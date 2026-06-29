import React, { useEffect, useMemo, useState } from 'react';
import { Lock, Trophy, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, Badge, Button } from '@/components/ui.jsx';
import { cn, money } from '@/lib/utils.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { STOCKS } from '@/data/stocks.js';
import { submitPrediction, getMyPredictions } from '@/lib/db.js';
import { CONTEST } from '@/data/community.js';
import { t } from '@/i18n.js';

export default function PredictPage() {
  const { user, openAuth } = useAuth();
  const [ticker, setTicker] = useState('2222');
  const [ptype, setPtype] = useState('price_target');
  const [target, setTarget] = useState('');
  const [direction, setDirection] = useState('up');
  const [horizon, setHorizon] = useState(30);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [mine, setMine] = useState([]);

  const stock = useMemo(() => STOCKS.find((s) => s.ticker === ticker), [ticker]);
  const tickerName = (tk) => STOCKS.find((s) => s.ticker === tk)?.name || tk;

  const refresh = () => { if (user) getMyPredictions(user.id).then(setMine).catch(() => {}); };
  useEffect(refresh, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const value = ptype === 'price_target' ? Number(target) : (direction === 'up' ? 1 : 0);
      if (ptype === 'price_target' && !(value > 0)) throw new Error(t('Enter a valid target price'));
      await submitPrediction({ user, ticker, predictionType: ptype, value, horizonDays: horizon });
      setTarget(''); refresh();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="muted" className="mb-3">{t('Server-locked')}</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Make a call')}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        {t("Lock in a prediction with a server-side timestamp. It can't be back-dated or edited — when the horizon passes, it's scored against the realised price and feeds your track record on the leaderboard.")}
      </p>

      <Card className="mt-6 border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center gap-3">
          <Trophy className="h-6 w-6 text-primary" />
          <div className="text-sm"><b>Season {CONTEST.season}</b> · {CONTEST.monthly} — analysts, crowd & AI in one arena.</div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> {t('Server-locked')}
          </span>
        </CardContent>
      </Card>

      {!user ? (
        <Card className="mt-6"><CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-muted-foreground">{t('Sign in to submit predictions and build your track record.')}</p>
          <Button variant="accent" onClick={openAuth}>{t('Sign in to play')}</Button>
        </CardContent></Card>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card><CardContent>
            <h2 className="font-serif text-xl font-bold">{t('New prediction')}</h2>
            <form onSubmit={submit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">{t('Stock')}</label>
                <select value={ticker} onChange={(e) => setTicker(e.target.value)} className="mt-1 w-full">
                  {STOCKS.map((s) => <option key={s.ticker} value={s.ticker}>{s.ticker} · {s.name}</option>)}
                </select>
                {stock && <div className="mt-1 text-xs text-muted-foreground">Current: {money(stock.price, 'SAR')}</div>}
              </div>

              <div className="flex rounded-full border border-border bg-card p-0.5">
                {[['price_target', t('Price target')], ['direction', t('Direction')]].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setPtype(v)}
                    className={cn('flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                      ptype === v ? 'bg-foreground text-background' : 'text-muted-foreground')}>{l}</button>
                ))}
              </div>

              {ptype === 'price_target' ? (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">{t('Target price (SAR)')}</label>
                  <input type="number" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)}
                    placeholder="e.g. 30.00" className="mt-1 w-full" />
                </div>
              ) : (
                <div className="flex gap-2">
                  {[['up', t('Up'), TrendingUp], ['down', t('Down'), TrendingDown]].map(([v, l, Icon]) => (
                    <button key={v} type="button" onClick={() => setDirection(v)}
                      className={cn('flex-1 inline-flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium',
                        direction === v ? (v === 'up' ? 'border-success bg-success/10 text-success' : 'border-destructive bg-destructive/10 text-destructive') : 'border-border text-muted-foreground')}>
                      <Icon className="h-4 w-4" /> {l}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-muted-foreground">{t('Horizon')}</label>
                <div className="mt-1 flex gap-2">
                  {[[30, t('1 month')], [90, t('3 months')], [180, t('6 months')]].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setHorizon(v)}
                      className={cn('flex-1 rounded-xl border py-2 text-xs font-medium',
                        horizon === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>{l}</button>
                  ))}
                </div>
              </div>

              {err && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</div>}
              <Button type="submit" variant="accent" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Lock className="h-4 w-4" /> {t('Lock prediction')}</>}
              </Button>
            </form>
          </CardContent></Card>

          <Card><CardContent>
            <h2 className="font-serif text-xl font-bold">Your predictions ({mine.length})</h2>
            {mine.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">{t('No predictions yet — lock your first call.')}</p>
            ) : (
              <div className="mt-4 space-y-2">
                {mine.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
                    <div>
                      <div className="font-semibold text-sm">{p.ticker} <span className="text-muted-foreground font-normal">{tickerName(p.ticker)}</span></div>
                      <div className="text-xs text-muted-foreground">
                        {p.prediction_type === 'price_target' ? `Target ${money(p.predicted_value, 'SAR')}` : (p.predicted_value ? t('Direction: Up') : t('Direction: Down'))}
                        {' · '}{p.horizon_days}d
                      </div>
                    </div>
                    <Badge variant={p.resolved ? 'success' : 'muted'}>
                      {p.resolved ? `${p.accuracy_pct ?? '—'}%` : <><Lock className="h-3 w-3" /> {t('Locked')}</>}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent></Card>
        </div>
      )}
    </div>
  );
}
