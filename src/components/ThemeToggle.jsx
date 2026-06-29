import React, { useState, useEffect, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';

function current() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(current);

  useEffect(() => { setTheme(current()); }, []);

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try { localStorage.setItem('equscore_theme', next); } catch { /* ignore */ }
    setTheme(next);
  }, [theme]);

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground/70 transition-colors hover:text-primary hover:border-primary/40 ${className}`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
