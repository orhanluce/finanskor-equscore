import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui.jsx';
import { STOCKS } from '@/data/stocks.js';
import { cn, pct } from '@/lib/utils.js';

export default function MarketPulse() {
  const { up, down, flat, breadth, topGainer, topLoser, avgDiscount } = useMemo(() => {
    const up = STOCKS.filter((s) => s.change > 0);
    const down = STOCKS.filter((s) => s.change < 0);
    const flat = STOCKS.length - up.length - down.length;
    const sorted = [...STOCKS].sort((a, b) => b.change - a.change);
    return {
      up: up.length, down: down.length, flat,
      breadth: Math.round((up.length / STOCKS.length) * 100),
      topGainer: sorted[0], topLoser: sorted[sorted.length - 1],
      avgDiscount: STOCKS.reduce((a, s) => a + s.discount, 0) / STOCKS.length,
    };
  }, []);

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-serif text-lg font-bold">Market Pulse</h3>
        </div>

        {/* breadth bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{up} advancing</span><span>{down} declining</span>
          </div>
          <div className="mt-1.5 flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-success" style={{ width: `${(up / STOCKS.length) * 100}%` }} />
            <div className="h-full bg-muted-foreground/30" style={{ width: `${(flat / STOCKS.length) * 100}%` }} />
            <div className="h-full bg-destructive" style={{ width: `${(down / STOCKS.length) * 100}%` }} />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{breadth}% of names higher today</div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link to={`/stock/${topGainer.ticker}`} className="rounded-xl border border-border p-3 hover:border-success/40">
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowUpRight className="h-3.5 w-3.5 text-success" /> Top gainer</div>
            <div className="mt-1 font-mono text-sm font-bold text-primary">{topGainer.ticker}</div>
            <div className="text-sm font-semibold text-success">{pct(topGainer.change)}</div>
          </Link>
          <Link to={`/stock/${topLoser.ticker}`} className="rounded-xl border border-border p-3 hover:border-destructive/40">
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowDownRight className="h-3.5 w-3.5 text-destructive" /> Top loser</div>
            <div className="mt-1 font-mono text-sm font-bold text-primary">{topLoser.ticker}</div>
            <div className="text-sm font-semibold text-destructive">{pct(topLoser.change)}</div>
          </Link>
        </div>

        <div className="mt-3 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Average discount to fair value:{' '}
          <span className={cn('font-semibold', avgDiscount >= 0 ? 'text-success' : 'text-destructive')}>
            {avgDiscount >= 0 ? '' : '+'}{Math.abs(avgDiscount).toFixed(1)}%
          </span>{' '}— {avgDiscount >= 0 ? 'the board screens cheap on average.' : 'the board screens rich on average.'}
        </div>
      </CardContent>
    </Card>
  );
}
