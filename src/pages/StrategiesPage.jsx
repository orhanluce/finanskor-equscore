import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui.jsx';
import { STRATEGIES } from '@/data/extras.js';
import { STOCKS } from '@/data/stocks.js';
import { cn } from '@/lib/utils.js';

const THEME_COLOR = {
  Income: 'text-success', Growth: 'text-primary', Value: 'text-ai-navy',
  Momentum: 'text-medal-bronze', Quality: 'text-sharia',
};

export default function StrategiesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3">Rules-based · monthly rebalance</Badge>
      <h1 className="font-serif text-4xl font-bold">Model Strategies</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Transparent, rules-based portfolios built from the Equity Star engine. Each shows its rule, holdings and return since inception versus TASI.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {STRATEGIES.map((st) => {
          const holdings = st.tickers.map((t) => STOCKS.find((s) => s.ticker === t)).filter(Boolean);
          const alpha = st.returnPct - st.benchPct;
          return (
            <Link key={st.slug} to={`/strategy/${st.slug}`} className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="muted" className={THEME_COLOR[st.theme]}>{st.theme}</Badge>
                    <span className={cn('font-serif text-2xl font-bold', st.returnPct >= 0 ? 'text-success' : 'text-destructive')}>
                      {st.returnPct >= 0 ? '+' : ''}{st.returnPct}%
                    </span>
                  </div>
                  <h2 className="mt-3 font-serif text-xl font-bold group-hover:text-primary">{st.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{st.tagline}</p>

                  <div className="mt-4 flex items-center gap-2">
                    {holdings.slice(0, 4).map((h) => (
                      <span key={h.ticker} className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold">{h.ticker}</span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                    <span className="text-muted-foreground">vs TASI {st.benchPct}%</span>
                    <span className={cn('inline-flex items-center gap-1 font-semibold', alpha >= 0 ? 'text-success' : 'text-destructive')}>
                      <TrendingUp className="h-3.5 w-3.5" /> {alpha >= 0 ? '+' : ''}{alpha.toFixed(1)}% alpha
                    </span>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    View strategy <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Illustrative back-tested returns assume monthly equal-weight rebalancing and exclude costs. Past performance is not indicative of future results. Not investment advice.
      </p>
    </div>
  );
}
