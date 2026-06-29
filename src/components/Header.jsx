import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, TrendingUp, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { Button } from '@/components/ui.jsx';

const NAV = [
  { to: '/market', label: 'Market' },
  { to: '/sharia', label: 'Sharia Screen' },
  { to: '/predict', label: 'Contest' },
  { to: '/journal', label: 'Journal' },
  { to: '/leaderboard', label: 'Leaderboard' },
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

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, signOut, openAuth, hasAuth } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Brand />
          <nav className="hidden md:flex items-center gap-5">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) => cn('text-sm font-medium transition-colors hover:text-primary',
                  isActive ? 'text-primary' : 'text-foreground/70')}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
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
          <button className="md:hidden p-2" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)}
              className={({ isActive }) => cn('block rounded-lg px-3 py-2 text-sm font-medium',
                isActive ? 'bg-primary/10 text-primary' : 'text-foreground/80')}>
              {n.label}
            </NavLink>
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
