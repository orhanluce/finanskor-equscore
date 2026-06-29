import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { COUNTRY } from '@/data/stocks.js';

// Per-country macro snapshot (illustrative). Pegged GCC currencies are flagged "pegged";
// Egypt shows a floating EGP and the inflation lens that matters there.
const MACRO_BY_COUNTRY = {
  SA: [
    { label: 'TASI', value: '11,842', change: 0.4 },
    { label: 'Brent', value: '$78.20', change: -0.8 },
    { label: 'USD/SAR', value: '3.7500', change: 0.0, note: 'pegged' },
    { label: 'SAMA repo', value: '5.50%', change: 0.0 },
    { label: 'Inflation', value: '1.6%', change: -0.1 },
    { label: 'PMI', value: '56.8', change: 0.6 },
  ],
  AE: [
    { label: 'DFMGI', value: '5,210', change: 0.7 },
    { label: 'FTSE ADX', value: '9,640', change: 0.3 },
    { label: 'Brent', value: '$78.20', change: -0.8 },
    { label: 'USD/AED', value: '3.6725', change: 0.0, note: 'pegged' },
    { label: 'EIBOR 3M', value: '4.35%', change: -0.02 },
    { label: 'Dubai PMI', value: '54.2', change: 0.4 },
  ],
  EG: [
    { label: 'EGX 30', value: '31,420', change: 1.1 },
    { label: 'USD/EGP', value: '48.30', change: 0.6, note: 'floating' },
    { label: 'CBE rate', value: '19.0%', change: -1.0 },
    { label: 'Inflation', value: '14.9%', change: -1.2 },
    { label: 'Reserves', value: '$53.1B', change: 0.6 },
    { label: 'Brent', value: '$78.20', change: -0.8 },
  ],
};

export default function MacroStrip() {
  const macro = MACRO_BY_COUNTRY[COUNTRY.id] || MACRO_BY_COUNTRY.SA;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-border bg-card px-5 py-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{COUNTRY.flag} Macro</span>
      {macro.map((m) => {
        const flat = m.change === 0;
        return (
          <div key={m.label} className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">{m.label}</span>
            <span className="font-mono text-sm font-semibold">{m.value}</span>
            {m.note ? (
              <span className={cn('text-[10px]', m.note === 'floating' ? 'text-medal-bronze' : 'text-muted-foreground')}>{m.note}</span>
            ) : (
              <span className={cn('inline-flex items-center text-[11px] font-medium',
                flat ? 'text-muted-foreground' : m.change > 0 ? 'text-success' : 'text-destructive')}>
                {!flat && (m.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />)}
                {m.change > 0 ? '+' : ''}{m.change}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
