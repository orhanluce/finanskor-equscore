"""
EquScore — "Efsah Flash" v1: news & disclosure sentiment per stock (research §2.3, T1.3).
FREE: Google News RSS per company (structured, no key) + a financial lexicon classifier
(no LLM dependency / no endpoint drift). Writes src/data/news_live.json keyed by ticker.
Top-N most liquid names only (keeps it fast). LLM/FinBERT + Arabic is a later upgrade.

Run:  py scripts/fetch_news.py            (top 40 by market cap)
      TOP=80 py scripts/fetch_news.py
"""
import os, re, json, time, html, urllib.parse, urllib.request, urllib.error

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, "..", "src", "data", "tadawul_live.json")
OUT = os.path.join(HERE, "..", "src", "data", "news_live.json")
ENV = os.path.join(HERE, "..", ".env")
TOP = int(os.environ.get("TOP", "40"))

_env = {}
for _l in open(ENV, encoding="utf-8"):
    _l = _l.strip()
    if _l and not _l.startswith("#") and "=" in _l:
        _k, _v = _l.split("=", 1); _env[_k.strip()] = _v.strip()
MARKETAUX = _env.get("MARKETAUX_API_KEY", "")

POS = set("""profit profits growth grow surge surged surges jump jumps jumped rise rises rose gain gains gained
beat beats record high highs upgrade upgraded dividend dividends expansion expand wins win won awarded award contract
approval approved strong soar soared rally rallied boost boosted raises raised outperform buyback acquire acquisition
upbeat optimistic recovery rebound profit-taking milestone partnership deal launch""".split())
NEG = set("""loss losses decline declines declined fall falls fell drop drops dropped plunge plunged plunges miss misses
missed cut cuts downgrade downgraded weak weakness warning warn warns fraud probe lawsuit sue resign resigns resigned
delay delays delayed halt halted suspend suspended slump slumped fears fear risk risks default fine fined penalty
investigation scandal writedown impairment loss-making bankruptcy debt-laden downturn slowdown""".split())


def http(url, t=20):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=t) as r:
            return r.read().decode("utf-8", "replace")
    except Exception:
        return None


def _tag(block, name):
    m = re.search(fr"<{name}[^>]*>(.*?)</{name}>", block, re.S)
    return html.unescape(re.sub(r"<[^>]+>", "", m.group(1)).strip()) if m else ""


def google_news(query):
    # Regex parse (no XML parser -> avoids XXE / entity-expansion attacks).
    q = urllib.parse.quote(query)
    body = http(f"https://news.google.com/rss/search?q={q}&hl=en&gl=US&ceid=US:en")
    if not body:
        return []
    items = []
    for block in re.findall(r"<item\b.*?</item>", body, re.S):
        title = _tag(block, "title")
        if title:
            items.append({"title": title, "url": _tag(block, "link"),
                          "date": _tag(block, "pubDate"), "source": _tag(block, "source")})
    return items


def marketaux_news(code):
    """Marketaux: Tadawul-aware news with a ready per-entity sentiment_score
    (sources: Argaam, Mubasher, Reuters...). Free tier ~3 articles/request, 100/day."""
    if not MARKETAUX:
        return None
    sym = f"{code}.SR"
    url = (f"https://api.marketaux.com/v1/news/all?symbols={sym}&filter_entities=true"
           f"&language=en&limit=3&api_token={MARKETAUX}")
    body = http(url)
    if not body:
        return None
    try:
        data = json.loads(body).get("data", [])
    except Exception:
        return None
    out = []
    for a in data:
        ent = next((e for e in a.get("entities", []) if e.get("symbol") == sym), None)
        sc = ent.get("sentiment_score") if ent else None
        sent = "positive" if (sc or 0) > 0.1 else "negative" if (sc or 0) < -0.1 else "neutral"
        out.append({"title": a.get("title", ""), "url": a.get("url", ""),
                    "date": a.get("published_at", ""), "source": a.get("source", ""), "sentiment": sent})
    return out


def classify(text):
    words = re.findall(r"[a-zA-Z][a-zA-Z'-]+", text.lower())
    p = sum(1 for w in words if w in POS)
    n = sum(1 for w in words if w in NEG)
    if p > n:
        return "positive", p - n
    if n > p:
        return "negative", p - n
    return "neutral", 0


def main():
    stocks = json.load(open(SRC, encoding="utf-8"))
    stocks = [s for s in stocks if s.get("mcap")]
    stocks.sort(key=lambda s: s["mcap"], reverse=True)
    stocks = stocks[:TOP]
    print(f"Efsah Flash: top {len(stocks)} by market cap", flush=True)

    out = {}
    for i, s in enumerate(stocks, 1):
        name = re.sub(r"\b(Company|Co\.|Corporation|Corp\.?|Group|A\.S\.|Ltd\.?|PLC|Holding)\b", "", s["name"]).strip()
        src = "marketaux"
        scored = marketaux_news(s["ticker"])
        if not scored:  # fallback: Google News RSS + lexicon
            src = "google"
            scored = []
            for it in google_news(f'"{name}" (Saudi OR Tadawul OR stock)')[:6]:
                it["sentiment"] = classify(it["title"])[0]
                scored.append(it)
        pos = sum(1 for it in scored if it["sentiment"] == "positive")
        neg = sum(1 for it in scored if it["sentiment"] == "negative")
        if scored:
            mood = "positive" if pos - neg >= 1 else "negative" if neg - pos >= 1 else "neutral"
            out[s["ticker"]] = {"items": scored, "summary": {"n": len(scored), "pos": pos, "neg": neg, "mood": mood, "src": src}}
        if i % 10 == 0 or i == len(stocks):
            print(f"  [{i}/{len(stocks)}] {s['ticker']} {name[:22]} — {len(scored)} headlines", flush=True)
        time.sleep(0.5)

    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    total = sum(v["summary"]["n"] for v in out.values())
    print(f"\nWrote {len(out)} stocks, {total} headlines -> {os.path.relpath(OUT)}", flush=True)


if __name__ == "__main__":
    main()
