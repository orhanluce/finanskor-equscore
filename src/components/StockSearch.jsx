import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { STOCKS, scoreColor } from '@/data/stocks.js';
import { cn } from '@/lib/utils.js';

export default function StockSearch({ compact = false }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return STOCKS
      .filter((s) => (s.ticker + ' ' + s.name + ' ' + s.sector).toLowerCase().includes(t))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [q]);

  useEffect(() => { setActive(0); }, [q]);

  useEffect(() => {
    const onClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (s) => {
    if (!s) return;
    navigate(`/stock/${s.ticker}`);
    setQ(''); setOpen(false);
    inputRef.current?.blur();
  };

  const onKey = (e) => {
    if (!open || !results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % results.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div ref={boxRef} className={cn('relative', compact ? 'w-full' : 'w-full sm:w-64')}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder="Search ticker or company…"
        className="w-full rounded-full border border-border bg-card pl-9 pr-8 h-9 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        aria-label="Search stocks"
      />
      {q && (
        <button onClick={() => { setQ(''); inputRef.current?.focus(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full sm:w-80 right-0 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          {results.map((s, i) => (
            <button
              key={s.ticker}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(s)}
              className={cn('flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors',
                i === active ? 'bg-primary/10' : 'hover:bg-muted/50')}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-primary">{s.ticker}</span>
                  <span className="truncate text-sm text-foreground">{s.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">{s.sector}</div>
              </div>
              <span className={cn('font-serif text-sm font-bold shrink-0', scoreColor(s.total))}>{s.total}<span className="text-[10px] text-muted-foreground">/42</span></span>
            </button>
          ))}
        </div>
      )}
      {open && q.trim() && results.length === 0 && (
        <div className="absolute z-50 mt-2 w-full sm:w-80 right-0 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-xl">
          No match for "{q}".
        </div>
      )}
    </div>
  );
}
