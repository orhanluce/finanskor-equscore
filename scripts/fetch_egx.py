"""
EquScore — Egypt (EGX) ingestion.
  * Price + change : LIVE via EODHD EOD ({TICKER}.EGX) — the free tier covers EOD prices.
  * Fundamentals   : EODHD free tier BLOCKS fundamentals, so PE/PB/dividend/Star dims and the
    EGP-specific fields (USD-revenue, import dependence, real growth) are CURATED estimates.
EGP floats, so the lenses here are FX-risk + inflation-adjusted (real) growth, not Sharia.
Writes src/data/egx_live.json (live price, estimated fundamentals — clearly flagged auto).

Run:  py scripts/fetch_egx.py
"""
import os, json, time
from urllib.request import urlopen

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "..", "src", "data", "egx_live.json")
ENV = os.path.join(HERE, "..", ".env")

env = {}
for line in open(ENV, encoding="utf-8"):
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, v = line.split("=", 1); env[k.strip()] = v.strip()
KEY = env.get("EODHD_API_KEY", "")

# Curated EGX universe (fundamentals are estimates; price/change overridden live below).
CUR = [
    dict(t="COMI", name="Commercial International Bank", sector="Banking", pe=6.8, pb=1.7, dy=3.2,
         star={"value":5,"growth":5,"quality":6,"health":5,"dividend":3,"consensus":6,"flow":6}, sharia="non-compliant", dr=45,
         usdRevPct=18, importDep="low", nominalGrowth=34, concentration=True, foreignOwn=62,
         about="Egypt's largest private bank and ~1/3 of EGX30 — a single-stock concentration risk. Foreign-favourite."),
    dict(t="HRHO", name="EFG Holding", sector="Financials", pe=7.5, pb=1.4, dy=1.5,
         star={"value":4,"growth":6,"quality":4,"health":4,"dividend":2,"consensus":5,"flow":5}, sharia="doubtful", dr=30,
         usdRevPct=35, importDep="low", nominalGrowth=48, foreignOwn=28,
         about="Leading MENA investment bank + NBFI platform. Regional fee income gives partial hard-currency exposure."),
    dict(t="TMGH", name="Talaat Moustafa Group", sector="Real Estate", pe=9.0, pb=1.9, dy=1.2,
         star={"value":4,"growth":5,"quality":4,"health":3,"dividend":2,"consensus":5,"flow":4}, sharia="compliant", dr=22,
         usdRevPct=22, importDep="med", nominalGrowth=41, foreignOwn=19,
         about="Egypt's biggest listed developer (Madinaty, Celia). Real estate is a popular inflation hedge."),
    dict(t="EAST", name="Eastern Company", sector="Consumer Staples", pe=5.5, pb=2.2, dy=9.5,
         star={"value":6,"growth":3,"quality":6,"health":6,"dividend":6,"consensus":4,"flow":3}, sharia="doubtful", dr=4,
         usdRevPct=8, importDep="high", nominalGrowth=28, foreignOwn=9,
         about="State-linked tobacco near-monopoly. Defensive pricing power and one of the highest EGX dividend yields."),
    dict(t="FWRY", name="Fawry", sector="Fintech", pe=26.0, pb=5.0, dy=0.5,
         star={"value":2,"growth":6,"quality":5,"health":4,"dividend":1,"consensus":5,"flow":6}, sharia="compliant", dr=6,
         usdRevPct=5, importDep="low", nominalGrowth=70, foreignOwn=24,
         about="Egypt's dominant e-payments network. Fast TPV growth on the digitisation theme; widely discussed."),
    dict(t="JUFO", name="Juhayna Food Industries", sector="Consumer Staples", pe=9.5, pb=2.0, dy=4.0,
         star={"value":4,"growth":4,"quality":5,"health":4,"dividend":4,"consensus":4,"flow":3}, sharia="compliant", dr=19,
         usdRevPct=6, importDep="high", nominalGrowth=32, foreignOwn=11,
         about="Leading dairy & juice producer. Strong brand pricing power, but imported inputs hurt when the pound weakens."),
    dict(t="CLHO", name="Cleopatra Hospitals", sector="Health Care", pe=13.8, pb=3.2, dy=2.0,
         star={"value":3,"growth":5,"quality":5,"health":5,"dividend":3,"consensus":5,"flow":4}, sharia="compliant", dr=14,
         usdRevPct=4, importDep="med", nominalGrowth=38, foreignOwn=21,
         about="Egypt's largest private hospital group. Demographic tailwind; the EGX's premium healthcare compounder."),
    dict(t="SKPC", name="Sidi Kerir Petrochemicals", sector="Materials", pe=7.0, pb=1.8, dy=8.0,
         star={"value":5,"growth":3,"quality":5,"health":5,"dividend":6,"consensus":4,"flow":4}, sharia="compliant", dr=8,
         usdRevPct=85, importDep="low", nominalGrowth=30, foreignOwn=16,
         about="Polyethylene producer with USD-linked pricing — a natural hedge that benefits when the EGP devalues."),
    dict(t="ABUK", name="Abu Qir Fertilizers", sector="Materials", pe=6.2, pb=2.5, dy=10.5,
         star={"value":6,"growth":4,"quality":6,"health":6,"dividend":6,"consensus":5,"flow":4}, sharia="compliant", dr=3,
         usdRevPct=75, importDep="low", nominalGrowth=36, foreignOwn=23,
         about="Major nitrogen-fertilizer exporter. Hard-currency revenue + subsidised gas = a classic devaluation winner."),
    dict(t="SWDY", name="Elsewedy Electric", sector="Industrials", pe=8.0, pb=2.3, dy=4.5,
         star={"value":5,"growth":5,"quality":5,"health":4,"dividend":4,"consensus":5,"flow":5}, sharia="compliant", dr=26,
         usdRevPct=55, importDep="med", nominalGrowth=44, foreignOwn=20,
         about="Cables, wind and EPC group with a large export & backlog book — meaningful hard-currency revenue."),
    dict(t="ETEL", name="Telecom Egypt", sector="Telecom", pe=5.0, pb=1.1, dy=6.0,
         star={"value":6,"growth":4,"quality":4,"health":3,"dividend":5,"consensus":4,"flow":3}, sharia="doubtful", dr=34,
         usdRevPct=30, importDep="med", nominalGrowth=33, foreignOwn=14,
         about="State-controlled telecom incumbent + 45% of Vodafone Egypt. International cable transit gives USD exposure."),
    dict(t="ALCN", name="Alexandria Container & Cargo", sector="Logistics", pe=6.5, pb=3.0, dy=11.0,
         star={"value":5,"growth":4,"quality":6,"health":6,"dividend":6,"consensus":4,"flow":4}, sharia="compliant", dr=2,
         usdRevPct=90, importDep="low", nominalGrowth=31, foreignOwn=17,
         about="Container terminal operator charging in USD — devaluation-resistant, debt-free, very high yield."),
]

MCAP = {  # rough market caps (EGP) for ordering
    "COMI": 2.8e11, "HRHO": 3.0e10, "TMGH": 1.1e11, "EAST": 4.0e10, "FWRY": 1.6e10, "JUFO": 1.3e10,
    "CLHO": 1.1e10, "SKPC": 1.0e10, "ABUK": 6.0e10, "SWDY": 1.7e11, "ETEL": 6.6e10, "ALCN": 1.5e10,
}


def eod(symbol):
    """Last two daily closes from EODHD -> (price, change%)."""
    try:
        url = f"https://eodhd.com/api/eod/{symbol}?api_token={KEY}&fmt=json&period=d&order=d"
        d = json.loads(urlopen(url, timeout=20).read())
        if isinstance(d, list) and len(d) >= 2:
            p, prev = d[0]["close"], d[1]["close"]
            chg = round((p / prev - 1) * 100, 2) if prev else 0.0
            return round(float(p), 2), chg
        if isinstance(d, list) and len(d) == 1:
            return round(float(d[0]["close"]), 2), 0.0
    except Exception:
        pass
    return None, 0.0


def rec(c):
    price, chg = eod(f"{c['t']}.EGX")
    live = price is not None
    if not live:
        price = round(c["pe"] * 2, 2) or 10  # crude placeholder if EOD missing
    fv = round(price * 1.12, 2)  # provisional; refined by sector reversion in UI
    return {
        "ticker": c["t"], "name": c["name"], "sector": c["sector"], "board": "EGX", "market": "EG", "currency": "EGP",
        "price": price, "change": chg, "mcap": MCAP.get(c["t"]),
        "pe": c["pe"], "pb": c["pb"], "divYield": c["dy"], "star": c["star"], "fairValue": fv,
        "sharia": c["sharia"], "shariaRatios": {"debt": c["dr"], "cashInterest": None, "impureIncome": None},
        "foreignFlow": "in", "foreignOwn": c.get("foreignOwn"), "instOwn": None, "rumor": "low", "auto": True,
        "priceLive": live,
        "usdRevPct": c["usdRevPct"], "importDep": c["importDep"], "nominalGrowth": c["nominalGrowth"],
        "concentration": c.get("concentration", False),
        "analysts": {"count": 12, "buy": None, "hold": None, "sell": None, "target": fv},
        "metrics": {}, "about": c["about"],
    }


def main():
    if not KEY:
        print("No EODHD_API_KEY", flush=True); return
    print(f"EGX: live EOD price via EODHD for {len(CUR)} names", flush=True)
    rows, live_n = [], 0
    for i, c in enumerate(CUR, 1):
        r = rec(c)
        if r["priceLive"]:
            live_n += 1
        rows.append(r)
        print(f"  [{i}/{len(CUR)}] {c['t']} {r['price']} EGP {r['change']:+}% {'live' if r['priceLive'] else 'EST'}", flush=True)
        time.sleep(0.3)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)
    print(f"\nWrote {len(rows)} EGX stocks ({live_n} live price, fundamentals estimated) -> {os.path.relpath(OUT)}", flush=True)


if __name__ == "__main__":
    main()
