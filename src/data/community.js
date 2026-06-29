// Sample accountability data: analyst / institution / crowd / AI leaderboard.
// In production this is computed from locked, time-stamped predictions vs realised price.

export const LEAGUES = ['All', 'Analyst', 'Crowd', 'AI'];

export const LEADERBOARD = [
  { rank: 1, name: 'Al Rajhi Capital', type: 'Analyst', org: 'Brokerage', predictions: 142, hitRate: 71.4, avgUpside: 9.2 },
  { rank: 2, name: 'EFG Hermes KSA', type: 'Analyst', org: 'Brokerage', predictions: 118, hitRate: 68.9, avgUpside: 11.1 },
  { rank: 3, name: 'AbuFaisal_KSA', type: 'Crowd', org: 'Individual', predictions: 64, hitRate: 66.2, avgUpside: 14.7 },
  { rank: 4, name: 'SNB Capital', type: 'Analyst', org: 'Brokerage', predictions: 156, hitRate: 64.8, avgUpside: 7.4 },
  { rank: 5, name: 'EquScore Quant v1', type: 'AI', org: 'Model', predictions: 210, hitRate: 63.5, avgUpside: 8.9 },
  { rank: 6, name: 'Aljazira Capital', type: 'Analyst', org: 'Brokerage', predictions: 97, hitRate: 62.0, avgUpside: 6.8 },
  { rank: 7, name: 'TadawulTrader', type: 'Crowd', org: 'Individual', predictions: 88, hitRate: 59.1, avgUpside: 18.3 },
  { rank: 8, name: 'Riyad Capital', type: 'Analyst', org: 'Brokerage', predictions: 131, hitRate: 58.0, avgUpside: 5.9 },
  { rank: 9, name: 'GulfValueInvestor', type: 'Crowd', org: 'Individual', predictions: 41, hitRate: 55.6, avgUpside: 12.0 },
  { rank: 10, name: 'Derayah Financial', type: 'Analyst', org: 'Brokerage', predictions: 73, hitRate: 53.2, avgUpside: 6.1 },
];

export const CONTEST = {
  season: 'Q3 2026',
  monthly: 'August 2026',
  participants: 0, // cold start — virtual-portfolio beta seeds this
  note: 'Predictions are locked with a server-side timestamp. No back-dating. Virtual portfolios are clearly marked as simulations.',
};
