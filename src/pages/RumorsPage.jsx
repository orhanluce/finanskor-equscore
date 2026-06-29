import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, AlertTriangle } from 'lucide-react';
import { Card, CardContent, Badge, Stat } from '@/components/ui.jsx';
import { STOCKS } from '@/data/stocks.js';
import { socialFor } from '@/data/social.js';
import { cn } from '@/lib/utils.js';
import { t } from '@/i18n.js';

const lvl = (s) => socialFor(s.ticker)?.level || s.rumor;

const LEVELS = {
  danger: { label: 'Dangerous', rank: 4, color: 'text-destructive', bg: 'bg-destructive', chip: 'danger', w: '100%' },
  high: { label: 'High', rank: 3, color: 'text-medal-bronze', bg: 'bg-medal-bronze', chip: 'muted', w: '75%' },
  medium: { label: 'Medium', rank: 2, color: 'text-primary', bg: 'bg-primary', chip: 'primary', w: '50%' },
  low: { label: 'Low', rank: 1, color: 'text-success', bg: 'bg-success', chip: 'success', w: '25%' },
};

export default function RumorsPage() {
  const [filter, setFilter] = useState('all');
  const ranked = useMemo(() => [...STOCKS].sort((a, b) => (LEVELS[lvl(b)]?.rank || 0) - (LEVELS[lvl(a)]?.rank || 0)), []);
  const rows = filter === 'all' ? ranked : ranked.filter((s) => lvl(s) === filter);
  const counts = useMemo(() => {
    const c = { danger: 0, high: 0, medium: 0, low: 0 };
    STOCKS.forEach((s) => { const L = lvl(s); c[L] = (c[L] || 0) + 1; });
    return c;
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="muted" className="mb-3">{t('Heuristic · separate from the score')}</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Rumor Thermometer')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t('Volume and tone of social chatter per name. Heavily discussed stocks have historically faded — high heat alone is not a buy signal.')}
      </p>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-medal-bronze/30 bg-medal-bronze/5 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-medal-bronze" />
        <p className="text-sm text-foreground/80">
          <span className="font-semibold">{t('Manipulation caution:')}</span> {t('sudden chatter spikes on low-float names are a classic pump pattern. This panel is deliberately kept out of the Equity Star score.')}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={counts.danger} label={t('Dangerous')} accent="text-destructive" />
        <Stat value={counts.high} label={t('High')} accent="text-medal-bronze" />
        <Stat value={counts.medium} label={t('Medium')} accent="text-primary" />
        <Stat value={counts.low} label={t('Low / quiet')} accent="text-success" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {['all', 'danger', 'high', 'medium', 'low'].map((id) => (
          <button key={id} onClick={() => setFilter(id)}
            className={cn('rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors',
              filter === id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            {id === 'all' ? t('All') : t(LEVELS[id].label)}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((s) => {
          const level = lvl(s);
          const lv = LEVELS[level];
          const soc = socialFor(s.ticker);
          return (
            <Card key={s.ticker}>
              <CardContent className="flex items-center gap-4 py-4">
                <Flame className={cn('h-6 w-6 shrink-0', lv.color)} />
                <div className="min-w-0 flex-1">
                  <Link to={`/stock/${s.ticker}`} className="hover:text-primary">
                    <span className="font-mono font-bold text-primary">{s.ticker}</span>
                    <span className="ml-2 text-foreground">{s.name}</span>
                  </Link>
                  <div className="mt-1.5 h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                    <div className={cn('h-full rounded-full', lv.bg)} style={{ width: lv.w }} />
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={lv.chip} className={level === 'high' ? 'text-medal-bronze border-medal-bronze/30 bg-medal-bronze/10' : ''}>{t(lv.label)}</Badge>
                  {soc ? <div className="mt-1 text-[11px] text-muted-foreground">𝕏 {soc.n} posts · {soc.mood}</div>
                    : level === 'danger' ? <div className="mt-1 text-[11px] text-muted-foreground">{t('historically a fade signal')}</div>
                    : level === 'low' ? <div className="mt-1 text-[11px] text-muted-foreground">{t('possibly overlooked')}</div> : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {t('Live 𝕏 chatter (AR + EN), volume + tone, kept out of the score. Not a recommendation; deeper Arabic-NLP is a planned upgrade.')}
      </p>
    </div>
  );
}
