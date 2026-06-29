import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, ShieldCheck, ShieldAlert, ShieldX,
  Users, Activity, Flame, Newspaper,
} from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui.jsx';
import { ScorePill, ShariaBadge } from '@/components/equity.jsx';
import EquityStarFull from '@/components/EquityStarFull.jsx';
import NEWS from '@/data/news_live.json';
import { getStock } from '@/data/stocks.js';
import { cn, money, pct } from '@/lib/utils.js';

const RUMOR = {
  low: { label: 'Low', color: 'text-success', bg: 'bg-success/10', w: '25%' },
  medium: { label: 'Medium', color: 'text-primary', bg: 'bg-primary/10', w: '50%' },
  high: { label: 'High', color: 'text-medal-bronze', bg: 'bg-medal-bronze/10', w: '75%' },
  danger: { label: 'Dangerous', color: 'text-destructive', bg: 'bg-destructive/10', w: '100%' },
};

function ShariaRatio({ label, value, threshold }) {
  const na = value == null;
  const pass = !na && value <= threshold;
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold">{na ? 'n/a' : `${value}%`}</span>
        <span className="text-[11px] text-muted-foreground">/ {threshold}%</span>
        <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold',
          na ? 'bg-muted text-muted-foreground' : pass ? 'bg-sharia/15 text-sharia' : 'bg-destructive/15 text-destructive')}>
          {na ? '—' : pass ? '✓' : '✕'}
        </span>
      </div>
    </div>
  );
}

export default function StockDetailPage() {
  const { ticker } = useParams();
  const s = getStock(ticker);

  if (!s) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-bold">Stock not found</h1>
        <Link to="/market" className="mt-4 inline-block text-primary">← Back to market</Link>
      </div>
    );
  }

  const up = s.change >= 0;
  const news = NEWS[s.ticker];
  const a = s.analysts;
  const upside = a.target && s.price ? (a.target / s.price - 1) * 100 : null;
  const FlowIcon = s.foreignFlow === 'in' ? TrendingUp : s.foreignFlow === 'out' ? TrendingDown : Minus;
  const flowText = s.foreignFlow === 'in' ? 'Net foreign inflow' : s.foreignFlow === 'out' ? 'Net foreign outflow' : 'Flat foreign flow';
  const r = RUMOR[s.rumor];
  const purify = s.sharia !== 'non-compliant' ? s.shariaRatios.impureIncome : s.shariaRatios.impureIncome;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/market" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Market
      </Link>

      {/* header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-primary">{s.ticker}</span>
            <Badge variant="muted">{s.sector}</Badge>
            {s.nomu && <Badge variant="muted" className="text-medal-bronze border-medal-bronze/30 bg-medal-bronze/10">NOMU · parallel market</Badge>}
            <ShariaBadge status={s.sharia} />
          </div>
          <h1 className="mt-1 font-serif text-4xl font-bold">{s.name}</h1>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-mono text-2xl font-bold">{money(s.price, s.currency)}</span>
            <span className={cn('text-sm font-semibold', up ? 'text-success' : 'text-destructive')}>{pct(s.change)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Equity Star</div>
          <ScorePill total={s.total} size="lg" />
        </div>
      </div>

      <p className="mt-4 max-w-3xl text-muted-foreground">{s.about}</p>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {/* Interactive Equity Star + Intelligence Cube (full width) */}
        <div className="lg:col-span-3">
          <EquityStarFull stock={s} />
        </div>

        {/* Fair value */}
        <Card>
          <CardContent>
            <h2 className="font-serif text-xl font-bold">Fair Value</h2>
            <p className="mt-1 text-xs text-muted-foreground">Sector-relative multiples (P/E reversion + analyst), USD-native — riyal is pegged.</p>
            <div className="mt-4 space-y-3">
              <Row label="Last price" value={money(s.price, s.currency)} />
              <Row label="Fair value" value={money(s.fairValue, s.currency)} />
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">{s.discount >= 0 ? 'Discount' : 'Premium'}</span>
                <span className={cn('font-serif text-2xl font-bold', s.discount >= 0 ? 'text-success' : 'text-destructive')}>
                  {s.discount >= 0 ? '' : '+'}{Math.abs(s.discount).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full', s.discount >= 0 ? 'bg-success' : 'bg-destructive')}
                  style={{ width: `${Math.min(Math.abs(s.discount) * 4, 100)}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sharia screen */}
        <Card className="border-sharia/30">
          <CardContent>
            <div className="flex items-center gap-2">
              {s.sharia === 'compliant' ? <ShieldCheck className="h-5 w-5 text-sharia" />
                : s.sharia === 'doubtful' ? <ShieldAlert className="h-5 w-5 text-medal-bronze" />
                : <ShieldX className="h-5 w-5 text-destructive" />}
              <h2 className="font-serif text-xl font-bold">Sharia Screen</h2>
              {s.auto && <Badge variant="muted" className="ml-auto">Auto-screen</Badge>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              AAOIFI Standard No. 21 — financial ratios.
              {s.auto && ' Status estimated from sector + live debt ratio — verify with a Shariah board.'}
            </p>
            <div className="mt-3 divide-y divide-border">
              <ShariaRatio label="Interest-bearing debt / mcap" value={s.shariaRatios.debt} threshold={30} />
              <ShariaRatio label="Interest deposits / mcap" value={s.shariaRatios.cashInterest} threshold={30} />
              <ShariaRatio label="Impermissible income" value={s.shariaRatios.impureIncome} threshold={5} />
            </div>
            <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              {purify != null
                ? <>Purification estimate: <span className="font-semibold text-foreground">{purify}%</span> of dividend income.</>
                : <>Debt ratio is live; the cash-interest & impermissible-income ratios need a deeper financials source (auto-screen).</>}
            </div>
          </CardContent>
        </Card>

        {/* Analyst consensus */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl font-bold">Analyst Consensus ★</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{a.count || '—'} analyst forecasts.</p>
            {a.buy != null ? (
              <div className="mt-4 flex gap-2">
                <Pill n={a.buy} label="Buy" cls="bg-success/15 text-success" />
                <Pill n={a.hold} label="Hold" cls="bg-muted text-muted-foreground" />
                <Pill n={a.sell} label="Sell" cls="bg-destructive/15 text-destructive" />
              </div>
            ) : (
              <div className="mt-4 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {a.count ? `${a.count} analysts cover this stock.` : 'No analyst coverage on the free feed.'} Hit-rate-weighted scoring activates with a licensed analyst feed (Argaam).
              </div>
            )}
            <div className="mt-4 space-y-3">
              <Row label="Median target" value={money(a.target, s.currency)} />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Implied upside</span>
                <span className={cn('font-semibold', upside >= 0 ? 'text-success' : 'text-destructive')}>{pct(upside)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Money flow */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-ai-navy" />
              <h2 className="font-serif text-xl font-bold">Money Flow ★</h2>
            </div>
            {s.netFlowPct != null ? (
              <>
                <p className="mt-1 text-xs text-muted-foreground">Net intraday money flow — Tadawul-licensed (SAHMK).</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className={cn('inline-flex h-11 w-11 items-center justify-center rounded-xl',
                    s.netFlowPct > 2 ? 'bg-success/15 text-success' : s.netFlowPct < -2 ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground')}>
                    {s.netFlowPct > 2 ? <TrendingUp className="h-6 w-6" /> : s.netFlowPct < -2 ? <TrendingDown className="h-6 w-6" /> : <Minus className="h-6 w-6" />}
                  </span>
                  <div>
                    <div className={cn('font-serif text-2xl font-bold', s.netFlowPct >= 0 ? 'text-success' : 'text-destructive')}>
                      {s.netFlowPct >= 0 ? '+' : ''}{s.netFlowPct}%
                    </div>
                    <div className="text-xs text-muted-foreground">net {s.netFlowPct >= 0 ? 'inflow' : 'outflow'} of value traded</div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Buy-side minus sell-side value, today. {s.instOwn != null && <>Institutions hold {s.instOwn}%. </>}
                  On Tadawul institutions trade on value while retail (90% of volume) chases attention.
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 text-xs text-muted-foreground">Institutional ownership — a smart-money proxy.</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-ai-navy/10 text-ai-navy">
                    <Activity className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="font-serif text-2xl font-bold">{s.instOwn != null ? `${s.instOwn}%` : '—'}</div>
                    <div className="text-xs text-muted-foreground">held by institutions</div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Heavier institutional ownership is a quality signal. <span className="text-foreground/70">Real net money-flow (SAHMK licensed) is shown for the most-traded names.</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Rumor thermometer */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className={cn('h-5 w-5', r.color)} />
              <h2 className="font-serif text-xl font-bold">Rumor Thermometer</h2>
            </div>
            <div className="mt-4">
              <div className={cn('inline-flex rounded-full px-3 py-1 text-sm font-semibold', r.bg, r.color)}>{r.label}</div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full',
                  s.rumor === 'danger' ? 'bg-destructive' : s.rumor === 'high' ? 'bg-medal-bronze' : s.rumor === 'medium' ? 'bg-primary' : 'bg-success')}
                  style={{ width: r.w }} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Volume + tone of social chatter. {s.rumor === 'danger' && 'Heavily discussed — historically a fade signal.'}
                {s.rumor === 'low' && 'Quiet — could be an overlooked name.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Retail attention (MAX) — Tadawul-specific lottery/attention signal */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-medal-bronze" />
              <h2 className="font-serif text-xl font-bold">Retail Attention (MAX)</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Biggest 1-day jump in volatility units (lottery-seeking signal).</p>
            <div className="mt-4">
              <div className="font-serif text-3xl font-bold">{s.maxScore != null ? `${s.maxScore}σ` : '—'}</div>
              {s.maxFlag === 'trap' ? (
                <div className="mt-2 inline-flex rounded-lg bg-medal-bronze/10 px-3 py-1.5 text-sm font-semibold text-medal-bronze">⚠ Value-trap risk</div>
              ) : s.maxFlag === 'strong' ? (
                <div className="mt-2 inline-flex rounded-lg bg-success/10 px-3 py-1.5 text-sm font-semibold text-success">▲ Attention + strong profits</div>
              ) : (
                <div className="mt-2 inline-flex rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground">Normal attention</div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                On Tadawul, high-attention "lottery" stocks rise when profitability is strong and fade when it's weak —
                so MAX is read together with the Quality dimension.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {news && (
        <Card className="mt-5">
          <CardContent>
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl font-bold">Efsah Flash</h2>
              <Badge variant={news.summary.mood === 'positive' ? 'success' : news.summary.mood === 'negative' ? 'danger' : 'muted'} className="ml-2 capitalize">
                {news.summary.mood}
              </Badge>
              <span className="ml-auto text-xs text-muted-foreground">{news.summary.n} recent headlines</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">News &amp; disclosure sentiment. Tadawul shows post-earnings drift (PEAD) — reactions tend to persist.</p>
            <div className="mt-3 divide-y divide-border">
              {news.items.map((it, i) => (
                <a key={i} href={it.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 py-2.5 hover:bg-muted/30 -mx-2 px-2 rounded-lg">
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    it.sentiment === 'positive' ? 'bg-success' : it.sentiment === 'negative' ? 'bg-destructive' : 'bg-muted-foreground/40')} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-snug">{it.title}</div>
                    {it.source && <div className="text-xs text-muted-foreground">{it.source}</div>}
                  </div>
                </a>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              {news.summary.src === 'marketaux'
                ? 'Marketaux — Tadawul-aware news (Argaam/Mubasher/Reuters) with per-entity sentiment.'
                : 'Google News + financial-lexicon sentiment (fallback).'} Arabic-NLP (AraBERT) is the next upgrade.
            </p>
          </CardContent>
        </Card>
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        Illustrative sample data. Informational/statistical analysis, not investment advice under CMA regulations.
        Sharia status is an AAOIFI-style screen for guidance only.
      </p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}
function Pill({ n, label, cls }) {
  return (
    <div className={cn('flex-1 rounded-lg px-3 py-2 text-center', cls)}>
      <div className="font-serif text-lg font-bold">{n}</div>
      <div className="text-[11px]">{label}</div>
    </div>
  );
}
