"""
EquScore — TradingView technical rating per stock (derived signal, NOT raw data).
Uses the public tradingview_ta technical-analysis summary (oscillators + moving averages)
→ a daily RECOMMENDATION (STRONG_BUY…STRONG_SELL) + buy/sell/neutral counts.
We store only the derived signal (no OHLCV redistribution). Mirrors FinanSkor's BIST
"TradingView direction" sentiment input.

Run:  COUNTRY=SA py scripts/fetch_tv.py      (also AE, EG)
      TOP=80 COUNTRY=SA py scripts/fetch_tv.py
"""
import os, json, time
from tradingview_ta import TA_Handler, Interval

HERE = os.path.dirname(__file__)
DATA = os.path.join(HERE, "..", "src", "data")
COUNTRY = os.environ.get("COUNTRY", "SA").upper()
TOP = int(os.environ.get("TOP", "80"))

CFG = {
    "SA": dict(live="tadawul_live.json", out="tv_sa.json", screener="ksa", exch=lambda s: "TADAWUL"),
    "AE": dict(live="uae_live.json", out="tv_ae.json", screener="uae", exch=lambda s: s.get("board", "DFM")),
    "EG": dict(live="egx_live.json", out="tv_eg.json", screener="egypt", exch=lambda s: "EGX"),
}


def main():
    cfg = CFG[COUNTRY]
    stocks = json.load(open(os.path.join(DATA, cfg["live"]), encoding="utf-8"))
    stocks = [s for s in stocks if s.get("mcap")]
    stocks.sort(key=lambda s: s["mcap"], reverse=True)
    stocks = stocks[:TOP]
    print(f"{COUNTRY}: TradingView TA for {len(stocks)} names (screener={cfg['screener']})", flush=True)

    out, ok, skip = {}, 0, 0
    for i, s in enumerate(stocks, 1):
        got = False
        for attempt in range(3):  # TV throttles bursts → retry with backoff
            try:
                h = TA_Handler(symbol=s["ticker"], exchange=cfg["exch"](s),
                               screener=cfg["screener"], interval=Interval.INTERVAL_1_DAY)
                sm = h.get_analysis().summary
                out[s["ticker"]] = {"rec": sm["RECOMMENDATION"], "buy": sm["BUY"],
                                    "sell": sm["SELL"], "neutral": sm["NEUTRAL"]}
                ok += 1; got = True
                break
            except Exception as e:
                if attempt < 2:
                    time.sleep(3 + attempt * 3)
                elif skip < 5:
                    print(f"  skip {s['ticker']} ({str(e)[:40]})", flush=True)
        if not got:
            skip += 1
        if i % 20 == 0 or i == len(stocks):
            print(f"  [{i}/{len(stocks)}] ok={ok} skip={skip}", flush=True)
        time.sleep(1.2)

    json.dump(out, open(os.path.join(DATA, cfg["out"]), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\nWrote {len(out)} TV ratings -> src/data/{cfg['out']}", flush=True)


if __name__ == "__main__":
    main()
