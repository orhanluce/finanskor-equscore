# EquScore — MENA Expansion (FinanSkor for the Gulf)

> Working domain: **equscore** (placeholder — change when a better name is found).
> EquScore is the MENA edition of FinanSkor: the **accountability & trust layer** for Gulf equity markets (Tadawul, DFM/ADX, QSE).
> Method & approach are a 1:1 port of FinanSkor. What changes: **language (English-first, Arabic next), data sources, and the "real-return lens → Sharia lens" swap.**

---

## 1. Field-research findings (2026-06)

### Target markets
| | 🇸🇦 Saudi · **Tadawul** | 🇦🇪 UAE · **DFM + ADX + Nasdaq Dubai** | 🇶🇦 Qatar · **QSE** |
|---|---|---|---|
| Regulator | CMA | SCA (federal) | QFMA |
| Disclosure platform (KAP analog) | **Efsah** (إفصاح) — AR+EN mandatory | DFM/ADX disclosure portals | QSE disclosures |
| Currency | SAR — **USD peg 3.75** (1987) | AED — **3.6725** (1997) | QAR — **3.64** |
| Inflation (2025-26) | **~2%** | low | low |
| Foreign access | **QFI abolished 1 Feb 2026** — open to all, 49% cap | open, sectoral caps | largely open |
| Languages | Arabic + English | Arabic + English | Arabic + English |

### 🔑 Most important finding — half of our methodology loses meaning here
FinanSkor's two core differentiators in Turkey are **(1) real (inflation-adjusted) return lens** and **(2) USD view**. In the GCC, inflation is ~2% and currencies are hard-pegged to USD → **nominal ≈ real, no FX erosion. The real-return "aha" is largely irrelevant.**
- → Make the real-return / FX lens a **toggleable, off-by-default module** (returns for Egypt/EGX high-inflation later, and as an **expat multi-currency** lens — most Gulf residents think in INR/EGP/PHP/GBP).
- → Its place as a **core differentiator is taken by Sharia compliance** (see §4).

### What we do in TR but **cannot / must change** in MENA
| TR method | MENA reality | Action |
|---|---|---|
| Real-return + USD lens | Unnecessary (low infl + peg) | Off by default; becomes expat/multi-currency module |
| **borsapy** (free BIST data) | **No equivalent** | Paid vendor required → budget line (delayed/EOD is enough) |
| Turkish BERT (KAP Flash, sentiment) | Won't work | Efsah is EN-first → English LLM easy; Arabic NLP later |
| HisseTakibi.com 10 strategies (founder asset) | Doesn't exist in MENA | Cold start from scratch (virtual portfolio + contest) |
| GA/GRU weights (calibrated on BIST theses) | BIST-specific | Models port, **weights retrained on MENA data** |
| MKK-grade settlement/foreign-flow granularity | Different structure | Exchanges publish foreign-ownership → feasible, lower granularity |

**Ports 1:1 (language aside):** Equity Star engine, Fair Value (FADM — cleaner here, USD-native), 3-League/contest, Virtual Portfolio, Decision Journal/Mirror, Rumor Thermometer, Verified Investors, Anomaly Hunter, ValidOK.

---

## 2. Region-specific features to ADD
1. **🕌 Sharia Compliance Screen (AAOIFI Standard No. 21)** — *new core module & differentiator.*
   - Business-activity screen + 3 financial ratios: interest-bearing debt < 30% of mcap, interest deposits < 30%, impermissible income < 5% of total.
   - **Purification ratio** (share of income to be donated).
   - Derivable from the financials we already compute → low extra cost, high differentiation.
   - Competitors (Zoya, Musaffa, Islamicly) only screen — they lack our score + accountability + behavioral layer. Combined product = no direct rival.
2. **Arabic-first, RTL UI** + English. (Our jargon "?" system fits Arabic well.)
3. **Zakat helper** — annual zakat on portfolio (cultural stickiness + retention).
4. **Sukuk / Islamic-finance context** (later phase).

---

## 3. Data sources (delayed / EOD is sufficient — no live feed needed)
| Layer | Source |
|---|---|
| Price / OHLCV / EOD | **EODHD**, **Twelve Data** (Tadawul=`XSAU`), **Masadir** (all 4 GCC, one API), official Tadawul/QSE EOD, **`tasi`** R package (Saudi prices+financials — closest borsapy analog), ICE |
| Fundamentals | EODHD fundamentals, **Argaam**, **Mubasher**, filings (Efsah EN) |
| Disclosures (KAP-Flash analog) | **Efsah** (KSA, AR+EN), DFM/ADX/QSE portals, Argaam/Mubasher news |
| Analyst estimates/recos | **Argaam** (analyst-recommendation + estimates, Tadawul+Nomu), Mubasher |
| Foreign / institutional flow | Exchange foreign-ownership reports (QFI removed, 49% cap) |
| Social sentiment | X (Arabic), Mubasher/Argaam comments, local forums |
| Sharia ratios | Computed from our fundamentals; or IdealRatings/Islamicly API for validation |
| Macro | SAMA / CBUAE / QCB + IMF — low inflation, peg (simple) |

> Note: TR had free borsapy; in MENA **data licensing is a real budget line** (start small: EODHD/Twelve Data all-in ≈ a few hundred $/mo; Argaam/Masadir enterprise). Delayed/EOD keeps us on the cheapest tier.

---

## 4. ROADMAP (priority) — Saudi-first, sequential
**Why Saudi (Tadawul) first:** biggest & most liquid (TASI ~$2.5T+), richest data ecosystem (Argaam + Efsah + `tasi` + Twelve Data XSAU), QFI just opened → foreign-flow story is hot, broadest retail base. Then UAE (two markets), then Qatar.

- **Phase 0 — Foundation & decisions (~3-4 wks):** vendor selection PoC (EODHD vs Twelve Data vs Masadir — coverage/cost); architecture = single codebase, **multi-market** (`country/currency/lang/sharia` fields); make real-return lens toggleable; Fair Value → USD-native.
- **Phase 1 — Tadawul (Saudi) MVP (~8-10 wks):** `stocks` (TASI+Nomu) + sector + **Sharia flag**; EOD price + fundamentals ingestion; Equity Star (re-calibrated weights); Fair Value (FADM, USD-native); **"Efsah Flash"** (KAP-Flash analog, EN-first LLM) + Argaam analyst feed; **Sharia Screen module** (AAOIFI) + purification; social/contest/virtual-portfolio; UI EN + Arabic (RTL).
- **Phase 2 — UAE (DFM + ADX + Nasdaq Dubai) (~4-6 wks):** same engine; add data source + disclosure portals; two exchanges under one "UAE" view.
- **Phase 3 — Qatar (QSE) (~3-4 wks):** smallest/fastest; engine mature.
- **Cross-cutting:** Arabic localization, Sharia data validation, expat multi-currency lens, MENA model retraining pipeline.

---

## 5. This repo (frontend prototype)
`equscore-web` — a faithful port of FinanSkor's design system (DM Sans + Georgia serif, amber/beige theme, the live candlestick WebGL hero), **English**. Pages: Home, Market, Stock Detail (Equity Star + Sharia + USD-native Fair Value, no real-return lens), **Sharia Screener** (new core), Leaderboard/Contest, Methodology.

### Data: FREE live Tadawul (no key) — DONE
`scripts/fetch_tadawul.py` pulls **real (delayed) price + fundamentals from Yahoo Finance** (`{code}.SR`, via yfinance — no API key), computes the 5 fundamental Equity-Star dims + analyst consensus + the **Sharia debt ratio** (totalDebt/mcap), and writes `src/data/tadawul_live.json`. The frontend prefers it over the sample (`IS_LIVE` flag). Refresh: `py scripts/fetch_tadawul.py`. 18 Tadawul names live.
- Vendor keys checked: EODHD key valid but **free plan has no Saudi**; Twelve Data key valid but **Tadawul needs Pro ($229/mo)**. → We chose the **free Yahoo route** to start.
- `tasi` R pkg installed (R 4.6.1) but `saudiexchange.sa` returns 403 from outside KSA — usable only from a KSA IP.

**Next steps (paid upgrade, later):** full AAOIFI cash/impure ratios + analyst-accountability feed (Argaam) + foreign-flow + Efsah Flash; Supabase backend; Arabic/RTL. Keys live in `.env` (gitignored).

_Sources: Twelve Data XSAU; Masadir GCC; EODHD; `tasi` R pkg; CMA/Efsah disclosure guide; AAOIFI screening (HalalScreener); Argaam analyst recos; Mubasher.info; QFI abolition (GT 2026); GCC USD peg & inflation._
