import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, TrendingUp, Loader2, UserPlus, UserCheck, Lock } from 'lucide-react';
import { Card, CardContent, Badge, Button, Stat } from '@/components/ui.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { getPublicShowcases, getMyFollows, followShowcase, unfollowShowcase } from '@/lib/db.js';
import { getStock } from '@/data/stocks.js';
import { cn, pct } from '@/lib/utils.js';
import { t } from '@/i18n.js';

// Showcase score from data we actually have (no time series):
//   return (live P/L) · quality (avg Equity Star) · diversification (sectors) · followers.
function scoreShowcase(holdings, followers) {
  let cost = 0, value = 0, starSum = 0, n = 0;
  const sectors = new Set();
  holdings.forEach((h) => {
    const s = getStock(h.ticker);
    const price = s?.price ?? h.buy_price;
    cost += h.shares * h.buy_price;
    value += h.shares * price;
    if (s) { starSum += s.total; sectors.add(s.sector); }
    n += 1;
  });
  const ret = cost ? (value / cost - 1) * 100 : 0;
  const retScore = Math.max(0, Math.min(45, 22.5 + ret * 1.5));          // 0–45
  const qualityScore = n ? (starSum / n / 42) * 30 : 0;                  // 0–30
  const divScore = Math.min(15, sectors.size * 3);                       // 0–15
  const followScore = Math.min(10, followers / 5);                      // 0–10
  return {
    score: Math.round(retScore + qualityScore + divScore + followScore),
    ret, holdingsCount: n, sectors: sectors.size,
  };
}

export default function ShowcasePage() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [follows, setFollows] = useState([]);
  const [busy, setBusy] = useState(null);

  const load = () => {
    getPublicShowcases().then((list) => {
      const scored = list.map((p) => ({ ...p, ...scoreShowcase(p.holdings, p.followers) }))
        .sort((a, b) => b.score - a.score);
      setRows(scored);
    }).catch(() => setRows([]));
    if (user) getMyFollows(user.id).then(setFollows).catch(() => {});
  };
  useEffect(load, [user]);

  const toggleFollow = async (targetId) => {
    if (!user || busy) return;
    setBusy(targetId);
    try {
      if (follows.includes(targetId)) { await unfollowShowcase(user, targetId); setFollows((f) => f.filter((x) => x !== targetId)); }
      else { await followShowcase(user, targetId); setFollows((f) => [...f, targetId]); }
    } catch { /* ignore */ } finally { setBusy(null); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3"><Trophy className="h-3.5 w-3.5" /> {t('Public portfolios')}</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Showcase')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t('Real members sharing their virtual portfolios. Ranked by a transparent score — live return, holding quality, diversification and followers.')}
      </p>

      <div className="mt-4">
        <Button as={Link} to="/portfolio" variant="outline" className="h-9 px-4 text-sm">{t('Publish your portfolio')}</Button>
      </div>

      {rows === null ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <Card className="mt-8"><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t('No public portfolios yet — be the first to publish yours.')}</p>
          <Button as={Link} to="/portfolio" variant="accent">{t('Publish your portfolio')}</Button>
        </CardContent></Card>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((p, i) => {
            const isMe = user?.id === p.user_id;
            const following = follows.includes(p.user_id);
            const top = [...p.holdings].sort((a, b) => (getStock(b.ticker)?.total || 0) - (getStock(a.ticker)?.total || 0)).slice(0, 5);
            return (
              <Card key={p.user_id}>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cn('font-serif text-2xl font-bold w-8 text-center',
                      i === 0 ? 'text-medal-gold' : i === 1 ? 'text-medal-silver' : i === 2 ? 'text-medal-bronze' : 'text-muted-foreground')}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-serif text-lg font-bold">{p.display_name}</div>
                      {p.blurb && <div className="text-sm text-muted-foreground">{p.blurb}</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-serif text-2xl font-bold text-primary">{p.score}<span className="text-sm text-muted-foreground">/100</span></div>
                      <div className="text-[11px] text-muted-foreground">{t('Showcase score')}</div>
                    </div>
                    {!isMe && (
                      <Button variant={following ? 'outline' : 'accent'} className="h-9 px-3 text-sm" disabled={!user || busy === p.user_id}
                        onClick={() => toggleFollow(p.user_id)}>
                        {busy === p.user_id ? <Loader2 className="h-4 w-4 animate-spin" />
                          : following ? <><UserCheck className="h-4 w-4" /> {t('Following')}</>
                            : <><UserPlus className="h-4 w-4" /> {t('Follow')}</>}
                      </Button>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat value={pct(p.ret)} label={t('Return')} accent={p.ret >= 0 ? 'text-success' : 'text-destructive'} />
                    <Stat value={p.holdingsCount} label={t('Holdings')} />
                    <Stat value={p.sectors} label={t('Sectors')} />
                    <Stat value={p.followers} label={t('Followers')} />
                  </div>

                  {top.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">{t('Top holdings')}:</span>
                      {top.map((h) => (
                        <Link key={h.ticker} to={`/stock/${h.ticker}`}
                          className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold hover:text-primary">{h.ticker}</Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!user && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" /> {t('Sign in to follow portfolios.')}
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        {t('Paper portfolios shared by members. Score is illustrative, not audited. Not investment advice.')}
      </p>
    </div>
  );
}
