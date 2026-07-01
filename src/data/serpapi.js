// EquScore — SerpAPI enrichment selectors (Google News + YouTube + Google Trends).
// All quota-budgeted, market-level. Files are written by scripts/fetch_serpapi.py and
// may be empty until that runs; every selector degrades gracefully to null/[].
import { ACTIVE_ID } from './countries.js';
import MARKET_NEWS from './serp_market_news.json';
import YOUTUBE from './serp_youtube.json';
import TRENDS from './serp_trends.json';

// Country-level Arabic market headlines (array, newest first). Falls back to [].
export function marketHeadlines() {
  return MARKET_NEWS[ACTIVE_ID] || [];
}

// Per-ticker Arabic stock-analysis videos (top names only). Falls back to null.
export function videosFor(ticker) {
  const v = YOUTUBE[ticker];
  return v && v.videos && v.videos.length ? v : null;
}

// Country-level retail search-attention (Google Trends). { latest, avg7, peak, timeline }.
// `heat` is a coarse label for the UI badge. Falls back to null.
export function retailAttention() {
  const t = TRENDS[ACTIVE_ID];
  if (!t) return null;
  const heat = t.latest >= 70 ? 'high' : t.latest >= 40 ? 'elevated' : 'calm';
  const trend = t.avg7 && t.latest > t.avg7 * 1.15 ? 'rising'
    : t.avg7 && t.latest < t.avg7 * 0.85 ? 'cooling' : 'steady';
  return { ...t, heat, trend };
}
