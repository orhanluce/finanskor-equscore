import React from 'react';
import { Link } from 'react-router-dom';
import ShareButtons from '@/components/ShareButtons.jsx';
import { COUNTRY } from '@/data/stocks.js';

export default function Footer() {
  return (
    <footer className="surface-dark mt-20 bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <img src="/logo-transparent.png" alt="EquScore" className="h-10 w-auto" />
            </div>
            <p className="mt-3 max-w-sm text-sm text-background/70">
              The accountability & trust layer for Gulf equity markets. Score the analysts,
              screen for Sharia, follow the smart money — starting with Tadawul.
            </p>
            <div className="mt-4"><ShareButtons title="EquScore" text="EquScore — accountability & Sharia scoring for Tadawul" /></div>
          </div>
          <div>
            <div className="text-sm font-semibold text-background">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-background/70">
              <li><Link to="/market" className="hover:text-primary">Market</Link></li>
              <li><Link to="/sharia" className="hover:text-primary">Sharia Screen</Link></li>
              <li><Link to="/leaderboard" className="hover:text-primary">Leaderboard</Link></li>
              <li><Link to="/methodology" className="hover:text-primary">Methodology</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-background">Coverage</div>
            <ul className="mt-3 space-y-2 text-sm text-background/70">
              <li>🇸🇦 Tadawul — live</li>
              <li>🇦🇪 DFM / ADX — live</li>
              <li>🇪🇬 EGX — rolling out</li>
            </ul>
            <div className="mt-4 text-sm font-semibold text-background">{COUNTRY.flag} Data sources</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(COUNTRY.sources || []).map((src) => (
                <span key={src} className="rounded-full border border-background/20 bg-background/5 px-2 py-0.5 text-[11px] text-background/70">{src}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-background/15 pt-6 text-xs text-background/50 leading-relaxed">
          Prototype for the {COUNTRY.exchange} market. Scores are informational/statistical analysis, not investment
          advice or a personal recommendation under {COUNTRY.regulator} rules.
          {COUNTRY.modules.sharia && ' Sharia status is an AAOIFI-style screen for guidance only — consult a qualified Shariah advisor before investing.'}
          {COUNTRY.modules.currencyRisk && ' EGP figures carry currency risk; valuations shown without an FX hedge are indicative only.'}
          {' '}© 2026 EquScore.
        </div>
      </div>
    </footer>
  );
}
