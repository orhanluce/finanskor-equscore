import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Menu, X, TrendingUp, LogOut, User, ChevronDown,
  LineChart, Compass, Scale, ShieldCheck,
  Droplets, Gauge, Newspaper, Flame, Zap,
  Layers, Rocket, Building2, BookOpen, Briefcase,
  Trophy, CalendarDays, BookMarked, UserCheck, Grid3x3, Compass as CompassIcon, Globe2, GraduationCap, CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { Button } from '@/components/ui.jsx';
import StockSearch from '@/components/StockSearch.jsx';
import ThemeToggle from '@/components/ThemeToggle.jsx';
import CountrySwitcher from '@/components/CountrySwitcher.jsx';
import LangToggle from '@/components/LangToggle.jsx';
import { islamicSignal } from '@/lib/islamicCalendar.js';
import { COUNTRY } from '@/data/stocks.js';
import { t } from '@/i18n.js';

const PRIMARY = [
  { to: '/market', label: 'Market', icon: LineChart },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/compare', label: 'Compare', icon: Scale },
  { to: '/sharia', label: 'Sharia', icon: ShieldCheck },
];

const MENUS = [
  {
    label: 'Signals',
    items: [
      { to: '/heatmap', label: 'Heat Map', desc: 'Whole market at a glance', icon: Grid3x3 },
      { to: '/money-flow', label: 'Money Flow', desc: 'SAHMK net flows', icon: Droplets },
      { to: '/foreign-flow', label: 'Foreign Flow', desc: 'QFI institutional flow', icon: Globe2 },
      { to: '/fear-greed', label: 'Fear & Greed', desc: 'TASI sentiment index', icon: Gauge },
      { to: '/efsah-flash', label: 'Efsah Flash', desc: 'News sentiment feed', icon: Newspaper },
      { to: '/rumors', label: 'Rumors', desc: 'Chatter thermometer', icon: Flame },
      { to: '/sentiment', label: 'Sentiment Index', desc: 'Retail mood 0–100', icon: Gauge },
      { to: '/signals', label: 'Anomalies', desc: 'Unusual moves', icon: Zap },
      { to: '/macro', label: 'Macro Compass', desc: 'Macro → sector impact', icon: CompassIcon },
    ],
  },
  {
    label: 'Discover',
    items: [
      { to: '/strategies', label: 'Strategies', desc: 'Model portfolios', icon: TrendingUp },
      { to: '/baskets', label: 'Baskets', desc: 'Thematic groups', icon: Layers },
      { to: '/ipo', label: 'IPOs', desc: 'New listings', icon: Rocket },
      { to: '/brokers', label: 'Brokers', desc: 'CMA-licensed firms', icon: Building2 },
      { to: '/stories', label: 'Stories', desc: 'Investor education', icon: BookOpen },
      { to: '/academy', label: 'Academy', desc: 'Learn to invest', icon: GraduationCap },
    ],
  },
  {
    label: 'Compete',
    items: [
      { to: '/predict', label: 'Contest', desc: 'Submit a prediction', icon: Trophy },
      { to: '/competition', label: 'Competitions', desc: 'Monthly & quarterly', icon: CalendarDays },
      { to: '/events', label: 'Prediction Events', desc: 'Call the big events', icon: CalendarClock },
      { to: '/leaderboard', label: 'Leaderboard', desc: 'Top forecasters', icon: Trophy },
      { to: '/journal', label: 'Journal', desc: 'Decision mirror', icon: BookMarked },
      { to: '/portfolio', label: 'Virtual Portfolio', desc: 'Paper-trade tracking', icon: Briefcase },
      { to: '/showcase', label: 'Showcase', desc: 'Public member portfolios', icon: Trophy },
      { to: '/investors', label: 'Verified Investors', desc: 'Identity-checked wall', icon: UserCheck },
    ],
  },
];

function Brand() {
  return (
    <Link to="/" className="flex shrink-0 items-center" aria-label="EquScore home">
      <img src="/logo-light-v3.png" alt="EquScore" className="h-16 w-auto sm:h-[105px] dark:hidden" />
      <img src="/logo-dark-v3.png" alt="EquScore" className="hidden h-16 w-auto sm:h-[105px] dark:block" />
    </Link>
  );
}

function Dropdown({ menu }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-1 whitespace-nowrap text-sm font-medium text-foreground/70 transition-colors hover:text-primary">
        {t(menu.label)} <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full -translate-x-1/2 pt-2">
          <div className="w-60 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            {menu.items.map((it) => (
              <NavLink key={it.to} to={it.to} onClick={() => setOpen(false)}
                className={({ isActive }) => cn('flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60', isActive && 'bg-primary/10')}>
                <it.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="block text-sm font-medium text-foreground">{t(it.label)}</span>
                  <span className="block text-xs text-muted-foreground">{t(it.desc)}</span>
                </span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Hijri date / Islamic-calendar signal, shown under the nav menus in the header.
function HijriLine() {
  if (!COUNTRY.modules.islamicCalendar) return null;
  const sig = islamicSignal();
  if (!sig) return null;
  const warn = sig.level === 'warning';
  const info = sig.level === 'info';
  return (
    <div className={cn('flex items-center gap-1.5 text-[11px] font-medium',
      warn ? 'text-medal-bronze' : info ? 'text-primary' : 'text-muted-foreground')}>
      <span className="text-sm leading-none">{sig.icon}</span>
      <span>{t(sig.title)}</span>
      {sig.note && <span className="hidden xl:inline max-w-md truncate text-muted-foreground">— {t(sig.note)}</span>}
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, signOut, openAuth, hasAuth } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-24 sm:h-32 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Brand />

        {/* Centered nav (menu row + Hijri date beneath it) */}
        <nav className="hidden flex-1 flex-col items-center justify-center gap-2 lg:flex">
          <div className="flex items-center gap-5 xl:gap-6">
            {PRIMARY.map((n) => (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) => cn('inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors hover:text-primary',
                  isActive ? 'text-primary' : 'text-foreground/70')}>
                <n.icon className="h-4 w-4" /> {t(n.label)}
              </NavLink>
            ))}
            {MENUS.map((m) => <Dropdown key={m.label} menu={m} />)}
          </div>
          <HijriLine />
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
          <div className="hidden md:block"><StockSearch /></div>
          <CountrySwitcher />
          <ThemeToggle />
          <LangToggle />
          {hasAuth && (user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/account" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40">
                <User className="h-3.5 w-3.5 text-primary" /> {user.username}
              </Link>
              <button onClick={signOut} title="Sign out" className="p-1.5 text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button variant="accent" onClick={openAuth} className="hidden sm:inline-flex h-9 px-4 text-sm">{t('Sign in')}</Button>
          ))}
          <button className="lg:hidden p-2" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="lg:hidden border-t border-border bg-background px-4 py-3 space-y-1 max-h-[80vh] overflow-y-auto">
          <div className="pb-2"><StockSearch compact /></div>
          {PRIMARY.map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)}
              className={({ isActive }) => cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                isActive ? 'bg-primary/10 text-primary' : 'text-foreground/80')}>
              <n.icon className="h-4 w-4" /> {t(n.label)}
            </NavLink>
          ))}
          {MENUS.map((m) => (
            <div key={m.label} className="pt-2">
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t(m.label)}</div>
              {m.items.map((it) => (
                <NavLink key={it.to} to={it.to} onClick={() => setOpen(false)}
                  className={({ isActive }) => cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                    isActive ? 'bg-primary/10 text-primary' : 'text-foreground/80')}>
                  <it.icon className="h-4 w-4 text-primary" /> {t(it.label)}
                </NavLink>
              ))}
            </div>
          ))}
          {hasAuth && (
            <div className="border-t border-border pt-2 mt-2">
              {user ? (
                <>
                  <NavLink to="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/80"><User className="h-4 w-4 text-primary" /> {t('My account')} ({user.username})</NavLink>
                  <button onClick={() => { signOut(); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/80"><LogOut className="h-4 w-4" /> {t('Sign out')}</button>
                </>
              ) : (
                <button onClick={() => { openAuth(); setOpen(false); }} className="block w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-primary">{t('Sign in')}</button>
              )}
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
