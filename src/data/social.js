// Country-aware social (Rumor Thermometer) feed — real X/Twitter chatter per ticker,
// computed level (low/medium/high/danger) + mood + sample posts. Empty until
// fetch_social.py is run for that market; the UI falls back to the static rumor field.
import { ACTIVE } from './countries.js';
import SA from './social_sa.json';
import AE from './social_ae.json';
import EG from './social_eg.json';

const MAP = { SA, AE, EG };
export const SOCIAL = MAP[ACTIVE.id] || {};

export function socialFor(ticker) {
  return SOCIAL[ticker] || null;
}
