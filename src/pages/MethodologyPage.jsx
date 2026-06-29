import React from 'react';
import { Star, ShieldCheck, Scale, Database, Map, Languages } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui.jsx';
import { STAR_DIMS } from '@/data/stocks.js';

const PHASES = [
  { p: 'Phase 0', t: 'Foundation', d: 'Vendor PoC (EODHD / Twelve Data / Masadir), multi-market schema, toggle off the real-return lens, USD-native fair value.' },
  { p: 'Phase 1', t: 'Tadawul MVP', d: 'TASI + Nomu, EOD ingestion, Equity Star (re-calibrated), Sharia screen, Efsah Flash, Argaam analyst feed, contest & virtual portfolio.' },
  { p: 'Phase 2', t: 'UAE — DFM / ADX', d: 'Same engine, add data sources and disclosure portals; two exchanges under one UAE view.' },
  { p: 'Phase 3', t: 'Qatar — QSE', d: 'Smallest and fastest; the engine is mature by now.' },
];

const SOURCES = [
  ['Price + fundamentals (live now, FREE)', 'Yahoo Finance via yfinance (.SR tickers) — delayed/EOD, no key. Powers this prototype today.'],
  ['Price / EOD (paid upgrade)', 'EODHD · Twelve Data Pro (XSAU) · Masadir (4 GCC) · Tadawul official · tasi (R)'],
  ['Fundamentals', 'EODHD fundamentals · Argaam · Mubasher · Efsah filings (EN)'],
  ['Disclosures', 'Efsah (KSA, AR+EN) · DFM / ADX / QSE portals'],
  ['Analyst estimates', 'Argaam (recommendations + estimates) · Mubasher'],
  ['Foreign flow', 'Exchange foreign-ownership reports (QFI removed Feb 2026)'],
  ['Sharia ratios', 'Computed from fundamentals · IdealRatings / Islamicly for validation'],
];

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="muted" className="mb-3">Methodology & roadmap</Badge>
      <h1 className="font-serif text-4xl font-bold">How EquScore works</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        EquScore's scoring engine is purpose-built for Gulf &amp; MENA markets. Each market keeps the same core
        method — what differs is the data sources, the local lenses, and (in the Gulf) the swap of the real-return
        lens for a Sharia lens.
      </p>

      {/* Equity Star */}
      <section className="mt-10">
        <div className="flex items-center gap-2"><Star className="h-5 w-5 text-primary" /><h2 className="font-serif text-2xl font-bold">Equity Star — 7 dimensions, out of 42</h2></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STAR_DIMS.map((d) => (
            <Card key={d.key}><CardContent className="p-4">
              <div className="font-serif font-bold">{d.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">{d.hint}</div>
            </CardContent></Card>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Fundamental weights are set by a genetic algorithm; for each market they are
          <span className="font-semibold text-foreground"> re-trained on MENA data</span> — the model ports, the weights do not.
        </p>
      </section>

      {/* Two key adaptations */}
      <section className="mt-12 grid gap-5 md:grid-cols-2">
        <Card className="border-sharia/30 bg-sharia/5"><CardContent>
          <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-sharia" /><h3 className="font-serif text-lg font-bold">Sharia replaces the real-return lens</h3></div>
          <p className="mt-2 text-sm text-muted-foreground">
            An inflation-adjusted real-return lens is redundant in the pegged Gulf markets (~2% inflation,
            USD peg). We retire it there (it stays as an optional multi-currency toggle) and make AAOIFI Sharia
            screening the core differentiator instead.
          </p>
        </CardContent></Card>
        <Card><CardContent>
          <div className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" /><h3 className="font-serif text-lg font-bold">USD-native valuation</h3></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Because SAR/AED/QAR are hard-pegged to the dollar, fair value is computed directly in a stable
            currency — clean, with no FX gymnastics.
          </p>
        </CardContent></Card>
      </section>

      {/* Data sources */}
      <section className="mt-12">
        <div className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" /><h2 className="font-serif text-2xl font-bold">Data sources (delayed / EOD)</h2></div>
        <p className="mt-1 text-sm text-muted-foreground">No live feed required. There is no free borsapy-style source for the Gulf, so a paid EOD vendor is the one new cost line.</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <tbody>
              {SOURCES.map(([k, v], i) => (
                <tr key={k} className={i % 2 ? 'bg-muted/20' : ''}>
                  <td className="w-40 px-4 py-3 font-semibold align-top">{k}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Roadmap */}
      <section className="mt-12">
        <div className="flex items-center gap-2"><Map className="h-5 w-5 text-primary" /><h2 className="font-serif text-2xl font-bold">Roadmap — Saudi first</h2></div>
        <div className="mt-4 space-y-3">
          {PHASES.map((ph) => (
            <div key={ph.p} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
              <div className="w-20 shrink-0 font-serif font-bold text-primary">{ph.p}</div>
              <div>
                <div className="font-semibold">{ph.t}</div>
                <div className="text-sm text-muted-foreground">{ph.d}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <Languages className="h-4 w-4" /> Cross-cutting: English-first now, Arabic / RTL next; Zakat helper; expat multi-currency lens.
        </div>
      </section>

      <p className="mt-10 text-xs text-muted-foreground">
        This prototype runs on <span className="font-semibold text-foreground">free, real (delayed) Tadawul data
        from Yahoo Finance</span> — live prices, fundamentals and a computed Equity Star, no API key. Deeper layers
        (full AAOIFI cash/impure ratios, an analyst-accountability feed, foreign-flow) upgrade to paid sources later.
      </p>
    </div>
  );
}
