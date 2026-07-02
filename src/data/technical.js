// Short-term technical signal — the 1-WEEK CONTRARIAN reversal (research §3.3).
// Tadawul rewards short-term reversal, NOT classic 12-1 momentum: names that fell
// hardest over the last week tend to bounce; names that spiked tend to give back.
// Cross-sectional — a stock is "oversold" relative to the rest of the market this
// week, not against a fixed threshold. revW = last-5-trading-day return (%),
// written by fetch_tadawul.py. Kept OUT of the Equity Star score (separate lens).
import { STOCKS } from './stocks.js';

// Build the cross-sectional distribution once per module load.
const _vals = STOCKS.map((s) => s.revW).filter((v) => v != null && Number.isFinite(v));
const _mean = _vals.length ? _vals.reduce((a, b) => a + b, 0) / _vals.length : 0;
const _sd = _vals.length
  ? Math.sqrt(_vals.reduce((a, b) => a + (b - _mean) ** 2, 0) / _vals.length)
  : 1;

export const HAS_TECHNICAL = _vals.length >= 20; // enough coverage to be meaningful

// z < 0 → underperformed the market this week (contrarian buy candidate);
// z > 0 → outperformed (pullback risk). Extremes (|z| ≥ 1.5) are flagged.
export function reversalSignal(s) {
  if (s?.revW == null || !Number.isFinite(s.revW) || !HAS_TECHNICAL) return null;
  const z = _sd ? (s.revW - _mean) / _sd : 0;
  if (z <= -1.5) {
    return { key: 'oversold', label: 'Oversold — reversal candidate', tone: 'success', z,
      rank: 2, note: 'Fell much harder than the market this week; short-term reversal has historically followed on Tadawul.' };
  }
  if (z >= 1.5) {
    return { key: 'overbought', label: 'Overbought — pullback risk', tone: 'destructive', z,
      rank: 0, note: 'Ran up far more than the market this week; short-term give-back is common. A contrarian caution, not a sell call.' };
  }
  return { key: 'inline', label: 'In line with the market', tone: 'muted', z, rank: 1,
    note: 'This week’s move is close to the market average — no contrarian edge.' };
}

export const REVERSAL_TONE = {
  success: 'text-success', destructive: 'text-destructive', muted: 'text-muted-foreground',
};
