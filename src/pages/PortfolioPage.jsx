import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Plus, Trash2, Loader2, Trophy, Globe } from 'lucide-react';
import { Card, CardContent, Badge, Button, Stat } from '@/components/ui.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { getPortfolio, addHolding, removeHolding, getShowcase, upsertShowcase } from '@/lib/db.js';
import { STOCKS, getStock } from '@/data/stocks.js';
import { cn, money, pct } from '@/lib/utils.js';
import { t } from '@/i18n.js';

export default function PortfolioPage() {
  const { user, openAuth } = useAuth();
  const [rows, setRows] = useState([]);
  const [ticker, setTicker] = useState('2222');
  const [shares, setShares] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const [sc, setSc] = useState({ display_name: '', blurb: '', is_public: false });
  const [scBusy, setScBusy] = useState(false);
  const [scMsg, setScMsg] = useState(null);

  const refresh = () => { if (user) getPortfolio(user.id).then(setRows).catch(() => {}); };
  useEffect(refresh, [user]);
  useEffect(() => {
    if (!user) return;
    getShowcase(user.id).then((s) => {
      if (s) setSc({ display_name: s.display_name || '', blurb: s.blurb || '', is_public: s.is_public });
      else setSc((p) => ({ ...p, display_name: user.username || user.email?.split('@')[0] || '' }));
    }).catch(() => {});
  }, [user]);

  const saveShowcase = async (e) => {
    e.preventDefault(); setScBusy(true); setScMsg(null);
    try {
      if (!sc.display_name.trim()) throw new Error(t('Enter a display name.'));
      await upsertShowcase({ user, displayName: sc.display_name.trim(), blurb: sc.blurb.trim(), isPublic: sc.is_public });
      setScMsg(sc.is_public ? t('Published to Showcase.') : t('Saved (private).'));
    } catch (e2) { setScMsg(e2.message); } finally { setScBusy(false); }
  };

  const enriched = useMemo(() => rows.map((r) => {
    const s = getStock(r.ticker);
    const price = s?.price ?? r.buy_price;
    const cost = r.shares * r.buy_price;
    const value = r.shares * price;
    return { ...r, name: s?.name || r.ticker, price, cost, value, pl: value - cost, plPct: cost ? (value / cost - 1) * 100 : 0 };
  }), [rows]);

  const totals = useMemo(() => {
    const cost = enriched.reduce((a, r) => a + r.cost, 0);
    const value = enriched.reduce((a, r) => a + r.value, 0);
    return { cost, value, pl: value - cost, plPct: cost ? (value / cost - 1) * 100 : 0 };
  }, [enriched]);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      if (!(Number(shares) > 0) || !(Number(buyPrice) > 0)) throw new Error(t('Enter valid shares and buy price.'));
      await addHolding({ user, ticker, shares, buyPrice });
      setShares(''); setBuyPrice(''); refresh();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  const del = async (id) => { await removeHolding(id); refresh(); };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="muted" className="mb-3">{t('Track without risk')}</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Virtual Portfolio')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t('Add positions at your entry price and watch live profit/loss against the latest Tadawul prices. Paper only — no real money.')}
      </p>

      {!user ? (
        <Card className="mt-6"><CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Briefcase className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">{t('Sign in to build and save your virtual portfolio.')}</p>
          <Button variant="accent" onClick={openAuth}>{t('Sign in')}</Button>
        </CardContent></Card>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={money(totals.value, 'SAR')} label={t('Market value')} />
            <Stat value={money(totals.cost, 'SAR')} label={t('Cost basis')} />
            <Stat value={`${totals.pl >= 0 ? '+' : ''}${money(totals.pl, 'SAR')}`} label={t('Unrealised P/L')} accent={totals.pl >= 0 ? 'text-success' : 'text-destructive'} />
            <Stat value={pct(totals.plPct)} label={t('Return')} accent={totals.plPct >= 0 ? 'text-success' : 'text-destructive'} />
          </div>

          <Card className="mt-6"><CardContent>
            <h2 className="font-serif text-lg font-bold">{t('Add a holding')}</h2>
            <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">{t('Stock')}</label>
                <select value={ticker} onChange={(e) => setTicker(e.target.value)} className="mt-1 w-full">
                  {STOCKS.map((s) => <option key={s.ticker} value={s.ticker}>{s.ticker} · {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">{t('Shares')}</label>
                <input type="number" step="1" value={shares} onChange={(e) => setShares(e.target.value)} placeholder="100" className="mt-1 w-28" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">{t('Buy price')}</label>
                <input type="number" step="0.01" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} placeholder={String(getStock(ticker)?.price ?? '')} className="mt-1 w-28" />
              </div>
              <Button type="submit" variant="accent" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> {t('Add')}</>}
              </Button>
            </form>
            {err && <div className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</div>}
          </CardContent></Card>

          <Card className="mt-5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                    <th className="px-4 py-2.5 text-left font-medium">{t('Stock')}</th>
                    <th className="px-4 py-2.5 text-right font-medium">{t('Shares')}</th>
                    <th className="px-4 py-2.5 text-right font-medium">{t('Buy price')}</th>
                    <th className="px-4 py-2.5 text-right font-medium">{t('Last')}</th>
                    <th className="px-4 py-2.5 text-right font-medium">{t('Value')}</th>
                    <th className="px-4 py-2.5 text-right font-medium">P/L</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <Link to={`/stock/${r.ticker}`} className="hover:text-primary">
                          <span className="font-mono font-bold text-primary">{r.ticker}</span>
                          <span className="ml-2 text-foreground/80">{r.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">{r.shares}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{r.buy_price.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{r.price.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{money(r.value, 'SAR')}</td>
                      <td className={cn('px-4 py-2.5 text-right font-mono', r.pl >= 0 ? 'text-success' : 'text-destructive')}>
                        {r.pl >= 0 ? '+' : ''}{r.pl.toFixed(0)} ({pct(r.plPct)})
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => del(r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {enriched.length === 0 && <div className="py-10 text-center text-muted-foreground">{t('No holdings yet — add your first position above.')}</div>}
            </div>
          </Card>

          {/* Publish to Showcase */}
          <Card className="mt-5 border-primary/30 bg-primary/5"><CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-lg font-bold">{t('Publish to Showcase')}</h2>
              <Button as={Link} to="/showcase" variant="ghost" className="ml-auto h-8 px-3 text-sm">{t('View Showcase')}</Button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t('Share this portfolio publicly. It gets a transparent score and others can follow you.')}</p>
            <form onSubmit={saveShowcase} className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">{t('Display name')}</label>
                <input value={sc.display_name} onChange={(e) => setSc({ ...sc, display_name: e.target.value })} className="mt-1 w-full" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">{t('Blurb (optional)')}</label>
                <input value={sc.blurb} onChange={(e) => setSc({ ...sc, blurb: e.target.value })} placeholder={t('e.g. Long-term Sharia dividend focus')} className="mt-1 w-full" />
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" checked={sc.is_public} onChange={(e) => setSc({ ...sc, is_public: e.target.checked })} className="accent-primary h-4 w-4" />
                <Globe className="h-4 w-4 text-muted-foreground" /> {t('Make my portfolio public on the Showcase')}
              </label>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Button type="submit" variant="accent" disabled={scBusy}>
                  {scBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('Save')}
                </Button>
                {scMsg && <span className="text-sm text-muted-foreground">{scMsg}</span>}
              </div>
            </form>
          </CardContent></Card>
        </>
      )}
      <p className="mt-6 text-xs text-muted-foreground">{t('Paper-trading tool for tracking only. Prices are delayed/sample. Not investment advice.')}</p>
    </div>
  );
}
