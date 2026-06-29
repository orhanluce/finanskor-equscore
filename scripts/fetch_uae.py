"""
EquScore — UAE (DFM + ADX) ingestion.
  * DFM (Dubai): LIVE via Yahoo Finance ({TICKER}.AE) — no key, delayed/EOD.
  * ADX (Abu Dhabi): Yahoo has NO free coverage, so the main ADX names are CURATED
    (clearly flagged auto/curated). Swap in a licensed ADX feed later.
Same 7-dim Equity Star engine as Tadawul; AED is USD-pegged so no inflation lens —
the lenses here are Sharia + dividend + IPO. Writes src/data/uae_live.json.

Run:  py scripts/fetch_uae.py
      LIMIT=8 py scripts/fetch_uae.py   (quick test)
"""
import os, json, time, statistics
import yfinance as yf
from urllib.request import Request, urlopen

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "..", "src", "data", "uae_live.json")
LIMIT = int(os.environ.get("LIMIT", "0"))

# ── DFM (Dubai) — live via Yahoo .AE. Curated ticker -> clean name. ──
DFM = {
    "EMAAR": "Emaar Properties", "EMAARDEV": "Emaar Development", "DEWA": "DEWA",
    "EMIRATESNBD": "Emirates NBD", "DIB": "Dubai Islamic Bank", "DIC": "Dubai Investments",
    "SALIK": "Salik Company", "TALABAT": "Talabat Holding", "PARKIN": "Parkin Company",
    "TECOM": "TECOM Group", "EMPOWER": "Empower", "DU": "du (EITC)",
    "UPP": "Union Properties", "DEYAAR": "Deyaar Development", "AMLAK": "Amlak Finance",
    "CBD": "Commercial Bank of Dubai", "MASQ": "Mashreqbank", "GFH": "GFH Financial Group",
    "SHUAA": "SHUAA Capital", "AIRARABIA": "Air Arabia", "ARMX": "Aramex",
    "DTC": "Dubai Taxi Company", "TAALEEM": "Taaleem Holdings", "SPINNEYS": "Spinneys",
    "DFM": "Dubai Financial Market", "NIND": "National Industries Group",
}

# ── ADX (Abu Dhabi) — no free live feed; curated snapshot (board=ADX, auto-flagged). ──
ADX_CURATED = [
    dict(t="FAB", name="First Abu Dhabi Bank", sector="Banking", price=13.6, chg=0.15, mcap=1.5e11, pe=9.2, pb=1.2, dy=5.9,
         star={"value":5,"growth":3,"quality":5,"health":5,"dividend":5,"consensus":4,"flow":4}, fv=15, sharia="non-compliant", dr=44,
         about="The UAE's largest bank and a regional heavyweight; strong capital and a high dividend. Conventional interest income."),
    dict(t="ADNOCGAS", name="ADNOC Gas", sector="Energy", price=3.6, chg=0.6, mcap=2.77e11, pe=15.0, pb=4.2, dy=5.0,
         star={"value":3,"growth":5,"quality":6,"health":5,"dividend":5,"consensus":6,"flow":5}, fv=3.9, sharia="compliant", dr=10,
         about="ADNOC's gas-processing arm — state-backed, high-margin growth plus dividend. Anchor of the ADX energy complex."),
    dict(t="ADNOCDRILL", name="ADNOC Drilling", sector="Energy", price=5.5, chg=1.1, mcap=8.8e10, pe=18.0, pb=5.5, dy=3.6,
         star={"value":2,"growth":6,"quality":5,"health":4,"dividend":4,"consensus":6,"flow":6}, fv=5.9, sharia="compliant", dr=18,
         about="World's largest national drilling fleet, expanding into unconventional & oilfield services. Strong inflows and growth."),
    dict(t="ALDAR", name="Aldar Properties", sector="Real Estate", price=8.1, chg=0.99, mcap=6.4e10, pe=11.0, pb=1.6, dy=2.6,
         star={"value":4,"growth":5,"quality":4,"health":4,"dividend":3,"consensus":5,"flow":5}, fv=9.0, sharia="doubtful", dr=31,
         about="Abu Dhabi's leading developer (Yas Island, Saadiyat). Diversified development + recurring-income portfolio."),
    dict(t="EAND", name="e& (Etisalat Group)", sector="Telecom", price=17.2, chg=-0.2, mcap=1.5e11, pe=16.0, pb=3.3, dy=4.7,
         star={"value":3,"growth":3,"quality":5,"health":5,"dividend":5,"consensus":4,"flow":3}, fv=18.5, sharia="doubtful", dr=28,
         about="UAE telecom champion expanding across MENA, fintech and data centres. Reliable high dividend, defensive cash flow."),
    dict(t="ADCB", name="Abu Dhabi Commercial Bank", sector="Banking", price=9.7, chg=0.41, mcap=7.0e10, pe=8.5, pb=1.3, dy=5.4,
         star={"value":5,"growth":4,"quality":4,"health":4,"dividend":5,"consensus":4,"flow":4}, fv=10.6, sharia="non-compliant", dr=40,
         about="Abu Dhabi's #2 bank, strong retail franchise and high dividend. Conventional interest income."),
    dict(t="MULTIPLY", name="Multiply Group", sector="Investment", price=2.3, chg=2.7, mcap=2.6e10, pe=30.0, pb=1.4, dy=0.0,
         star={"value":3,"growth":6,"quality":3,"health":4,"dividend":0,"consensus":4,"flow":6}, fv=2.2, sharia="compliant", dr=16,
         about="IHC-backed holding investing in media, mobility and energy services. Acquisitive, volatile and heavily discussed."),
    dict(t="PRESIGHT", name="Presight AI", sector="Technology", price=3.4, chg=1.8, mcap=3.1e10, pe=33.0, pb=6.0, dy=2.0,
         star={"value":2,"growth":6,"quality":5,"health":5,"dividend":2,"consensus":5,"flow":6}, fv=3.5, sharia="compliant", dr=4,
         about="G42-backed big-data & AI analytics company — a fast-growing ADX new-economy proxy."),
    dict(t="AMERICANA", name="Americana Restaurants", sector="Consumer", price=2.9, chg=-0.6, mcap=2.4e10, pe=22.0, pb=7.0, dy=3.3,
         star={"value":2,"growth":4,"quality":5,"health":4,"dividend":3,"consensus":4,"flow":3}, fv=3.1, sharia="compliant", dr=20,
         about="MENA's largest restaurant operator (KFC, Pizza Hut franchises). Dual-listed in Abu Dhabi and Riyadh."),
    dict(t="BOROUGE", name="Borouge", sector="Materials", price=2.5, chg=0.4, mcap=7.5e10, pe=18.0, pb=4.0, dy=6.5,
         star={"value":3,"growth":3,"quality":5,"health":4,"dividend":6,"consensus":4,"flow":4}, fv=2.7, sharia="compliant", dr=22,
         about="ADNOC/Borealis polyolefins JV — high dividend petrochemicals play with Asian demand exposure."),
]

ISLAMIC = {"DIB"}                      # Dubai Islamic Bank — fully Sharia
CONVENTIONAL = {"EMIRATESNBD", "CBD", "MASQ"}   # conventional banks


def band(x, thr, sc):
    for t, s in zip(thr, sc):
        if x is not None and x <= t:
            return s
    return sc[-1]


def num(v):
    try:
        f = float(v); return f if f == f and abs(f) != float("inf") else None
    except (TypeError, ValueError):
        return None


def auto_sharia(code, sector, dr):
    if sector == "Banking":
        if code in ISLAMIC: return "compliant"
        if code in CONVENTIONAL: return "non-compliant"
        return "doubtful"
    if sector == "Insurance": return "doubtful"
    if sector == "Real Estate": return "compliant" if (dr is None or dr < 45) else "doubtful"
    return "compliant" if (dr is None or dr < 33) else "doubtful"


def value_score(pe, ev, pb):
    pe_s = band(pe if (pe and pe > 0) else 99, [8, 12, 16, 22, 30, 45], [6, 5, 4, 3, 2, 1, 0])
    pb_s = band(pb if pb else 99, [1, 1.5, 2.5, 4, 7, 10], [6, 5, 4, 3, 2, 1, 0])
    if ev and ev > 0:
        ev_s = band(ev, [5, 8, 11, 14, 18, 25], [6, 5, 4, 3, 2, 1, 0])
        return round(0.45 * pe_s + 0.45 * ev_s + 0.10 * pb_s)
    return round(0.80 * pe_s + 0.20 * pb_s)


def yahoo_series(symbol):
    try:
        req = Request(f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=1y",
                      headers={"User-Agent": "Mozilla/5.0"})
        d = json.loads(urlopen(req, timeout=25).read())
        r = d["chart"]["result"][0]
        closes = [c for c in r["indicators"]["quote"][0]["close"] if c]
        m = r["meta"]
        price = m.get("regularMarketPrice") or (closes[-1] if closes else None)
        prev = (closes[-2] if len(closes) >= 2 else None) or m.get("chartPreviousClose")
        chg = round((price / prev - 1) * 100, 2) if (price and prev) else 0.0
        return price, chg
    except Exception:
        return None, 0.0


def build_dfm(code, name):
    sym = f"{code}.AE"
    price, chg = yahoo_series(sym)
    info = {}
    try:
        info = yf.Ticker(sym).info or {}
    except Exception:
        pass
    price = num(price) or num(info.get("currentPrice")) or num(info.get("previousClose"))
    if not price:
        return None
    mcap = num(info.get("marketCap"))
    pe = num(info.get("trailingPE")); pb = num(info.get("priceToBook"))
    ev = num(info.get("enterpriseToEbitda"))
    dy = num(info.get("dividendYield")); dyv = (dy * 100 if (dy and dy < 1) else dy) or 0
    debt = num(info.get("totalDebt"))
    dr = round(debt / mcap * 100, 1) if (debt and mcap) else None
    roe = num(info.get("returnOnEquity")); margin = num(info.get("profitMargins"))
    growth = num(info.get("revenueGrowth")); target = num(info.get("targetMeanPrice"))
    rec = num(info.get("recommendationMean")); n_an = int(num(info.get("numberOfAnalystOpinions")) or 0)
    inst = num(info.get("heldPercentInstitutions"))
    inst_pct = round(inst * 100, 1) if inst is not None else None

    SECTOR_MAP = {"Financial Services": "Banking", "Real Estate": "Real Estate", "Utilities": "Utilities",
                  "Energy": "Energy", "Communication Services": "Telecom", "Industrials": "Industrials",
                  "Consumer Cyclical": "Consumer", "Consumer Defensive": "Consumer", "Technology": "Technology"}
    sector = SECTOR_MAP.get(info.get("sector"), "Investment")
    dr_screen = dr if dr is not None else None
    star = {
        "value": value_score(pe, ev, pb),
        "growth": band(-((growth or 0) * 100), [-25, -15, -8, -3, 0, 99], [6, 5, 4, 3, 2, 1]),
        "quality": round(sum(
            [band(-(roe or 0) * 100, [-20, -15, -10, -5, 0], [6, 5, 4, 3, 2])] +
            ([band(-(margin) * 100, [-20, -12, -6, -2, 0], [6, 5, 4, 3, 2])] if margin is not None else [])
        ) / (2 if margin is not None else 1)),
        "health": band(dr_screen, [10, 20, 30, 50, 80], [6, 5, 4, 3, 2, 1]) if dr_screen is not None else 3,
        "dividend": band(-dyv, [-6, -4, -3, -1.5, 0], [6, 5, 4, 3, 2, 1]),
        "consensus": band(rec, [1.5, 2.0, 2.5, 3.0, 3.5], [6, 5, 4, 3, 2, 1]) if rec else 3,
        "flow": band(-(inst_pct or 0), [-50, -35, -20, -10, -4, 0], [6, 5, 4, 3, 2, 1]),
    }
    blurb = (info.get("longBusinessSummary") or "").strip()
    about = (blurb[:170].rsplit(" ", 1)[0] + "…") if len(blurb) > 170 else (blurb or name)
    return {
        "ticker": code, "name": name, "sector": sector, "board": "DFM", "market": "AE", "currency": "AED",
        "price": round(price, 2), "change": chg, "mcap": mcap,
        "pe": round(pe, 1) if pe else 0, "pb": round(pb, 2) if pb else 0, "divYield": round(dyv, 1),
        "star": star, "fairValue": round(target, 2) if target else round(price, 2),
        "sharia": auto_sharia(code, sector, dr), "shariaRatios": {"debt": dr if dr is not None else 0, "cashInterest": None, "impureIncome": None},
        "foreignFlow": "flat", "foreignOwn": None, "instOwn": inst_pct, "rumor": "low", "auto": True,
        "analysts": {"count": n_an, "buy": None, "hold": None, "sell": None, "target": round(target, 2) if target else None},
        "metrics": {"roe": round(roe * 100, 1) if roe is not None else None,
                    "margin": round(margin * 100, 1) if margin is not None else None,
                    "revGrowth": round(growth * 100, 1) if growth is not None else None},
        "about": about,
    }


def adx_record(c):
    star = c["star"]
    return {
        "ticker": c["t"], "name": c["name"], "sector": c["sector"], "board": "ADX", "market": "AE", "currency": "AED",
        "price": c["price"], "change": c["chg"], "mcap": c["mcap"],
        "pe": c["pe"], "pb": c["pb"], "divYield": c["dy"], "star": star, "fairValue": c["fv"],
        "sharia": c["sharia"], "shariaRatios": {"debt": c["dr"], "cashInterest": None, "impureIncome": None},
        "foreignFlow": "in", "foreignOwn": None, "instOwn": None, "rumor": "low", "auto": True,
        "analysts": {"count": 12, "buy": None, "hold": None, "sell": None, "target": c["fv"]},
        "metrics": {}, "about": c["about"],
    }


def apply_fair_value(rows):
    sec_pe = {}
    for r in rows:
        if r["pe"] and r["pe"] > 0:
            sec_pe.setdefault(r["sector"], []).append(r["pe"])
    med = {s: statistics.median(v) for s, v in sec_pe.items() if len(v) >= 3}
    for r in rows:
        price = r["price"]; cands = []
        if r["pe"] and r["pe"] > 0 and r["sector"] in med:
            cands.append((price / r["pe"]) * med[r["sector"]])
        t = r["analysts"].get("target")
        if t: cands.append(t)
        fv = sum(cands) / len(cands) if cands else price
        r["fairValue"] = round(max(price * 0.4, min(price * 2.5, fv)), 2)


def main():
    items = list(DFM.items())
    if LIMIT:
        items = items[:LIMIT]
    print(f"UAE: DFM live (Yahoo .AE) fetching {len(items)} + {len(ADX_CURATED)} curated ADX", flush=True)
    rows, ok, skip = [], 0, 0
    for n, (code, name) in enumerate(items, 1):
        rec = None
        try:
            rec = build_dfm(code, name)
        except Exception as e:
            print(f"  [{n}] {code} ERR {str(e)[:60]}", flush=True)
        if rec:
            rows.append(rec); ok += 1
        else:
            skip += 1
        if n % 5 == 0 or n == len(items):
            print(f"  [{n}/{len(items)}] DFM ok={ok} skip={skip} last={code}", flush=True)
        time.sleep(0.4)
    # merge curated ADX
    for c in ADX_CURATED:
        rows.append(adx_record(c))
    apply_fair_value(rows)

    import math
    def clean(o):
        if isinstance(o, float): return None if (math.isnan(o) or math.isinf(o)) else o
        if isinstance(o, dict): return {k: clean(v) for k, v in o.items()}
        if isinstance(o, list): return [clean(x) for x in o]
        return o
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(clean(rows), f, ensure_ascii=False, allow_nan=False, indent=1)
    dfm_n = sum(1 for r in rows if r["board"] == "DFM")
    adx_n = sum(1 for r in rows if r["board"] == "ADX")
    print(f"\nWrote {len(rows)} UAE stocks ({dfm_n} DFM live, {adx_n} ADX curated, {skip} skipped) -> {os.path.relpath(OUT)}", flush=True)


if __name__ == "__main__":
    main()
