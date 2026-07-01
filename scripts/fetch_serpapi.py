"""
EquScore — SerpAPI enrichment (Google News + YouTube + Google Trends).
FREE plan = 250 searches/month, so this is QUOTA-BUDGETED and country/market-level,
NOT per-stock across the whole universe:
  * news    (daily)   — 3 calls: Arabic market headlines per market (SA/AE/EG).
  * youtube (weekly)  — top-N by mcap: Arabic stock-analysis videos (community interest).
  * trends  (weekly)  — 3 calls: retail search-attention timeseries per market.
Each mode checks remaining quota first and refuses to run if it would overspend.

Run:  py scripts/fetch_serpapi.py news
      py scripts/fetch_serpapi.py youtube      (TOP=12 by default)
      py scripts/fetch_serpapi.py trends
      py scripts/fetch_serpapi.py all          (news+youtube+trends; ~18 calls)
"""
import os, sys, json, time, urllib.parse, urllib.request, urllib.error

HERE = os.path.dirname(__file__)
DATA = os.path.join(HERE, "..", "src", "data")
ENV = os.path.join(HERE, "..", ".env")

_env = {}
for _l in open(ENV, encoding="utf-8"):
    _l = _l.strip()
    if _l and not _l.startswith("#") and "=" in _l:
        _k, _v = _l.split("=", 1); _env[_k.strip()] = _v.strip()
KEY = _env.get("SERPAPI_API_KEY", "")
TOP = int(os.environ.get("TOP", "12"))

# Per-market Arabic queries + geo/hl. Keep these market-level (quota-friendly).
MARKETS = {
    "SA": {"news": "أخبار سوق الأسهم السعودية تداول", "trend": "تداول",
           "gl": "sa", "hl": "ar", "geo": "SA", "src": "tadawul_live.json"},
    "AE": {"news": "أخبار سوق دبي وأبوظبي المالي", "trend": "سوق دبي المالي",
           "gl": "ae", "hl": "ar", "geo": "AE", "src": "uae_live.json"},
    "EG": {"news": "أخبار البورصة المصرية", "trend": "البورصة المصرية",
           "gl": "eg", "hl": "ar", "geo": "EG", "src": "egx_live.json"},
}


def call(params, timeout=35):
    params["api_key"] = KEY
    url = "https://serpapi.com/search?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "equscore/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def quota_left():
    try:
        d = json.loads(urllib.request.urlopen(
            f"https://serpapi.com/account?api_key={KEY}", timeout=25).read())
        return int(d.get("total_searches_left", 0))
    except Exception:
        return 0


def guard(need):
    left = quota_left()
    if left < need:
        print(f"  ! quota too low: {left} left, need {need} — aborting to protect budget", flush=True)
        sys.exit(1)
    print(f"  quota: {left} searches left (this run spends ~{need})", flush=True)


def save(name, obj):
    path = os.path.join(DATA, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    print(f"  wrote {os.path.relpath(path)}", flush=True)


def do_news():
    guard(len(MARKETS))
    out = {}
    for mk, cfg in MARKETS.items():
        try:
            d = call({"engine": "google_news", "q": cfg["news"], "gl": cfg["gl"], "hl": cfg["hl"]})
            items = []
            for a in (d.get("news_results") or [])[:15]:
                if not a.get("title") or not a.get("link"):
                    continue
                items.append({"title": a["title"], "url": a["link"],
                              "source": (a.get("source") or {}).get("name"), "date": a.get("date")})
            out[mk] = items
            print(f"  {mk}: {len(items)} market headlines", flush=True)
        except Exception as e:
            print(f"  {mk} news err: {str(e)[:90]}", flush=True)
        time.sleep(1)
    save("serp_market_news.json", out)


def do_youtube():
    guard(TOP)
    src = json.load(open(os.path.join(DATA, "tadawul_live.json"), encoding="utf-8"))
    src = [s for s in src if s.get("mcap")]
    src.sort(key=lambda s: s["mcap"], reverse=True)
    src = src[:TOP]
    out = {}
    for i, s in enumerate(src, 1):
        q = f"تحليل سهم {s['name']} {s['ticker']}"
        try:
            d = call({"engine": "youtube", "search_query": q})
            vids = []
            for v in (d.get("video_results") or [])[:6]:
                if not v.get("title") or not v.get("link"):
                    continue
                vids.append({"title": v["title"], "url": v["link"],
                             "channel": (v.get("channel") or {}).get("name"),
                             "views": v.get("views"), "published": v.get("published_date"),
                             "thumb": (v.get("thumbnail") or {}).get("static")})
            if vids:
                out[s["ticker"]] = {"n": len(vids), "videos": vids}
            print(f"  [{i}/{len(src)}] {s['ticker']} {s['name'][:20]} — {len(vids)} videos", flush=True)
        except Exception as e:
            print(f"  {s['ticker']} yt err: {str(e)[:90]}", flush=True)
        time.sleep(1)
    save("serp_youtube.json", out)


def do_trends():
    guard(len(MARKETS))
    out = {}
    for mk, cfg in MARKETS.items():
        try:
            d = call({"engine": "google_trends", "q": cfg["trend"],
                      "data_type": "TIMESERIES", "geo": cfg["geo"], "date": "today 3-m"})
            tl = (d.get("interest_over_time") or {}).get("timeline_data", [])
            series = []
            for p in tl:
                vals = [v.get("extracted_value") for v in p.get("values", []) if v.get("extracted_value") is not None]
                if vals:
                    series.append({"t": p.get("date"), "v": vals[0]})
            if series:
                vs = [x["v"] for x in series]
                recent = vs[-7:] if len(vs) >= 7 else vs
                out[mk] = {"latest": vs[-1], "avg7": round(sum(recent) / len(recent), 1),
                           "peak": max(vs), "timeline": series[-60:]}
            print(f"  {mk}: {len(series)} trend points (latest {out.get(mk, {}).get('latest')})", flush=True)
        except Exception as e:
            print(f"  {mk} trends err: {str(e)[:90]}", flush=True)
        time.sleep(1)
    save("serp_trends.json", out)


def main():
    if not KEY:
        print("No SERPAPI_API_KEY in .env", flush=True); sys.exit(1)
    mode = sys.argv[1] if len(sys.argv) > 1 else "news"
    print(f"SerpAPI mode: {mode}", flush=True)
    if mode == "news":
        do_news()
    elif mode == "youtube":
        do_youtube()
    elif mode == "trends":
        do_trends()
    elif mode == "all":
        do_news(); do_youtube(); do_trends()
    else:
        print(f"Unknown mode '{mode}'. Use: news | youtube | trends | all", flush=True); sys.exit(1)
    print("Done.", flush=True)


if __name__ == "__main__":
    main()
