// EquScore — sample Tadawul (TASI) dataset.
// Local stand-in for the live EOD pipeline (EODHD / Twelve Data / Argaam).
// Numbers are illustrative but plausible; the SHAPE mirrors the production schema.
//
// Equity Star = 7 dimensions, each 0–6 → total out of 42 (same engine as FinanSkor).
//   5 fundamental: value · growth · quality · health · dividend
//   2 signal ★    : consensus (analyst hit-rate weighted) · flow (smart-money)
// NOTE: no real-return / inflation lens here — GCC is low-inflation + USD-pegged.
// Its place is taken by the AAOIFI Sharia screen (region-specific differentiator).

export const MARKETS = [
  { id: 'TADAWUL', name: 'Saudi Exchange (Tadawul)', country: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', status: 'live' },
  { id: 'DFM', name: 'Dubai Financial Market / ADX', country: 'UAE', flag: '🇦🇪', currency: 'AED', status: 'soon' },
  { id: 'QSE', name: 'Qatar Stock Exchange', country: 'Qatar', flag: '🇶🇦', currency: 'QAR', status: 'soon' },
];

export const SECTORS = [
  'Energy', 'Banking', 'Materials', 'Telecom', 'Utilities',
  'Consumer Staples', 'Retail', 'Health Care', 'Technology', 'Insurance',
];

// sharia: 'compliant' | 'doubtful' | 'non-compliant'  (AAOIFI Std. 21)
const RAW = [
  {
    ticker: '2222', name: 'Saudi Aramco', sector: 'Energy', price: 27.85, change: 0.36, mcap: 6.74e12,
    pe: 16.2, pb: 3.6, divYield: 5.6, star: { value: 3, growth: 3, quality: 6, health: 6, dividend: 6, consensus: 4, flow: 4 },
    fairValue: 29.5, sharia: 'compliant', shariaRatios: { debt: 11, cashInterest: 4, impureIncome: 0.3 },
    foreignFlow: 'in', foreignOwn: 1.8, rumor: 'low', analysts: { count: 18, buy: 9, hold: 7, sell: 2, target: 31.0 },
    about: 'The world\'s largest integrated oil & gas company and the anchor of TASI. Dividend backbone of the index.',
  },
  {
    ticker: '1120', name: 'Al Rajhi Bank', sector: 'Banking', price: 96.4, change: 1.21, mcap: 3.86e11,
    pe: 18.4, pb: 4.1, divYield: 2.9, star: { value: 2, growth: 5, quality: 5, health: 4, dividend: 3, consensus: 5, flow: 5 },
    fairValue: 104, sharia: 'compliant', shariaRatios: { debt: 0, cashInterest: 0, impureIncome: 0 },
    foreignFlow: 'in', foreignOwn: 12.4, rumor: 'medium', analysts: { count: 16, buy: 11, hold: 4, sell: 1, target: 108 },
    about: 'The largest Islamic bank in the world by market cap. Fully Sharia-compliant retail banking franchise.',
  },
  {
    ticker: '1180', name: 'Saudi National Bank (SNB)', sector: 'Banking', price: 36.2, change: -0.55, mcap: 2.17e11,
    pe: 11.1, pb: 1.3, divYield: 4.1, star: { value: 5, growth: 3, quality: 4, health: 4, dividend: 4, consensus: 4, flow: 3 },
    fairValue: 40, sharia: 'doubtful', shariaRatios: { debt: 24, cashInterest: 19, impureIncome: 6.2 },
    foreignFlow: 'flat', foreignOwn: 9.1, rumor: 'medium', analysts: { count: 15, buy: 8, hold: 6, sell: 1, target: 41.5 },
    about: 'Saudi Arabia\'s biggest bank by assets. Conventional + Islamic windows — fails the 5% impure-income screen.',
  },
  {
    ticker: '1150', name: 'Alinma Bank', sector: 'Banking', price: 28.9, change: 0.84, mcap: 1.44e11,
    pe: 13.7, pb: 1.9, divYield: 3.2, star: { value: 4, growth: 5, quality: 4, health: 4, dividend: 3, consensus: 4, flow: 5 },
    fairValue: 31.2, sharia: 'compliant', shariaRatios: { debt: 0, cashInterest: 0, impureIncome: 0 },
    foreignFlow: 'in', foreignOwn: 7.6, rumor: 'high', analysts: { count: 14, buy: 9, hold: 4, sell: 1, target: 32 },
    about: 'Fast-growing fully Sharia-compliant bank, popular with retail and a frequent social-media talking point.',
  },
  {
    ticker: '1010', name: 'Riyad Bank', sector: 'Banking', price: 29.7, change: -0.2, mcap: 8.9e10,
    pe: 9.8, pb: 1.2, divYield: 5.3, star: { value: 5, growth: 3, quality: 4, health: 4, dividend: 5, consensus: 3, flow: 3 },
    fairValue: 32, sharia: 'non-compliant', shariaRatios: { debt: 38, cashInterest: 31, impureIncome: 41 },
    foreignFlow: 'flat', foreignOwn: 6.2, rumor: 'low', analysts: { count: 13, buy: 6, hold: 6, sell: 1, target: 33 },
    about: 'Large conventional bank with attractive dividend yield, but interest-based income places it outside the Sharia screen.',
  },
  {
    ticker: '7010', name: 'stc (Saudi Telecom)', sector: 'Telecom', price: 41.1, change: 0.49, mcap: 2.05e11,
    pe: 15.6, pb: 2.4, divYield: 4.4, star: { value: 4, growth: 3, quality: 5, health: 5, dividend: 5, consensus: 4, flow: 3 },
    fairValue: 44, sharia: 'compliant', shariaRatios: { debt: 18, cashInterest: 9, impureIncome: 1.1 },
    foreignFlow: 'flat', foreignOwn: 4.3, rumor: 'low', analysts: { count: 15, buy: 8, hold: 6, sell: 1, target: 45 },
    about: 'Dominant telecom operator with a strong dividend and digital-infrastructure growth optionality.',
  },
  {
    ticker: '2010', name: 'SABIC', sector: 'Materials', price: 64.5, change: -1.1, mcap: 1.94e11,
    pe: 22.0, pb: 1.4, divYield: 4.7, star: { value: 4, growth: 2, quality: 4, health: 5, dividend: 5, consensus: 3, flow: 2 },
    fairValue: 68, sharia: 'compliant', shariaRatios: { debt: 21, cashInterest: 7, impureIncome: 0.6 },
    foreignFlow: 'out', foreignOwn: 5.5, rumor: 'medium', analysts: { count: 17, buy: 6, hold: 9, sell: 2, target: 70 },
    about: 'Global petrochemicals champion, majority-owned by Aramco. Cyclical earnings, defensive balance sheet.',
  },
  {
    ticker: '1211', name: 'Maaden (Saudi Mining)', sector: 'Materials', price: 52.3, change: 2.4, mcap: 1.99e11,
    pe: 34.5, pb: 3.0, divYield: 0.4, star: { value: 2, growth: 6, quality: 4, health: 3, dividend: 1, consensus: 5, flow: 6 },
    fairValue: 55, sharia: 'compliant', shariaRatios: { debt: 27, cashInterest: 6, impureIncome: 0.2 },
    foreignFlow: 'in', foreignOwn: 8.0, rumor: 'high', analysts: { count: 16, buy: 12, hold: 3, sell: 1, target: 58 },
    about: 'National mining champion (phosphate, gold, aluminium) — a Vision 2030 growth proxy with strong inflows.',
  },
  {
    ticker: '2082', name: 'ACWA Power', sector: 'Utilities', price: 248, change: 3.1, mcap: 1.81e11,
    pe: 55.0, pb: 6.2, divYield: 0.3, star: { value: 1, growth: 6, quality: 4, health: 3, dividend: 1, consensus: 5, flow: 6 },
    fairValue: 235, sharia: 'compliant', shariaRatios: { debt: 29, cashInterest: 5, impureIncome: 0.1 },
    foreignFlow: 'in', foreignOwn: 6.8, rumor: 'danger', analysts: { count: 15, buy: 9, hold: 4, sell: 2, target: 240 },
    about: 'Renewable & water developer, a flagship energy-transition story. Richly valued and heavily discussed.',
  },
  {
    ticker: '2280', name: 'Almarai', sector: 'Consumer Staples', price: 56.8, change: 0.18, mcap: 5.68e10,
    pe: 21.3, pb: 3.1, divYield: 1.8, star: { value: 3, growth: 4, quality: 5, health: 4, dividend: 3, consensus: 4, flow: 3 },
    fairValue: 60, sharia: 'compliant', shariaRatios: { debt: 26, cashInterest: 8, impureIncome: 0.4 },
    foreignFlow: 'flat', foreignOwn: 6.0, rumor: 'low', analysts: { count: 14, buy: 8, hold: 5, sell: 1, target: 61 },
    about: 'The largest vertically integrated dairy & food company in the MENA region. Defensive consumer compounder.',
  },
  {
    ticker: '4190', name: 'Jarir Marketing', sector: 'Retail', price: 13.4, change: -0.6, mcap: 1.61e10,
    pe: 17.8, pb: 7.5, divYield: 6.1, star: { value: 3, growth: 2, quality: 5, health: 5, dividend: 6, consensus: 3, flow: 2 },
    fairValue: 14, sharia: 'compliant', shariaRatios: { debt: 8, cashInterest: 3, impureIncome: 0.9 },
    foreignFlow: 'flat', foreignOwn: 5.2, rumor: 'low', analysts: { count: 12, buy: 5, hold: 6, sell: 1, target: 14.5 },
    about: 'Bookstore-to-electronics retailer famous for one of the highest, most reliable dividend yields on TASI.',
  },
  {
    ticker: '5110', name: 'Saudi Electricity', sector: 'Utilities', price: 16.9, change: 0.12, mcap: 7.04e10,
    pe: 13.0, pb: 0.9, divYield: 4.1, star: { value: 5, growth: 2, quality: 3, health: 2, dividend: 4, consensus: 3, flow: 3 },
    fairValue: 18, sharia: 'doubtful', shariaRatios: { debt: 33, cashInterest: 12, impureIncome: 2.0 },
    foreignFlow: 'flat', foreignOwn: 2.1, rumor: 'low', analysts: { count: 11, buy: 4, hold: 6, sell: 1, target: 18 },
    about: 'Regulated national power utility. Heavy debt load nudges it just past the 30% Sharia debt threshold.',
  },
  {
    ticker: '4013', name: 'Dr Sulaiman Al Habib', sector: 'Health Care', price: 282, change: 1.7, mcap: 9.87e10,
    pe: 41.0, pb: 9.8, divYield: 1.2, star: { value: 1, growth: 6, quality: 6, health: 5, dividend: 2, consensus: 5, flow: 5 },
    fairValue: 290, sharia: 'compliant', shariaRatios: { debt: 14, cashInterest: 5, impureIncome: 0.2 },
    foreignFlow: 'in', foreignOwn: 9.5, rumor: 'medium', analysts: { count: 14, buy: 10, hold: 3, sell: 1, target: 300 },
    about: 'Premium private-hospital operator — high-quality compounder riding Saudi healthcare privatisation.',
  },
  {
    ticker: '4001', name: 'Abdullah Al Othaim Markets', sector: 'Retail', price: 10.6, change: -0.3, mcap: 9.5e9,
    pe: 19.4, pb: 2.8, divYield: 3.0, star: { value: 3, growth: 3, quality: 4, health: 4, dividend: 3, consensus: 3, flow: 3 },
    fairValue: 11.4, sharia: 'compliant', shariaRatios: { debt: 19, cashInterest: 6, impureIncome: 0.8 },
    foreignFlow: 'flat', foreignOwn: 3.4, rumor: 'low', analysts: { count: 10, buy: 5, hold: 4, sell: 1, target: 11.8 },
    about: 'Value-focused grocery & supermarket chain with steady cash generation across the Kingdom.',
  },
  {
    ticker: '2050', name: 'Savola Group', sector: 'Consumer Staples', price: 30.1, change: 0.9, mcap: 1.6e10,
    pe: 24.0, pb: 1.7, divYield: 1.5, star: { value: 3, growth: 3, quality: 3, health: 3, dividend: 2, consensus: 3, flow: 4 },
    fairValue: 33, sharia: 'doubtful', shariaRatios: { debt: 31, cashInterest: 14, impureIncome: 3.1 },
    foreignFlow: 'in', foreignOwn: 4.0, rumor: 'medium', analysts: { count: 11, buy: 6, hold: 4, sell: 1, target: 34 },
    about: 'Food & retail holding (Panda, Almarai stake). Leverage pushes it into the Sharia "doubtful" band.',
  },
  {
    ticker: '7203', name: 'Elm Company', sector: 'Technology', price: 980, change: 2.2, mcap: 7.84e10,
    pe: 38.0, pb: 12.0, divYield: 1.0, star: { value: 1, growth: 6, quality: 6, health: 6, dividend: 2, consensus: 6, flow: 6 },
    fairValue: 1010, sharia: 'compliant', shariaRatios: { debt: 2, cashInterest: 3, impureIncome: 0.1 },
    foreignFlow: 'in', foreignOwn: 7.1, rumor: 'danger', analysts: { count: 13, buy: 11, hold: 2, sell: 0, target: 1050 },
    about: 'Government-digital-services powerhouse — debt-free, high-margin, the market\'s favourite tech compounder.',
  },
  {
    ticker: '2380', name: 'Petro Rabigh', sector: 'Materials', price: 7.2, change: -2.6, mcap: 6.6e9,
    pe: 0, pb: 0.8, divYield: 0, star: { value: 4, growth: 1, quality: 1, health: 1, dividend: 0, consensus: 2, flow: 2 },
    fairValue: 6.8, sharia: 'non-compliant', shariaRatios: { debt: 61, cashInterest: 8, impureIncome: 1.4 },
    foreignFlow: 'out', foreignOwn: 1.2, rumor: 'medium', analysts: { count: 9, buy: 1, hold: 4, sell: 4, target: 6.5 },
    about: 'Refining & petrochemicals JV with a heavily levered balance sheet and loss-making cycles — high-risk turnaround.',
  },
  {
    ticker: '8210', name: 'Bupa Arabia', sector: 'Insurance', price: 178, change: 0.7, mcap: 2.67e10,
    pe: 17.0, pb: 4.5, divYield: 2.4, star: { value: 3, growth: 5, quality: 5, health: 5, dividend: 3, consensus: 5, flow: 4 },
    fairValue: 190, sharia: 'compliant', shariaRatios: { debt: 0, cashInterest: 22, impureIncome: 4.2 },
    foreignFlow: 'in', foreignOwn: 8.3, rumor: 'medium', analysts: { count: 13, buy: 9, hold: 3, sell: 1, target: 196 },
    about: 'Leading cooperative (takaful) health insurer — structurally Sharia-compliant, benefiting from mandatory cover.',
  },
];

// Prefer FREE live data (Yahoo Finance via scripts/fetch_tadawul.py) when present;
// fall back to the curated sample. Run `py scripts/fetch_tadawul.py` to refresh.
import LIVE from './tadawul_live.json';

const SOURCE = Array.isArray(LIVE) && LIVE.length ? LIVE : RAW;
export const IS_LIVE = SOURCE === LIVE;

export const STOCKS = SOURCE.map((s) => {
  const total = Object.values(s.star).reduce((a, b) => a + b, 0); // out of 42
  const discount = s.price > 0 ? (s.fairValue / s.price - 1) * 100 : 0;
  return { ...s, market: 'TADAWUL', currency: 'SAR', total, discount: Math.round(discount * 10) / 10 };
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
