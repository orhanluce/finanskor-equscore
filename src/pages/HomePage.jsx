import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, Star, Trophy, Search, Activity, Brain, Eye, Scale,
} from 'lucide-react';
import WebGLHero from '@/components/WebGLHero.jsx';
import StockCard from '@/components/StockCard.jsx';
import MacroStrip from '@/components/MacroStrip.jsx';
import MarketPulse from '@/components/MarketPulse.jsx';
import SectorMomentum from '@/components/SectorMomentum.jsx';
import EvidenceCorner from '@/components/EvidenceCorner.jsx';
import { Button, Badge, Stat } from '@/components/ui.jsx';
import { STOCKS, COUNTRY } from '@/data/stocks.js';
import { LEADERBOARD } from '@/data/community.js';

const QUICK = [
  { to: '/sharia', icon: ShieldCheck, title: 'Sharia Screen', desc: 'AAOIFI-style halal / doubtful / non-compliant gate.' },
  { to: '/market', icon: Search, title: 'Find a Stock', desc: 'Every Tadawul name with its Equity Star.' },
  { to: '/leaderboard', icon: Trophy, title: 'Leaderboard', desc: 'Which analyst actually delivers?' },
];

const MODULES = [
  { icon: Star, title: 'Equity Star (7 dimensions)', body: 'Value · Growth · Quality · Health · Dividend + analyst Consensus ★ and Money-Flow ★ — one visual score out of 42.' },
  { icon: ShieldCheck, title: 'Sharia Compliance', body: 'AAOIFI Standard No. 21: business-activity screen plus the three financial ratios, with a purification estimate. The Gulf-native lens.', accent: true },
  { icon: Scale, title: 'USD-native Fair Value', body: 'A discount/premium read in a single number. No inflation gymnastics needed — the riyal is pegged to the dollar.' },
  { icon: Trophy, title: 'Analyst Accountability', body: 'Every forecast is time-stamped and locked, then graded against realised price. Who is right, in which sector?' },
  { icon: Activity, title: 'Smart-Money Flow', body: 'Foreign and institutional ownership flow, distilled into one ★ signal — now that Tadawul is open to all foreign investors.' },
  { icon: Eye, title: 'Rumor Thermometer', body: 'Volume + tone of social chatter per stock: low → danger. We turn the WhatsApp tip into a measurable signal.' },
];

export default function HomePage() {
  const top = [...STOCKS].sort((a, b) => b.total - a.total).slice(0, 6);
  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-background pt-12 pb-28">
        <div className="absolute inset-0 z-0">
          <WebGLHero className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/30 via-background/75 to-background" />
        </div>
        <div className="relative z-20 mx-auto w-full max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Badge variant="primary" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest">
              The accountability & trust layer for Gulf markets
            </Badge>
            <h1 className="font-serif text-5xl font-bold leading-[1.08] text-foreground md:text-7xl" style={{ letterSpacing: '-0.02em' }}>
              Not hype.<br />
              <span className="italic text-primary">Track record.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/70 md:text-2xl">
              Who said it, did it work, {COUNTRY.modules.sharia ? <>is it <span className="text-sharia font-semibold">Sharia-compliant</span>, </> : ''}
              and where is the money flowing? Score every {COUNTRY.exchange} stock in a single glance.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button as={Link} to="/market" variant="primary" className="h-14 px-8 text-lg">
                Explore {COUNTRY.short} <ArrowRight className="h-5 w-5" />
              </Button>
              <Button as={Link} to="/methodology" variant="outline" className="h-14 px-8 text-lg">
                How it works
              </Button>
            </div>

            <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              {QUICK.map((c) => (
                <Link key={c.to} to={c.to}
                  className="group flex flex-col items-start gap-1.5 rounded-2xl border border-border bg-card/70 p-4 text-left backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-card">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <span className="font-serif font-bold">{c.title}</span>
                  <span className="text-sm text-muted-foreground">{c.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
          <Stat value={`${STOCKS.length}`} label={`${COUNTRY.exchange} names scored`} accent="text-primary" />
          <Stat value="7" label="Equity Star dimensions" accent="text-foreground" />
          {COUNTRY.modules.sharia
            ? <Stat value="AAOIFI" label="Sharia screen standard" accent="text-sharia" />
            : <Stat value={COUNTRY.indexName} label="Benchmark index" accent="text-sharia" />}
          {COUNTRY.modules.currencyRisk
            ? <Stat value="FX-aware" label="Inflation & EGP lens" accent="text-teal" />
            : <Stat value="USD-peg" label="No inflation lens needed" accent="text-teal" />}
        </div>
      </section>

      {/* MARKET TODAY — live dashboard */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Badge variant="muted" className="mb-3">Market today</Badge>
          <h2 className="font-serif text-3xl font-bold md:text-4xl">The whole board, at a glance.</h2>
        </div>
        <div className="mt-6"><MacroStrip /></div>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <MarketPulse />
          <SectorMomentum />
          <EvidenceCorner />
        </div>
      </section>

      {/* MODULES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Badge variant="muted" className="mb-3">What you get</Badge>
          <h2 className="font-serif text-3xl font-bold md:text-4xl">One screen, the whole story of a stock.</h2>
          <p className="mt-3 text-muted-foreground">
            The same engine that powers our Turkish platform — re-pointed at the Gulf, with a Sharia lens
            replacing the real-return lens that low inflation and the dollar peg make redundant here.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <div key={m.title}
              className={`rounded-2xl border p-6 ${m.accent ? 'border-sharia/30 bg-sharia/5' : 'border-border bg-card'}`}>
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${m.accent ? 'bg-sharia/15 text-sharia' : 'bg-primary/10 text-primary'}`}>
                <m.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-serif text-lg font-bold">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MARKET PREVIEW */}
      <section className="bg-card/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <Badge variant="muted" className="mb-3">Top of the market</Badge>
              <h2 className="font-serif text-3xl font-bold md:text-4xl">Highest Equity Stars on {COUNTRY.exchange}</h2>
            </div>
            <Button as={Link} to="/market" variant="outline" className="hidden sm:inline-flex">
              All stocks <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((s) => <StockCard key={s.ticker} s={s} />)}
          </div>
        </div>
      </section>

      {/* LEADERBOARD TEASER */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Badge variant="muted" className="mb-3">Accountability</Badge>
            <h2 className="font-serif text-3xl font-bold md:text-4xl">Score the analysts, not just the stocks.</h2>
            <p className="mt-3 text-muted-foreground">
              Every prediction is locked with a server-side timestamp and graded against realised price.
              Analysts, the crowd and AI models compete in the same arena — no back-dating, no cherry-picking.
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Brain className="h-4 w-4 text-ai-navy" /> Analysts · crowd · AI in one league
            </div>
            <Button as={Link} to="/leaderboard" variant="accent" className="mt-6">
              See the leaderboard <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="rounded-2xl border border-border bg-card p-2">
            {LEADERBOARD.slice(0, 5).map((r) => (
              <div key={r.rank} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40">
                <span className="w-6 text-center font-serif font-bold text-muted-foreground">{r.rank}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.type} · {r.predictions} calls</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-success">{r.hitRate}%</div>
                  <div className="text-[11px] text-muted-foreground">hit rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COVERAGE / CTA */}
      <section className="surface-dark bg-foreground py-16 text-background">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-bold md:text-4xl">One engine. Every market you enter.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-background/70">
            The same Equity Star, Decision Mirror and Rumor Thermometer — re-pointed at each market, with the
            local lenses each one needs. We detect your country and open its exchange automatically.
          </p>
          <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-3">
            <span className="rounded-full border border-background/20 bg-background/5 px-4 py-2 text-sm">🇸🇦 Tadawul — live</span>
            <span className="rounded-full border border-background/20 bg-background/5 px-4 py-2 text-sm">🇦🇪 DFM / ADX — live</span>
            <span className="rounded-full border border-background/20 px-4 py-2 text-sm text-background/60">🇪🇬 EGX — rolling out</span>
          </div>
        </div>
      </section>
    </>
  );
}
