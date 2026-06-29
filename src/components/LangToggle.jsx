import React, { useEffect } from 'react';
import { LANG, setLang, hasChosenLang, AR_COUNTRIES } from '@/i18n.js';

// One-time geo default: Arabic-speaking visitors (SA/AE/EG/…) open in Arabic + RTL.
function useArabicDefault() {
  useEffect(() => {
    if (hasChosenLang()) return;
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), 2000);
    fetch('/api/geo', { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        const ar = AR_COUNTRIES.includes(String(d?.country || '').toUpperCase());
        const next = ar ? 'ar' : 'en';
        setLang(next);
        if (next !== LANG) window.location.reload();
      })
      .catch(() => { setLang('en'); })
      .finally(() => clearTimeout(tm));
  }, []);
}

export default function LangToggle() {
  useArabicDefault();
  const toggle = () => {
    setLang(LANG === 'ar' ? 'en' : 'ar');
    window.location.reload();
  };
  return (
    <button
      onClick={toggle}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-border bg-card px-2.5 text-sm font-semibold hover:border-primary/40"
      aria-label={LANG === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      title={LANG === 'ar' ? 'English' : 'العربية'}
    >
      {LANG === 'ar' ? 'EN' : 'ع'}
    </button>
  );
}
