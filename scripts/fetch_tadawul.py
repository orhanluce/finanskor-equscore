"""
EquScore — FREE full-Tadawul ingestion.
  * Symbol list  : Twelve Data reference endpoint (free) -> all TASI codes + clean names.
  * Price+fundamentals : Yahoo Finance (yfinance, {code}.SR) -> no key, delayed/EOD.
Computes the 7-dim Equity Star, the Sharia debt ratio (live) + an auto Sharia screen,
and per-dimension driver metrics (for the Star/Cube explanations). Writes
src/data/tadawul_live.json incrementally. The 18 curated names keep rich extras.

Run:  py scripts/fetch_tadawul.py            (all stocks; ~10-20 min)
      LIMIT=30 py scripts/fetch_tadawul.py   (first 30 only — quick test)
"""
import os, json, time, re, statistics, urllib.request, urllib.error
import yfinance as yf

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "..", "src", "data", "tadawul_live.json")
ENV = os.path.join(HERE, "..", ".env")
LIMIT = int(os.environ.get("LIMIT", "0"))

env = {}
for line in open(ENV, encoding="utf-8"):
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, v = line.split("=", 1); env[k.strip()] = v.strip()
TD = env.get("TWELVEDATA_API_KEY", "")
SAHMK_KEY = env.get("SAHMK_API_KEY", "")
SAHMK_N = int(os.environ.get("SAHMK_N", "80"))   # free tier = 100 req/day -> top-N by mcap

# Real Shariah-board certification (Argaam, via scripts/fetch_sharia_argaam.py). Takes
# priority over the CURATED guesses and the sector heuristic when present for a code.
ARGAAM_PATH = os.path.join(HERE, "..", "src", "data", "sharia_argaam.json")
try:
    with open(ARGAAM_PATH, encoding="utf-8") as f:
        ARGAAM = json.load(f)
except FileNotFoundError:
    ARGAAM = {}

# Known Sharia classification of Saudi banks (the auto debt-ratio screen is meaningless
# for banks, so we hard-code the well-established status).
ISLAMIC_BANKS = {"1120", "1150", "1140", "1020"}        # Al Rajhi, Alinma, Albilad, Aljazira (fully Islamic)
CONVENTIONAL_BANKS = {"1030", "1050", "1060", "1080"}   # SAIB, Banque Saudi Fransi, SABB, Arab National Bank


def auto_sharia(code, sector, dr):
    """Heuristic AAOIFI-style status for non-curated names. Business screen by sector +
    live interest-bearing-debt ratio. Clearly flagged 'auto' in the UI (verify with a Shariah board)."""
    if sector == "Banking":
        if code in ISLAMIC_BANKS:
            return "compliant"
        if code in CONVENTIONAL_BANKS:
            return "non-compliant"
        return "doubtful"
    if sector == "Insurance":
        return "doubtful"                       # cooperative/takaful — needs purification review
    if sector == "Real Estate":
        return "compliant" if (dr is None or dr < 45) else "doubtful"   # REITs tolerate more leverage
    return "compliant" if (dr is None or dr < 33) else "doubtful"       # AAOIFI 33% debt line

CURATED = {
    "2222": dict(sharia="compliant", cashInterest=4, impure=0.3, flow="in", own=1.8, rumor="low"),
    "1120": dict(sharia="compliant", cashInterest=0, impure=0, flow="in", own=12.4, rumor="medium"),
    "1180": dict(sharia="doubtful", cashInterest=19, impure=6.2, flow="flat", own=9.1, rumor="medium"),
    "1010": dict(sharia="non-compliant", cashInterest=31, impure=41, flow="flat", own=6.2, rumor="low"),
    "1150": dict(sharia="compliant", cashInterest=0, impure=0, flow="in", own=7.6, rumor="high"),
    "7010": dict(sharia="compliant", cashInterest=9, impure=1.1, flow="flat", own=4.3, rumor="low"),
    "2010": dict(sharia="compliant", cashInterest=7, impure=0.6, flow="out", own=5.5, rumor="medium"),
    "1211": dict(sharia="compliant", cashInterest=6, impure=0.2, flow="in", own=8.0, rumor="high"),
    "2082": dict(sharia="compliant", cashInterest=5, impure=0.1, flow="in", own=6.8, rumor="danger"),
    "2280": dict(sharia="compliant", cashInterest=8, impure=0.4, flow="flat", own=6.0, rumor="low"),
    "4190": dict(sharia="compliant", cashInterest=3, impure=0.9, flow="flat", own=5.2, rumor="low"),
    "5110": dict(sharia="doubtful", cashInterest=12, impure=2.0, flow="flat", own=2.1, rumor="low"),
    "4013": dict(sharia="compliant", cashInterest=5, impure=0.2, flow="in", own=9.5, rumor="medium"),
    "4001": dict(sharia="compliant", cashInterest=6, impure=0.8, flow="flat", own=3.4, rumor="low"),
    "2050": dict(sharia="doubtful", cashInterest=14, impure=3.1, flow="in", own=4.0, rumor="medium"),
    "7203": dict(sharia="compliant", cashInterest=3, impure=0.1, flow="in", own=7.1, rumor="danger"),
    "2380": dict(sharia="non-compliant", cashInterest=8, impure=1.4, flow="out", own=1.2, rumor="medium"),
    "8210": dict(sharia="compliant", cashInterest=22, impure=4.2, flow="in", own=8.3, rumor="medium"),
}

SECTOR_MAP = {
    "Energy": "Energy", "Financial Services": "Banking", "Basic Materials": "Materials",
    "Communication Services": "Telecom", "Utilities": "Utilities", "Consumer Defensive": "Consumer Staples",
    "Consumer Cyclical": "Retail", "Healthcare": "Health Care", "Technology": "Technology",
    "Industrials": "Industrials", "Real Estate": "Real Estate",
}


def http(url, t=25, headers=None):
    h = {"User-Agent": "Mozilla/5.0"}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=t) as r:
            return json.loads(r.read())
    except Exception:
        return None


def sahmk_quote(symbol):
    """Tadawul-LICENSED quote: official price/change + real intraday net money flow
    (liquidity.net_value). Free tier = 100 req/day, so used only for the top-N by mcap."""
    if not SAHMK_KEY:
        return None
    d = http(f"https://app.sahmk.sa/api/v1/quote/{symbol}/", headers={"X-API-Key": SAHMK_KEY})
    return d if isinstance(d, dict) and d.get("symbol") else None


def apply_sahmk(rows):
    """Override price/change + Money Flow ★ for the top-N most valuable names using SAHMK's
    licensed quote (real net money flow). The rest keep the Yahoo institutional-ownership proxy."""
    if not SAHMK_KEY:
        return 0
    top = sorted([r for r in rows if r.get("mcap")], key=lambda r: r["mcap"], reverse=True)[:SAHMK_N]
    n = 0
    for r in top:
        q = sahmk_quote(r["ticker"])
        if not q:
            continue
        if num(q.get("price")):
            r["price"] = round(num(q["price"]), 2)
            r["change"] = round(num(q.get("change_percent")) or 0, 2)
        liq = q.get("liquidity") or {}
        net = num(liq.get("net_value")); val = num(q.get("value"))
        if net is not None and val:
            fp = round(net / val * 100, 1)
            r["netFlowPct"] = fp
            r["flowSource"] = "sahmk"
            r["star"]["flow"] = band(-fp, [-10, -4, -1, 1, 4], [6, 5, 4, 3, 2, 1])
            r["foreignFlow"] = "in" if fp > 2 else "out" if fp < -2 else "flat"
        n += 1
        time.sleep(0.2)
    return n


def symbol_list():
    d = http(f"https://api.twelvedata.com/stocks?exchange=Tadawul&apikey={TD}")
    arr = (d or {}).get("data", []) if isinstance(d, dict) else []
    out = {}
    for s in arr:
        code = str(s.get("symbol", ""))
        if re.fullmatch(r"\d{4}", code) and code not in out:
            out[code] = s.get("name") or code
    return out


def yahoo_series(symbol):
    """1y daily history -> (price, change%, daily_returns[]). One call powers price,
    change AND the 52-week MAX/retail-attention signal (research §3.2)."""
    d = http(f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=1y")
    try:
        r = d["chart"]["result"][0]
        closes = [c for c in r["indicators"]["quote"][0]["close"] if c]
        m = r["meta"]
        price = m.get("regularMarketPrice") or (closes[-1] if closes else None)
        prev = (closes[-2] if len(closes) >= 2 else None) or m.get("chartPreviousClose")
        chg = round((price / prev - 1) * 100, 2) if (price and prev) else 0.0
        rets = [closes[i] / closes[i - 1] - 1 for i in range(1, len(closes)) if closes[i - 1]]
        return price, chg, rets
    except Exception:
        return None, 0.0, []


def week_return(rets):
    """Last-5-trading-day compound return (%) — feeds the 1-week CONTRARIAN signal
    (research §3.3: short-term reversal works on Tadawul; classic 12-1 momentum does
    NOT). Cross-sectional thresholding happens on the frontend."""
    if len(rets) < 5:
        return None
    w = 1.0
    for r in rets[-5:]:
        w *= (1 + r)
    return round((w - 1) * 100, 2)


def max_signal(rets):
    """MAX / retail-attention score (§3.2): biggest single-day jump in stdev units."""
    if len(rets) < 30:
        return None
    sd = statistics.pstdev(rets)
    if sd <= 0:
        return None
    return round(max(rets) / sd, 1)


def flow_score(inst_pct):
    """Money Flow ★ from institutional ownership (smart-money proxy, research §10).
    Free Yahoo proxy until true QFI foreign-flow (paid / KSA-only) is wired."""
    if inst_pct is None:
        return 3
    return band(-inst_pct, [-50, -35, -20, -10, -4, 0], [6, 5, 4, 3, 2, 1])


def value_score(pe, ev, pb):
    """Tadawul value: P/E + EV/EBITDA lead; P/B WEAK -> minor weight only (research §3.4)."""
    pe_s = band(pe if (pe and pe > 0) else 99, [8, 12, 16, 22, 30, 45], [6, 5, 4, 3, 2, 1, 0])
    pb_s = band(pb if pb else 99, [1, 1.5, 2.5, 4, 7, 10], [6, 5, 4, 3, 2, 1, 0])
    if ev and ev > 0:
        ev_s = band(ev, [5, 8, 11, 14, 18, 25], [6, 5, 4, 3, 2, 1, 0])
        return round(0.45 * pe_s + 0.45 * ev_s + 0.10 * pb_s)
    return round(0.80 * pe_s + 0.20 * pb_s)


def band(x, thr, sc):
    for t, s in zip(thr, sc):
        if x is not None and x <= t:
            return s
    return sc[-1]


def num(v):
    try:
        f = float(v)
        return f if f == f and abs(f) != float("inf") else None
    except (TypeError, ValueError):
        return None


def build(code, name):
    """Fetch + score one stock. Returns a record dict, or None if no price."""
    sym = f"{code}.SR"
    price, chg, rets = yahoo_series(sym)
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
    roe = num(info.get("returnOnEquity")); roa = num(info.get("returnOnAssets"))
    margin = num(info.get("profitMargins")); growth = num(info.get("revenueGrowth"))
    target = num(info.get("targetMeanPrice")); rec = num(info.get("recommendationMean"))
    n_an = int(num(info.get("numberOfAnalystOpinions")) or 0)
    inst = num(info.get("heldPercentInstitutions"))
    inst_pct = round(inst * 100, 1) if inst is not None else None
    mx = max_signal(rets)
    wr = week_return(rets)

    star = {
        "value": value_score(pe, ev, pb),
        "growth": band(-((growth or 0) * 100), [-25, -15, -8, -3, 0, 99], [6, 5, 4, 3, 2, 1]),
        "quality": round(sum(
            [band(-(roe or 0) * 100, [-20, -15, -10, -5, 0], [6, 5, 4, 3, 2])] +
            ([band(-(margin) * 100, [-20, -12, -6, -2, 0], [6, 5, 4, 3, 2])] if margin is not None else [])
        ) / (2 if margin is not None else 1)),
        "health": band(dr, [10, 20, 30, 50, 80], [6, 5, 4, 3, 2, 1]) if dr is not None else 3,
        "dividend": band(-dyv, [-6, -4, -3, -1.5, 0], [6, 5, 4, 3, 2, 1]),
        "consensus": band(rec, [1.5, 2.0, 2.5, 3.0, 3.5], [6, 5, 4, 3, 2, 1]) if rec else 3,
        "flow": flow_score(inst_pct),
    }
    sector = SECTOR_MAP.get(info.get("sector"), "Industrials")
    board = "NOMU" if code.startswith("9") else "TASI"   # parallel market — separate risk (§9.4)
    cur = CURATED.get(code)
    arg = ARGAAM.get(code)
    shariaBoards = purificationPerShare = None
    if arg:
        # Certified by >=1 real Shariah board: compliant, not a heuristic guess.
        sharia = "compliant"
        shariaBoards = arg["boards"]
        purificationPerShare = arg.get("purification")
        cashI = impure = None
        flow, own, rumor, auto = (cur["flow"], cur["own"], cur["rumor"], False) if cur else ("flat", None, "low", False)
    elif cur:
        sharia, cashI, impure = cur["sharia"], cur["cashInterest"], cur["impure"]
        flow, own, rumor, auto = cur["flow"], cur["own"], cur["rumor"], False
    else:
        sharia = auto_sharia(code, sector, dr)
        cashI = impure = own = None; flow = "flat"; rumor = "low"; auto = True

    # MAX / retail-attention flag (§3.2): high MAX + high profitability = strong;
    # high MAX + low profitability = value trap. Only the actionable extremes are flagged.
    qual = star["quality"]
    max_flag = None
    if mx is not None and mx >= 5:
        if qual >= 4: max_flag = "strong"
        elif qual <= 2: max_flag = "trap"

    blurb = (info.get("longBusinessSummary") or "").strip()
    about = (blurb[:180].rsplit(" ", 1)[0] + "…") if len(blurb) > 180 else (blurb or name)

    return {
        "ticker": code, "name": name, "sector": sector, "board": board, "nomu": board == "NOMU",
        "market": "TADAWUL", "currency": "SAR",
        "price": round(price, 2), "change": chg, "mcap": mcap,
        "pe": round(pe, 1) if pe else 0, "pb": round(pb, 2) if pb else 0,
        "evEbitda": round(ev, 1) if ev else None, "divYield": round(dyv, 1),
        "star": star, "fairValue": round(target, 2) if target else round(price, 2),  # provisional; set in post-pass
        "maxScore": mx, "maxFlag": max_flag, "revW": wr,
        "sharia": sharia,
        "shariaRatios": {"debt": dr if dr is not None else 0, "cashInterest": cashI, "impureIncome": impure},
        "shariaBoards": shariaBoards, "purificationPerShare": purificationPerShare,
        "foreignFlow": flow, "foreignOwn": own, "instOwn": inst_pct, "rumor": rumor, "auto": auto,
        "analysts": {"count": n_an, "buy": None, "hold": None, "sell": None, "target": round(target, 2) if target else None},
        "metrics": {"roe": round(roe * 100, 1) if roe is not None else None,
                    "roa": round(roa * 100, 1) if roa is not None else None,
                    "margin": round(margin * 100, 1) if margin is not None else None,
                    "revGrowth": round(growth * 100, 1) if growth is not None else None,
                    "recMean": rec, "upside": None},  # upside set in post-pass vs fair value
        "about": about,
    }


def apply_fair_value(rows):
    """Multiples-based fair value: sector-relative P/E reversion blended with analyst target,
    USD-native (peg). Replaces the crude price*1.05 placeholder (research §7, A2). Zakat is
    implicit in market multiples; full Zakat-DCF is a later upgrade."""
    sec_pe = {}
    for r in rows:
        if r["pe"] and r["pe"] > 0:
            sec_pe.setdefault(r["sector"], []).append(r["pe"])
    med = {s: statistics.median(v) for s, v in sec_pe.items() if len(v) >= 3}
    for r in rows:
        price = r["price"]; cands = []
        if r["pe"] and r["pe"] > 0 and r["sector"] in med:
            eps = price / r["pe"]
            cands.append(eps * med[r["sector"]])          # sector P/E reversion
        t = r["analysts"].get("target")
        if t:
            cands.append(t)
        fv = sum(cands) / len(cands) if cands else price
        fv = max(price * 0.4, min(price * 2.5, fv))        # clamp absurd multiples
        r["fairValue"] = round(fv, 2)
        r["metrics"]["upside"] = round((t / price - 1) * 100, 1) if t else None


def main():
    syms = symbol_list()
    items = list(syms.items())
    if LIMIT:
        items = items[:LIMIT]
    print(f"Tadawul symbols: {len(syms)} | fetching {len(items)}", flush=True)
    rows, ok, skip = [], 0, 0

    def _clean(o):  # strict JSON: NaN/Inf -> null (JS JSON.parse rejects them)
        import math
        if isinstance(o, float):
            return None if (math.isnan(o) or math.isinf(o)) else o
        if isinstance(o, dict):
            return {k: _clean(v) for k, v in o.items()}
        if isinstance(o, list):
            return [_clean(x) for x in o]
        return o

    def save():
        with open(OUT, "w", encoding="utf-8") as f:
            json.dump(_clean(rows), f, ensure_ascii=False, allow_nan=False, indent=1)

    for n, (code, name) in enumerate(items, 1):
        rec = None
        try:
            rec = build(code, name)
        except Exception as e:
            print(f"  [{n}/{len(items)}] {code} ERR {str(e)[:70]}", flush=True)
        if rec:
            rows.append(rec); ok += 1
        else:
            skip += 1
        if n % 20 == 0 or n == len(items):
            last = rows[-1] if rows else {}
            print(f"  [{n}/{len(items)}] ok={ok} skip={skip} | last {code} {name[:22]} "
                  f"{last.get('price')} SAR star={sum(last.get('star', {}).values())}/42", flush=True)
            save()
        time.sleep(0.35)

    sk = apply_sahmk(rows)   # licensed price + real money flow for top-N
    print(f"  SAHMK: {sk} stocks with licensed price + net money flow", flush=True)
    apply_fair_value(rows)
    save()
    nomu = sum(1 for r in rows if r.get("nomu"))
    traps = sum(1 for r in rows if r.get("maxFlag") == "trap")
    print(f"\nWrote {len(rows)} stocks ({skip} skipped, {nomu} NOMU, {traps} value-traps, {sk} SAHMK-flow) -> {os.path.relpath(OUT)}", flush=True)


if __name__ == "__main__":
    main()
