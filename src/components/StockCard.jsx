import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { pct, money } from '@/lib/utils.js';
import { ScorePill, ShariaBadge } from '@/components/equity.jsx';

export default function StockCard({ s }) {
  const up = s.change >= 0;
  return (
    <Link
      to={`/stock/${s.ticker}`}
      className="group block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-primary">{s.ticker}</span>
            <span className="text-[11px] text-muted-foreground">{s.sector}</span>
            {s.nomu && <span className="rounded bg-medal-bronze/15 px-1.5 text-[10px] font-bold text-medal-bronze">NOMU</span>}
          </div>
          <div className="mt-0.5 truncate font-serif font-bold leading-tight">{s.name}</div>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="font-mono text-lg font-bold">{money(s.price, s.currency)}</div>
          <div className={cn('text-xs font-semibold', up ? 'text-success' : 'text-destructive')}>{pct(s.change)}</div>
        </div>
        <ScorePill total={s.total} />
      </div>

      {s.maxFlag === 'trap' && (
        <div className="mt-2 text-[11px] font-semibold text-medal-bronze">⚠ High attention · weak profits — value-trap risk</div>
      )}
      {s.maxFlag === 'strong' && (
        <div className="mt-2 text-[11px] font-semibold text-success">▲ High attention · strong profits</div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <ShariaBadge status={s.sharia} />
        <span className={cn('text-xs font-medium', s.discount >= 0 ? 'text-success' : 'text-destructive')}>
          {s.discount >= 0 ? 'Discount' : 'Premium'} {Math.abs(s.discount).toFixed(0)}%
        </span>
      </div>
    </Link>
  );
}
