import React from 'react';
import { Link } from 'react-router-dom';
import { Building, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent, Badge, Stat } from '@/components/ui.jsx';
import JargonTip from '@/components/JargonTip.jsx';
import { STOCKS } from '@/data/stocks.js';
import { cn, pct } from '@/lib/utils.js';
import { t } from '@/i18n.js';

// Dubai Land Department open data (Q1 2026 snapshot, dubaipulse.gov.ae).
// DFM is real-estate-led, so this property pulse is a genuine factor for Emaar/Deyaar/etc.
const DLD = {
  period: 'Q1 2026',
  transactions: 60303, transactionsYoY: 6,
  valueAED: 252, valueYoY: 31,   // AED bn
  investors: 48448, investorsYoY: 8,
  // Composite momentum (0.4·volume + 0.6·price trend) → positive
  momentum: 'positive',
};

export default function DubaiRealEstate({ compact = false }) {
  const reStocks = STOCKS
    .filter((s) => s.sector === 'Real Estate')
    .sort((a, b) => b.total - a.total);

  return (
    <Card className="border-teal/25 bg-teal/5">
      <CardContent>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-teal" />
          <h2 className="font-serif text-xl font-bold">{t('Dubai Real-Estate Pulse')}</h2>
          <Badge variant="muted" className="ml-auto">DLD · {DLD.period}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('DFM is real-estate-led — Dubai Land Department transaction trends move Emaar, Deyaar & peers.')}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat value={`${(DLD.transactions / 1000).toFixed(1)}K`} label={t('Transactions')} sub={`+${DLD.transactionsYoY}% YoY`} accent="text-teal" />
          <Stat value={`${DLD.valueAED}B`} label={t('AED value')} sub={`+${DLD.valueYoY}% YoY`} accent="text-success" />
          <Stat value={`${(DLD.investors / 1000).toFixed(1)}K`} label={t('Investors')} sub={`+${DLD.investorsYoY}% YoY`} accent="text-teal" />
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-sm text-success">
          <TrendingUp className="h-4 w-4" />
          <span><JargonTip term="Momentum" inline>{t('Property momentum')}</JargonTip> {t('is positive — a tailwind for DFM developers this quarter.')}</span>
        </div>

        {!compact && reStocks.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('Real-estate names')}</div>
            <div className="mt-2 divide-y divide-border">
              {reStocks.map((s) => (
                <Link key={s.ticker} to={`/stock/${s.ticker}`} className="flex items-center gap-3 py-2 hover:bg-muted/30 -mx-2 px-2 rounded-lg">
                  <span className="w-20 font-mono text-sm font-bold text-primary">{s.ticker}</span>
                  <span className="flex-1 truncate text-sm text-foreground/80">{s.name}</span>
                  {s.board && <Badge variant="muted" className="font-mono text-[10px]">{s.board}</Badge>}
                  <span className={cn('w-16 text-right font-mono text-sm font-semibold', s.change >= 0 ? 'text-success' : 'text-destructive')}>{pct(s.change)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="mt-3 text-[11px] text-muted-foreground">{t('Source: Dubai Land Department open data (dubaipulse.gov.ae). Illustrative snapshot.')}</p>
      </CardContent>
    </Card>
  );
}
