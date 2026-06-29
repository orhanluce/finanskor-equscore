import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, Badge, Stat } from '@/components/ui.jsx';
import JargonTip from '@/components/JargonTip.jsx';
import NEWS from '@/data/news.js';
import { STOCKS } from '@/data/stocks.js';
import { cn } from '@/lib/utils.js';

const nameOf = (t) => STOCKS.find((s) => s.ticker === t)?.name || t;
const MOOD_RANK = { positive: 2, neutral: 1, negative: 0 };

export default function EfsahFlashPage() {
  const [mood, setMood] = useState('all');

  const entries = useMemo(() => {
    return Object.entries(NEWS)
      .map(([ticker, data]) => ({ ticker, ...data }))
      .sort((a, b) => (b.summary.n - a.summary.n) || (MOOD_RANK[b.summary.mood] - MOOD_RANK[a.summary.mood]));
  }, []);

  const stats = useMemo(() => {
    let pos = 0, neg = 0, neu = 0, headlines = 0;
    entries.forEach((e) => {
      headlines += e.summary.n;
      if (e.summary.mood === 'positive') pos++;
      else if (e.summary.mood === 'negative') neg++;
      else neu++;
    });
    return { pos, neg, neu, headlines, stocks: entries.length };
  }, [entries]);

  const rows = mood === 'all' ? entries : entries.filter((e) => e.summary.mood === mood);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3">Marketaux + Google News</Badge>
      <h1 className="font-serif text-4xl font-bold">Efsah Flash</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        News &amp; disclosure <JargonTip term="Sentiment" inline>sentiment</JargonTip> across TASI. Tadawul shows{' '}
        <JargonTip term="PEAD" inline>post-earnings drift</JargonTip> — reactions tend to persist for weeks.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={stats.stocks} label="Names covered" />
        <Stat value={stats.headlines} label="Recent headlines" />
        <Stat value={stats.pos} label="Positive mood" accent="text-success" />
        <Stat value={stats.neg} label="Negative mood" accent="text-destructive" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {['all', 'positive', 'neutral', 'negative'].map((id) => (
          <button key={id} onClick={() => setMood(id)}
            className={cn('rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors',
              mood === id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            {id}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {rows.map((e) => {
          const MoodIcon = e.summary.mood === 'positive' ? TrendingUp : e.summary.mood === 'negative' ? TrendingDown : Minus;
          return (
            <Card key={e.ticker}>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-primary" />
                  <Link to={`/stock/${e.ticker}`} className="hover:text-primary">
                    <span className="font-mono font-bold text-primary">{e.ticker}</span>
                    <span className="ml-2 text-foreground">{nameOf(e.ticker)}</span>
                  </Link>
                  <Badge variant={e.summary.mood === 'positive' ? 'success' : e.summary.mood === 'negative' ? 'danger' : 'muted'} className="ml-2 capitalize">
                    <MoodIcon className="h-3 w-3" /> {e.summary.mood}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">{e.summary.n} headlines</span>
                </div>
                <div className="mt-3 divide-y divide-border">
                  {e.items.slice(0, 4).map((it, i) => (
                    <a key={i} href={it.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 py-2 hover:bg-muted/30 -mx-2 px-2 rounded-lg">
                      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        it.sentiment === 'positive' ? 'bg-success' : it.sentiment === 'negative' ? 'bg-destructive' : 'bg-muted-foreground/40')} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-snug">{it.title}</div>
                        {it.source && <div className="text-xs text-muted-foreground">{it.source}</div>}
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {rows.length === 0 && <div className="py-12 text-center text-muted-foreground">No {mood} headlines right now.</div>}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Sentiment from Marketaux per-entity scores (Argaam/Mubasher/Reuters) with a Google-News lexicon fallback. Arabic-NLP (AraBERT) is the next upgrade.
      </p>
    </div>
  );
}
