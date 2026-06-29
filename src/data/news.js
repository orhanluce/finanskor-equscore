// Country-aware Efsah Flash news selector. Each market keeps its own news file
// (Marketaux + Google-News fallback), keyed by ticker. Active country decides which.
import { ACTIVE } from './countries.js';
import SA_NEWS from './news_live.json';
import AE_NEWS from './news_uae.json';
import EG_NEWS from './news_egx.json';

const MAP = { SA: SA_NEWS, AE: AE_NEWS, EG: EG_NEWS };
export const NEWS = MAP[ACTIVE.id] || {};
export default NEWS;
