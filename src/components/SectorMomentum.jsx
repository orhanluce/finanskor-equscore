import React, { useMemo } from 'react';
import { Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui.jsx';
import { STOCKS, SECTORS } from '@/data/stocks.js';
import { cn } from '@/lib/utils.js';

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

export default function SectorMomentum() {
  const rows = useMemo(() => {
    return SECTORS.map((sec) => {
      const list = STOCKS.filter((s) => s.sector === sec);
      return { sector: sec, n: list.length, change: avg(list.map((s) => s.change)), score: avg(list.map((s) => s.total)) };
    }).filter((x) => x.n > 0).sort((a, b) => b.change - a.change);
  }, []);

  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.change)), 1);

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h3 className="font-serif text-lg font-bold">Sector Momentum</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Average move today, with mean Equity Star per sector.</p>
        <div className="mt-4 space-y-2">
          {rows.map((r) => {
            const pos = r.change >= 0;
            return (
              <div key={r.sector} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-sm text-foreground/80">{r.sector}</span>
                <div className="relative h-2 flex-1 rounded-full bg-muted overflow-hidden">
                  <div className={cn('absolute top-0 h-full', pos ? 'bg-success left-1/2' : 'bg-destructive right-1/2')}
                    style={{ width: `${(Math.abs(r.change) / maxAbs) * 50}%` }} />
                  <div className="absolute left-1/2 top-0 h-full w-px bg-border" />
                </div>
                <span className={cn('w-14 text-right font-mono text-xs font-semibold', pos ? 'text-success' : 'text-destructive')}>
                  {pos ? '+' : ''}{r.change.toFixed(2)}%
                </span>
                <span className="w-10 text-right text-xs text-muted-foreground">{r.score.toFixed(0)}/42</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
