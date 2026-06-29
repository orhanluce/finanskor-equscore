import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, TrendingUp, TrendingDown, Flame, Droplets, Tag, AlertTriangle } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui.jsx';
import { STOCKS } from '@/data/stocks.js';
import { cn, pct } from '@/lib/utils.js';
import { t } from '@/i18n.js';

function buildSignals() {
  const out = [];
  STOCKS.forEach((s) => {
    if (Math.abs(s.change) >= 2) {
      out.push({ ticker: s.ticker, name: s.name, type: s.change > 0 ? 'spike-up' : 'spike-down',
        severity: Math.min(3, Math.round(Math.abs(s.change) / 2)), detail: `${pct(s.change)} move today.` });
    }
    if (s.maxFlag === 'trap') {
      out.push({ ticker: s.ticker, name: s.name, type: 'value-trap', severity: 3,
        detail: `High attention (${s.maxScore}σ) but weak profitability — value-trap risk.` });
    } else if (s.maxFlag === 'strong') {
      out.push({ ticker: s.ticker, name: s.name, type: 'attention-strong', severity: 2,
        detail: `Attention spike (${s.maxScore}σ) backed by strong profits.` });
    }
    if (s.netFlowPct != null && Math.abs(s.netFlowPct) >= 15) {
      out.push({ ticker: s.ticker, name: s.name, type: s.netFlowPct > 0 ? 'flow-in' : 'flow-out',
        severity: Math.min(3, Math.round(Math.abs(s.netFlowPct) / 15)), detail: `Net ${s.netFlowPct > 0 ? 'inflow' : 'outflow'} ${s.netFlowPct}% of value traded (SAHMK).` });
    }
    if (s.discount >= 12) {
      out.push({ ticker: s.ticker, name: s.name, type: 'deep-discount', severity: Math.min(3, Math.round(s.discount / 10)),
        detail: `Trading ${s.discount.toFixed(1)}% below fair value.` });
    }
    if (s.rumor === 'danger') {
      out.push({ ticker: s.ticker, name: s.name, type: 'rumor', severity: 3, detail: 'Heavily discussed — historically a fade signal.' });
    }
  });
  return out.sort((a, b) => b.severity - a.severity);
}

const META = {
  'spike-up': { label: 'Price spike ↑', icon: TrendingUp, color: 'text-success', group: 'price' },
  'spike-down': { label: 'Price spike ↓', icon: TrendingDown, color: 'text-destructive', group: 'price' },
  'value-trap': { label: 'Value-trap risk', icon: AlertTriangle, color: 'text-medal-bronze', group: 'attention' },
  'attention-strong': { label: 'Attention + strong', icon: Flame, color: 'text-success', group: 'attention' },
  'flow-in': { label: 'Money inflow', icon: Droplets, color: 'text-success', group: 'flow' },
  'flow-out': { label: 'Money outflow', icon: Droplets, color: 'text-destructive', group: 'flow' },
  'deep-discount': { label: 'Deep discount', icon: Tag, color: 'text-primary', group: 'value' },
  rumor: { label: 'Rumor heat', icon: Flame, color: 'text-destructive', group: 'attention' },
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'price', label: 'Price moves' },
  { id: 'flow', label: 'Money flow' },
  { id: 'attention', label: 'Attention' },
  { id: 'value', label: 'Valuation' },
];

export default function SignalsPage() {
  const [filter, setFilter] = useState('all');
  const signals = useMemo(buildSignals, []);
  const rows = filter === 'all' ? signals : signals.filter((x) => META[x.type].group === filter);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3">{t('Daily scan')}</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Anomalies & Signals')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t('Unusual moves the daily scan flagged — price spikes, money-flow surges, lottery attention, and valuation gaps. A starting point for research, not a recommendation.')}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              filter === f.id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            {t(f.label)}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {rows.map((sig, i) => {
          const m = META[sig.type];
          const Icon = m.icon;
          return (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 py-3.5">
                <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted', m.color)}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-semibold', m.color)}>{t(m.label)}</span>
                    {Array.from({ length: sig.severity }).map((_, k) => <Zap key={k} className="h-3 w-3 text-medal-bronze" />)}
                  </div>
                  <p className="text-sm text-muted-foreground">{sig.detail}</p>
                </div>
                <Link to={`/stock/${sig.ticker}`} className="shrink-0 text-right hover:text-primary">
                  <div className="font-mono text-sm font-bold text-primary">{sig.ticker}</div>
                  <div className="max-w-[120px] truncate text-xs text-muted-foreground">{sig.name}</div>
                </Link>
              </CardContent>
            </Card>
          );
        })}
        {rows.length === 0 && <div className="py-12 text-center text-muted-foreground">{t('No signals in this category right now.')}</div>}
      </div>
    </div>
  );
}
