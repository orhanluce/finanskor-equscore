import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity, Minus } from 'lucide-react';
import { Card, CardContent, Badge, Stat } from '@/components/ui.jsx';
import JargonTip from '@/components/JargonTip.jsx';
import { STOCKS, SECTORS } from '@/data/stocks.js';
import { cn, pct } from '@/lib/utils.js';

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

function FlowRow({ s }) {
  const v = s.netFlowPct;
  const pos = v >= 0;
  return (
    <Link to={`/stock/${s.ticker}`} className="flex items-center gap-3 py-2.5 hover:bg-muted/30 -mx-2 px-2 rounded-lg">
      <span className="w-16 font-mono text-sm font-bold text-primary">{s.ticker}</span>
      <span className="flex-1 truncate text-sm text-foreground/80">{s.name}</span>
      <div className="flex w-40 items-center gap-2">
        <div className="relative h-2 flex-1 rounded-full bg-muted overflow-hidden">
          <div className={cn('absolute top-0 h-full rounded-full', pos ? 'bg-success left-1/2' : 'bg-destructive right-1/2')}
            style={{ width: `${Math.min(Math.abs(v) * 1.5, 50)}%` }} />
        </div>
        <span className={cn('w-14 text-right font-mono text-sm font-semibold', pos ? 'text-success' : 'text-destructive')}>
          {pos ? '+' : ''}{v}%
        </span>
      </div>
    </Link>
  );
}

export default function MoneyFlowPage() {
  const withFlow = useMemo(() => STOCKS.filter((s) => s.netFlowPct != null), []);
  const sorted = useMemo(() => [...withFlow].sort((a, b) => b.netFlowPct - a.netFlowPct), [withFlow]);
  const inflows = sorted.filter((s) => s.netFlowPct > 0).slice(0, 12);
  const outflows = [...sorted].reverse().filter((s) => s.netFlowPct < 0).slice(0, 12);

  const sectorFlow = useMemo(() => {
    return SECTORS.map((sec) => {
      const rows = withFlow.filter((s) => s.sector === sec);
      return { sector: sec, value: avg(rows.map((s) => s.netFlowPct)), n: rows.length };
    }).filter((x) => x.n > 0).sort((a, b) => b.value - a.value);
  }, [withFlow]);

  const breadthIn = withFlow.filter((s) => s.netFlowPct > 0).length;

  if (withFlow.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <Activity className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-3xl font-bold">Money Flow</h1>
        <p className="mt-2 text-muted-foreground">Licensed SAHMK flow data isn't loaded yet. Run the fetch pipeline to populate it.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="success" className="mb-3">SAHMK · Tadawul-licensed</Badge>
      <h1 className="font-serif text-4xl font-bold"><JargonTip term="Foreign flow">Money Flow</JargonTip></h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Real net intraday money flow — buy-side minus sell-side value traded — for the most liquid TASI names.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={withFlow.length} label="Names with licensed flow" />
        <Stat value={`${breadthIn}/${withFlow.length}`} label="Net inflow today" accent="text-success" />
        <Stat value={`${sorted[0].netFlowPct >= 0 ? '+' : ''}${sorted[0].netFlowPct}%`} label={`Top inflow · ${sorted[0].ticker}`} accent="text-success" />
        <Stat value={`${sorted[sorted.length - 1].netFlowPct}%`} label={`Top outflow · ${sorted[sorted.length - 1].ticker}`} accent="text-destructive" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent>
            <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-success" /><h2 className="font-serif text-xl font-bold">Strongest inflows</h2></div>
            <div className="mt-3 divide-y divide-border">{inflows.map((s) => <FlowRow key={s.ticker} s={s} />)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-destructive" /><h2 className="font-serif text-xl font-bold">Strongest outflows</h2></div>
            <div className="mt-3 divide-y divide-border">{outflows.map((s) => <FlowRow key={s.ticker} s={s} />)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardContent>
          <h2 className="font-serif text-xl font-bold">Sector flow</h2>
          <p className="mt-1 text-xs text-muted-foreground">Average net flow across covered names in each sector.</p>
          <div className="mt-4 space-y-2.5">
            {sectorFlow.map((x) => {
              const pos = x.value >= 0;
              return (
                <div key={x.sector} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 text-sm text-muted-foreground">{x.sector}</span>
                  <div className="relative h-3 flex-1 rounded-full bg-muted overflow-hidden">
                    <div className={cn('absolute top-0 h-full', pos ? 'bg-success left-1/2' : 'bg-destructive right-1/2')}
                      style={{ width: `${Math.min(Math.abs(x.value) * 2, 50)}%` }} />
                    <div className="absolute left-1/2 top-0 h-full w-px bg-border" />
                  </div>
                  <span className={cn('w-16 text-right font-mono text-sm font-semibold', pos ? 'text-success' : 'text-destructive')}>
                    {pos ? '+' : ''}{x.value.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        On Tadawul institutions trade on value while retail (≈90% of volume) chases attention — sustained net inflow into a name
        is a smart-money signal, not a guarantee. Informational only.
      </p>
    </div>
  );
}
