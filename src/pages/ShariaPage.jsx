import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { Card, CardContent, Badge, Stat } from '@/components/ui.jsx';
import { cn } from '@/lib/utils.js';
import { STOCKS } from '@/data/stocks.js';
import { t } from '@/i18n.js';

const THRESHOLDS = [
  { title: 'Interest-bearing debt', rule: '< 30% of market cap', icon: '💳' },
  { title: 'Interest-earning deposits', rule: '< 5% of total revenue', icon: '🏦' },
  { title: 'Impermissible income', rule: '< 5% of total revenue', icon: '⚖️' },
];

const TABS = [
  { id: 'compliant', label: 'Compliant', icon: ShieldCheck, cls: 'text-sharia', badge: 'sharia' },
  { id: 'doubtful', label: 'Doubtful', icon: ShieldAlert, cls: 'text-medal-bronze', badge: 'muted' },
  { id: 'non-compliant', label: 'Non-compliant', icon: ShieldX, cls: 'text-destructive', badge: 'danger' },
];

export default function ShariaPage() {
  const [tab, setTab] = useState('compliant');
  const counts = Object.fromEntries(TABS.map((tb) => [tb.id, STOCKS.filter((s) => s.sharia === tb.id).length]));
  const rows = STOCKS.filter((s) => s.sharia === tab).sort((a, b) => b.total - a.total);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="sharia" className="mb-3">{t('Region-native differentiator')}</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Sharia Compliance Screen')}</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        In the Gulf, an inflation-adjusted "real return" lens is redundant —
        inflation is ~2% and the riyal is pegged to the dollar. Its place is taken by the question that actually
        matters to most Gulf retail investors: <span className="font-semibold text-foreground">{t('is this stock halal?')}</span>{' '}
        We screen every name against the <span className="font-semibold text-sharia">AAOIFI Standard No. 21</span> ratios.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {THRESHOLDS.map((th) => (
          <Card key={th.title} className="border-sharia/25 bg-sharia/5">
            <CardContent>
              <div className="text-2xl">{th.icon}</div>
              <div className="mt-2 font-serif font-bold">{t(th.title)}</div>
              <div className="mt-1 text-sm text-sharia font-semibold">{t(th.rule)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {t('Plus a business-activity screen (excludes conventional banking, alcohol, gambling, tobacco, adult content, weapons) and a purification estimate for any minor impermissible income. Derived from the financials we already compute — guidance only; consult a qualified Shariah advisor.')}
      </p>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <Stat value={counts.compliant} label={t('Compliant')} accent="text-sharia" />
        <Stat value={counts.doubtful} label={t('Doubtful')} accent="text-medal-bronze" />
        <Stat value={counts['non-compliant']} label={t('Non-compliant')} accent="text-destructive" />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {TABS.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              tab === tb.id ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
            <tb.icon className="h-4 w-4" /> {t(tb.label)} ({counts[tb.id]})
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t('Company')}</th>
              <th className="px-4 py-3 text-right">{t('Debt')}</th>
              <th className="px-4 py-3 text-right">{t('Int. cash')}</th>
              <th className="px-4 py-3 text-right">{t('Impure')}</th>
              <th className="px-4 py-3 text-right">{t('Star')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
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
                <Cell v={s.shariaRatios.debt} thr={30} />
                <Cell v={s.shariaRatios.cashInterest} thr={30} />
                <Cell v={s.shariaRatios.impureIncome} thr={5} />
                <td className="px-4 py-3 text-right font-mono font-bold">{s.total}<span className="text-xs text-muted-foreground">/42</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({ v, thr }) {
  const pass = v <= thr;
  return (
    <td className="px-4 py-3 text-right">
      <span className={cn('font-mono font-semibold', pass ? 'text-foreground' : 'text-destructive')}>{v}%</span>
    </td>
  );
}
