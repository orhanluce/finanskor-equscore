import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, Badge, Button } from '@/components/ui.jsx';
import { cn } from '@/lib/utils.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { STOCKS } from '@/data/stocks.js';
import { addDecision, getMyDecisions, computeMirror, computeBiases } from '@/lib/db.js';

const STOCK_BY_TICKER = Object.fromEntries(STOCKS.map((s) => [s.ticker, s]));

const ACTIONS = [['buy', 'Bought'], ['sell', 'Sold'], ['watch', 'Watching']];
const REASONS = [
  ['intuition', 'Intuition'], ['news', 'News'], ['tip', 'A tip'],
  ['rumor', 'Rumor'], ['analysis', 'Analysis'],
];
const REASON_LABEL = Object.fromEntries(REASONS);

export default function JournalPage() {
  const { user, openAuth } = useAuth();
  const [ticker, setTicker] = useState('2222');
  const [action, setAction] = useState('buy');
  const [reason, setReason] = useState('intuition');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [list, setList] = useState([]);

  const tickerName = (t) => STOCKS.find((s) => s.ticker === t)?.name || t;
  const refresh = () => { if (user) getMyDecisions(user.id).then(setList).catch(() => {}); };
  useEffect(refresh, [user]);

  const mirror = useMemo(() => computeMirror(list), [list]);
  const biases = useMemo(() => computeBiases(list, STOCK_BY_TICKER), [list]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await addDecision({ user, ticker, action, reason, note });
      setNote(''); refresh();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="muted" className="mb-3">Behavioural moat</Badge>
      <h1 className="font-serif text-4xl font-bold">Decision Journal</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Log what you do and <span className="font-semibold text-foreground">why</span> — intuition, news, a tip,
        a rumor, or analysis. Over time the <span className="text-primary font-semibold">Decision Mirror</span> shows
        you which reasons actually make you money. (Private to you.)
      </p>

      {!user ? (
        <Card className="mt-6"><CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-muted-foreground">Sign in to keep a private decision journal.</p>
          <Button variant="accent" onClick={openAuth}>Sign in</Button>
        </CardContent></Card>
      ) : (
        <>
          {/* Mirror */}
          <Card className="mt-6 border-primary/30 bg-primary/5"><CardContent>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl font-bold">Decision Mirror</h2>
            </div>
            {mirror.total === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Log a few decisions to unlock your mirror.</p>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mirror.total} decisions logged{mirror.withResult > 0 ? `, ${mirror.withResult} scored` : ' — results fill in as horizons pass'}.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {mirror.rows.map((r) => (
                    <div key={r.reason} className="rounded-xl border border-border bg-card px-3 py-2.5">
                      <div className="text-sm font-semibold">{REASON_LABEL[r.reason] || r.reason}</div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">{r.count} decisions</span>
                        {r.avg != null && <span className={cn('font-mono font-bold', r.avg >= 0 ? 'text-success' : 'text-destructive')}>{r.avg >= 0 ? '+' : ''}{r.avg}%</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {biases.length > 0 && (
                  <div className="mt-5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Behavioural flags</div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {biases.map((b) => (
                        <div key={b.key} className={cn('rounded-xl border px-3 py-2.5',
                          b.level === 'warning' ? 'border-destructive/30 bg-destructive/5'
                            : b.level === 'info' ? 'border-medal-bronze/30 bg-medal-bronze/5'
                              : 'border-border bg-card')}>
                          <div className={cn('flex items-center gap-1.5 text-sm font-semibold',
                            b.level === 'warning' ? 'text-destructive' : b.level === 'info' ? 'text-medal-bronze' : 'text-foreground')}>
                            {b.level === 'warning' ? '⚠' : b.level === 'info' ? '◴' : '✓'} {b.title}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{b.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent></Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* form */}
            <Card><CardContent>
              <h2 className="font-serif text-xl font-bold">Log a decision</h2>
              <form onSubmit={submit} className="mt-4 space-y-4">
                <select value={ticker} onChange={(e) => setTicker(e.target.value)} className="w-full">
                  {STOCKS.map((s) => <option key={s.ticker} value={s.ticker}>{s.ticker} · {s.name}</option>)}
                </select>
                <div className="flex gap-2">
                  {ACTIONS.map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setAction(v)}
                      className={cn('flex-1 rounded-xl border py-2 text-sm font-medium',
                        action === v ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground')}>{l}</button>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Why? (the honest reason)</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {REASONS.map(([v, l]) => (
                      <button key={v} type="button" onClick={() => setReason(v)}
                        className={cn('rounded-full border px-3 py-1.5 text-xs font-medium',
                          reason === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>{l}</button>
                    ))}
                  </div>
                </div>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                  placeholder="Optional note…" className="w-full resize-none" />
                {err && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</div>}
                <Button type="submit" variant="accent" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><BookOpen className="h-4 w-4" /> Add to journal</>}
                </Button>
              </form>
            </CardContent></Card>

            {/* list */}
            <Card><CardContent>
              <h2 className="font-serif text-xl font-bold">Your journal ({list.length})</h2>
              {list.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Nothing logged yet.</p>
              ) : (
                <div className="mt-4 space-y-2 max-h-[420px] overflow-auto custom-scrollbar">
                  {list.map((d) => (
                    <div key={d.id} className="rounded-xl border border-border px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{ACTIONS.find(a => a[0] === d.action)?.[1]} {d.ticker}</span>
                        <Badge variant="muted">{REASON_LABEL[d.reason] || d.reason}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{tickerName(d.ticker)} · {new Date(d.created_at).toLocaleDateString()}</div>
                      {d.note && <div className="mt-1 text-sm text-foreground/75">{d.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent></Card>
          </div>
        </>
      )}
    </div>
  );
}
