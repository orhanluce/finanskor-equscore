import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { Card, CardContent, Badge, Stat } from '@/components/ui.jsx';
import { ScorePill, ShariaBadge } from '@/components/equity.jsx';
import ShareButtons from '@/components/ShareButtons.jsx';
import { getStrategy } from '@/data/extras.js';
import { STOCKS } from '@/data/stocks.js';
import { cn, money, pct } from '@/lib/utils.js';

// Build a plausible monthly cumulative-return path that lands on the stated totals.
function buildSeries(returnPct, benchPct, months = 18) {
  const pts = [];
  for (let i = 0; i <= months; i++) {
    const f = i / months;
    const ease = f * f * (3 - 2 * f); // smoothstep
    const wobble = Math.sin(i * 1.3) * (returnPct * 0.04);
    const wobbleB = Math.sin(i * 1.1) * (benchPct * 0.04);
    pts.push({
      m: `M${i}`,
      strategy: +(returnPct * ease + wobble).toFixed(1),
      tasi: +(benchPct * ease + wobbleB).toFixed(1),
    });
  }
  return pts;
}

export default function StrategyDetailPage() {
  const { slug } = useParams();
  const st = getStrategy(slug);
  const series = useMemo(() => (st ? buildSeries(st.returnPct, st.benchPct) : []), [st]);

  if (!st) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-bold">Strategy not found</h1>
        <Link to="/strategies" className="mt-4 inline-block text-primary">← All strategies</Link>
      </div>
    );
  }

  const holdings = st.tickers.map((t) => STOCKS.find((s) => s.ticker === t)).filter(Boolean);
  const alpha = st.returnPct - st.benchPct;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/strategies" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Strategies
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="muted">{st.theme}</Badge>
          <h1 className="mt-2 font-serif text-4xl font-bold">{st.name}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{st.tagline}</p>
        </div>
        <ShareButtons title={st.name} text={`${st.name} on EquScore — ${st.returnPct >= 0 ? '+' : ''}${st.returnPct}% since inception`} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={`${st.returnPct >= 0 ? '+' : ''}${st.returnPct}%`} label="Return since inception" accent={st.returnPct >= 0 ? 'text-success' : 'text-destructive'} />
        <Stat value={`${st.benchPct}%`} label="TASI benchmark" />
        <Stat value={`${alpha >= 0 ? '+' : ''}${alpha.toFixed(1)}%`} label="Alpha" accent={alpha >= 0 ? 'text-success' : 'text-destructive'} />
        <Stat value={holdings.length} label="Holdings" sub={`since ${st.inception}`} />
      </div>

      <Card className="mt-6">
        <CardContent>
          <h2 className="font-serif text-xl font-bold">Cumulative return vs TASI</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} unit="%" />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
              <Legend />
              <Line type="monotone" dataKey="strategy" name={st.name} stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="tasi" name="TASI" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardContent>
          <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
            <span className="font-semibold text-foreground">Selection rule:</span> <span className="text-muted-foreground">{st.rule}</span>
          </div>

          <h2 className="mt-5 font-serif text-xl font-bold">Holdings</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Company</th>
                  <th className="px-3 py-2 text-right font-medium">Star</th>
                  <th className="px-3 py-2 text-right font-medium">Price</th>
                  <th className="px-3 py-2 text-right font-medium">Today</th>
                  <th className="px-3 py-2 text-left font-medium">Sharia</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((s) => (
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
                    <td className="px-3 py-2.5"><ShariaBadge status={s.sharia} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        Illustrative back-test, equal-weight monthly rebalance, costs excluded. Past performance is not indicative of future results. Not investment advice.
      </p>
    </div>
  );
}
