import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, ShieldCheck } from 'lucide-react';
import { Card, CardContent, Badge, Stat } from '@/components/ui.jsx';
import { ScorePill } from '@/components/equity.jsx';
import { STOCKS, COUNTRY } from '@/data/stocks.js';
import { computeZScore, zPercentile, ZONE_META } from '@/data/zscore.js';
import { cn } from '@/lib/utils.js';
import { t } from '@/i18n.js';

const ZONE_BADGE = { success: 'success', 'medal-bronze': 'muted', destructive: 'danger' };
const ZONE_TEXT = { success: 'text-success', 'medal-bronze': 'text-medal-bronze', destructive: 'text-destructive' };

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'safe', label: 'Safe Zone' },
  { id: 'grey', label: 'Grey Zone' },
  { id: 'distress', label: 'Distress Zone' },
];

export default function FinancialHealthPage() {
  const [filter, setFilter] = useState('all');

  const { rows, stats, excluded } = useMemo(() => {
    const scored = [];
    let excluded = 0;
    STOCKS.forEach((s) => {
      const z = computeZScore(s);
      if (!z.applicable) { excluded += 1; return; }
      scored.push({ ...s, z: z.z, zone: z.zone, pct: zPercentile(s).percentile });
    });
    scored.sort((a, b) => b.z - a.z);
    const stats = {
      scored: scored.length,
      safe: scored.filter((r) => r.zone === 'safe').length,
      grey: scored.filter((r) => r.zone === 'grey').length,
      distress: scored.filter((r) => r.zone === 'distress').length,
    };
    const rows = filter === 'all' ? scored : scored.filter((r) => r.zone === filter);
    return { rows, stats, excluded };
  }, [filter]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3"><HeartPulse className="h-3.5 w-3.5" /> {t('Altman Z″')}</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Financial Health')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t('Bankruptcy-distance for every')} {COUNTRY.exchange} {t('name (Altman Z″, emerging-market variant). Read within the sector — banks & insurers are scored differently and excluded here.')}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={stats.scored} label={t('Scored')} />
        <Stat value={stats.safe} label={t('Safe Zone')} accent="text-success" />
        <Stat value={stats.grey} label={t('Grey Zone')} accent="text-medal-bronze" />
        <Stat value={stats.distress} label={t('Distress Zone')} accent="text-destructive" />
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

      <div className="mt-5 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t('Company')}</th>
              <th className="px-4 py-3 text-right">Z″</th>
              <th className="px-4 py-3">{t('Zone')}</th>
              <th className="px-4 py-3">{t('Sector percentile')}</th>
              <th className="px-4 py-3 text-right">{t('Star')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const meta = ZONE_META[s.zone];
              return (
                <tr key={s.ticker} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link to={`/stock/${s.ticker}`} className="group">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">{s.ticker}</span>
                        <span className="font-semibold group-hover:text-primary">{s.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{s.sector}</div>
                    </Link>
                  </td>
                  <td className={cn('px-4 py-3 text-right font-mono font-bold', ZONE_TEXT[meta.tone])}>{s.z}</td>
                  <td className="px-4 py-3"><Badge variant={ZONE_BADGE[meta.tone]}>{t(meta.label)}</Badge></td>
                  <td className="px-4 py-3">
                    {s.pct != null ? (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${s.pct}%` }} />
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">{s.pct}%</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right"><ScorePill total={s.total} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <div className="py-12 text-center text-muted-foreground">{t('No names in this category right now.')}</div>}
      </div>

      {excluded > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> {excluded} {t('bank/insurer names are excluded — use CAR / Solvency instead.')}
        </div>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        {t('Z″ emerging-market variant. Read within the sector, never on the absolute threshold alone. Informational only.')}
      </p>
    </div>
  );
}
