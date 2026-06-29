import React, { useMemo } from 'react';
import { Activity, TrendingUp, TrendingDown, Gauge, Flame, Droplets } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui.jsx';
import JargonTip from '@/components/JargonTip.jsx';
import { STOCKS } from '@/data/stocks.js';
import { cn } from '@/lib/utils.js';

const clamp = (v) => Math.max(0, Math.min(100, v));
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

function zone(v) {
  if (v >= 75) return { label: 'Extreme Greed', color: 'text-destructive', bg: 'bg-destructive' };
  if (v >= 55) return { label: 'Greed', color: 'text-medal-bronze', bg: 'bg-medal-bronze' };
  if (v >= 45) return { label: 'Neutral', color: 'text-primary', bg: 'bg-primary' };
  if (v >= 25) return { label: 'Fear', color: 'text-ai-navy', bg: 'bg-ai-navy' };
  return { label: 'Extreme Fear', color: 'text-success', bg: 'bg-success' };
}

export default function FearGreedPage() {
  const { index, components } = useMemo(() => {
    const breadth = (STOCKS.filter((s) => s.change > 0).length / STOCKS.length) * 100;

    // Valuation: market trading above fair value = greed. avg discount<0 => greed.
    const valuation = clamp(50 - avg(STOCKS.map((s) => s.discount)) * 2.5);

    // Money flow: avg net flow where licensed data exists; +ve => greed.
    const flows = STOCKS.map((s) => s.netFlowPct).filter((v) => v != null);
    const moneyFlow = flows.length ? clamp(50 + avg(flows) * 1.5) : null;

    // Lottery/attention (MAX): higher sigma => more greed/speculation.
    const maxes = STOCKS.map((s) => s.maxScore).filter((v) => v != null);
    const attention = maxes.length ? clamp(avg(maxes) * 18) : clamp(avg(STOCKS.map((s) => (s.rumor === 'danger' ? 90 : s.rumor === 'high' ? 70 : s.rumor === 'medium' ? 50 : 25))));

    // Foreign demand: net foreign inflow share => greed.
    const inflow = STOCKS.filter((s) => s.foreignFlow === 'in').length;
    const outflow = STOCKS.filter((s) => s.foreignFlow === 'out').length;
    const demand = clamp(50 + ((inflow - outflow) / STOCKS.length) * 120);

    const comps = [
      { key: 'breadth', label: 'Market breadth', icon: Activity, value: clamp(breadth), desc: '% of names up today.' },
      { key: 'valuation', label: 'Valuation', icon: Gauge, value: valuation, desc: 'Price vs USD-native fair value across the board.' },
      ...(moneyFlow != null ? [{ key: 'flow', label: 'Money flow', icon: Droplets, value: moneyFlow, desc: 'SAHMK net buy/sell pressure on liquid names.' }] : []),
      { key: 'attention', label: 'Speculative attention', icon: Flame, value: attention, desc: 'MAX/lottery & rumor heat — high = euphoria.' },
      { key: 'demand', label: 'Foreign demand', icon: TrendingUp, value: demand, desc: 'Net foreign inflow vs outflow.' },
    ];
    return { index: Math.round(avg(comps.map((c) => c.value))), components: comps };
  }, []);

  const z = zone(index);
  const angle = -90 + (index / 100) * 180;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl font-bold">Fear &amp; Greed</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        A composite read on TASI sentiment — built from market breadth, valuation, money flow, speculative attention and foreign demand.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {/* Gauge */}
        <Card>
          <CardContent className="flex flex-col items-center">
            <svg viewBox="0 0 200 120" className="w-full max-w-sm">
              {[
                { a0: -90, a1: -54, c: 'hsl(var(--success))' },
                { a0: -54, a1: -18, c: 'hsl(var(--ai-navy))' },
                { a0: -18, a1: 18, c: 'hsl(var(--primary))' },
                { a0: 18, a1: 54, c: 'hsl(var(--medal-bronze))' },
                { a0: 54, a1: 90, c: 'hsl(var(--destructive))' },
              ].map((seg, i) => {
                const r = 80, cx = 100, cy = 100;
                const p = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
                const [x0, y0] = p(seg.a0 - 90), [x1, y1] = p(seg.a1 - 90);
                return <path key={i} d={`M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`} stroke={seg.c} strokeWidth="14" fill="none" strokeLinecap="butt" />;
              })}
              <line x1="100" y1="100" x2={100 + 62 * Math.cos((angle * Math.PI) / 180)} y2={100 + 62 * Math.sin((angle * Math.PI) / 180)}
                stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" />
              <circle cx="100" cy="100" r="6" fill="hsl(var(--foreground))" />
            </svg>
            <div className="-mt-2 text-center">
              <div className={cn('font-serif text-5xl font-bold', z.color)}>{index}</div>
              <div className={cn('mt-1 text-lg font-semibold', z.color)}>{z.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">0 = extreme fear · 100 = extreme greed</div>
            </div>
          </CardContent>
        </Card>

        {/* Components */}
        <Card>
          <CardContent>
            <h2 className="font-serif text-xl font-bold">What's driving it</h2>
            <div className="mt-4 space-y-4">
              {components.map((c) => {
                const cz = zone(c.value);
                const Icon = c.icon;
                return (
                  <div key={c.key}>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-sm font-medium"><Icon className={cn('h-4 w-4', cz.color)} /> {c.label}</span>
                      <span className={cn('text-sm font-bold', cz.color)}>{Math.round(c.value)}</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={cn('h-full rounded-full', cz.bg)} style={{ width: `${c.value}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Contrarian read: extreme fear has historically marked better entry points, extreme greed worse ones — but it is a
        statistical tendency, not a timing signal. Informational only, not investment advice.
      </p>
    </div>
  );
}
