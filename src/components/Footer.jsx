import { t } from '@/i18n.js';
import React from 'react';
import { Link } from 'react-router-dom';
import ShareButtons from '@/components/ShareButtons.jsx';
import { COUNTRY } from '@/data/stocks.js';
import META from '@/data/meta.json';

// "Veri güncellendi" tazelik damgası — pipeline meta.json'ı her koşuda yeniler.
function freshness() {
  if (!META?.lastRun) return null;
  const d = new Date(META.lastRun);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Footer() {
  return (
    <footer className="surface-dark mt-20 bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <img src="/logo-dark-v3.png" alt="EquScore" className="h-10 w-auto" />
            </div>
            <p className="mt-3 max-w-sm text-sm text-background/70">
              {t('The accountability & trust layer for Gulf equity markets. Score the analysts, screen for Sharia, follow the smart money — starting with Tadawul.')}
            </p>
            <div className="mt-4"><ShareButtons title="EquScore" text="EquScore — accountability & Sharia scoring for Tadawul" /></div>
          </div>
          <div>
            <div className="text-sm font-semibold text-background">{t('Product')}</div>
            <ul className="mt-3 space-y-2 text-sm text-background/70">
              <li><Link to="/market" className="hover:text-primary">{t('Market')}</Link></li>
              <li><Link to="/sharia" className="hover:text-primary">{t('Sharia Screen')}</Link></li>
              <li><Link to="/leaderboard" className="hover:text-primary">{t('Leaderboard')}</Link></li>
              <li><Link to="/methodology" className="hover:text-primary">{t('Methodology')}</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-background">{t('Coverage')}</div>
            <ul className="mt-3 space-y-2 text-sm text-background/70">
              <li>🇸🇦 Tadawul — live</li>
              <li>🇦🇪 DFM / ADX — live</li>
              <li>🇪🇬 EGX — rolling out</li>
            </ul>
            <div className="mt-4 text-sm font-semibold text-background">{COUNTRY.flag} {t('Data sources')}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(COUNTRY.sources || []).map((src) => (
                <span key={src} className="rounded-full border border-background/20 bg-background/5 px-2 py-0.5 text-[11px] text-background/70">{src}</span>
              ))}
            </div>
            {freshness() && (
              <div className="mt-2 text-[11px] text-background/50">
                {t('Data updated:')} {freshness()}
              </div>
            )}
          </div>
        </div>
        <div className="mt-10 border-t border-background/15 pt-6 text-xs text-background/50 leading-relaxed">
          {t('Prototype for the')} {COUNTRY.exchange} {t('market. Scores are informational/statistical analysis, not investment advice or a personal recommendation under')} {COUNTRY.regulator} {t('rules.')}
          {COUNTRY.modules.sharia && ` ${t('Sharia status is an AAOIFI-style screen for guidance only — consult a qualified Shariah advisor before investing.')}`}
          {COUNTRY.modules.currencyRisk && ` ${t('EGP figures carry currency risk; valuations shown without an FX hedge are indicative only.')}`}
          {' '}© 2026 EquScore.
        </div>
      </div>
    </footer>
  );
}
