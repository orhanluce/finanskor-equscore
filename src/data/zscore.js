// Altman Z-Score (Z″ / Z-double-prime, MENA-adapted) — Financial Health axis.
// Per the Quiscor guide: Z″ = 6.56·A + 3.26·B + 6.72·C + 1.05·D, emerging-market
// thresholds (Safe > 2.60, Grey 1.10–2.60, Distress < 1.10).
//
// NOTE ON DATA: a true Z″ needs balance-sheet items (working capital, retained
// earnings, EBITDA, total assets, equity/debt). Those are fed by the otomasyon
// pipeline (EODHD/SAHMK) in production — same pattern as SAHMK money flow. Until
// then we DERIVE an illustrative Z″ from the Health/Quality/Value stars + the
// Sharia leverage ratio, so it stays consistent with the rest of the score.

import { COUNTRY, STOCKS } from '@/data/stocks.js';

const EXCLUDED = new Set(['Banking', 'Insurance', 'Takaful']);
const REAL_ESTATE = new Set(['Real Estate', 'Construction & Real Estate']);

export const Z_SAFE = 2.60;
export const Z_DISTRESS = 1.10;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Derived components (illustrative — replaced by real financials via the pipeline).
function components(s) {
  const hv = (s.star?.health ?? 3) / 6;
  const qv = (s.star?.quality ?? 3) / 6;
  const vv = (s.star?.value ?? 3) / 6;
  const gv = (s.star?.growth ?? 3) / 6;
  const debt = s.shariaRatios?.debt ?? 30; // interest-bearing debt as % of mcap
  const A = +(0.03 + 0.07 * vv).toFixed(4);
  const B = +(0.02 + 0.11 * qv).toFixed(4);
  const C = +(0.02 + 0.07 * ((qv + gv) / 2)).toFixed(4);
  const D = +clamp((1 - debt / 100) * (1.5 + 2.5 * hv), 0.2, 6).toFixed(4);
  return { A, B, C, D };
}

function marketNote(market, sector) {
  if (market === 'TASI') return 'tasi-high';
  if ((market === 'DFM' || market === 'ADX') && REAL_ESTATE.has(sector)) return 'dfm-re';
  if (market === 'EGX') return 'egx-fx';
  return null;
}

export function computeZScore(s, market = COUNTRY.id) {
  const sector = s.sector;
  if (EXCLUDED.has(sector)) {
    return {
      applicable: false,
      alternative: sector === 'Banking' ? 'CAR' : 'Solvency',
    };
  }
  const c = components(s);
  const z = +(6.56 * c.A + 3.26 * c.B + 6.72 * c.C + 1.05 * c.D).toFixed(2);
  const zone = z > Z_SAFE ? 'safe' : z >= Z_DISTRESS ? 'grey' : 'distress';
  return { applicable: true, z, zone, components: c, noteKey: marketNote(market, sector) };
}

// Sector-relative percentile (0–100) across applicable peers in the active market.
export function zPercentile(s) {
  const peers = STOCKS
    .filter((p) => p.sector === s.sector && !EXCLUDED.has(p.sector))
    .map((p) => computeZScore(p).z)
    .filter((z) => z != null);
  if (peers.length < 3) return { percentile: null, peers: peers.length };
  const my = computeZScore(s).z;
  const below = peers.filter((z) => z < my).length;
  return {
    percentile: Math.round((below / peers.length) * 100),
    peers: peers.length,
    mean: +(peers.reduce((a, b) => a + b, 0) / peers.length).toFixed(2),
  };
}

// 8-quarter trend path that lands on the current Z″ (illustrative sparkline).
export function zTrend(z, n = 8) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const drift = (z - 0.4) + 0.4 * f;            // gently rising toward current
    const wobble = Math.sin(i * 1.7) * 0.18;
    pts.push(+Math.max(0.1, drift + wobble).toFixed(2));
  }
  pts[n - 1] = z;
  return pts;
}

export const ZONE_META = {
  safe: { label: 'Safe Zone', tone: 'success' },
  grey: { label: 'Grey Zone', tone: 'medal-bronze' },
  distress: { label: 'Distress Zone', tone: 'destructive' },
};
