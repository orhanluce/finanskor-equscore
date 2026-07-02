import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, Badge, Stat } from '@/components/ui.jsx';
import { ScorePill } from '@/components/equity.jsx';
import { STOCKS, COUNTRY } from '@/data/stocks.js';
import { foreignSignal, FOREIGN_TONE } from '@/data/foreignFlow.js';
import { cn } from '@/lib/utils.js';
import { t } from '@/i18n.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in', label: 'Inflow' },
  { id: 'out', label: 'Outflow' },
];

export default function ForeignFlowPage() {
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => {
    return STOCKS
      .filter((s) => s.foreignOwn != null || s.foreignFlow)
      .map((s) => ({ ...s, sig: foreignSignal(s) }))
      .filter((s) => filter === 'all' || (filter === 'in' && s.foreignFlow === 'in') || (filter === 'out' && s.foreignFlow === 'out'))
      .sort((a, b) => (b.sig.rank - a.sig.rank) || ((b.foreignOwn || 0) - (a.foreignOwn || 0)));
  }, [filter]);

  const stats = useMemo(() => {
    const covered = STOCKS.filter((s) => s.foreignOwn != null || s.foreignFlow);
    const inflow = covered.filter((s) => s.foreignFlow === 'in').length;
    const outflow = covered.filter((s) => s.foreignFlow === 'out').length;
    const owns = covered.map((s) => s.foreignOwn).filter((v) => v != null);
    const avgOwn = owns.length ? owns.reduce((a, b) => a + b, 0) / owns.length : 0;
    return { covered: covered.length, inflow, outflow, avgOwn };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3"><Globe2 className="h-3.5 w-3.5" /> {t('Foreign & institutional flow')}</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Foreign Flow')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t('Where foreign institutions — the most informed players on')} {COUNTRY.exchange} {t('— are putting money. Net buying into a name they already own heavily is a quality validation signal.')}
      </p>

      {COUNTRY.id === 'SA' && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground/80">
          <span className="font-semibold text-foreground">{t('New (Feb 2026):')}</span>{' '}
          {t('The CMA scrapped the Qualified Foreign Investor (QFI) framework — Tadawul is now open to all foreign investors directly. Foreign participation is set to broaden, making this flow signal more meaningful, not less.')}
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={stats.covered} label={t('Names covered')} />
        <Stat value={stats.inflow} label={t('Foreign inflow')} accent="text-success" />
        <Stat value={stats.outflow} label={t('Foreign outflow')} accent="text-destructive" />
        <Stat value={`${stats.avgOwn.toFixed(1)}%`} label={t('Avg foreign ownership')} />
      </div>

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
        {rows.map((s) => {
          const Icon = s.foreignFlow === 'in' ? TrendingUp : s.foreignFlow === 'out' ? TrendingDown : Minus;
          return (
            <Card key={s.ticker}>
              <CardContent className="flex flex-wrap items-center gap-4 py-3.5">
                <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted', FOREIGN_TONE[s.sig.tone])}>
                  <Icon className="h-5 w-5" />
                </span>
                <Link to={`/stock/${s.ticker}`} className="min-w-0 hover:text-primary">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-primary">{s.ticker}</span>
                    <span className="truncate text-sm text-foreground">{s.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{s.sector}</div>
                </Link>
                <div className="ml-auto flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold">{s.foreignOwn != null ? `${s.foreignOwn}%` : '—'}</div>
                    <div className="text-[11px] text-muted-foreground">{t('foreign own')}</div>
                  </div>
                  <Badge variant={s.sig.tone === 'success' ? 'success' : s.sig.tone === 'destructive' ? 'danger' : 'muted'}>
                    {t(s.sig.label)}
                  </Badge>
                  <ScorePill total={s.total} />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {rows.length === 0 && <div className="py-12 text-center text-muted-foreground">{t('No names in this category right now.')}</div>}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {t('Foreign ownership & flow from exchange reports (Saudi Exchange weekly ownership-by-nationality report where available). Sample/delayed; informational only, not investment advice.')}
      </p>
    </div>
  );
}
