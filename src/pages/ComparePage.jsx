import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend,
} from 'recharts';
import { Plus, X, Search } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui.jsx';
import { ShariaBadge } from '@/components/equity.jsx';
import JargonTip from '@/components/JargonTip.jsx';
import { STOCKS, STAR_DIMS, scoreColor } from '@/data/stocks.js';
import { cn, money, pct } from '@/lib/utils.js';

const SERIES_COLORS = ['hsl(var(--primary))', '#D4AF37', '#4F7942', '#C0563B'];
const DEFAULTS = ['2222', '1120', '1211'];

function Picker({ onPick, exclude }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    return STOCKS
      .filter((s) => !exclude.includes(s.ticker))
      .filter((s) => !t || (s.ticker + ' ' + s.name).toLowerCase().includes(t))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [q, exclude]);
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a stock…"
          className="w-full rounded-full border border-border bg-card pl-9 h-9 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>
      <div className="mt-2 space-y-1">
        {results.map((s) => (
          <button key={s.ticker} onClick={() => { onPick(s.ticker); setQ(''); }}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/60">
            <span><span className="font-mono font-bold text-primary">{s.ticker}</span> {s.name}</span>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
        {results.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">No more matches.</div>}
      </div>
    </div>
  );
}

const ROWS = [
  { label: 'Equity Star', term: 'Equity Star', fn: (s) => `${s.total}/42`, color: (s) => scoreColor(s.total) },
  { label: 'Price', fn: (s) => money(s.price, s.currency) },
  { label: 'Today', fn: (s) => pct(s.change), color: (s) => (s.change >= 0 ? 'text-success' : 'text-destructive') },
  { label: 'Fair value', term: 'Fair value', fn: (s) => money(s.fairValue, s.currency) },
  { label: 'Discount', term: 'Discount', fn: (s) => `${s.discount >= 0 ? '' : '+'}${Math.abs(s.discount).toFixed(1)}%`, color: (s) => (s.discount >= 0 ? 'text-success' : 'text-destructive') },
  { label: 'P/E', term: 'P/E', fn: (s) => (s.pe ? s.pe.toFixed(1) : '—') },
  { label: 'P/B', term: 'P/B', fn: (s) => (s.pb ? s.pb.toFixed(1) : '—') },
  { label: 'Dividend yield', term: 'Dividend yield', fn: (s) => (s.divYield ? `${s.divYield}%` : '—') },
  { label: 'Sector', fn: (s) => s.sector },
  { label: 'Sharia', fn: (s) => s.sharia, render: (s) => <ShariaBadge status={s.sharia} /> },
];

export default function ComparePage() {
  const [tickers, setTickers] = useState(DEFAULTS);
  const stocks = tickers.map((t) => STOCKS.find((s) => s.ticker === t)).filter(Boolean);

  const radarData = STAR_DIMS.map((d) => {
    const row = { dim: d.label.replace(' ★', '') };
    stocks.forEach((s) => { row[s.ticker] = s.star[d.key]; });
    return row;
  });

  const add = (t) => setTickers((prev) => (prev.length >= 4 || prev.includes(t) ? prev : [...prev, t]));
  const remove = (t) => setTickers((prev) => prev.filter((x) => x !== t));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl font-bold">Compare</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Put up to four names side by side — Equity Star dimensions, valuation, and Sharia status at a glance.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {/* Radar overlay */}
        <Card className="lg:col-span-2">
          <CardContent>
            <h2 className="font-serif text-xl font-bold">Equity Star overlay</h2>
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <PolarRadiusAxis domain={[0, 6]} tick={false} axisLine={false} />
                {stocks.map((s, i) => (
                  <Radar key={s.ticker} name={s.ticker} dataKey={s.ticker}
                    stroke={SERIES_COLORS[i]} fill={SERIES_COLORS[i]} fillOpacity={0.12} strokeWidth={2} />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Picker */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {stocks.map((s, i) => (
              <span key={s.ticker} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES_COLORS[i] }} />
                <span className="font-mono font-bold">{s.ticker}</span>
                <button onClick={() => remove(s.ticker)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}
          </div>
          {tickers.length < 4 && <Picker onPick={add} exclude={tickers} />}
        </div>
      </div>

      {/* Metrics table */}
      <Card className="mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Metric</th>
                {stocks.map((s, i) => (
                  <th key={s.ticker} className="px-4 py-3 text-left">
                    <Link to={`/stock/${s.ticker}`} className="inline-flex items-center gap-2 hover:text-primary">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES_COLORS[i] }} />
                      <span className="font-mono font-bold">{s.ticker}</span>
                    </Link>
                    <div className="text-xs font-normal text-muted-foreground truncate max-w-[140px]">{s.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.term ? <JargonTip term={row.term} inline>{row.label}</JargonTip> : row.label}
                  </td>
                  {stocks.map((s) => (
                    <td key={s.ticker} className={cn('px-4 py-3 font-medium', row.color ? row.color(s) : 'text-foreground')}>
                      {row.render ? row.render(s) : row.fn(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {stocks.length === 0 && <div className="mt-10 text-center text-muted-foreground">Add a stock to start comparing.</div>}
    </div>
  );
}
