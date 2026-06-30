import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Lock, Loader2, Check } from 'lucide-react';
import { Card, CardContent, Badge, Button } from '@/components/ui.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { PREDICTION_EVENTS } from '@/data/predictionEvents.js';
import { COUNTRY } from '@/data/stocks.js';
import { getEventVotes, getMyEventVotes, castEventVote } from '@/lib/db.js';
import { cn } from '@/lib/utils.js';
import { t } from '@/i18n.js';

export default function EventsPage() {
  const { user, openAuth } = useAuth();
  const events = useMemo(() => PREDICTION_EVENTS[COUNTRY.id] || PREDICTION_EVENTS.SA, []);
  const ids = useMemo(() => events.map((e) => e.id), [events]);
  const [tally, setTally] = useState({});
  const [mine, setMine] = useState({});
  const [busy, setBusy] = useState(null);

  const load = () => {
    getEventVotes(ids).then(setTally).catch(() => {});
    if (user) getMyEventVotes(user.id, ids).then(setMine).catch(() => {});
  };
  useEffect(load, [user]);

  const vote = async (eventId, choice) => {
    if (!user) { openAuth(); return; }
    if (busy) return;
    setBusy(eventId);
    const prev = mine[eventId];
    setMine((m) => ({ ...m, [eventId]: choice }));
    // optimistic tally update
    setTally((tl) => {
      const ev = { ...(tl[eventId] || {}) };
      if (prev != null) ev[prev] = Math.max(0, (ev[prev] || 1) - 1);
      ev[choice] = (ev[choice] || 0) + 1;
      return { ...tl, [eventId]: ev };
    });
    try { await castEventVote({ user, eventId, choice }); } catch { load(); } finally { setBusy(null); }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3"><CalendarClock className="h-3.5 w-3.5" /> {t('Event predictions')}</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Prediction Events')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t('Call the big upcoming events on')} {COUNTRY.exchange}{t('. Virtual only — no money, just the crowd\'s read. See how the community is leaning.')}
      </p>

      <div className="mt-8 space-y-4">
        {events.map((e) => {
          const counts = tally[e.id] || {};
          const total = e.options.reduce((a, _, i) => a + (counts[i] || 0), 0);
          const myChoice = mine[e.id];
          return (
            <Card key={e.id}>
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-serif text-lg font-bold">{t(e.q)}</h2>
                  <Badge variant="muted" className="shrink-0 whitespace-nowrap"><CalendarClock className="h-3 w-3" /> {e.close}</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {e.options.map((opt, i) => {
                    const c = counts[i] || 0;
                    const pctv = total ? Math.round((c / total) * 100) : 0;
                    const picked = myChoice === i;
                    return (
                      <button key={i} onClick={() => vote(e.id, i)} disabled={busy === e.id}
                        className={cn('relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-colors',
                          picked ? 'border-primary' : 'border-border hover:border-primary/40')}>
                        <span className={cn('absolute inset-y-0 left-0 rounded-xl', picked ? 'bg-primary/15' : 'bg-muted/60')} style={{ width: `${pctv}%` }} />
                        <span className="relative flex items-center gap-2 text-sm font-medium">
                          {picked && <Check className="h-4 w-4 text-primary" />}
                          {t(opt)}
                          <span className="ml-auto font-mono text-xs text-muted-foreground">{pctv}%</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{total} {t('votes')}{busy === e.id && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!user && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" /> {t('Sign in to cast your vote.')}
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        {t('Virtual event polls for engagement only — not a regulated prediction market, no wagering. Informational only.')}
      </p>
    </div>
  );
}
