import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils.js';

// Saudi macro snapshot (illustrative). USD peg means FX is effectively fixed.
const MACRO = [
  { label: 'TASI', value: '11,842', change: 0.4 },
  { label: 'Brent', value: '$78.20', change: -0.8 },
  { label: 'USD/SAR', value: '3.7500', change: 0.0, note: 'pegged' },
  { label: 'SAMA repo', value: '5.50%', change: 0.0 },
  { label: 'Inflation', value: '1.6%', change: -0.1 },
  { label: 'PMI', value: '56.8', change: 0.6 },
];

export default function MacroStrip() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-border bg-card px-5 py-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">🇸🇦 Macro</span>
      {MACRO.map((m) => {
        const flat = m.change === 0;
        return (
          <div key={m.label} className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">{m.label}</span>
            <span className="font-mono text-sm font-semibold">{m.value}</span>
            {m.note ? (
              <span className="text-[10px] text-muted-foreground">{m.note}</span>
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
