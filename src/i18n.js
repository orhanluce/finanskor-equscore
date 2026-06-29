// EquScore — lightweight i18n. Language is resolved at load (persisted choice or geo
// default) and applied to <html lang/dir>; switching reloads (like the country switch),
// so t() is a pure function keyed by the ENGLISH SOURCE STRING (falls back to English
// for anything not yet translated → never breaks).
import { AR } from './i18n/ar.js';

const LS = 'equscore_lang';
// Arabic-speaking visitor countries → default to Arabic + RTL.
export const AR_COUNTRIES = ['SA', 'AE', 'EG', 'QA', 'KW', 'BH', 'OM', 'JO', 'IQ', 'LB', 'PS', 'YE', 'SY', 'LY', 'SD', 'MA', 'TN', 'DZ'];

export function getLang() {
  try { const l = localStorage.getItem(LS); if (l === 'ar' || l === 'en') return l; } catch { /* ignore */ }
  if (typeof document !== 'undefined' && document.documentElement.lang === 'ar') return 'ar';
  return 'en';
}
export function hasChosenLang() {
  try { return !!localStorage.getItem(LS); } catch { return false; }
}
export function setLang(l) {
  try { localStorage.setItem(LS, l); } catch { /* ignore */ }
}

export const LANG = getLang();
export const isRTL = LANG === 'ar';

export function t(s) {
  if (LANG !== 'ar') return s;
  return AR[s] ?? s;
}

// Apply <html lang/dir> as early as possible (also done inline in index.html).
export function applyDir() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = LANG;
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
}
