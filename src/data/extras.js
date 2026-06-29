// EquScore — curated content data (IPOs, model strategies, brokers, stories).
// Illustrative but plausible; shape mirrors what a live pipeline would feed.

// ─────────────────────────────── IPOs ───────────────────────────────
export const IPOS = [
  {
    name: 'Tamkeen Human Resources', ticker: '—', board: 'Main', sector: 'Technology',
    status: 'upcoming', priceRange: '60–66 SAR', subscription: '2026-07-14 → 2026-07-18',
    offerPct: 30, raise: '1.4B SAR', note: 'HR-tech & outsourcing leader riding Saudisation demand. Heavily oversubscribed grey-market interest.',
  },
  {
    name: 'Red Sea Capital REIT', ticker: '—', board: 'Main', sector: 'Real Estate',
    status: 'upcoming', priceRange: '10 SAR (fixed)', subscription: '2026-07-21 → 2026-07-25',
    offerPct: 40, raise: '900M SAR', note: 'Hospitality-focused REIT tied to Vision 2030 tourism build-out.',
  },
  {
    name: 'Najm Logistics', ticker: '9612', board: 'NOMU', sector: 'Industrials',
    status: 'open', priceRange: '24–28 SAR', subscription: '2026-06-28 → 2026-07-02',
    offerPct: 20, raise: '210M SAR', note: 'Last-mile logistics on the parallel market. Smaller float, higher volatility.',
  },
  {
    name: 'Saudi Diagnostics Co.', ticker: '4271', board: 'Main', sector: 'Health Care',
    status: 'listed', priceRange: 'Listed at 38 SAR', subscription: 'Closed', firstDay: '+19.7%',
    offerPct: 30, raise: '760M SAR', note: 'Lab-services operator. Strong day-one pop, settled ~12% above offer.',
  },
  {
    name: 'Arabian Drilling Tech', ticker: '2381', board: 'Main', sector: 'Energy',
    status: 'listed', priceRange: 'Listed at 100 SAR', subscription: 'Closed', firstDay: '+9.2%',
    offerPct: 25, raise: '2.1B SAR', note: 'Oilfield-services spin-off; institutional anchor demand was strong.',
  },
];

// ───────────────────────────── Strategies ─────────────────────────────
// Each references real tickers from the dataset so the detail page shows live holdings.
export const STRATEGIES = [
  {
    slug: 'sharia-dividend', name: 'Sharia Dividend Core', theme: 'Income',
    tagline: 'Sharia-compliant names with the most reliable dividend yields.',
    rule: 'Sharia-compliant + dividend dimension ≥ 4, weighted by yield.',
    tickers: ['2222', '7010', '4190', '2010'],
    inception: '2025-01', returnPct: 18.4, benchPct: 11.2,
  },
  {
    slug: 'vision-2030-growth', name: 'Vision 2030 Growth', theme: 'Growth',
    tagline: 'High-growth Vision-2030 proxies — mining, utilities, healthcare, tech.',
    rule: 'Growth dimension ≥ 5 with positive money flow.',
    tickers: ['1211', '2082', '4013', '7203'],
    inception: '2025-01', returnPct: 31.7, benchPct: 11.2,
  },
  {
    slug: 'deep-value', name: 'Deep Value', theme: 'Value',
    tagline: 'Largest discounts to USD-native fair value with a solid balance sheet.',
    rule: 'Discount ≥ 8% and health dimension ≥ 4.',
    tickers: ['1180', '1010', '5110'],
    inception: '2025-01', returnPct: 9.1, benchPct: 11.2,
  },
  {
    slug: 'smart-money', name: 'Smart-Money Flow', theme: 'Momentum',
    tagline: 'Names with the strongest licensed net inflows and analyst conviction.',
    rule: 'Flow dimension ≥ 5 and consensus ≥ 5.',
    tickers: ['1120', '1211', '7203', '4013'],
    inception: '2025-01', returnPct: 24.3, benchPct: 11.2,
  },
  {
    slug: 'defensive-quality', name: 'Defensive Quality', theme: 'Quality',
    tagline: 'High-quality compounders to hold through volatility.',
    rule: 'Quality ≥ 5 and health ≥ 4.',
    tickers: ['2222', '2280', '7010', '8210'],
    inception: '2025-01', returnPct: 14.6, benchPct: 11.2,
  },
];

export function getStrategy(slug) {
  return STRATEGIES.find((s) => s.slug === slug) || null;
}

// ─────────────────────────────── Baskets ───────────────────────────────
// Baskets are derived live from the dataset by a predicate (see BasketsPage),
// but their definitions live here.
export const BASKET_DEFS = [
  { id: 'sharia-income', name: 'Sharia Income', emoji: '🕌', desc: 'Sharia-compliant with dividend ≥ 4.',
    predicate: (s) => s.sharia === 'compliant' && s.star.dividend >= 4 },
  { id: 'undervalued', name: 'Undervalued', emoji: '🏷️', desc: 'Trading ≥ 6% below fair value.',
    predicate: (s) => s.discount >= 6 },
  { id: 'high-momentum', name: 'High Momentum', emoji: '🚀', desc: 'Growth + flow both strong (≥ 5).',
    predicate: (s) => s.star.growth >= 5 && s.star.flow >= 5 },
  { id: 'blue-chips', name: 'Blue Chips', emoji: '💎', desc: 'Equity Star ≥ 30 out of 42.',
    predicate: (s) => s.total >= 30 },
  { id: 'dividend-aristocrats', name: 'Dividend Leaders', emoji: '💰', desc: 'Dividend yield ≥ 4%.',
    predicate: (s) => (s.divYield || 0) >= 4 },
  { id: 'quality-compounders', name: 'Quality Compounders', emoji: '⚙️', desc: 'Quality ≥ 5 and health ≥ 4.',
    predicate: (s) => s.star.quality >= 5 && s.star.health >= 4 },
];

// ─────────────────────────────── Brokers ───────────────────────────────
// CMA-licensed brokerages (illustrative directory).
export const BROKERS = [
  { name: 'Al Rajhi Capital', research: true, score: 92, note: 'Largest retail brokerage; deep Arabic + English research desk.' },
  { name: 'SNB Capital', research: true, score: 90, note: 'Bulge-bracket equity research and IPO bookrunner.' },
  { name: 'Riyad Capital', research: true, score: 85, note: 'Strong macro & banking-sector coverage.' },
  { name: 'Aljazira Capital', research: true, score: 82, note: 'Sharia-focused research and advisory.' },
  { name: 'BSF Capital', research: true, score: 80, note: 'Mid-cap and petrochemical coverage.' },
  { name: 'Derayah Financial', research: false, score: 74, note: 'Popular low-cost digital trading platform.' },
  { name: 'Alistithmar Capital', research: true, score: 78, note: 'Asset management + selective single-stock notes.' },
  { name: 'EFG Hermes KSA', research: true, score: 88, note: 'Regional powerhouse; institutional flow and frontier research.' },
  { name: 'Yaqeen Capital', research: false, score: 70, note: 'Brokerage and margin services.' },
];

// ─────────────────────────────── Stories ───────────────────────────────
export const STORIES = [
  {
    slug: 'read-equity-star', tag: 'Guide', title: 'How to read the Equity Star',
    excerpt: 'The 42-point score in plain English — what each of the seven dimensions actually measures and how to weigh them.',
    minutes: 4,
  },
  {
    slug: 'sharia-screening', tag: 'Sharia', title: 'AAOIFI screening, demystified',
    excerpt: 'Why a profitable bank can still be "non-compliant", and what the debt, cash-interest and impure-income ratios mean.',
    minutes: 5,
  },
  {
    slug: 'tadawul-retail', tag: 'Behaviour', title: 'Why Tadawul retail chases lottery stocks',
    excerpt: 'The MAX effect: how attention-seeking behaviour creates value traps — and when it actually pays off.',
    minutes: 6,
  },
  {
    slug: 'money-flow-edge', tag: 'Signals', title: 'Following the smart money',
    excerpt: 'Institutions trade on value while retail chases price. Here is how licensed net-flow data exposes the difference.',
    minutes: 4,
  },
  {
    slug: 'pead-drift', tag: 'Research', title: 'Post-earnings drift on Tadawul',
    excerpt: 'Earnings surprises keep moving prices for weeks. What the academic evidence says and how Efsah Flash surfaces it.',
    minutes: 5,
  },
  {
    slug: 'vision-2030', tag: 'Macro', title: 'Investing the Vision 2030 transition',
    excerpt: 'From mining to renewables to healthcare privatisation — mapping the structural growth themes reshaping TASI.',
    minutes: 7,
  },
];
