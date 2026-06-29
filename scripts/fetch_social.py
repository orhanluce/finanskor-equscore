"""
EquScore — Rumor Thermometer social feed (X / Twitter via twikit, FREE login route).
Ported from FinanSkor's sosyal_cek.py, re-pointed at MENA with bilingual (AR+EN) queries
and lexicon. Per stock: chatter VOLUME → rumor level (low/medium/high/danger) + a
social-spike (possible-manipulation) flag + a mood (pos/neg/neutral). DISCLAIMER: this is
unverified retail chatter — it stays OUT of the Equity Star score, shown in a separate panel.

Run:  COUNTRY=SA py scripts/fetch_social.py        (also AE, EG)
      TOP=15 COUNTRY=AE py scripts/fetch_social.py
"""
import os, re, sys, json, asyncio
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import twikit_patch  # noqa: F401  (X webpack + search-QID patch)
from dotenv import load_dotenv
load_dotenv(os.path.join(HERE, "..", ".env"))

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

DATA = os.path.join(HERE, "..", "src", "data")
COOKIE = os.path.join(HERE, "x_cookies.json")
COUNTRY = os.environ.get("COUNTRY", "SA").upper()
TOP = int(os.environ.get("TOP", "15"))
PER = int(os.environ.get("SOCIAL_TWEET", "25"))

CFG = {
    "SA": dict(live="tadawul_live.json", out="social_sa.json"),
    "AE": dict(live="uae_live.json", out="social_ae.json"),
    "EG": dict(live="egx_live.json", out="social_eg.json"),
}

# Bilingual finance sentiment lexicon (prefix match).
POS = set("""buy bull bullish long strong rally breakout target upside undervalued gain gains surge
moon accumulate growth beat upgrade rocket support pump green outperform
شراء صعود قوي هدف فرصة ارتفاع تجميع ربح ايجابي اخضر صاعد دعم مكاسب""".split())
NEG = set("""sell bear bearish short dump crash drop overvalued loss downgrade avoid bubble fall miss
warning risk weak red panic correction
بيع هبوط ضعيف خساره خسارة خطر انخفاض سلبي فقاعه فقاعة تحذير احمر هابط مخاطر تصحيح""".split())

_WORD = re.compile(r"[A-Za-z؀-ۿ]+", re.UNICODE)


def classify(text):
    ws = [w.lower() for w in _WORD.findall(text)]
    p = sum(1 for w in ws if any(w.startswith(x) for x in POS))
    n = sum(1 for w in ws if any(w.startswith(x) for x in NEG))
    if p + n == 0:
        return "neutral", 0.0
    sc = (p - n) / (p + n)
    return ("positive" if sc >= 0.2 else "negative" if sc <= -0.2 else "neutral"), round(sc, 3)


def assign_levels(out):
    """Relative chatter heat across covered names → rumor level (engagement-weighted volume,
    quartile-ranked). Heavily discussed = 'danger' (a historical fade signal)."""
    ranked = sorted(out.items(), key=lambda kv: kv[1]["heat"], reverse=True)
    N = max(1, len(ranked) - 1)
    for idx, (t, v) in enumerate(ranked):
        q = idx / N
        v["level"] = "danger" if q < 0.12 else "high" if q < 0.4 else "medium" if q < 0.75 else "low"
        v["spike"] = v["level"] == "danger" and abs(v["pos"] - v["neg"]) >= max(3, v["n"] * 0.5)


# Market context to disambiguate (esp. numeric Tadawul cashtags like $1010 that otherwise
# match unrelated/foreign tweets).
CTX = {
    "SA": "تداول OR السعودية OR Saudi OR Tadawul OR TASI",
    "AE": "DFM OR ADX OR Dubai OR Emirates OR الامارات",
    "EG": "EGX OR Egypt OR مصر OR البورصة",
}

def query_for(s):
    name = re.sub(r"\b(Company|Co\.|Corporation|Corp\.?|Group|PJSC|Holding|Industries|Properties|Bank|Fertilizers|Petrochemicals)\b", "", s["name"]).strip()
    return f'(${s["ticker"]} OR "{name}") ({CTX.get(COUNTRY, "")}) -filter:retweets'


# CJK (Japanese/Chinese/Korean) → noise for a MENA feed; drop.
_CJK = re.compile(r"[　-〿぀-ヿ㐀-䶿一-鿿가-힯]")


def extract(raw):
    j = raw[0] if isinstance(raw, tuple) else raw
    try:
        instrs = j["data"]["search_by_raw_query"]["search_timeline"]["timeline"]["instructions"]
    except (KeyError, TypeError):
        return
    for ins in instrs:
        for e in ins.get("entries", []):
            ic = (e.get("content", {}) or {}).get("itemContent")
            if not ic or ic.get("itemType") != "TimelineTweet":
                continue
            res = (ic.get("tweet_results", {}) or {}).get("result", {}) or {}
            if res.get("__typename") == "TweetWithVisibilityResults":
                res = res.get("tweet", res)
            leg = res.get("legacy", {}) or {}
            note = (((res.get("note_tweet") or {}).get("note_tweet_results") or {}).get("result") or {})
            user = (((res.get("core") or {}).get("user_results") or {}).get("result") or {})
            ucore = user.get("core", {}) or {}; uleg = user.get("legacy", {}) or {}
            tid = leg.get("id_str") or res.get("rest_id")
            if not tid:
                continue
            yield {
                "id": str(tid),
                "text": (note.get("text") or leg.get("full_text") or "")[:280],
                "author": ucore.get("screen_name") or uleg.get("screen_name") or "?",
                "followers": int(uleg.get("followers_count") or 0),
                "likes": int(leg.get("favorite_count") or 0),
            }


async def main():
    cfg = CFG[COUNTRY]
    stocks = json.load(open(os.path.join(DATA, cfg["live"]), encoding="utf-8"))
    stocks = [s for s in stocks if s.get("mcap")]
    stocks.sort(key=lambda s: s["mcap"], reverse=True)
    stocks = stocks[:TOP]
    print(f"{COUNTRY}: social (X) for {len(stocks)} names", flush=True)

    from twikit import Client
    client = Client("en-US")
    if os.path.exists(COOKIE):
        client.load_cookies(COOKIE)
    else:
        try:
            await client.login(auth_info_1=os.getenv("X_USERNAME"), auth_info_2=os.getenv("X_EMAIL"), password=os.getenv("X_PASSWORD"))
            client.save_cookies(COOKIE)
        except Exception as e:
            print(f"X login failed: {str(e)[:80]}"); return

    out = {}
    for i, s in enumerate(stocks, 1):
        try:
            raw = await client.gql.search_timeline(query_for(s), "Latest", PER, None)
        except Exception as e:
            print(f"  {s['ticker']}: search err {str(e)[:50]}"); await asyncio.sleep(6); continue
        items, pos, neg = [], 0, 0
        for tw in extract(raw):
            if len(tw["text"]) < 12 or _CJK.search(tw["text"]):
                continue
            sent, _ = classify(tw["text"])
            if sent == "positive": pos += 1
            elif sent == "negative": neg += 1
            items.append({"text": tw["text"], "author": tw["author"], "url": f"https://x.com/{tw['author']}/status/{tw['id']}",
                          "sentiment": sent, "likes": tw["likes"]})
        n = len(items)
        mood = "positive" if pos - neg >= 1 else "negative" if neg - pos >= 1 else "neutral"
        heat = n + 0.1 * sum(it["likes"] for it in items)
        out[s["ticker"]] = {"n": n, "pos": pos, "neg": neg, "mood": mood, "heat": round(heat, 1),
                            "items": items[:8]}
        print(f"  [{i}/{len(stocks)}] {s['ticker']:8} {n:>2} posts · heat {heat:.0f} · {mood}", flush=True)
        await asyncio.sleep(5)  # X search budget is low; gentle pacing

    assign_levels(out)
    for v in out.values():
        v.pop("heat", None)
    json.dump(out, open(os.path.join(DATA, cfg["out"]), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    total = sum(v["n"] for v in out.values())
    print(f"\nWrote {len(out)} stocks, {total} posts -> src/data/{cfg['out']}", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
