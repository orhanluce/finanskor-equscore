// Islamic-calendar risk overlay (research §5). Uses the built-in Umm al-Qura calendar
// (Saudi official) via Intl — no library, no data feed. Returns the active market signal
// for a given date so the UI can flag Ramadan's last 10 days, Eid herding windows, etc.

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' I", "Rabi' II", 'Jumada I', 'Jumada II',
  'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhul-Qa'dah", 'Dhul-Hijjah',
];

export function hijri(date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',
      { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(date);
    const get = (t) => Number(parts.find((p) => p.type === t)?.value);
    const month = get('month');
    return { day: get('day'), month, year: get('year'), monthName: HIJRI_MONTHS[month - 1] };
  } catch {
    return null;
  }
}

// level: 'warning' (actionable risk) | 'info' (notable) | 'normal'
export function islamicSignal(date = new Date()) {
  const h = hijri(date);
  if (!h) return null;
  const { day, month, year, monthName } = h;
  const dateLabel = `${day} ${monthName} ${year} AH`;

  if (month === 9 && day >= 21) return {
    key: 'ramadan_late', level: 'warning', icon: '🌙', dateLabel,
    title: `Ramadan, day ${day} — final 10 days`,
    note: 'Pre-Eid liquidity needs historically drive selling pressure and the most negative TASI returns of the year (Seyyed 2005; Gavriilidis 2016). Lower volume, higher volatility.',
  };
  if (month === 9) return {
    key: 'ramadan', level: 'info', icon: '🌙', dateLabel,
    title: `Ramadan, day ${day}`,
    note: 'Trading volume runs lower through Ramadan. Watch the final 10 days for liquidity-driven selling.',
  };
  if (month === 10 && day <= 3) return {
    key: 'eid_fitr', level: 'info', icon: '🎉', dateLabel,
    title: 'Eid al-Fitr window',
    note: 'Post-Eid optimism raises herding behaviour (CSAD, Gabbori 2024) — crowd-driven moves are more likely.',
  };
  if (month === 12 && day >= 8 && day <= 13) return {
    key: 'eid_adha', level: 'info', icon: '🕋', dateLabel,
    title: 'Hajj / Eid al-Adha',
    note: 'Hajj spending supports consumer-sector names; positive-sentiment herding around Eid al-Adha.',
  };
  if (month === 1 && day === 10) return {
    key: 'ashura', level: 'warning', icon: '🌑', dateLabel,
    title: 'Ashura',
    note: 'Negative-sentiment herding historically (Gabbori 2024) — expect elevated volatility.',
  };
  return { key: 'normal', level: 'normal', icon: '☾', dateLabel, title: dateLabel, note: null };
}

// Was a given date inside Ramadan's last 10 days? (for the Decision Mirror sell-trap check)
export function isRamadanLate(date) {
  const h = hijri(new Date(date));
  return !!h && h.month === 9 && h.day >= 21;
}
