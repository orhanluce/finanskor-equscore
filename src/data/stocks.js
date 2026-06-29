// EquScore — country-aware dataset selector.
// The active country (countries.js, persisted in localStorage) decides which market's
// data this module exposes. Pages import { STOCKS, SECTORS, getStock } unchanged — switching
// country persists the choice and reloads, so this module re-evaluates for the new market.
//
// Equity Star = 7 dimensions, each 0–6 → total out of 42 (same engine across all countries).
//   5 fundamental: value · growth · quality · health · dividend
//   2 signal ★    : consensus (analyst hit-rate weighted) · flow (smart-money)

import { COUNTRIES, ACTIVE } from './countries.js';

// ─── Saudi (Tadawul) sample — fallback when the live feed is empty ───
const SA_RAW = [
  { ticker: '2222', name: 'Saudi Aramco', sector: 'Energy', price: 27.85, change: 0.36, mcap: 6.74e12,
    pe: 16.2, pb: 3.6, divYield: 5.6, star: { value: 3, growth: 3, quality: 6, health: 6, dividend: 6, consensus: 4, flow: 4 },
    fairValue: 29.5, sharia: 'compliant', shariaRatios: { debt: 11, cashInterest: 4, impureIncome: 0.3 },
    foreignFlow: 'in', foreignOwn: 1.8, rumor: 'low', analysts: { count: 18, buy: 9, hold: 7, sell: 2, target: 31.0 },
    about: 'The world\'s largest integrated oil & gas company and the anchor of TASI. Dividend backbone of the index.' },
  { ticker: '1120', name: 'Al Rajhi Bank', sector: 'Banking', price: 96.4, change: 1.21, mcap: 3.86e11,
    pe: 18.4, pb: 4.1, divYield: 2.9, star: { value: 2, growth: 5, quality: 5, health: 4, dividend: 3, consensus: 5, flow: 5 },
    fairValue: 104, sharia: 'compliant', shariaRatios: { debt: 0, cashInterest: 0, impureIncome: 0 },
    foreignFlow: 'in', foreignOwn: 12.4, rumor: 'medium', analysts: { count: 16, buy: 11, hold: 4, sell: 1, target: 108 },
    about: 'The largest Islamic bank in the world by market cap. Fully Sharia-compliant retail banking franchise.' },
  { ticker: '1180', name: 'Saudi National Bank (SNB)', sector: 'Banking', price: 36.2, change: -0.55, mcap: 2.17e11,
    pe: 11.1, pb: 1.3, divYield: 4.1, star: { value: 5, growth: 3, quality: 4, health: 4, dividend: 4, consensus: 4, flow: 3 },
    fairValue: 40, sharia: 'doubtful', shariaRatios: { debt: 24, cashInterest: 19, impureIncome: 6.2 },
    foreignFlow: 'flat', foreignOwn: 9.1, rumor: 'medium', analysts: { count: 15, buy: 8, hold: 6, sell: 1, target: 41.5 },
    about: 'Saudi Arabia\'s biggest bank by assets. Conventional + Islamic windows — fails the 5% impure-income screen.' },
  { ticker: '7010', name: 'stc (Saudi Telecom)', sector: 'Telecom', price: 41.1, change: 0.49, mcap: 2.05e11,
    pe: 15.6, pb: 2.4, divYield: 4.4, star: { value: 4, growth: 3, quality: 5, health: 5, dividend: 5, consensus: 4, flow: 3 },
    fairValue: 44, sharia: 'compliant', shariaRatios: { debt: 18, cashInterest: 9, impureIncome: 1.1 },
    foreignFlow: 'flat', foreignOwn: 4.3, rumor: 'low', analysts: { count: 15, buy: 8, hold: 6, sell: 1, target: 45 },
    about: 'Dominant telecom operator with a strong dividend and digital-infrastructure growth optionality.' },
  { ticker: '2010', name: 'SABIC', sector: 'Materials', price: 64.5, change: -1.1, mcap: 1.94e11,
    pe: 22.0, pb: 1.4, divYield: 4.7, star: { value: 4, growth: 2, quality: 4, health: 5, dividend: 5, consensus: 3, flow: 2 },
    fairValue: 68, sharia: 'compliant', shariaRatios: { debt: 21, cashInterest: 7, impureIncome: 0.6 },
    foreignFlow: 'out', foreignOwn: 5.5, rumor: 'medium', analysts: { count: 17, buy: 6, hold: 9, sell: 2, target: 70 },
    about: 'Global petrochemicals champion, majority-owned by Aramco. Cyclical earnings, defensive balance sheet.' },
  { ticker: '1211', name: 'Maaden (Saudi Mining)', sector: 'Materials', price: 52.3, change: 2.4, mcap: 1.99e11,
    pe: 34.5, pb: 3.0, divYield: 0.4, star: { value: 2, growth: 6, quality: 4, health: 3, dividend: 1, consensus: 5, flow: 6 },
    fairValue: 55, sharia: 'compliant', shariaRatios: { debt: 27, cashInterest: 6, impureIncome: 0.2 },
    foreignFlow: 'in', foreignOwn: 8.0, rumor: 'high', analysts: { count: 16, buy: 12, hold: 3, sell: 1, target: 58 },
    about: 'National mining champion (phosphate, gold, aluminium) — a Vision 2030 growth proxy with strong inflows.' },
  { ticker: '4013', name: 'Dr Sulaiman Al Habib', sector: 'Health Care', price: 282, change: 1.7, mcap: 9.87e10,
    pe: 41.0, pb: 9.8, divYield: 1.2, star: { value: 1, growth: 6, quality: 6, health: 5, dividend: 2, consensus: 5, flow: 5 },
    fairValue: 290, sharia: 'compliant', shariaRatios: { debt: 14, cashInterest: 5, impureIncome: 0.2 },
    foreignFlow: 'in', foreignOwn: 9.5, rumor: 'medium', analysts: { count: 14, buy: 10, hold: 3, sell: 1, target: 300 },
    about: 'Premium private-hospital operator — high-quality compounder riding Saudi healthcare privatisation.' },
  { ticker: '1010', name: 'Riyad Bank', sector: 'Banking', price: 29.7, change: -0.2, mcap: 8.9e10,
    pe: 9.8, pb: 1.2, divYield: 5.3, star: { value: 5, growth: 3, quality: 4, health: 4, dividend: 5, consensus: 3, flow: 3 },
    fairValue: 32, sharia: 'non-compliant', shariaRatios: { debt: 38, cashInterest: 31, impureIncome: 41 },
    foreignFlow: 'flat', foreignOwn: 6.2, rumor: 'low', analysts: { count: 13, buy: 6, hold: 6, sell: 1, target: 33 },
    about: 'Large conventional bank with attractive dividend yield, but interest-based income places it outside the Sharia screen.' },
];

import SA_LIVE from './tadawul_live.json';
import UAE_LIVE from './uae_live.json';
import EGX_LIVE from './egx_live.json';
import { AE_RAW, AE_SECTORS } from './markets/ae.sample.js';
import { EG_RAW, EG_SECTORS } from './markets/eg.sample.js';

const SA_SECTORS = [
  'Energy', 'Banking', 'Materials', 'Telecom', 'Utilities',
  'Consumer Staples', 'Retail', 'Health Care', 'Technology', 'Insurance',
];

// Pick the active market's source (prefer live feed when populated) + sectors.
function resolveMarket() {
  switch (ACTIVE.id) {
    case 'AE':
      return { source: (Array.isArray(UAE_LIVE) && UAE_LIVE.length) ? UAE_LIVE : AE_RAW, live: UAE_LIVE.length > 0, sectors: AE_SECTORS };
    case 'EG':
      return { source: (Array.isArray(EGX_LIVE) && EGX_LIVE.length) ? EGX_LIVE : EG_RAW, live: EGX_LIVE.length > 0, sectors: EG_SECTORS };
    case 'SA':
    default:
      return { source: (Array.isArray(SA_LIVE) && SA_LIVE.length) ? SA_LIVE : SA_RAW, live: Array.isArray(SA_LIVE) && SA_LIVE.length > 0, sectors: SA_SECTORS };
  }
}

const { source: SOURCE, live: LIVE_FLAG, sectors: SECTORS_SRC } = resolveMarket();

export const IS_LIVE = LIVE_FLAG;
export const SECTORS = SECTORS_SRC;
export const COUNTRY = ACTIVE; // active country meta (flag, exchange, currency, modules…)

// Markets list (country chooser / "coming soon" UI)
export const MARKETS = Object.values(COUNTRIES).map((c) => ({
  id: c.id, name: `${c.exchange} (${c.short})`, country: c.name, flag: c.flag, currency: c.currency,
  status: c.id === ACTIVE.id ? 'live' : 'switch',
}));

export const STOCKS = SOURCE.map((s) => {
  const total = Object.values(s.star).reduce((a, b) => a + b, 0); // out of 42
  const discount = s.price > 0 ? (s.fairValue / s.price - 1) * 100 : 0;
  return { ...s, market: ACTIVE.id, currency: ACTIVE.currency, total, discount: Math.round(discount * 10) / 10 };
});

export const STAR_DIMS = [
  { key: 'value', label: 'Value', hint: 'How cheap is it vs earnings & book?' },
  { key: 'growth', label: 'Growth', hint: 'Revenue, earnings & equity expansion.' },
  { key: 'quality', label: 'Quality', hint: 'Returns on assets/equity & margins.' },
  { key: 'health', label: 'Health', hint: 'Leverage and interest cover.' },
  { key: 'dividend', label: 'Dividend', hint: 'Yield and payout reliability.' },
  { key: 'consensus', label: 'Consensus ★', hint: 'Hit-rate-weighted analyst view.' },
  { key: 'flow', label: 'Money Flow ★', hint: 'Foreign + institutional smart money.' },
];

export const SHARIA_LABEL = {
  compliant: { text: 'Sharia-compliant', color: 'sharia' },
  doubtful: { text: 'Doubtful', color: 'medal-bronze' },
  'non-compliant': { text: 'Non-compliant', color: 'destructive' },
};

export function getStock(ticker) {
  return STOCKS.find((s) => s.ticker === String(ticker)) || null;
}

export function scoreColor(total) {
  if (total >= 30) return 'text-success';
  if (total >= 20) return 'text-primary';
  return 'text-destructive';
}
