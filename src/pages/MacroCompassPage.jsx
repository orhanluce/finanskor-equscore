import React, { useMemo, useState } from 'react';
import { Compass, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui.jsx';
import { COUNTRY } from '@/data/stocks.js';
import { cn } from '@/lib/utils.js';
import { t } from '@/i18n.js';

// Curated macro→sector sensitivity map per market. Drivers carry a current
// traffic-light status (illustrative, in line with the MacroStrip snapshot);
// `sectors` is the sign + strength (−1..+1) of each driver on each sector.
// Built from the same correlation basis as CountryLens.
const COMPASS = {
  SA: {
    drivers: [
      { key: 'brent', label: 'Brent Crude', value: '$78', status: 'bad', note: 'Soft oil weighs on energy & the budget.',
        sectors: { Energy: 0.85, Materials: 0.5, Banking: 0.2, Telecom: 0, 'Consumer Staples': -0.1, Retail: -0.1 } },
      { key: 'sama', label: 'SAMA Repo', value: '5.50%', status: 'neutral', note: 'High rates: good for bank margins, heavy for real estate.',
        sectors: { Banking: 0.35, 'Real Estate': -0.4, Retail: -0.2, Utilities: -0.15 } },
      { key: 'pmi', label: 'Saudi PMI', value: '56.8', status: 'good', note: 'Expansion (>50) supports consumer & industry.',
        sectors: { Retail: 0.4, 'Consumer Staples': 0.35, Materials: 0.2, Banking: 0.15 } },
      { key: 'qfi', label: 'Foreign Flow', value: 'Inflow', status: 'good', note: 'Net foreign buying validates large caps.',
        sectors: { Banking: 0.3, Energy: 0.25, Telecom: 0.2, Materials: 0.2 } },
      { key: 'v2030', label: 'Vision 2030', value: 'Active', status: 'good', note: 'Diversification spend lifts non-oil sectors.',
        sectors: { Technology: 0.5, Retail: 0.4, 'Health Care': 0.4, Utilities: 0.3 } },
    ],
  },
  AE: {
    drivers: [
      { key: 'dld', label: 'Dubai Real Estate', value: '+31% YoY', status: 'good', note: 'DLD transaction boom drives the DFM.',
        sectors: { 'Real Estate': 0.7, Banking: 0.3, Investment: 0.25, Consumer: 0.15 } },
      { key: 'eibor', label: 'EIBOR 3M', value: '4.35%', status: 'neutral', note: 'Elevated rates: bank margins up, property financing costlier.',
        sectors: { Banking: 0.3, 'Real Estate': -0.35, Investment: -0.15 } },
      { key: 'brent', label: 'Brent Crude', value: '$78', status: 'neutral', note: 'Matters for ADX energy, lighter for Dubai.',
        sectors: { Energy: 0.5, Banking: 0.1, Investment: 0.1 } },
      { key: 'tourism', label: 'Tourism', value: 'Strong', status: 'good', note: 'Record arrivals lift consumer & transport.',
        sectors: { Consumer: 0.5, Transport: 0.45, 'Real Estate': 0.2 } },
    ],
  },
  EG: {
    drivers: [
      { key: 'egp', label: 'USD/EGP', value: '48.3', status: 'bad', note: 'Weak pound: exporters win, importers squeezed.',
        sectors: { Materials: 0.4, Industrials: 0.3, 'Consumer Staples': -0.35, 'Real Estate': -0.2 } },
      { key: 'cbe', label: 'CBE Rate', value: '19.0%', status: 'neutral', note: 'Very high rates: wide bank margins, costly credit.',
        sectors: { Banking: 0.45, Financials: 0.3, 'Real Estate': -0.4, Industrials: -0.2 } },
      { key: 'inflation', label: 'Inflation', value: '14.9%', status: 'bad', note: 'Erodes real value; defensives hold up better.',
        sectors: { 'Consumer Staples': -0.4, 'Health Care': -0.1, Materials: 0.1 } },
      { key: 'suez', label: 'Suez Revenue', value: 'Recovering', status: 'neutral', note: 'Canal traffic drives logistics names.',
        sectors: { Logistics: 0.5, Industrials: 0.2 } },
    ],
  },
};

const STATUS_META = {
  good: { dot: 'bg-success', text: 'text-success', icon: TrendingUp, label: 'Tailwind' },
  neutral: { dot: 'bg-medal-bronze', text: 'text-medal-bronze', icon: Minus, label: 'Mixed' },
  bad: { dot: 'bg-destructive', text: 'text-destructive', icon: TrendingDown, label: 'Headwind' },
};
const dir = (status) => (status === 'good' ? 1 : status === 'bad' ? -1 : 0);

function cellColor(v) {
  if (v >= 0.5) return 'bg-success/80 text-white';
  if (v >= 0.2) return 'bg-success/30';
  if (v > 0) return 'bg-success/10';
  if (v === 0) return 'bg-muted/40';
  if (v > -0.2) return 'bg-destructive/10';
  if (v > -0.5) return 'bg-destructive/30';
  return 'bg-destructive/80 text-white';
}

export default function MacroCompassPage() {
  const cfg = COMPASS[COUNTRY.id] || COMPASS.SA;
  const drivers = cfg.drivers;
  const [active, setActive] = useState(null);

  // Sectors that appear in any driver's sensitivity map.
  const sectors = useMemo(() => {
    const set = new Set();
    drivers.forEach((d) => Object.keys(d.sectors).forEach((s) => set.add(s)));
    return [...set];
  }, [drivers]);

  // Net read: combine each driver's current direction × its sensitivity.
  const sectorScores = useMemo(() => {
    const scores = sectors.map((sec) => {
      let v = 0;
      drivers.forEach((d) => { v += dir(d.status) * (d.sectors[sec] || 0); });
      return { sector: sec, score: v };
    });
    return scores.sort((a, b) => b.score - a.score);
  }, [drivers, sectors]);

  const favored = sectorScores.filter((s) => s.score > 0.15).slice(0, 4);
  const pressured = sectorScores.filter((s) => s.score < -0.15).slice(-4).reverse();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3"><Compass className="h-3.5 w-3.5" /> {t('Macro Compass')}</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Macro Compass')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t('Which macro forces are blowing for or against each sector on')} {COUNTRY.exchange}{t('. Read the drivers, then the sector grid.')}
      </p>

      {/* Driver traffic lights */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {drivers.map((d) => {
          const m = STATUS_META[d.status];
          const Icon = m.icon;
          return (
            <button key={d.key} onClick={() => setActive(active === d.key ? null : d.key)}
              className={cn('rounded-2xl border p-4 text-left transition-colors',
                active === d.key ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40')}>
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold">{t(d.label)}</span>
                <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', m.text)}>
                  <Icon className="h-3.5 w-3.5" /> {t(m.label)}
                </span>
              </div>
              <div className="mt-1 font-mono text-lg font-bold">{d.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{t(d.note)}</p>
            </button>
          );
        })}
      </div>

      {/* Current read */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="border-success/30 bg-success/5"><CardContent>
          <div className="flex items-center gap-2 text-success"><TrendingUp className="h-5 w-5" /><h2 className="font-serif text-lg font-bold">{t('Favoured now')}</h2></div>
          <div className="mt-3 flex flex-wrap gap-2">
            {favored.length ? favored.map((s) => (
              <span key={s.sector} className="rounded-full bg-success/15 px-3 py-1 text-sm font-medium text-success">{t(s.sector)}</span>
            )) : <span className="text-sm text-muted-foreground">{t('No clear tailwind right now.')}</span>}
          </div>
        </CardContent></Card>
        <Card className="border-destructive/30 bg-destructive/5"><CardContent>
          <div className="flex items-center gap-2 text-destructive"><TrendingDown className="h-5 w-5" /><h2 className="font-serif text-lg font-bold">{t('Under pressure')}</h2></div>
          <div className="mt-3 flex flex-wrap gap-2">
            {pressured.length ? pressured.map((s) => (
              <span key={s.sector} className="rounded-full bg-destructive/15 px-3 py-1 text-sm font-medium text-destructive">{t(s.sector)}</span>
            )) : <span className="text-sm text-muted-foreground">{t('No clear headwind right now.')}</span>}
          </div>
        </CardContent></Card>
      </div>

      {/* Impact grid */}
      <h2 className="mt-10 font-serif text-2xl font-bold">{t('Driver → sector impact')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('Green = a rise in the driver helps the sector; red = it hurts. Intensity = strength.')}</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground">
              <th className="px-3 py-2.5 text-left font-medium sticky left-0 bg-muted/40">{t('Driver')}</th>
              {sectors.map((sec) => (
                <th key={sec} className="px-2 py-2.5 text-center font-medium whitespace-nowrap">{t(sec)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.key} className={cn('border-b border-border last:border-0', active && active !== d.key && 'opacity-40')}>
                <td className="px-3 py-2.5 font-medium whitespace-nowrap sticky left-0 bg-card">{t(d.label)}</td>
                {sectors.map((sec) => {
                  const v = d.sectors[sec] || 0;
                  return (
                    <td key={sec} className="px-1 py-1 text-center">
                      <span className={cn('inline-flex h-8 w-full min-w-[44px] items-center justify-center rounded-md text-xs font-mono font-semibold', cellColor(v))}>
                        {v === 0 ? '·' : `${v > 0 ? '+' : ''}${v.toFixed(2)}`}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {t('Curated sensitivities for guidance, not live regression output. Informational only, not investment advice.')}
      </p>
    </div>
  );
}
