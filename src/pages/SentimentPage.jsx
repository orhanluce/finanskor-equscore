import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gauge, AlertTriangle, Flame, Snowflake, Search, TrendingUp } from 'lucide-react';
import { Card, CardContent, Badge, Stat } from '@/components/ui.jsx';
import { SOCIAL } from '@/data/social.js';
import { retailAttention } from '@/data/serpapi.js';
import { getStock, COUNTRY } from '@/data/stocks.js';
import { cn } from '@/lib/utils.js';
import { t } from '@/i18n.js';

// Retail Sentiment Index (Xueqiu/FactSet model): 0–100 mood index per stock,
// with a cross-sectional z-score flagging extreme euphoria / panic.
function indexFor(d) {
  // Net mood over the whole chatter volume — neutral mentions dampen the reading,
  // so a few positives in a quiet name don't peg the index at 100.
  const n = Math.max(1, d.n || 0);
  const net = ((d.pos || 0) - (d.neg || 0)) / n;
  return Math.max(0, Math.min(100, Math.round(50 + 50 * net)));
}

function label(idx, z) {
  if (z > 1.5) return { key: 'euphoria', text: 'Extreme euphoria', tone: 'destructive', icon: Flame };
  if (z < -1.5) return { key: 'panic', text: 'Extreme panic', tone: 'destructive', icon: Snowflake };
  if (idx >= 60) return { key: 'positive', text: 'Positive', tone: 'success', icon: null };
  if (idx <= 40) return { key: 'negative', text: 'Negative', tone: 'muted', icon: null };
  return { key: 'neutral', text: 'Neutral', tone: 'muted', icon: null };
}

export default function SentimentPage() {
  const [onlyWarn, setOnlyWarn] = useState(false);

  const { rows, stats } = useMemo(() => {
    const base = Object.entries(SOCIAL).map(([ticker, d]) => {
      const s = getStock(ticker);
      return { ticker, name: s?.name || ticker, sector: s?.sector, total: s?.total,
        n: d.n || 0, pos: d.pos || 0, neg: d.neg || 0, index: indexFor(d) };
    }).filter((r) => r.n > 0);

    const idxs = base.map((r) => r.index);
    const mean = idxs.length ? idxs.reduce((a, b) => a + b, 0) / idxs.length : 50;
    const sd = idxs.length ? Math.sqrt(idxs.reduce((a, b) => a + (b - mean) ** 2, 0) / idxs.length) : 1;
    const withZ = base.map((r) => {
      const z = sd ? (r.index - mean) / sd : 0;
      return { ...r, z, lab: label(r.index, z) };
    }).sort((a, b) => b.index - a.index);

    const stats = {
      covered: base.length,
      avg: Math.round(mean),
      euphoric: withZ.filter((r) => r.z > 1.5).length,
      panic: withZ.filter((r) => r.z < -1.5).length,
    };
    return { rows: withZ, stats };
  }, []);

  const shown = onlyWarn ? rows.filter((r) => Math.abs(r.z) > 1.5) : rows;
  const attn = retailAttention();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3"><Gauge className="h-3.5 w-3.5" /> {t('Retail sentiment')}</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Sentiment Index')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t('Mood of retail chatter per name on')} {COUNTRY.exchange}{t(', scored 0–100. Extreme readings are flagged — crowded euphoria has historically faded. Kept out of the Equity Star score.')}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={stats.covered} label={t('Names covered')} />
        <Stat value={stats.avg} label={t('Average index')} />
        <Stat value={stats.euphoric} label={t('Euphoria flags')} accent="text-destructive" />
        <Stat value={stats.panic} label={t('Panic flags')} accent="text-primary" />
      </div>

      {attn && (
        <Card className="mt-6">
          <CardContent>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-lg font-bold">{t('Retail Search Attention')}</h2>
              <Badge variant={attn.heat === 'high' ? 'danger' : attn.heat === 'elevated' ? 'primary' : 'muted'} className="ml-auto capitalize">
                {attn.trend === 'rising' && <TrendingUp className="h-3 w-3" />} {t(attn.heat)}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('Google search interest in')} {COUNTRY.exchange} {t('trading — a market-wide retail-attention gauge (0–100). Spikes often mark crowded tops.')}
            </p>
            <div className="mt-3 flex items-end gap-6">
              <div>
                <div className="font-serif text-3xl font-bold">{attn.latest}</div>
                <div className="text-[11px] text-muted-foreground">{t('now')}</div>
              </div>
              <div><div className="font-mono text-lg">{attn.avg7}</div><div className="text-[11px] text-muted-foreground">{t('7-pt avg')}</div></div>
              <div><div className="font-mono text-lg">{attn.peak}</div><div className="text-[11px] text-muted-foreground">{t('3-mo peak')}</div></div>
              {attn.timeline?.length > 1 && (
                <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="ml-auto h-10 w-40 text-primary">
                  <polyline fill="none" stroke="currentColor" strokeWidth="1.5"
                    points={attn.timeline.map((p, i) => `${(i / (attn.timeline.length - 1)) * 100},${28 - (p.v / 100) * 26}`).join(' ')} />
                </svg>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <label className="mt-6 inline-flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={onlyWarn} onChange={(e) => setOnlyWarn(e.target.checked)} className="accent-primary h-4 w-4" />
        {t('Only extreme readings')}
      </label>

      <div className="mt-4 space-y-2.5">
        {shown.map((r) => {
          const LabIcon = r.lab.icon;
          const tone = r.lab.tone === 'success' ? 'text-success' : r.lab.tone === 'destructive' ? 'text-destructive' : 'text-muted-foreground';
          const barColor = r.index >= 60 ? 'bg-success' : r.index <= 40 ? 'bg-destructive' : 'bg-medal-bronze';
          return (
            <Card key={r.ticker}>
              <CardContent className="flex flex-wrap items-center gap-4 py-3.5">
                <Link to={`/stock/${r.ticker}`} className="min-w-0 w-40 hover:text-primary">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-primary">{r.ticker}</span>
                    <span className="truncate text-sm text-foreground">{r.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{r.n} {t('mentions')}</div>
                </Link>
                <div className="flex-1 min-w-[120px]">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={cn('h-full rounded-full', barColor)} style={{ width: `${r.index}%` }} />
                  </div>
                </div>
                <div className="w-12 text-right font-mono text-lg font-bold">{r.index}</div>
                <Badge variant={r.lab.tone === 'success' ? 'success' : r.lab.tone === 'destructive' ? 'danger' : 'muted'}>
                  {LabIcon && <LabIcon className="h-3 w-3" />} {t(r.lab.text)}
                </Badge>
                {Math.abs(r.z) > 1.5 && <AlertTriangle className="h-4 w-4 text-destructive" title={t('Extreme reading')} />}
              </CardContent>
            </Card>
          );
        })}
        {shown.length === 0 && <div className="py-12 text-center text-muted-foreground">{t('No names in this category right now.')}</div>}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {t('Engagement-weighted mood from live X/social chatter (AR + EN). A contrarian read, not a buy/sell signal; deeper Arabic-NLP is planned. Informational only.')}
      </p>
    </div>
  );
}
