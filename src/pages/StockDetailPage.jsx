import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, ShieldCheck, ShieldAlert, ShieldX,
  Users, Activity, Flame, Newspaper, Sparkles, Loader2, Trophy,
} from 'lucide-react';
import { Card, CardContent, Badge, Button } from '@/components/ui.jsx';
import { ScorePill, ShariaBadge } from '@/components/equity.jsx';
import EquityStarFull from '@/components/EquityStarFull.jsx';
import JargonTip from '@/components/JargonTip.jsx';
import ShareButtons from '@/components/ShareButtons.jsx';
import CountryLens from '@/components/CountryLens.jsx';
import TvChart from '@/components/TvChart.jsx';
import { tvRating } from '@/data/tvSignals.js';
import { socialFor } from '@/data/social.js';
import NEWS from '@/data/news.js';
import { getStock, COUNTRY } from '@/data/stocks.js';
import { cn, money, pct } from '@/lib/utils.js';
import { supabase } from '@/lib/supabaseClient.js';
import { t, LANG } from '@/i18n.js';

async function fetchAiYorum(stock) {
  const ctx = [
    `Stock: ${stock.ticker} — ${stock.name} (${stock.sector})`,
    `Price: ${stock.price} ${stock.currency}, change: ${stock.change > 0 ? '+' : ''}${stock.change}%`,
    `Equity Star: ${stock.total ?? '—'}/42`,
    `Fair value: ${stock.fairValue} (${stock.discount >= 0 ? stock.discount + '% discount' : Math.abs(stock.discount) + '% premium'})`,
    `P/E: ${stock.pe ?? '—'}, P/B: ${stock.pb ?? '—'}`,
    `Sharia: ${stock.sharia}`,
    stock.netFlowPct != null ? `Money flow: ${stock.netFlowPct > 0 ? '+' : ''}${stock.netFlowPct}% (SAHMK)` : null,
    stock.maxScore != null ? `MAX score: ${stock.maxScore}σ (${stock.maxFlag})` : null,
  ].filter(Boolean).join('\n');

  const { data, error } = await supabase.functions.invoke('ai-ask', {
    body: {
      question: `Give a 3-sentence summary of this stock's current situation based on the EquScore data. Focus on the most interesting signal — whether it looks cheap or expensive, any standout strength or risk. End with one key thing to watch.${LANG === 'ar' ? ' أجب باللغة العربية بأسلوب واضح ومبسّط.' : ' Answer in plain English.'}`,
      ticker: stock.ticker,
      history: [{ role: 'user', content: `Stock context:\n${ctx}` }, { role: 'assistant', content: 'Understood. I have the stock data.' }],
    },
  });
  if (error) return null;
  return data?.answer ?? null;
}

// Structured "fundamental brief" (BridgeWise/Rakuten-style) generated on demand
// from the EquScore data we already have. Returns labelled lines we render below.
async function fetchAiBrief(stock) {
  const a = stock.analysts || {};
  const ctx = [
    `Stock: ${stock.ticker} — ${stock.name} (${stock.sector})`,
    `Price ${stock.price} ${stock.currency}, Equity Star ${stock.total}/42`,
    `Fair value ${stock.fairValue} (${stock.discount >= 0 ? stock.discount + '% discount' : Math.abs(stock.discount) + '% premium'})`,
    `P/E ${stock.pe ?? '—'}, P/B ${stock.pb ?? '—'}, dividend yield ${stock.divYield ?? 0}%`,
    `Star dims — value ${stock.star.value}, growth ${stock.star.growth}, quality ${stock.star.quality}, health ${stock.star.health}, dividend ${stock.star.dividend}/6`,
    `Sharia: ${stock.sharia}`,
    a.count ? `Analysts: ${a.count}, median target ${a.target ?? '—'}` : 'No analyst coverage',
    stock.netFlowPct != null ? `Money flow ${stock.netFlowPct > 0 ? '+' : ''}${stock.netFlowPct}%` : null,
  ].filter(Boolean).join('\n');

  const lang = LANG === 'ar' ? 'Arabic' : 'English';
  const { data, error } = await supabase.functions.invoke('ai-ask', {
    body: {
      question: `Write a structured fundamental brief (3–6 month horizon) for this stock using ONLY the EquScore data. Output 7 lines, each starting with a bold label then a colon, in this exact order and labels (translate the labels to ${lang}): Valuation, Growth, Quality & Health, Dividend, Catalysts, Risks, Verdict. Keep each line to one sentence. Write in ${lang}. No preamble, no disclaimer.`,
      ticker: stock.ticker,
      history: [{ role: 'user', content: `Stock context:\n${ctx}` }, { role: 'assistant', content: 'Understood. I have the stock data.' }],
    },
  });
  if (error) return null;
  return data?.answer ?? null;
}

// Render "**Label:** text" or "Label: text" lines into styled rows.
function BriefLines({ text }) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return (
    <div className="mt-3 space-y-2">
      {lines.map((line, i) => {
        const clean = line.replace(/\*/g, '').replace(/^[-•\s]+/, '').trim();
        const idx = clean.indexOf(':');
        const label = idx > 0 ? clean.slice(0, idx) : null;
        const body = idx > 0 ? clean.slice(idx + 1).trim() : clean;
        return (
          <div key={i} className="text-sm leading-relaxed">
            {label && <span className="font-semibold text-foreground">{label}: </span>}
            <span className="text-foreground/85">{body}</span>
          </div>
        );
      })}
    </div>
  );
}

const RUMOR = {
  low: { label: () => t('Low'), color: 'text-success', bg: 'bg-success/10', w: '25%' },
  medium: { label: () => t('Medium'), color: 'text-primary', bg: 'bg-primary/10', w: '50%' },
  high: { label: () => t('High'), color: 'text-medal-bronze', bg: 'bg-medal-bronze/10', w: '75%' },
  danger: { label: () => t('Dangerous'), color: 'text-destructive', bg: 'bg-destructive/10', w: '100%' },
};

const TV_META = {
  STRONG_BUY: { label: () => t('Strong Buy'), color: 'text-success' },
  BUY: { label: () => t('Buy'), color: 'text-success' },
  NEUTRAL: { label: () => t('Neutral'), color: 'text-primary' },
  SELL: { label: () => t('Sell'), color: 'text-destructive' },
  STRONG_SELL: { label: () => t('Strong Sell'), color: 'text-destructive' },
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
  const [aiYorum, setAiYorum] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [brief, setBrief] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [tab, setTab] = useState('star');

  useEffect(() => {
    if (!s) return;
    const cacheKey = `ai_yorum_${s.ticker}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setAiYorum(cached); return; }
    setAiLoading(true);
    fetchAiYorum(s).then((txt) => {
      if (txt) { setAiYorum(txt); sessionStorage.setItem(cacheKey, txt); }
      setAiLoading(false);
    });
  }, [s?.ticker]);

  // Lazy structured brief — restore from cache on ticker change, generate on demand.
  useEffect(() => {
    if (!s) return;
    setBrief(sessionStorage.getItem(`ai_brief_${s.ticker}`) || null);
  }, [s?.ticker]);

  const generateBrief = () => {
    if (!s || briefLoading) return;
    setBriefLoading(true);
    fetchAiBrief(s).then((txt) => {
      if (txt) { setBrief(txt); sessionStorage.setItem(`ai_brief_${s.ticker}`, txt); }
      setBriefLoading(false);
    });
  };

  if (!s) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-bold">{t('Stock not found')}</h1>
        <Link to="/market" className="mt-4 inline-block text-primary">← {t('Back to market')}</Link>
      </div>
    );
  }

  const up = s.change >= 0;
  const news = NEWS[s.ticker];
  const a = s.analysts;
  const upside = a.target && s.price ? (a.target / s.price - 1) * 100 : null;
  const soc = socialFor(s.ticker);
  const rumorLevel = soc?.level || s.rumor;
  const r = RUMOR[rumorLevel];
  const purify = s.shariaRatios.impureIncome;
  const tv = tvRating(s.ticker);

  const TABS = [
    { id: 'star', label: t('Star') },
    { id: 'flow', label: t('Flow') },
    { id: 'value', label: t('Fair Value') },
    { id: 'stories', label: t('Stories') },
    { id: 'social', label: t('Social') },
    { id: 'predictions', label: t('Predictions') },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/market" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {t('Market')}
      </Link>

      {/* header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-primary">{s.ticker}</span>
            <Badge variant="muted">{s.sector}</Badge>
            {s.nomu && <Badge variant="muted" className="text-medal-bronze border-medal-bronze/30 bg-medal-bronze/10">{t('NOMU · parallel market')}</Badge>}
            {COUNTRY.modules.dualBoard && s.board && (
              <Badge variant="muted" className="font-mono">{s.board}</Badge>
            )}
            {COUNTRY.modules.sharia && <ShariaBadge status={s.sharia} />}
          </div>
          <h1 className="mt-1 font-serif text-4xl font-bold">{s.name}</h1>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-mono text-2xl font-bold">{money(s.price, s.currency)}</span>
            <span className={cn('text-sm font-semibold', up ? 'text-success' : 'text-destructive')}>{pct(s.change)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t('Equity Star')}</div>
          <ScorePill total={s.total} size="lg" />
        </div>
      </div>

      <p className="mt-4 max-w-3xl text-muted-foreground">{s.about}</p>
      <div className="mt-4"><ShareButtons title={`${s.ticker} — ${s.name}`} text={`${s.name} (${s.ticker}) scores ${s.total}/42 on EquScore`} /></div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={cn('px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === tb.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ─────────────── STAR ─────────────── */}
      {tab === 'star' && (
        <div className="mt-6 space-y-5">
          <EquityStarFull stock={s} />

          <Card>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="font-serif text-xl font-bold">{t('Price Chart')}</h2>
                <Badge variant="muted" className="ml-auto">TradingView</Badge>
              </div>
              <div className="mt-3"><TvChart stock={s} /></div>
            </CardContent>
          </Card>

          {tv && (() => {
            const meta = TV_META[tv.rec] || TV_META.NEUTRAL;
            const metaLabel = meta.label();
            const total = tv.buy + tv.sell + tv.neutral || 1;
            return (
              <Card>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-ai-navy" />
                    <h2 className="font-serif text-xl font-bold">{t('Technical Rating')}</h2>
                    <Badge variant="muted" className="ml-auto">{t('TradingView · daily')}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-6">
                    <div>
                      <div className={cn('font-serif text-3xl font-bold', meta.color)}>{metaLabel}</div>
                      <div className="text-xs text-muted-foreground">{t('summary of oscillators & moving averages')}</div>
                    </div>
                    <div className="flex-1 min-w-[220px]">
                      <div className="flex h-3 w-full overflow-hidden rounded-full">
                        <div className="bg-success" style={{ width: `${(tv.buy / total) * 100}%` }} />
                        <div className="bg-muted-foreground/30" style={{ width: `${(tv.neutral / total) * 100}%` }} />
                        <div className="bg-destructive" style={{ width: `${(tv.sell / total) * 100}%` }} />
                      </div>
                      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                        <span className="text-success">{t('Buy')} {tv.buy}</span>
                        <span>{t('Neutral')} {tv.neutral}</span>
                        <span className="text-destructive">{t('Sell')} {tv.sell}</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    {t("Derived from TradingView's technical-analysis summary. Indicative direction only, not a recommendation.")}
                  </p>
                </CardContent>
              </Card>
            );
          })()}

          {(aiLoading || aiYorum) && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-serif text-xl font-bold">{t('AI Analysis')}</h2>
                  <span className="text-xs text-muted-foreground ml-1">{t('· EquScore data')}</span>
                </div>
                {aiLoading ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> {t('Generating analysis…')}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-foreground/90">{aiYorum}</p>
                )}
                <p className="mt-2 text-[11px] text-muted-foreground">{t('Not investment advice. Generated from live EquScore metrics.')}</p>
              </CardContent>
            </Card>
          )}

          {/* AI Fundamental Brief — structured, on demand */}
          <Card className="border-ai-navy/20 bg-ai-navy/5">
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-ai-navy/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-ai-navy" />
                </div>
                <h2 className="font-serif text-xl font-bold">{t('AI Fundamental Brief')}</h2>
                <span className="text-xs text-muted-foreground">{t('· 3–6 month view')}</span>
                {(brief || briefLoading) ? null : (
                  <Button variant="outline" className="ml-auto h-8 px-3 text-sm" onClick={generateBrief}>
                    <Sparkles className="h-3.5 w-3.5" /> {t('Generate')}
                  </Button>
                )}
              </div>
              {briefLoading ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> {t('Generating analysis…')}
                </div>
              ) : brief ? (
                <BriefLines text={brief} />
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">{t('A structured read across valuation, growth, quality, catalysts and risks — generated from EquScore data.')}</p>
              )}
              {brief && <p className="mt-2 text-[11px] text-muted-foreground">{t('Not investment advice. Generated from EquScore data.')}</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────── FLOW ─────────────── */}
      {tab === 'flow' && (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Card>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-ai-navy" />
                <h2 className="font-serif text-xl font-bold"><JargonTip term="Foreign flow">Money Flow</JargonTip> ★</h2>
              </div>
              {s.netFlowPct != null ? (
                <>
                  <p className="mt-1 text-xs text-muted-foreground">{t('Net intraday money flow — Tadawul-licensed (SAHMK).')}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <span className={cn('inline-flex h-11 w-11 items-center justify-center rounded-xl',
                      s.netFlowPct > 2 ? 'bg-success/15 text-success' : s.netFlowPct < -2 ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground')}>
                      {s.netFlowPct > 2 ? <TrendingUp className="h-6 w-6" /> : s.netFlowPct < -2 ? <TrendingDown className="h-6 w-6" /> : <Minus className="h-6 w-6" />}
                    </span>
                    <div>
                      <div className={cn('font-serif text-2xl font-bold', s.netFlowPct >= 0 ? 'text-success' : 'text-destructive')}>
                        {s.netFlowPct >= 0 ? '+' : ''}{s.netFlowPct}%
                      </div>
                      <div className="text-xs text-muted-foreground">{s.netFlowPct >= 0 ? t('net inflow') : t('net outflow')} {t('of value traded')}</div>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Buy-side minus sell-side value, today. {s.instOwn != null && <>Institutions hold {s.instOwn}%. </>}
                    On Tadawul institutions trade on value while retail (90% of volume) chases attention.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-xs text-muted-foreground">{t('Institutional ownership — a smart-money proxy.')}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-ai-navy/10 text-ai-navy">
                      <Activity className="h-6 w-6" />
                    </span>
                    <div>
                      <div className="font-serif text-2xl font-bold">{s.instOwn != null ? `${s.instOwn}%` : (s.foreignOwn != null ? `${s.foreignOwn}%` : '—')}</div>
                      <div className="text-xs text-muted-foreground">{s.instOwn != null ? t('held by institutions') : t('foreign ownership')}</div>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {t('Heavier institutional/foreign ownership is a quality signal.')} <span className="text-foreground/70">{t('Licensed real-time net flow is shown where available.')}</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────── FAIR VALUE ─────────────── */}
      {tab === 'value' && (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Card>
            <CardContent>
              <h2 className="font-serif text-xl font-bold"><JargonTip term="Fair value">{t('Fair Value')}</JargonTip></h2>
              <p className="mt-1 text-xs text-muted-foreground">{t('Sector-relative multiples (P/E reversion + analyst).')}</p>
              <div className="mt-4 space-y-3">
                <Row label={t('Last price')} value={money(s.price, s.currency)} />
                <Row label={t('Fair value')} value={money(s.fairValue, s.currency)} />
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">
                    {s.discount >= 0 ? t('Discount') : t('Premium')}
                  </span>
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

          {COUNTRY.modules.sharia && (
            <Card className="border-sharia/30">
              <CardContent>
                <div className="flex items-center gap-2">
                  {s.sharia === 'compliant' ? <ShieldCheck className="h-5 w-5 text-sharia" />
                    : s.sharia === 'doubtful' ? <ShieldAlert className="h-5 w-5 text-medal-bronze" />
                    : <ShieldX className="h-5 w-5 text-destructive" />}
                  <h2 className="font-serif text-xl font-bold">{t('Sharia Screen')}</h2>
                  {s.auto && <Badge variant="muted" className="ml-auto">{t('Auto-screen')}</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('AAOIFI Standard No. 21 — financial ratios.')}
                  {s.auto && ' ' + t('Status estimated from sector + live debt ratio — verify with a Shariah board.')}
                </p>
                <div className="mt-3 divide-y divide-border">
                  <ShariaRatio label={t('Interest-bearing debt / mcap')} value={s.shariaRatios.debt} threshold={30} />
                  <ShariaRatio label={t('Interest deposits / mcap')} value={s.shariaRatios.cashInterest} threshold={30} />
                  <ShariaRatio label={t('Impermissible income')} value={s.shariaRatios.impureIncome} threshold={5} />
                </div>
                <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  {purify != null
                    ? <>{t('Purification')} {t('estimate:')} <span className="font-semibold text-foreground">{purify}%</span> {t('of dividend income.')}</>
                    : <>{t('Debt ratio is live; the cash-interest & impermissible-income ratios need a deeper financials source (auto-screen).')}</>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Country-specific valuation/risk lenses */}
          <CountryLens stock={s} />
        </div>
      )}

      {/* ─────────────── STORIES (Efsah Flash) ─────────────── */}
      {tab === 'stories' && (
        <div className="mt-6">
          {news ? (
            <Card>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-primary" />
                  <h2 className="font-serif text-xl font-bold">{t('Efsah Flash')}</h2>
                  <Badge variant={news.summary.mood === 'positive' ? 'success' : news.summary.mood === 'negative' ? 'danger' : 'muted'} className="ml-2 capitalize">
                    {t(news.summary.mood)}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">{news.summary.n} {t('recent headlines')}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t('News & disclosure sentiment. Reactions to earnings tend to persist (post-earnings drift).')}</p>
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
                    ? t('Marketaux — region-aware news with per-entity sentiment.')
                    : t('Google News + financial-lexicon sentiment (fallback).')} {t('Arabic-NLP is the next upgrade.')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground">{t('No recent headlines for')} {s.ticker} {t('yet.')}</CardContent></Card>
          )}
        </div>
      )}

      {/* ─────────────── SOCIAL ─────────────── */}
      {tab === 'social' && (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Card>
            <CardContent>
              <div className="flex items-center gap-2">
                <Flame className={cn('h-5 w-5', r.color)} />
                <h2 className="font-serif text-xl font-bold">{t('Rumor Thermometer')}</h2>
                {soc && <Badge variant="muted" className="ml-auto">𝕏 · {soc.n} posts</Badge>}
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <div className={cn('inline-flex rounded-full px-3 py-1 text-sm font-semibold', r.bg, r.color)}>{r.label()}</div>
                  {soc && (
                    <Badge variant={soc.mood === 'positive' ? 'success' : soc.mood === 'negative' ? 'danger' : 'muted'} className="capitalize">{soc.mood}</Badge>
                  )}
                  {soc?.spike && <Badge variant="danger">⚠ spike</Badge>}
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className={cn('h-full',
                    rumorLevel === 'danger' ? 'bg-destructive' : rumorLevel === 'high' ? 'bg-medal-bronze' : rumorLevel === 'medium' ? 'bg-primary' : 'bg-success')}
                    style={{ width: r.w }} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {soc ? t('Volume + tone of live 𝕏 chatter (AR + EN).') : t('Volume + tone of social chatter.')}
                  {rumorLevel === 'danger' && ' ' + t('Heavily discussed — historically a fade signal.')}
                  {rumorLevel === 'low' && ' ' + t('Quiet — could be an overlooked name.')}
                </p>
                {soc?.spike && (
                  <p className="mt-1 text-[11px] text-medal-bronze">{t('Sudden one-sided chatter spike — watch for pump/manipulation.')}</p>
                )}
                {soc?.items?.length > 0 && (
                  <div className="mt-3 divide-y divide-border border-t border-border">
                    {soc.items.slice(0, 4).map((it, i) => (
                      <a key={i} href={it.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 py-2 hover:bg-muted/30 -mx-2 px-2 rounded-lg">
                        <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          it.sentiment === 'positive' ? 'bg-success' : it.sentiment === 'negative' ? 'bg-destructive' : 'bg-muted-foreground/40')} />
                        <div className="min-w-0">
                          <div className="text-xs leading-snug text-foreground/90 line-clamp-2">{it.text}</div>
                          <div className="text-[10px] text-muted-foreground">@{it.author}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-[11px] text-muted-foreground">
                  {t('Unverified retail chatter — kept out of the Equity Star score.')}
                  {COUNTRY.modules.facebookSentiment && ' ' + t('On EGX, Facebook groups (300K+ members) are the dominant channel; X is shown here.')}
                </p>
              </div>
            </CardContent>
          </Card>

          {COUNTRY.modules.max && (
            <Card>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-medal-bronze" />
                  <h2 className="font-serif text-xl font-bold">{t('Retail Attention (MAX)')}</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t('Biggest 1-day jump in volatility units (lottery-seeking signal).')}</p>
                <div className="mt-4">
                  <div className="font-serif text-3xl font-bold">{s.maxScore != null ? `${s.maxScore}σ` : '—'}</div>
                  {s.maxFlag === 'trap' ? (
                    <div className="mt-2 inline-flex rounded-lg bg-medal-bronze/10 px-3 py-1.5 text-sm font-semibold text-medal-bronze">{t('⚠ Value-trap risk')}</div>
                  ) : s.maxFlag === 'strong' ? (
                    <div className="mt-2 inline-flex rounded-lg bg-success/10 px-3 py-1.5 text-sm font-semibold text-success">{t('▲ Attention + strong profits')}</div>
                  ) : (
                    <div className="mt-2 inline-flex rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground">{t('Normal attention')}</div>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t("On Tadawul, high-attention \"lottery\" stocks rise when profitability is strong and fade when it's weak — so MAX is read together with the Quality dimension.")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─────────────── PREDICTIONS ─────────────── */}
      {tab === 'predictions' && (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Card>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="font-serif text-xl font-bold">{t('Analyst Consensus')} ★</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{a.count || '—'} {t('analyst forecasts.')}</p>
              {a.buy != null ? (
                <div className="mt-4 flex gap-2">
                  <Pill n={a.buy} label={t('Buy')} cls="bg-success/15 text-success" />
                  <Pill n={a.hold} label={t('Hold')} cls="bg-muted text-muted-foreground" />
                  <Pill n={a.sell} label={t('Sell')} cls="bg-destructive/15 text-destructive" />
                </div>
              ) : (
                <div className="mt-4 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {a.count ? `${a.count} ${t('analysts cover this stock.')}` : t('No analyst coverage on the free feed.')} {t('Hit-rate-weighted scoring activates with a licensed analyst feed.')}
                </div>
              )}
              <div className="mt-4 space-y-3">
                <Row label={t('Median target')} value={money(a.target, s.currency)} />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('Implied upside')}</span>
                  <span className={cn('font-semibold', upside >= 0 ? 'text-success' : 'text-destructive')}>{pct(upside)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex h-full flex-col items-start justify-center gap-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <h2 className="font-serif text-xl font-bold">{t('Make your own call')}</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('Lock a price target or direction on')} {s.ticker} {t("with a server-side timestamp — it's graded against the realised price and feeds your leaderboard track record.")}
              </p>
              <Button as={Link} to="/predict" variant="accent">{t('Submit a prediction')}</Button>
            </CardContent>
          </Card>
        </div>
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        {t('Informational/statistical analysis, not investment advice under')} {COUNTRY.regulator} {t('rules.')}
        {COUNTRY.modules.sharia && ' ' + t('Sharia status is an AAOIFI-style screen for guidance only.')}
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
