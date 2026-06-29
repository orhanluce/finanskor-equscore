import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, TrendingUp, LogOut, User, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { Button } from '@/components/ui.jsx';
import StockSearch from '@/components/StockSearch.jsx';

const PRIMARY = [
  { to: '/market', label: 'Market' },
  { to: '/explore', label: 'Explore' },
  { to: '/compare', label: 'Compare' },
  { to: '/sharia', label: 'Sharia' },
];

const MENUS = [
  {
    label: 'Signals',
    items: [
      { to: '/money-flow', label: 'Money Flow', desc: 'SAHMK net flows' },
      { to: '/fear-greed', label: 'Fear & Greed', desc: 'TASI sentiment index' },
      { to: '/efsah-flash', label: 'Efsah Flash', desc: 'News sentiment feed' },
      { to: '/rumors', label: 'Rumors', desc: 'Chatter thermometer' },
      { to: '/signals', label: 'Anomalies', desc: 'Unusual moves' },
    ],
  },
  {
    label: 'Discover',
    items: [
      { to: '/strategies', label: 'Strategies', desc: 'Model portfolios' },
      { to: '/baskets', label: 'Baskets', desc: 'Thematic groups' },
      { to: '/ipo', label: 'IPOs', desc: 'New listings' },
      { to: '/brokers', label: 'Brokers', desc: 'CMA-licensed firms' },
      { to: '/stories', label: 'Stories', desc: 'Investor education' },
    ],
  },
  {
    label: 'Compete',
    items: [
      { to: '/predict', label: 'Contest', desc: 'Submit a prediction' },
      { to: '/leaderboard', label: 'Leaderboard', desc: 'Top forecasters' },
      { to: '/journal', label: 'Journal', desc: 'Decision mirror' },
    ],
  },
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <TrendingUp className="h-5 w-5" />
      </span>
      <span className="font-serif text-xl font-bold tracking-tight">Equ<span className="text-primary">Score</span></span>
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
      <button className="flex items-center gap-1 text-sm font-medium text-foreground/70 transition-colors hover:text-primary">
        {menu.label} <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full pt-2">
          <div className="w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            {menu.items.map((it) => (
              <NavLink key={it.to} to={it.to} onClick={() => setOpen(false)}
                className={({ isActive }) => cn('block px-4 py-2.5 transition-colors hover:bg-muted/60', isActive && 'bg-primary/10')}>
                <div className="text-sm font-medium text-foreground">{it.label}</div>
                <div className="text-xs text-muted-foreground">{it.desc}</div>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, signOut, openAuth, hasAuth } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Brand />
          <nav className="hidden lg:flex items-center gap-5">
            {PRIMARY.map((n) => (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) => cn('text-sm font-medium transition-colors hover:text-primary',
                  isActive ? 'text-primary' : 'text-foreground/70')}>
                {n.label}
              </NavLink>
            ))}
            {MENUS.map((m) => <Dropdown key={m.label} menu={m} />)}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block"><StockSearch /></div>
          {hasAuth && (user ? (
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
                <User className="h-3.5 w-3.5 text-primary" /> {user.username}
              </span>
              <button onClick={signOut} title="Sign out" className="p-1.5 text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button variant="accent" onClick={openAuth} className="hidden sm:inline-flex h-9 px-4 text-sm">Sign in</Button>
          ))}
          <button className="lg:hidden p-2" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="lg:hidden border-t border-border bg-background px-4 py-3 space-y-1 max-h-[80vh] overflow-y-auto">
          <div className="pb-2"><StockSearch compact /></div>
          {PRIMARY.map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)}
              className={({ isActive }) => cn('block rounded-lg px-3 py-2 text-sm font-medium',
                isActive ? 'bg-primary/10 text-primary' : 'text-foreground/80')}>
              {n.label}
            </NavLink>
          ))}
          {MENUS.map((m) => (
            <div key={m.label} className="pt-2">
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{m.label}</div>
              {m.items.map((it) => (
                <NavLink key={it.to} to={it.to} onClick={() => setOpen(false)}
                  className={({ isActive }) => cn('block rounded-lg px-3 py-2 text-sm',
                    isActive ? 'bg-primary/10 text-primary' : 'text-foreground/80')}>
                  {it.label}
                </NavLink>
              ))}
            </div>
          ))}
          {hasAuth && (
            <div className="border-t border-border pt-2 mt-2">
              {user ? (
                <button onClick={() => { signOut(); setOpen(false); }} className="block w-full text-left rounded-lg px-3 py-2 text-sm text-foreground/80">Sign out ({user.username})</button>
              ) : (
                <button onClick={() => { openAuth(); setOpen(false); }} className="block w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-primary">Sign in</button>
              )}
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
