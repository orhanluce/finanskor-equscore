"""
EquScore — UAE "Efsah Flash" news & sentiment per DFM/ADX stock.
Marketaux free tier does NOT index UAE by symbol/exchange, but its `search` endpoint
returns rich UAE company news (Zawya/Arabian Business/The National/Khaleej Times).
So we query Marketaux by company name + UAE context, with a Google-News RSS fallback,
and a financial-lexicon classifier. Writes src/data/news_uae.json keyed by ticker.

Run:  py scripts/fetch_news_uae.py            (top 30 by market cap)
      TOP=40 py scripts/fetch_news_uae.py
"""
import os, re, json, time, html, urllib.parse, urllib.request

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, "..", "src", "data", "uae_live.json")
OUT = os.path.join(HERE, "..", "src", "data", "news_uae.json")
ENV = os.path.join(HERE, "..", ".env")
TOP = int(os.environ.get("TOP", "30"))

_env = {}
for _l in open(ENV, encoding="utf-8"):
    _l = _l.strip()
    if _l and not _l.startswith("#") and "=" in _l:
        _k, _v = _l.split("=", 1); _env[_k.strip()] = _v.strip()
MARKETAUX = _env.get("MARKETAUX_API_KEY", "")

POS = set("""profit profits growth grow surge surged jump jumped rise rose gain gained beat beats record high
upgrade upgraded dividend dividends expansion expand wins win won awarded award contract approval approved strong
soar soared rally rallied boost boosted raises raised outperform buyback acquire acquisition upbeat optimistic
recovery rebound milestone partnership deal launch stake""".split())
NEG = set("""loss losses decline declined fall fell drop dropped plunge plunged miss missed cut cuts downgrade
downgraded weak weakness warning warn warns fraud probe lawsuit sue resign resigned delay delayed halt halted
suspend suspended slump slumped fears fear risk risks default fine fined penalty investigation scandal writedown
impairment bankruptcy debt-laden downturn slowdown""".split())


def http(url, t=20):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=t) as r:
            return r.read().decode("utf-8", "replace")
    except Exception:
        return None


def classify(text):
    words = re.findall(r"[a-zA-Z][a-zA-Z'-]+", text.lower())
    p = sum(1 for w in words if w in POS); n = sum(1 for w in words if w in NEG)
    return "positive" if p > n else "negative" if n > p else "neutral"


def _tag(block, name):
    m = re.search(fr"<{name}[^>]*>(.*?)</{name}>", block, re.S)
    return html.unescape(re.sub(r"<[^>]+>", "", m.group(1)).strip()) if m else ""


def google_news(query):
    q = urllib.parse.quote(query)
    body = http(f"https://news.google.com/rss/search?q={q}&hl=en&gl=AE&ceid=AE:en")
    if not body:
        return []
    items = []
    for block in re.findall(r"<item\b.*?</item>", body, re.S):
        title = _tag(block, "title")
        if title:
            items.append({"title": title, "url": _tag(block, "link"),
                          "date": _tag(block, "pubDate"), "source": _tag(block, "source")})
    return items


def marketaux_search(name):
    """Marketaux free tier: search by company name + UAE context. Returns scored items."""
    if not MARKETAUX:
        return None
    q = urllib.parse.quote(f"{name} (Dubai OR UAE OR \"Abu Dhabi\")")
    url = (f"https://api.marketaux.com/v1/news/all?search={q}&language=en&limit=3"
           f"&api_token={MARKETAUX}")
    body = http(url)
    if not body:
        return None
    try:
        data = json.loads(body).get("data", [])
    except Exception:
        return None
    out = []
    for a in data:
        ents = [e for e in a.get("entities", []) if e.get("sentiment_score") is not None]
        if ents:
            sc = sum(e["sentiment_score"] for e in ents) / len(ents)
            sent = "positive" if sc > 0.1 else "negative" if sc < -0.1 else "neutral"
        else:
            sent = classify(a.get("title", ""))
        out.append({"title": a.get("title", ""), "url": a.get("url", ""),
                    "date": a.get("published_at", ""), "source": a.get("source", ""), "sentiment": sent})
    return out


def main():
    stocks = json.load(open(SRC, encoding="utf-8"))
    stocks = [s for s in stocks if s.get("mcap")]
    stocks.sort(key=lambda s: s["mcap"], reverse=True)
    stocks = stocks[:TOP]
    print(f"UAE Efsah Flash: top {len(stocks)} by market cap", flush=True)

    out = {}
    for i, s in enumerate(stocks, 1):
        name = re.sub(r"\b(Company|Co\.|Corporation|Corp\.?|Group|PJSC|Holding|Properties|Bank)\b", "", s["name"]).strip()
        src = "marketaux"
        scored = marketaux_search(name)
        if not scored:
            src = "google"
            scored = []
            for it in google_news(f'"{s["name"]}" (DFM OR ADX OR UAE OR Dubai)')[:6]:
                it["sentiment"] = classify(it["title"]); scored.append(it)
        pos = sum(1 for it in scored if it["sentiment"] == "positive")
        neg = sum(1 for it in scored if it["sentiment"] == "negative")
        if scored:
            mood = "positive" if pos - neg >= 1 else "negative" if neg - pos >= 1 else "neutral"
            out[s["ticker"]] = {"items": scored, "summary": {"n": len(scored), "pos": pos, "neg": neg, "mood": mood, "src": src}}
        if i % 10 == 0 or i == len(stocks):
            print(f"  [{i}/{len(stocks)}] {s['ticker']} {name[:20]} — {len(scored)} headlines ({src})", flush=True)
        time.sleep(0.5)

    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    total = sum(v["summary"]["n"] for v in out.values())
    mx = sum(1 for v in out.values() if v["summary"]["src"] == "marketaux")
    print(f"\nWrote {len(out)} stocks, {total} headlines ({mx} via Marketaux) -> {os.path.relpath(OUT)}", flush=True)


if __name__ == "__main__":
    main()
