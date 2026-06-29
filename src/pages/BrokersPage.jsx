import React, { useState } from 'react';
import { Building2, FileText, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, Badge, Stat } from '@/components/ui.jsx';
import { getBrokers } from '@/data/extras.js';
import { COUNTRY } from '@/data/stocks.js';
import { cn } from '@/lib/utils.js';
import { t } from '@/i18n.js';

export default function BrokersPage() {
  const [onlyResearch, setOnlyResearch] = useState(false);
  const all = getBrokers(COUNTRY.id);
  const hasShare = all.some((b) => b.share != null);
  const rows = [...all]
    .filter((b) => !onlyResearch || b.research)
    .sort((a, b) => (hasShare ? (b.share || 0) - (a.share || 0) : b.score - a.score));
  const researchCount = all.filter((b) => b.research).length;
  const regShort = COUNTRY.regulator.split(' ')[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3">{regShort}-{t('licensed')}</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Brokers Directory')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {regShort}-{t('licensed brokerages on')} {COUNTRY.exchange}, {t('scored on platform quality, research depth and reliability')}{hasShare ? `, ${t('ranked by market share')}` : ''}.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat value={all.length} label={t('Licensed firms')} />
        <Stat value={researchCount} label={t('Publish research')} accent="text-primary" />
        <Stat value={Math.round(all.reduce((a, b) => a + b.score, 0) / all.length)} label={t('Average score')} />
      </div>

      <label className="mt-6 inline-flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={onlyResearch} onChange={(e) => setOnlyResearch(e.target.checked)} className="accent-primary" />
        {t('Only firms that publish research')}
      </label>

      <div className="mt-4 space-y-3">
        {rows.map((b, i) => (
          <Card key={b.name}>
            <CardContent className="flex items-center gap-4 py-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {hasShare && <span className="font-mono text-sm font-bold text-muted-foreground">#{i + 1}</span>}
                  <h2 className="font-serif text-lg font-bold">{b.name}</h2>
                  {b.research && <Badge variant="primary"><FileText className="h-3 w-3" /> {t('Research')}</Badge>}
                  {b.share != null && <Badge variant="success"><TrendingUp className="h-3 w-3" /> {b.share}% {t('share')}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{b.note}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="inline-flex items-center gap-1">
                  <Star className={cn('h-4 w-4', b.score >= 85 ? 'text-medal-bronze fill-medal-bronze' : 'text-muted-foreground')} />
                  <span className="font-serif text-xl font-bold">{b.score}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">/ 100</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {t('Illustrative directory. EquScore is independent and not affiliated with these firms; scores are editorial, not an endorsement.')}
      </p>
    </div>
  );
}
