import React from 'react';
import { BookMarked, ExternalLink } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui.jsx';
import { t } from '@/i18n.js';

// Rotating "why we built it this way" academic-basis card.
const EVIDENCE = [
  {
    claim: 'The MAX effect is strong on Tadawul.',
    body: 'High-attention "lottery" stocks underperform when profitability is weak — so MAX is read together with the Quality dimension, never alone.',
    source: 'Bali, Cakici & Whitelaw (2011); GCC replications',
  },
  {
    claim: 'Post-earnings drift persists for weeks.',
    body: 'Prices keep moving in the direction of an earnings surprise long after the announcement — the basis for Efsah Flash sentiment.',
    source: 'Bernard & Thomas (1989); MENA studies',
  },
  {
    claim: 'Institutions trade on value, retail on attention.',
    body: 'With ≈90% of Tadawul volume from retail, licensed net-flow is a genuine smart-money signal — the Money-Flow ★ dimension.',
    source: 'Tadawul market microstructure research',
  },
];

export default function EvidenceCorner() {
  const e = EVIDENCE[new Date().getDate() % EVIDENCE.length];
  return (
    <Card className="border-ai-navy/25 bg-ai-navy/5">
      <CardContent>
        <div className="flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-ai-navy" />
          <h3 className="font-serif text-lg font-bold">{t('Evidence Corner')}</h3>
          <Badge variant="muted" className="ml-auto">{t("Why it's built this way")}</Badge>
        </div>
        <p className="mt-3 font-serif text-base font-semibold text-foreground">"{t(e.claim)}"</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(e.body)}</p>
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-ai-navy">
          <ExternalLink className="h-3.5 w-3.5" /> {e.source}
        </div>
      </CardContent>
    </Card>
  );
}
