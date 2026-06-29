import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import StockCard from '@/components/StockCard.jsx';
import { Badge } from '@/components/ui.jsx';
import { cn } from '@/lib/utils.js';
import { STOCKS, SECTORS, IS_LIVE } from '@/data/stocks.js';

const SORTS = [
  { id: 'score', label: 'Equity Star' },
  { id: 'discount', label: 'Discount' },
  { id: 'change', label: 'Today' },
];
const SHARIA = [
  { id: 'all', label: 'All' },
  { id: 'compliant', label: 'Sharia ✓' },
  { id: 'doubtful', label: 'Doubtful' },
  { id: 'non-compliant', label: 'Non-compliant' },
];

export default function MarketPage() {
  const [q, setQ] = useState('');
  const [sector, setSector] = useState('All');
  const [sharia, setSharia] = useState('all');
  const [sort, setSort] = useState('score');

  const rows = useMemo(() => {
    let r = STOCKS.filter((s) => {
      if (sector !== 'All' && s.sector !== sector) return false;
      if (sharia !== 'all' && s.sharia !== sharia) return false;
      if (q) {
        const t = (s.ticker + ' ' + s.name).toLowerCase();
        if (!t.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    r = [...r].sort((a, b) =>
      sort === 'score' ? b.total - a.total : sort === 'discount' ? b.discount - a.discount : b.change - a.change
    );
    return r;
  }, [q, sector, sharia, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant={IS_LIVE ? 'success' : 'muted'} className="mb-3">
        🇸🇦 Tadawul · {IS_LIVE ? 'live — Yahoo Finance (delayed)' : 'sample dataset'}
      </Badge>
      <h1 className="font-serif text-4xl font-bold">Market</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Every name with its Equity Star (out of 42), Sharia status and discount to USD-native fair value.
      </p>

      {/* controls */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search ticker or company…" className="w-full pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={sector} onChange={(e) => setSector(e.target.value)} className="text-sm">
            <option value="All">All sectors</option>
            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex rounded-full border border-border bg-card p-0.5">
            {SHARIA.map((s) => (
              <button key={s.id} onClick={() => setSharia(s.id)}
                className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  sharia === s.id ? 'bg-sharia text-white' : 'text-muted-foreground hover:text-foreground')}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-full border border-border bg-card p-0.5">
            {SORTS.map((s) => (
              <button key={s.id} onClick={() => setSort(s.id)}
                className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  sort === s.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">{rows.length} stocks</div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map((s) => <StockCard key={s.ticker} s={s} />)}
      </div>
      {rows.length === 0 && (
        <div className="mt-16 text-center text-muted-foreground">No stocks match your filters.</div>
      )}
    </div>
  );
}
