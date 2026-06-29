import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { t } from '@/i18n.js';
import {
  COUNTRIES, SUPPORTED, ACTIVE_ID, setActiveCountryId,
  hasChosenCountry, countryFromGeo, DEFAULT_COUNTRY,
} from '@/data/countries.js';

// One-time IP-geo default: on first visit (no stored choice) ask the server which
// country the visitor is in and open that market automatically.
function useGeoDefault() {
  useEffect(() => {
    if (hasChosenCountry()) return;
    let cancelled = false;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    fetch('/api/geo', { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const resolved = countryFromGeo(d?.country) || DEFAULT_COUNTRY;
        setActiveCountryId(resolved);
        if (resolved !== ACTIVE_ID) window.location.reload();
      })
      .catch(() => { if (!cancelled) setActiveCountryId(DEFAULT_COUNTRY); })
      .finally(() => clearTimeout(t));
    return () => { cancelled = true; ctrl.abort(); };
  }, []);
}

export default function CountrySwitcher() {
  useGeoDefault();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = COUNTRIES[ACTIVE_ID];

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const choose = (id) => {
    if (id === ACTIVE_ID) { setOpen(false); return; }
    setActiveCountryId(id);
    window.location.assign('/'); // reload into the new market
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 h-9 text-sm font-medium hover:border-primary/40"
        aria-label="Switch country"
        title={`${active.exchange} — switch market`}
      >
        <span className="text-base leading-none">{active.flag}</span>
        <span className="hidden sm:inline">{active.short}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Globe className="h-3.5 w-3.5" /> {t('Choose market')}
          </div>
          {SUPPORTED.map((id) => {
            const c = COUNTRIES[id];
            return (
              <button key={id} onClick={() => choose(id)}
                className={cn('flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/60',
                  id === ACTIVE_ID && 'bg-primary/10')}>
                <span className="text-lg leading-none">{c.flag}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{c.name}</span>
                  <span className="block text-xs text-muted-foreground">{c.exchange} · {c.currency}</span>
                </span>
                {id === ACTIVE_ID && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
