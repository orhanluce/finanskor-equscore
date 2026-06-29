import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Card, CardContent, Badge, Button } from '@/components/ui.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { cn } from '@/lib/utils.js';
import { t } from '@/i18n.js';

const PLANS = [
  {
    name: 'Free', price: '0', period: 'forever', cta: 'Current plan', variant: 'outline',
    features: ['Equity Star on every stock', 'Sharia screen', 'Market & Explorer', 'Fear & Greed index', 'Contest + leaderboard'],
  },
  {
    name: 'Premium', price: '49', period: 'SAR / month', highlight: true, cta: 'Start free preview', variant: 'accent',
    features: ['Everything in Free', 'AI Analysis on every stock', 'Licensed SAHMK money flow', 'Efsah Flash full feed', 'Model strategies & baskets', 'Virtual portfolio tracking', 'Anomaly alerts'],
  },
  {
    name: 'Pro', price: '149', period: 'SAR / month', cta: 'Contact us', variant: 'outline',
    features: ['Everything in Premium', 'API access', 'Analyst hit-rate weighting', 'Custom screeners & exports', 'Priority data refresh'],
  },
];

export default function PremiumPage() {
  const { user, openAuth } = useAuth();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <Badge variant="primary" className="mb-3"><Sparkles className="h-3.5 w-3.5" /> {t('Preview pricing')}</Badge>
        <h1 className="font-serif text-4xl font-bold">{t('Upgrade EquScore')}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          {t('Everything is free during the preview. These are the plans we\'ll launch with — lock in early access by signing in now.')}
        </p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.name} className={cn(p.highlight && 'border-primary ring-1 ring-primary/30')}>
            <CardContent className="flex h-full flex-col">
              {p.highlight && <Badge variant="primary" className="w-fit">{t('Most popular')}</Badge>}
              <h2 className="mt-2 font-serif text-2xl font-bold">{t(p.name)}</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-serif text-4xl font-bold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{t(p.period)}</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> <span className="text-foreground/80">{t(f)}</span>
                  </li>
                ))}
              </ul>
              <Button variant={p.variant} className="mt-6 w-full" onClick={user ? undefined : openAuth}>
                {user && p.name === 'Free' ? t('Signed in') : t(p.cta)}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {t('Billing isn\'t enabled yet — no card required during preview. Prices indicative.')}
      </p>
    </div>
  );
}
