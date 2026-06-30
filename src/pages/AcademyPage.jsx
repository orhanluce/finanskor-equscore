import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ChevronDown, ArrowRight } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui.jsx';
import { cn } from '@/lib/utils.js';
import { t } from '@/i18n.js';

// Investor Academy (Stockbit Academy model) — concise, cross-linked lessons that
// teach a concept then point to the EquScore feature that uses it.
const LEVELS = [
  { id: 'beginner', label: 'Beginner', color: 'text-success' },
  { id: 'intermediate', label: 'Intermediate', color: 'text-primary' },
  { id: 'advanced', label: 'Advanced', color: 'text-ai-navy' },
  { id: 'mena', label: 'MENA-specific', color: 'text-sharia' },
];

const LESSONS = [
  { level: 'beginner', title: 'What is the stock market?', summary: 'Shares, exchanges and how TASI/DFM/EGX work.',
    points: ['A share is part-ownership of a company.', 'Exchanges match buyers and sellers at a live price.', 'An index like TASI tracks the whole market in one number.'], link: '/market', linkLabel: 'Open the Market' },
  { level: 'beginner', title: 'Reading the Equity Star', summary: 'One score out of 42 across 7 dimensions.',
    points: ['Value, Growth, Quality, Health, Dividend + Consensus ★ and Money-Flow ★.', 'Higher is better, but always read the dimensions, not just the total.', 'It is a starting point for research, never a buy signal.'], link: '/methodology', linkLabel: 'How it works' },
  { level: 'beginner', title: 'What is the P/E ratio?', summary: 'Price versus earnings — cheap or expensive?',
    points: ['P/E = price ÷ earnings per share.', 'Lower can mean cheaper — or a struggling business.', 'Compare against the sector, not across sectors.'], link: '/explore', linkLabel: 'Screen by P/E' },
  { level: 'intermediate', title: 'Fundamental analysis basics', summary: 'Judge the business behind the price.',
    points: ['Profitability (ROE/margins), leverage and growth matter most.', 'Quality + Health dimensions capture this on EquScore.', 'A cheap price with weak fundamentals can be a value trap.'], link: '/explore', linkLabel: 'Use the Screener' },
  { level: 'intermediate', title: 'How fair value is computed', summary: 'A discount/premium read in one number.',
    points: ['Sector-relative multiples plus analyst targets set a fair value.', 'A discount means price is below fair value, a premium above.', 'In the pegged Gulf it is computed directly in USD-stable terms.'], link: '/macro', linkLabel: 'Macro context' },
  { level: 'intermediate', title: 'Diversification & risk', summary: 'Do not bet the portfolio on one name.',
    points: ['Spreading across sectors lowers single-stock risk.', 'The Showcase score rewards diversification.', 'Position size is the simplest risk control you have.'], link: '/portfolio', linkLabel: 'Build a portfolio' },
  { level: 'advanced', title: 'Following the smart money', summary: 'Foreign & institutional flow as a signal.',
    points: ['Institutions trade on value; retail (≈90% of volume) chases attention.', 'Net foreign buying into a heavily-owned name validates quality.', 'Flow confirms a thesis — it does not replace one.'], link: '/foreign-flow', linkLabel: 'Foreign Flow board' },
  { level: 'advanced', title: 'Reading sentiment, not chasing it', summary: 'Crowd mood is a contrarian tell.',
    points: ['Extreme euphoria has historically faded on MENA markets.', 'The Sentiment Index flags crowded readings with a z-score.', 'It is deliberately kept out of the Equity Star score.'], link: '/sentiment', linkLabel: 'Sentiment Index' },
  { level: 'mena', title: 'Is this stock halal?', summary: 'AAOIFI Sharia screening explained.',
    points: ['Three financial ratios plus a business-activity screen.', 'Interest-bearing debt < 30% of market cap is the key line.', 'A small impure-income share can be purified.'], link: '/sharia', linkLabel: 'Sharia Screen' },
  { level: 'mena', title: 'Ramadan & the market', summary: 'Calendar anomalies worth knowing.',
    points: ['Volume runs lower through Ramadan.', 'The final 10 days have historically shown selling pressure.', 'Post-Eid optimism can raise herding behaviour.'], link: '/', linkLabel: 'Home' },
  { level: 'mena', title: 'Vision 2030 sectors', summary: 'Where diversification spending flows.',
    points: ['Technology, retail, healthcare and tourism are key beneficiaries.', 'The Macro Compass shows which forces favour them now.', 'Non-oil growth is the structural theme.'], link: '/macro', linkLabel: 'Macro Compass' },
  { level: 'mena', title: 'How to track QFI flow', summary: 'The most-informed players in the Gulf.',
    points: ['QFI = qualified foreign institutional investors.', 'Their weekly net buying/selling is a quality validation layer.', 'Watch it alongside fundamentals, never alone.'], link: '/foreign-flow', linkLabel: 'Foreign Flow board' },
];

export default function AcademyPage() {
  const [open, setOpen] = useState(null);
  const [level, setLevel] = useState('all');
  const shown = level === 'all' ? LESSONS : LESSONS.filter((l) => l.level === level);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3"><GraduationCap className="h-3.5 w-3.5" /> {t('Learn')}</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Academy')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t('Plain-language lessons on investing in MENA markets — each one links to the EquScore tool that puts it to work.')}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {[{ id: 'all', label: 'All' }, ...LEVELS].map((lv) => (
          <button key={lv.id} onClick={() => setLevel(lv.id)}
            className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              level === lv.id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            {t(lv.label)}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {shown.map((l, i) => {
          const lv = LEVELS.find((x) => x.id === l.level);
          const isOpen = open === `${l.level}-${l.title}`;
          return (
            <Card key={i}>
              <CardContent className="p-0">
                <button onClick={() => setOpen(isOpen ? null : `${l.level}-${l.title}`)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left">
                  <GraduationCap className={cn('h-5 w-5 shrink-0', lv?.color)} />
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-lg font-bold">{t(l.title)}</div>
                    <div className="text-sm text-muted-foreground">{t(l.summary)}</div>
                  </div>
                  <Badge variant="muted" className={cn('shrink-0', lv?.color)}>{t(lv?.label)}</Badge>
                  <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <div className="border-t border-border px-5 py-4">
                    <ul className="space-y-2">
                      {l.points.map((p, k) => (
                        <li key={k} className="flex items-start gap-2 text-sm text-foreground/85">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {t(p)}
                        </li>
                      ))}
                    </ul>
                    {l.link && (
                      <Link to={l.link} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                        {t(l.linkLabel)} <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">{t('Educational content, not investment advice.')}</p>
    </div>
  );
}
