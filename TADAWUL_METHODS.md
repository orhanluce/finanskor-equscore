# EquScore — Tadawul Method Playbook (signal priority matrix)

> Distilled from `tadawul_araştırma_sentezi.md` (35+ academic studies). This is the **authoritative
> source for which methods we use**. Mirrors FinanSkor's BIST academic roadmap, adapted to Tadawul.
> Two parts: **(A) corrections to what's already built**, **(B) prioritized build matrix**, **(C) DON'T list**.

---

## A. CORRECTIONS to the current EquScore build (do these first)

The prototype was built on generic logic; the research demands these fixes:

| # | Current state | Research finding | Fix |
|---|---|---|---|
| A1 | Equity Star **Value** dim = avg(P/E, **P/B**) | **P/B is WEAK on Tadawul** (§3.4) — value factor doesn't transfer from BIST | De-emphasise P/B; lead with **P/E + EV/EBITDA**. P/B never standalone. |
| A2 | **Fair Value** = analyst target or price×1.05 (placeholder) | Needs **Zakat-adjusted DCF / multiples + GCC peers** (§7) | Rebuild: P/E + EV/EBITDA vs GCC peers; effective tax (Saudi 7.7% / foreign 20% / oil 50-85%); USD-native WACC (peg → Rf = US T-bill + Saudi CRP). DDM for banks. |
| A3 | **Money Flow ★** = neutral placeholder (3) | **QFI foreign flow is informative** (foreigners value-driven vs retail speculative, §10) | Wire to **CMA weekly QFI net buy/sell**; "foreign institutional vs local retail" signal. |
| A4 | **NOMU (9xxx) treated same as TASI** | NOMU = different liquidity/float/vol profile (§9.4, DON'T #6) | **Flag NOMU separately**, separate risk profile; don't apply TASI metrics directly. |
| A5 | Oil exposure not shown / would be overstated | Oil-TASI corr only **~31% avg, sector-dependent** (§8.2, DON'T #7) | If shown, **sector-level** oil sensitivity, never a blanket "oil-driven". |
| A6 | Equity Star weights = generic | Re-weight per §11.1 (below) | Profitability HIGH, Health HIGH, **Technical HIGH**, **Social HIGH**, Value MEDIUM (Zakat-adj), Growth MEDIUM |

---

## B. PRIORITIZED BUILD MATRIX

### Equity Star re-weighting (§11.1) — Tadawul vs BIST
| Dimension | Tadawul weight | Why |
|---|---|---|
| Profitability (ROA/ROE/margin) | **HIGH ✓** | Retail-attention × profitability is the proven Tadawul mechanism (§3.2) |
| Financial Health (leverage) | **HIGH ✓** | 2006 crash = leverage disaster; Islamic constraints (§6.2) |
| **Technical signal** | **HIGH ↑** | Market periodically inefficient → technicals meaningful; **short-term (1wk) CONTRARIAN** strong, NOT 12-1 momentum (§3.3) |
| **Social media** | **HIGH ↑ (Arabic NLP)** | Twitter 14M+, Saudi #1 Arab; influencers predict moves (§4) |
| Valuation | **MEDIUM** (Zakat-adj) | P/B weak; EV/EBITDA + P/E lead (§3.4, §7) |
| Growth | MEDIUM | Vision 2030 sector growth differentiates (§9) |
| Management | MEDIUM | Improving post-CMA reform; data thin |

### Tier 0 — high value, build now (free/feasible)
- **T0.1 MAX score (lottery/retail-attention signal)** — `MAX_52w / stdev(returns)`. High MAX + high profitability → strong buy; high MAX + low profitability → **value-trap warning** (§3.2). *Tadawul-specific, free from OHLCV.*
- **T0.2 Fix Value dim + Fair Value** (A1, A2) — P/E/EV-EBITDA + GCC-peer relative; Zakat-adjusted effective tax.
- **T0.3 NOMU separation** (A4) — flag 9xxx as parallel-market, separate risk badge.
- **T0.4 Short-term contrarian technical** — 1-week reversal signal (not 12-1 momentum).
- **T0.5 Islamic-calendar risk overlay** — Hijri calendar; **Ramadan last 10 days = 🔴 liquidity-sell red flag** (§5.1); Eid herding window; Hajj → consumer-sector positive. *Novel differentiator, free.*

### Tier 1 — needs data feed / backend
- **T1.1 Arabic sentiment (Rumor Thermometer, real)** — AraBERT/CAMeL Tools + BORSAH-style lexicon; Twitter/X (Arabic) + **Google Trends (leading indicator)** + Snapchat + Argaam/Al Arabiya news. **Influencer-weighting + manipulation filter** (§4). *This is the Söylenti module — HIGH priority, Arabic NLP required.*
- **T1.2 QFI flow tracker** (A3) — CMA weekly QFI net flow → Money Flow ★.
- **T1.3 "Efsah Flash" + PEAD** — Tadawul/CMA disclosure (Efsah) sentiment + **post-earnings drift** signal (semi-strong inefficiency, §2.3).
- **T1.4 Decision Mirror — Saudi bias pack** (§6.4): Herd Index (CSAD), **Ramadan sell-trap**, MAX-trap, overconfidence (trade-frequency), concentration, leverage warnings. *Extends the journal we just built.*

### Tier 2 — later
- Volatility module (GARCH/EGARCH; periodic Ramadan/Eid/oil-shock multipliers, §8).
- GCC peer comparison view (UAE/Kuwait/Qatar/Bahrain).
- Overconfidence/literacy module (§6.3 paradox: literacy ↑ → overconfidence ↑).

---

## C. DON'T (§11.3) — hard rules
1. **No P/B as a headline value signal** (weak on Tadawul).
2. **No classic 12-1 momentum** — use 1-week contrarian instead.
3. **Don't mix pre-2017 (Saudi GAAP) financials** with IFRS.
4. **Don't treat Twitter as the only social source** — Snapchat + Google Trends matter.
5. **No ESG module yet** — CMA disclosure immature, data unreliable.
6. **Don't score NOMU with TASI standards.**
7. **Don't overstate oil-TASI correlation** (~31% avg; show per-sector).
8. **Never skip Zakat** in DCF (compute even if hidden from user).

---

## D. Recommended build order
1. **T0.1 MAX score + A1/A2 value/fair-value fix + A4 NOMU flag** (frontend + scoring; free, corrects the core).
2. **T0.5 Islamic-calendar overlay** (novel, cheap, demoable).
3. **T1.4 Decision-Mirror Saudi bias pack** (extends what we just shipped).
4. **T1.2 QFI flow** + **T1.3 Efsah/PEAD** (needs CMA/Efsah feed).
5. **T1.1 Arabic sentiment** (biggest data lift → last of Tier-1).

_Full source: `~/Downloads/tadawul_araştırma_sentezi.md` (35 refs). Updated 2026-06-29._
