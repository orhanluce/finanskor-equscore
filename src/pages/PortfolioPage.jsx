import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Plus, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, Badge, Button, Stat } from '@/components/ui.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { getPortfolio, addHolding, removeHolding } from '@/lib/db.js';
import { STOCKS, getStock } from '@/data/stocks.js';
import { cn, money, pct } from '@/lib/utils.js';

export default function PortfolioPage() {
  const { user, openAuth } = useAuth();
  const [rows, setRows] = useState([]);
  const [ticker, setTicker] = useState('2222');
  const [shares, setShares] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const refresh = () => { if (user) getPortfolio(user.id).then(setRows).catch(() => {}); };
  useEffect(refresh, [user]);

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
      if (!(Number(shares) > 0) || !(Number(buyPrice) > 0)) throw new Error('Enter valid shares and buy price.');
      await addHolding({ user, ticker, shares, buyPrice });
      setShares(''); setBuyPrice(''); refresh();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  const del = async (id) => { await removeHolding(id); refresh(); };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="muted" className="mb-3">Track without risk</Badge>
      <h1 className="font-serif text-4xl font-bold">Virtual Portfolio</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Add positions at your entry price and watch live profit/loss against the latest Tadawul prices. Paper only — no real money.
      </p>

      {!user ? (
        <Card className="mt-6"><CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Briefcase className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">Sign in to build and save your virtual portfolio.</p>
          <Button variant="accent" onClick={openAuth}>Sign in</Button>
        </CardContent></Card>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={money(totals.value, 'SAR')} label="Market value" />
            <Stat value={money(totals.cost, 'SAR')} label="Cost basis" />
            <Stat value={`${totals.pl >= 0 ? '+' : ''}${money(totals.pl, 'SAR')}`} label="Unrealised P/L" accent={totals.pl >= 0 ? 'text-success' : 'text-destructive'} />
            <Stat value={pct(totals.plPct)} label="Return" accent={totals.plPct >= 0 ? 'text-success' : 'text-destructive'} />
          </div>

          {/* Add form */}
          <Card className="mt-6"><CardContent>
            <h2 className="font-serif text-lg font-bold">Add a holding</h2>
            <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Stock</label>
                <select value={ticker} onChange={(e) => setTicker(e.target.value)} className="mt-1 w-full">
                  {STOCKS.map((s) => <option key={s.ticker} value={s.ticker}>{s.ticker} · {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Shares</label>
                <input type="number" step="1" value={shares} onChange={(e) => setShares(e.target.value)} placeholder="100" className="mt-1 w-28" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Buy price</label>
                <input type="number" step="0.01" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} placeholder={String(getStock(ticker)?.price ?? '')} className="mt-1 w-28" />
              </div>
              <Button type="submit" variant="accent" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Add</>}
              </Button>
            </form>
            {err && <div className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</div>}
          </CardContent></Card>

          {/* Holdings */}
          <Card className="mt-5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                    <th className="px-4 py-2.5 text-left font-medium">Stock</th>
                    <th className="px-4 py-2.5 text-right font-medium">Shares</th>
                    <th className="px-4 py-2.5 text-right font-medium">Buy</th>
                    <th className="px-4 py-2.5 text-right font-medium">Last</th>
                    <th className="px-4 py-2.5 text-right font-medium">Value</th>
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
              {enriched.length === 0 && <div className="py-10 text-center text-muted-foreground">No holdings yet — add your first position above.</div>}
            </div>
          </Card>
        </>
      )}
      <p className="mt-6 text-xs text-muted-foreground">Paper-trading tool for tracking only. Prices are delayed/sample. Not investment advice.</p>
    </div>
  );
}
