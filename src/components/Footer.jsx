import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="surface-dark mt-20 bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <TrendingUp className="h-5 w-5" />
              </span>
              <span className="font-serif text-xl font-bold">EquScore</span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-background/70">
              The accountability & trust layer for Gulf equity markets. Score the analysts,
              screen for Sharia, follow the smart money — starting with Tadawul.
            </p>
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
              <li>🇸🇦 Tadawul — live (preview)</li>
              <li>🇦🇪 DFM / ADX — Phase 2</li>
              <li>🇶🇦 QSE — Phase 3</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-background/15 pt-6 text-xs text-background/50 leading-relaxed">
          Prototype with illustrative sample data for the Tadawul market. Scores are informational/statistical
          analysis, not investment advice or a personal recommendation under CMA regulations. Sharia status is an
          AAOIFI-style screen for guidance only — consult a qualified Shariah advisor before investing.
          © 2026 EquScore.
        </div>
      </div>
    </footer>
  );
}
