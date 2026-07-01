import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Menu, X, TrendingUp, LogOut, User, Home, ChevronDown,
  LineChart, Compass, Scale, ShieldCheck,
  Droplets, Gauge, Newspaper, Flame, Zap,
  Layers, Rocket, Building2, BookOpen, Briefcase,
  Trophy, CalendarClock, BookMarked, UserCheck, Grid3x3,
  Compass as CompassIcon, Globe2, GraduationCap, HeartPulse, FileText,
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

// Left rail: core nav + Signals + Compete.
const LEFT_NAV = [
  {
    items: [
      { to: '/', label: 'Home', icon: Home, end: true },
      { to: '/market', label: 'Market', icon: LineChart },
      { to: '/explore', label: 'Explore', icon: Compass },
      { to: '/compare', label: 'Compare', icon: Scale },
      { to: '/sharia', label: 'Sharia', icon: ShieldCheck },
    ],
  },
  {
    label: 'Signals',
    items: [
      { to: '/heatmap', label: 'Heat Map', icon: Grid3x3 },
      { to: '/money-flow', label: 'Money Flow', icon: Droplets },
      { to: '/foreign-flow', label: 'Foreign Flow', icon: Globe2 },
      { to: '/fear-greed', label: 'Fear & Greed', icon: Gauge },
      { to: '/efsah-flash', label: 'Efsah Flash', icon: Newspaper },
      { to: '/rumors', label: 'Rumors', icon: Flame },
      { to: '/sentiment', label: 'Sentiment Index', icon: Gauge },
      { to: '/signals', label: 'Anomalies', icon: Zap },
      { to: '/macro', label: 'Macro Compass', icon: CompassIcon },
      { to: '/financial-health', label: 'Financial Health', icon: HeartPulse },
    ],
  },
  {
    label: 'Compete',
    items: [
      { to: '/predict', label: 'Contest', icon: Trophy },
      { to: '/competition', label: 'Competitions', icon: CalendarClock },
      { to: '/events', label: 'Prediction Events', icon: CalendarClock },
      { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
      { to: '/journal', label: 'Journal', icon: BookMarked },
      { to: '/portfolio', label: 'Virtual Portfolio', icon: Briefcase },
      { to: '/showcase', label: 'Showcase', icon: Trophy },
      { to: '/investors', label: 'Verified Investors', icon: UserCheck },
    ],
  },
];

// Right rail: Discover + Methodology (plus search + controls in the panel chrome).
const RIGHT_NAV = [
  {
    label: 'Discover',
    items: [
      { to: '/strategies', label: 'Strategies', icon: TrendingUp },
      { to: '/baskets', label: 'Baskets', icon: Layers },
      { to: '/ipo', label: 'IPOs', icon: Rocket },
      { to: '/brokers', label: 'Brokers', icon: Building2 },
      { to: '/stories', label: 'Stories', icon: BookOpen },
      { to: '/academy', label: 'Academy', icon: GraduationCap },
    ],
  },
  {
    items: [
      { to: '/methodology', label: 'Methodology', icon: FileText },
    ],
  },
];

function HijriLine() {
  if (!COUNTRY.modules.islamicCalendar) return null;
  const sig = islamicSignal();
  if (!sig) return null;
  const warn = sig.level === 'warning';
  const info = sig.level === 'info';
  return (
    <div className={cn('flex items-center gap-1.5 px-2 text-[11px] font-medium',
      warn ? 'text-medal-bronze' : info ? 'text-primary' : 'text-muted-foreground')}>
      <span className="text-sm leading-none">{sig.icon}</span>
      <span className="truncate">{t(sig.title)}</span>
    </div>
  );
}

function NavItem({ it, onNavigate }) {
  return (
    <NavLink to={it.to} end={it.end} onClick={onNavigate}
      className={({ isActive }) => cn(
        'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
        isActive ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-muted/60 hover:text-foreground')}>
      <it.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{t(it.label)}</span>
    </NavLink>
  );
}

function GroupLabel({ children }) {
  return (
    <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {children}
    </div>
  );
}

// Collapsible group — opens on hover (desktop) or tap (touch fires mouseenter);
// starts open if the active route lives inside it.
function CollapsibleGroup({ group, onNavigate }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(() => group.items.some((it) => it.to === pathname));
  return (
    <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-foreground">
        <span>{t(group.label)}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {group.items.map((it) => <NavItem key={it.to} it={it} onNavigate={onNavigate} />)}
        </div>
      )}
    </div>
  );
}

function NavGroups({ groups, onNavigate }) {
  return (
    <>
      {groups.map((group, gi) => (
        group.collapsible ? (
          <CollapsibleGroup key={group.label} group={group} onNavigate={onNavigate} />
        ) : (
          <div key={group.label || `g${gi}`}>
            {group.label && <GroupLabel>{t(group.label)}</GroupLabel>}
            <div className="space-y-0.5">
              {group.items.map((it) => <NavItem key={it.to} it={it} onNavigate={onNavigate} />)}
            </div>
          </div>
        )
      ))}
    </>
  );
}

// Left panel: brand + core/Signals/Compete nav.
function LeftPanel({ onNavigate, className }) {
  return (
    <div className={cn('flex flex-col', className)}>
      <Link to="/" onClick={onNavigate} className="flex shrink-0 items-center px-4 pt-4 pb-2" aria-label="EquScore home">
        <img src="/logo-light-v3.png" alt="EquScore" className="h-20 w-auto dark:hidden" />
        <img src="/logo-dark-v3.png" alt="EquScore" className="hidden h-20 w-auto dark:block" />
      </Link>
      <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <NavGroups groups={LEFT_NAV} onNavigate={onNavigate} />
      </nav>
    </div>
  );
}

// Right panel: search + Discover/Methodology nav + Hijri/controls/account.
function RightPanel({ onNavigate, className }) {
  const { user, signOut, openAuth, hasAuth } = useAuth();
  return (
    <div className={cn('flex flex-col', className)}>
      {/* Top: Hijri + controls + account */}
      <div className="shrink-0 space-y-2 border-b border-border px-3 pt-4 pb-3">
        <HijriLine />
        <div className="flex items-center justify-end gap-1.5">
          <CountrySwitcher />
          <ThemeToggle />
          <LangToggle />
        </div>
        {hasAuth && (user ? (
          <div className="flex items-center gap-2">
            <Link to="/account" onClick={onNavigate}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-medium hover:border-primary/40">
              <User className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{user.username}</span>
            </Link>
            <button onClick={() => { signOut(); onNavigate?.(); }} title={t('Sign out')}
              className="shrink-0 p-2 text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Button variant="accent" onClick={() => { openAuth(); onNavigate?.(); }} className="h-9 w-full text-sm">
            {t('Sign in')}
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <StockSearch compact />
      </div>

      {/* Nav: Discover + Methodology */}
      <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <NavGroups groups={RIGHT_NAV} onNavigate={onNavigate} />
      </nav>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const close = () => setOpen(false);
  React.useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* Desktop: fixed left + right rails */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border bg-background lg:block">
        <LeftPanel className="h-full" />
      </aside>
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-60 border-l border-border bg-background lg:block">
        <RightPanel className="h-full" />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-2 backdrop-blur-md lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Menu" className="p-1.5">
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" aria-label="EquScore home" className="flex items-center">
          <img src="/logo-light-v3.png" alt="EquScore" className="h-9 w-auto dark:hidden" />
          <img src="/logo-dark-v3.png" alt="EquScore" className="hidden h-9 w-auto dark:block" />
        </Link>
      </div>

      {/* Mobile drawer — both panels stacked */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-border bg-background shadow-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button onClick={close} aria-label="Close menu" className="absolute right-3 top-3 z-10 p-1.5 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <LeftPanel onNavigate={close} />
            <div className="my-1 border-t border-border" />
            <RightPanel onNavigate={close} />
          </div>
        </div>
      )}
    </>
  );
}
