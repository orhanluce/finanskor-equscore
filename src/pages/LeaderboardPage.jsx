import React, { useEffect, useState } from 'react';
import { Trophy, Lock } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui.jsx';
import { cn } from '@/lib/utils.js';
import { LEAGUES, CONTEST } from '@/data/community.js';
import { getLeaderboard } from '@/lib/db.js';

const TYPE_CLS = {
  Analyst: 'bg-primary/10 text-primary',
  Crowd: 'bg-success/10 text-success',
  AI: 'bg-ai-navy/10 text-ai-navy',
};

export default function LeaderboardPage() {
  const [league, setLeague] = useState('All');
  const [all, setAll] = useState([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    getLeaderboard().then(({ rows, live }) => { setAll(rows); setLive(live); }).catch(() => {});
  }, []);

  const rows = all.filter((r) => league === 'All' || r.type === league)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="muted" className="mb-3">Accountability arena</Badge>
      <h1 className="font-serif text-4xl font-bold">Leaderboard</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Analysts, the crowd and AI models compete in one arena. Every call is locked with a server-side
        timestamp and graded against realised price — hit rate is earned, not claimed.
      </p>

      {/* contest banner */}
      <Card className="mt-6 border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-7 w-7 text-primary" />
            <div>
              <div className="font-serif text-lg font-bold">Season {CONTEST.season} · {CONTEST.monthly}</div>
              <div className="text-sm text-muted-foreground">{CONTEST.note}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Predictions locked & time-stamped
          </div>
        </CardContent>
      </Card>

      {/* leagues */}
      <div className="mt-6 flex flex-wrap gap-2">
        {LEAGUES.map((l) => (
          <button key={l} onClick={() => setLeague(l)}
            className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              league === l ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
            {l}
          </button>
        ))}
      </div>

      {/* table */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 w-12">#</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">League</th>
              <th className="px-4 py-3 text-right">Calls</th>
              <th className="px-4 py-3 text-right">Avg upside</th>
              <th className="px-4 py-3 text-right">Hit rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3">
                  <span className={cn('font-serif font-bold',
                    r.rank === 1 ? 'text-medal-gold' : r.rank === 2 ? 'text-medal-silver' : r.rank === 3 ? 'text-medal-bronze' : 'text-muted-foreground')}>
                    {r.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.org}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', TYPE_CLS[r.type])}>{r.type}</span>
                </td>
                <td className="px-4 py-3 text-right font-mono">{r.predictions}</td>
                <td className="px-4 py-3 text-right font-mono text-success">+{r.avgUpside}%</td>
                <td className="px-4 py-3 text-right font-mono font-bold">{r.hitRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        {live
          ? 'Live standings from real, server-timestamped predictions. Hit rate fills in as horizons resolve.'
          : 'Sample standings — be the first to lock a prediction in the Contest and you\'ll appear here live.'}{' '}
        An analyst (Argaam feed) leaderboard like this exists nowhere else for Tadawul.
      </p>
    </div>
  );
}
