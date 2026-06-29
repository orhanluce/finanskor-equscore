import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui.jsx';
import { ScorePill, ShariaBadge } from '@/components/equity.jsx';
import { BASKET_DEFS } from '@/data/extras.js';
import { STOCKS } from '@/data/stocks.js';
import { cn, money, pct } from '@/lib/utils.js';

export default function BasketsPage() {
  const baskets = useMemo(
    () => BASKET_DEFS.map((b) => ({ ...b, members: STOCKS.filter(b.predicate).sort((a, z) => z.total - a.total) })),
    []
  );
  const [active, setActive] = useState(baskets[0].id);
  const current = baskets.find((b) => b.id === active);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3">Auto-built from the dataset</Badge>
      <h1 className="font-serif text-4xl font-bold">Thematic Baskets</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Ready-made groupings built live from the Equity Star engine — a fast way to find names that share a single idea.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* Basket list */}
        <div className="space-y-2">
          {baskets.map((b) => (
            <button key={b.id} onClick={() => setActive(b.id)}
              className={cn('flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors',
                active === b.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/40')}>
              <span className="text-2xl">{b.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-foreground">{b.name}</div>
                <div className="truncate text-xs text-muted-foreground">{b.desc}</div>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{b.members.length}</span>
            </button>
          ))}
        </div>

        {/* Active basket members */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl font-bold">{current.emoji} {current.name}</h2>
              <span className="ml-auto text-sm text-muted-foreground">{current.members.length} names</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{current.desc}</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-3 py-2 text-left font-medium">Company</th>
                    <th className="px-3 py-2 text-right font-medium">Star</th>
                    <th className="px-3 py-2 text-right font-medium">Price</th>
                    <th className="px-3 py-2 text-right font-medium">Today</th>
                    <th className="px-3 py-2 text-right font-medium">Div %</th>
                    <th className="px-3 py-2 text-left font-medium">Sharia</th>
                  </tr>
                </thead>
                <tbody>
                  {current.members.map((s) => (
                    <tr key={s.ticker} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2.5">
                        <Link to={`/stock/${s.ticker}`} className="hover:text-primary">
                          <span className="font-mono font-bold text-primary">{s.ticker}</span>
                          <span className="ml-2 text-foreground/80">{s.name}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-right"><ScorePill total={s.total} /></td>
                      <td className="px-3 py-2.5 text-right font-mono">{money(s.price, s.currency)}</td>
                      <td className={cn('px-3 py-2.5 text-right font-mono', s.change >= 0 ? 'text-success' : 'text-destructive')}>{pct(s.change)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{s.divYield ? `${s.divYield}%` : '—'}</td>
                      <td className="px-3 py-2.5"><ShariaBadge status={s.sharia} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {current.members.length === 0 && <div className="py-10 text-center text-muted-foreground">No names currently match this theme.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
