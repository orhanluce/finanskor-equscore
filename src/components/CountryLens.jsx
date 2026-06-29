import React from 'react';
import { Coins, Banknote, AlertTriangle, Globe2, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui.jsx';
import JargonTip from '@/components/JargonTip.jsx';
import { COUNTRY } from '@/data/stocks.js';
import { EG_INFLATION } from '@/data/markets/eg.sample.js';
import { cn } from '@/lib/utils.js';

// Country-specific, per-stock insight cards. Each is gated by a country module flag,
// so the same component lights up the right lenses for UAE vs Egypt vs Saudi.
export default function CountryLens({ stock: s }) {
  const m = COUNTRY.modules;
  const cards = [];

  // ── Egypt: EGP currency-risk / hard-currency hedge ──
  if (m.currencyRisk && s.usdRevPct != null) {
    const usd = s.usdRevPct;
    const imp = s.importDep || 'med';
    const score = Math.max(0, Math.min(100, usd - (imp === 'high' ? 30 : imp === 'med' ? 12 : 0)));
    const verdict = score >= 60 ? { label: 'Devaluation winner', color: 'text-success', icon: TrendingUp }
      : score <= 20 ? { label: 'Devaluation exposed', color: 'text-destructive', icon: TrendingDown }
      : { label: 'Mixed FX exposure', color: 'text-medal-bronze', icon: RefreshCw };
    const V = verdict.icon;
    cards.push(
      <Card key="fx">
        <CardContent>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-medal-bronze" />
            <h2 className="font-serif text-xl font-bold"><JargonTip term="Currency risk" description="How a weaker Egyptian pound (EGP) would hit this company: hard-currency revenue cushions it; heavy imports hurt.">EGP Currency Risk</JargonTip></h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">The EGP floats — hard-currency revenue is a natural hedge, imports are a cost risk.</p>
          <div className="mt-4 flex items-center gap-3">
            <span className={cn('inline-flex h-11 w-11 items-center justify-center rounded-xl bg-muted', verdict.color)}><V className="h-6 w-6" /></span>
            <div>
              <div className={cn('font-serif text-xl font-bold', verdict.color)}>{verdict.label}</div>
              <div className="text-xs text-muted-foreground">USD revenue {usd}% · import dependence {imp}</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Bar label="Hard-currency revenue" value={usd} good />
            <Bar label="Import cost exposure" value={imp === 'high' ? 80 : imp === 'med' ? 45 : 15} good={false} />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Egypt: real vs nominal growth (inflation lens) ──
  if (m.inflationAdj && s.nominalGrowth != null) {
    const real = +(s.nominalGrowth - EG_INFLATION).toFixed(1);
    cards.push(
      <Card key="real">
        <CardContent>
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-ai-navy" />
            <h2 className="font-serif text-xl font-bold">Real vs Nominal Growth</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Headline growth is inflated by ~{EG_INFLATION}% inflation. Real growth is what compounds wealth.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border p-3">
              <div className="text-xs text-muted-foreground">Nominal</div>
              <div className="font-serif text-2xl font-bold">{s.nominalGrowth}%</div>
            </div>
            <div className="rounded-xl border border-border p-3">
              <div className="text-xs text-muted-foreground">Real (inflation-adj.)</div>
              <div className={cn('font-serif text-2xl font-bold', real >= 0 ? 'text-success' : 'text-destructive')}>{real >= 0 ? '+' : ''}{real}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Egypt: index-concentration warning (CIB ≈ 1/3 of EGX30) ──
  if (m.concentrationWarn && s.concentration) {
    cards.push(
      <Card key="conc" className="border-medal-bronze/30 bg-medal-bronze/5">
        <CardContent>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-medal-bronze" />
            <h2 className="font-serif text-xl font-bold">Index Concentration</h2>
          </div>
          <p className="mt-3 text-sm text-foreground/80">
            This name alone is roughly a third of the {COUNTRY.indexName}. Index funds and foreign flows are
            heavily exposed to it — a single-stock concentration risk for the whole market.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── UAE: zero-tax + expat / global comparison ──
  if (m.expatCompare) {
    cards.push(
      <Card key="expat">
        <CardContent>
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-teal" />
            <h2 className="font-serif text-xl font-bold">Net-of-Tax Yield</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">UAE has zero capital-gains and zero dividend tax — gross yield is net yield.</p>
          <div className="mt-4 flex items-end gap-3">
            <div>
              <div className="font-serif text-3xl font-bold text-teal">{s.divYield ? `${s.divYield}%` : '—'}</div>
              <div className="text-xs text-muted-foreground">dividend you actually keep</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            For an income-focused investor comparing against a ~1.3% S&P 500 yield, a tax-free {s.divYield || 0}% is a meaningful pickup.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Contrarian note (UAE + Egypt): momentum is weak, big moves mean-revert ──
  if (m.contrarian && Math.abs(s.change) >= 2) {
    const up = s.change > 0;
    cards.push(
      <Card key="contra">
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl font-bold">Short-Term Contrarian</h2>
          </div>
          <p className="mt-3 text-sm text-foreground/80">
            {COUNTRY.short} markets show little momentum but strong short-term <JargonTip term="z-score" description="A statistically large one-day move that tends to partly reverse over the next few sessions.">over-reaction</JargonTip>.
            Today&apos;s {up ? 'sharp rise' : 'sharp drop'} ({s.change > 0 ? '+' : ''}{s.change}%) {up ? 'may fade' : 'has historically tended to bounce'} —
            classic 12-1 momentum does not work here.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!cards.length) return null;
  return <>{cards}</>;
}

function Bar({ label, value, good }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground"><span>{label}</span><span>{value}%</span></div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', good ? 'bg-success' : 'bg-destructive')} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
