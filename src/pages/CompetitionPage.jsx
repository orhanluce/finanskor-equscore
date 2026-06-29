import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, CalendarDays, Loader2, Lock } from 'lucide-react';
import { Card, CardContent, Badge, Button, Stat } from '@/components/ui.jsx';
import { getLeaderboard } from '@/lib/db.js';
import { CONTEST } from '@/data/community.js';
import { cn } from '@/lib/utils.js';
import { t } from '@/i18n.js';

const PERIODS = [
  { id: 'monthly', label: 'Monthly Cup', window: CONTEST.monthly, prize: '🥇 Featured + verified badge', desc: 'Resets on the 1st. Best hit-rate over locked calls this month.' },
  { id: 'quarterly', label: 'Quarterly League', window: CONTEST.season, prize: '🏆 Season champion spotlight', desc: 'Cumulative hit-rate across the quarter — rewards consistency.' },
];

const TYPE_COLOR = { Analyst: 'text-primary', Crowd: 'text-success', AI: 'text-ai-navy', Corporate: 'text-medal-bronze' };
const MEDAL = ['text-medal-gold', 'text-medal-silver', 'text-medal-bronze'];

export default function CompetitionPage() {
  const [period, setPeriod] = useState('monthly');
  const [rows, setRows] = useState([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard().then(({ rows, live }) => { setRows(rows); setLive(live); }).finally(() => setLoading(false));
  }, []);

  const cur = PERIODS.find((p) => p.id === period);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="muted" className="mb-3">{t('Accountability arena')}</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Competitions')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t('Analysts, the crowd and AI compete in the same league. Every call is locked with a server-side timestamp and graded against realised price.')}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              period === p.id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            {t(p.label)}
          </button>
        ))}
      </div>

      <Card className="mt-4 border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /><span className="font-semibold">{t(cur.label)}</span><span className="text-sm text-muted-foreground">· {cur.window}</span></div>
          <span className="text-sm text-muted-foreground">{cur.desc}</span>
          <span className="ml-auto text-sm font-medium text-primary">{cur.prize}</span>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat value={rows.length} label={t('Competitors')} />
        <Stat value={rows[0]?.hitRate ? `${rows[0].hitRate}%` : '—'} label={t('Top hit rate')} accent="text-success" />
        <Stat value={live ? t('Live') : t('Sample')} label={t('Data')} accent={live ? 'text-success' : 'text-muted-foreground'} />
      </div>

      <Card className="mt-6 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-medium">#</th>
                  <th className="px-4 py-2.5 text-left font-medium">{t('Competitor')}</th>
                  <th className="px-4 py-2.5 text-left font-medium">{t('Type')}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t('Calls')}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t('Hit rate')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.rank ?? i} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      {i < 3 ? <Medal className={cn('h-5 w-5', MEDAL[i])} /> : <span className="text-muted-foreground">{i + 1}</span>}
                    </td>
                    <td className="px-4 py-2.5 font-medium">{r.name}</td>
                    <td className={cn('px-4 py-2.5 font-medium', TYPE_COLOR[r.type] || 'text-foreground')}>{r.type}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{r.predictions}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-success">{r.hitRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Lock className="h-4 w-4" /> {CONTEST.note}</div>
        <Button as={Link} to="/predict" variant="accent" className="shrink-0">{t('Make a call')}</Button>
      </div>
    </div>
  );
}
