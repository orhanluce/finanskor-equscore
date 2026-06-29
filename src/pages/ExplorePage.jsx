import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown, RotateCcw } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui.jsx';
import { ShariaBadge } from '@/components/equity.jsx';
import { STOCKS, SECTORS, scoreColor } from '@/data/stocks.js';
import { cn, money, pct } from '@/lib/utils.js';
import { t } from '@/i18n.js';

const COLUMNS = [
  { key: 'total', label: 'Star', fmt: (s) => `${s.total}`, cls: (s) => scoreColor(s.total) },
  { key: 'price', label: 'Price', fmt: (s) => money(s.price, s.currency) },
  { key: 'change', label: 'Today', fmt: (s) => pct(s.change), cls: (s) => (s.change >= 0 ? 'text-success' : 'text-destructive') },
  { key: 'discount', label: 'Discount', fmt: (s) => `${s.discount >= 0 ? '' : '+'}${Math.abs(s.discount).toFixed(1)}%`, cls: (s) => (s.discount >= 0 ? 'text-success' : 'text-destructive') },
  { key: 'pe', label: 'P/E', fmt: (s) => (s.pe ? s.pe.toFixed(1) : '—') },
  { key: 'pb', label: 'P/B', fmt: (s) => (s.pb ? s.pb.toFixed(1) : '—') },
  { key: 'divYield', label: 'Div %', fmt: (s) => (s.divYield ? s.divYield.toFixed(1) : '—') },
];

const RANGE_DEFAULTS = { minScore: 0, maxPe: 100, minDiv: 0, minDiscount: -100 };

export default function ExplorePage() {
  const [sector, setSector] = useState('All');
  const [sharia, setSharia] = useState('all');
  const [f, setF] = useState(RANGE_DEFAULTS);
  const [sort, setSort] = useState({ key: 'total', dir: 'desc' });

  const rows = useMemo(() => {
    let r = STOCKS.filter((s) => {
      if (sector !== 'All' && s.sector !== sector) return false;
      if (sharia !== 'all' && s.sharia !== sharia) return false;
      if (s.total < f.minScore) return false;
      if (s.pe && s.pe > f.maxPe) return false;
      if ((s.divYield || 0) < f.minDiv) return false;
      if (s.discount < f.minDiscount) return false;
      return true;
    });
    const { key, dir } = sort;
    r = [...r].sort((a, b) => {
      const av = a[key] ?? 0, bv = b[key] ?? 0;
      return dir === 'desc' ? bv - av : av - bv;
    });
    return r;
  }, [sector, sharia, f, sort]);

  const toggleSort = (key) => setSort((p) => (p.key === key ? { key, dir: p.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));
  const reset = () => { setSector('All'); setSharia('all'); setF(RANGE_DEFAULTS); };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl font-bold">{t('Explorer')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t('Screen every TASI name by score, valuation, dividend and Sharia status. Build your own shortlist.')}
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* Filters */}
        <Card className="h-fit p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-serif text-lg font-bold"><SlidersHorizontal className="h-4 w-4 text-primary" /> {t('Filters')}</div>
            <button onClick={reset} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="h-3 w-3" /> {t('Reset')}</button>
          </div>

          <label className="mt-4 block text-xs font-medium text-muted-foreground">{t('Sector')}</label>
          <select value={sector} onChange={(e) => setSector(e.target.value)} className="mt-1 w-full text-sm">
            <option value="All">{t('All sectors')}</option>
            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <label className="mt-4 block text-xs font-medium text-muted-foreground">Sharia</label>
          <div className="mt-1 flex flex-wrap gap-1">
            {['all', 'compliant', 'doubtful', 'non-compliant'].map((id) => (
              <button key={id} onClick={() => setSharia(id)}
                className={cn('rounded-full px-3 py-1 text-xs font-medium capitalize', sharia === id ? 'bg-sharia text-white' : 'bg-muted text-muted-foreground hover:text-foreground')}>
                {id === 'all' ? t('All') : id}
              </button>
            ))}
          </div>

          <RangeField label={`${t('Min Equity Star:')} ${f.minScore}`} min={0} max={42} value={f.minScore} onChange={(v) => setF({ ...f, minScore: v })} />
          <RangeField label={`${t('Max P/E:')} ${f.maxPe}`} min={5} max={100} value={f.maxPe} onChange={(v) => setF({ ...f, maxPe: v })} />
          <RangeField label={`${t('Min dividend yield:')} ${f.minDiv}%`} min={0} max={8} step={0.5} value={f.minDiv} onChange={(v) => setF({ ...f, minDiv: v })} />
          <RangeField label={`${t('Min discount:')} ${f.minDiscount}%`} min={-50} max={30} value={f.minDiscount} onChange={(v) => setF({ ...f, minDiscount: v })} />
        </Card>

        {/* Results table */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">{rows.length} {t('stocks')}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-medium">{t('Company')}</th>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className="px-4 py-2.5 text-right font-medium">
                      <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-foreground">
                        {t(c.label)} <ArrowUpDown className={cn('h-3 w-3', sort.key === c.key ? 'text-primary' : 'opacity-40')} />
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-2.5 text-left font-medium">Sharia</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.ticker} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <Link to={`/stock/${s.ticker}`} className="hover:text-primary">
                        <span className="font-mono font-bold text-primary">{s.ticker}</span>
                        <span className="ml-2 text-foreground/80">{s.name}</span>
                      </Link>
                    </td>
                    {COLUMNS.map((c) => (
                      <td key={c.key} className={cn('px-4 py-2.5 text-right font-mono', c.cls ? c.cls(s) : 'text-foreground')}>{c.fmt(s)}</td>
                    ))}
                    <td className="px-4 py-2.5"><ShariaBadge status={s.sharia} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && <div className="py-12 text-center text-muted-foreground">{t('No stocks match. Loosen the filters.')}</div>}
        </Card>
      </div>
    </div>
  );
}

function RangeField({ label, min, max, step = 1, value, onChange }) {
  return (
    <div className="mt-4">
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-primary" />
    </div>
  );
}
