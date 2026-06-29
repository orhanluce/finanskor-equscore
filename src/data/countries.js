// EquScore — multi-country registry.
// Same skeleton, same signature features (Equity Star, Decision Mirror, Rumor Thermometer)
// for every country; per-country `modules` flags switch on/off the market-specific pieces.

export const COUNTRIES = {
  SA: {
    id: 'SA', name: 'Saudi Arabia', short: 'Saudi', flag: '🇸🇦',
    exchange: 'Tadawul', indexName: 'TASI', currency: 'SAR', locales: ['en'],
    tagline: 'Not hype. Track record.',
    geo: ['SA'], regulator: 'CMA (Capital Market Authority)',
    sources: ['Yahoo Finance', 'SAHMK (licensed)', 'Marketaux', 'Twelve Data'],
    modules: {
      sharia: true, max: true, islamicCalendar: true, sahmkFlow: true,
      momentum: true, contrarian: false, ipoFocus: false, dividendFocus: false,
      currencyRisk: false, inflationAdj: false, dualBoard: false, realEstate: false,
      facebookSentiment: false, concentrationWarn: false, expatCompare: false,
    },
  },
  AE: {
    id: 'AE', name: 'United Arab Emirates', short: 'UAE', flag: '🇦🇪',
    exchange: 'DFM + ADX', indexName: 'DFMGI / FTSE ADX', currency: 'AED', locales: ['en', 'ar'],
    tagline: 'Zero tax. Real yield. Global view.',
    geo: ['AE'], regulator: 'SCA (Securities & Commodities Authority)',
    sources: ['Yahoo Finance (DFM)', 'DLD / Dubai Pulse', 'CBUAE (EIBOR)', 'Marketaux'],
    modules: {
      sharia: true, max: false, islamicCalendar: true, sahmkFlow: false,
      momentum: false, contrarian: true, ipoFocus: true, dividendFocus: true,
      currencyRisk: false, inflationAdj: false, dualBoard: true, realEstate: true,
      facebookSentiment: false, concentrationWarn: false, expatCompare: true,
    },
  },
  EG: {
    id: 'EG', name: 'Egypt', short: 'Egypt', flag: '🇪🇬',
    exchange: 'EGX', indexName: 'EGX 30', currency: 'EGP', locales: ['en', 'ar'],
    tagline: 'Real returns, after inflation.',
    geo: ['EG'], regulator: 'FRA (Financial Regulatory Authority)',
    sources: ['EODHD (EOD)', 'Marketaux', 'CBE (rates)'],
    modules: {
      sharia: false, max: false, islamicCalendar: false, sahmkFlow: false,
      momentum: false, contrarian: true, ipoFocus: true, dividendFocus: true,
      currencyRisk: true, inflationAdj: true, dualBoard: false, realEstate: false,
      facebookSentiment: true, concentrationWarn: true, expatCompare: false,
    },
  },
};

export const SUPPORTED = ['SA', 'AE', 'EG'];
export const DEFAULT_COUNTRY = 'SA';
const LS_KEY = 'equscore_country';

export function getActiveCountryId() {
  try {
    const c = localStorage.getItem(LS_KEY);
    if (c && COUNTRIES[c]) return c;
  } catch { /* ignore */ }
  return DEFAULT_COUNTRY;
}

export function setActiveCountryId(id) {
  try { if (COUNTRIES[id]) localStorage.setItem(LS_KEY, id); } catch { /* ignore */ }
}

export function hasChosenCountry() {
  try { return !!localStorage.getItem(LS_KEY); } catch { return false; }
}

// Map an ISO country code (from IP geo) to a supported market; null if unsupported.
export function countryFromGeo(iso) {
  if (!iso) return null;
  const up = String(iso).toUpperCase();
  return SUPPORTED.find((id) => COUNTRIES[id].geo.includes(up)) || null;
}

// Resolved at module load — the rest of the data layer keys off this.
export const ACTIVE_ID = getActiveCountryId();
export const ACTIVE = COUNTRIES[ACTIVE_ID];
