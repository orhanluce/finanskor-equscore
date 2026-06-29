// Country-aware TradingView technical-rating selector (derived signal only).
// Keyed by ticker → { rec, buy, sell, neutral }. Empty until fetch_tv.py is run per market.
import { ACTIVE } from './countries.js';
import SA_TV from './tv_sa.json';
import AE_TV from './tv_ae.json';
import EG_TV from './tv_eg.json';

const MAP = { SA: SA_TV, AE: AE_TV, EG: EG_TV };
export const TV_SIGNALS = MAP[ACTIVE.id] || {};

export function tvRating(ticker) {
  return TV_SIGNALS[ticker] || null;
}
