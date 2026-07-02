import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown, RotateCcw, Sparkles, X } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui.jsx';
import { ShariaBadge } from '@/components/equity.jsx';
import { STOCKS, SECTORS, scoreColor } from '@/data/stocks.js';
import { computeZScore } from '@/data/zscore.js';
import { reversalSignal } from '@/data/technical.js';
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

// Preset strategies — one-click curated screens (East Money / Stockbit style),
// built from market-agnostic fields so they port across TASI / DFM / EGX.
const PRESETS = [
  {
    id: 'quality', emoji: '💎', label: 'Quality',
    desc: 'Strong quality & balance-sheet health, paying a dividend — durable compounders.',
    test: (s) => s.star.quality >= 5 && s.star.health >= 4 && (s.divYield || 0) > 0,
    sort: { key: 'total', dir: 'desc' },
  },
  {
    id: 'deep-value', emoji: '🏷️', label: 'Deep Value',
    desc: 'Trading well below fair value on a modest earnings multiple.',
    test: (s) => s.discount >= 10 && s.pe && s.pe <= 15,
    sort: { key: 'discount', dir: 'desc' },
  },
  {
    id: 'dividend', emoji: '💰', label: 'Dividend Aristocrats',
    desc: 'High, reliable yield — the expat/income favourite (zero dividend tax in the GCC).',
    test: (s) => (s.divYield || 0) >= 4 && s.star.dividend >= 5,
    sort: { key: 'divYield', dir: 'desc' },
  },
  {
    id: 'sharia-income', emoji: '🕌', label: 'Sharia Income',
    desc: 'Sharia-compliant names with a solid dividend score.',
    test: (s) => s.sharia === 'compliant' && s.star.dividend >= 4,
    sort: { key: 'divYield', dir: 'desc' },
  },
  {
    id: 'smart-momentum', emoji: '🚀', label: 'Smart-Money Momentum',
    desc: 'Strong growth + money-flow stars with foreign inflow — institutions are buying.',
    test: (s) => s.star.flow >= 5 && s.star.growth >= 4 && s.foreignFlow === 'in',
    sort: { key: 'total', dir: 'desc' },
  },
  {
    id: 'contrarian', emoji: '↩️', label: 'Contrarian Dip',
    desc: 'High-quality names down sharply today — MENA markets tend to mean-revert overreactions.',
    test: (s) => s.change <= -3 && s.total >= 24,
    sort: { key: 'change', dir: 'asc' },
  },
  {
    id: 'top-star', emoji: '⭐', label: 'Top Equity Star',
    desc: 'The highest overall Equity Star scores in the market.',
    test: (s) => s.total >= 30,
    sort: { key: 'total', dir: 'desc' },
  },
  {
    id: 'foreign-backed', emoji: '🌍', label: 'Foreign-Backed',
    desc: 'Heavy foreign ownership with active inflow — a quality / validation signal.',
    test: (s) => s.foreignFlow === 'in' && (s.foreignOwn || 0) >= 8,
    sort: { key: 'foreignOwn', dir: 'desc' },
  },
  {
    id: 'z-solid', emoji: '🛡️', label: 'Financially Solid',
    desc: 'In the Altman Z″ Safe Zone — low bankruptcy distress (banks/insurers excluded).',
    test: (s) => { const z = computeZScore(s); return z.applicable && z.zone === 'safe'; },
    sort: { key: 'total', dir: 'desc' },
  },
  {
    id: 'oversold-week', emoji: '↩️', label: 'Oversold (1-Week)',
    desc: 'Fell much harder than the market this week — Tadawul rewards short-term reversal, not momentum.',
    test: (s) => reversalSignal(s)?.key === 'oversold',
    sort: { key: 'revW', dir: 'asc' },
  },
];

export default function ExplorePage() {
  const [sector, setSector] = useState('All');
  const [sharia, setSharia] = useState('all');
  const [f, setF] = useState(RANGE_DEFAULTS);
  const [sort, setSort] = useState({ key: 'total', dir: 'desc' });
  const [presetId, setPresetId] = useState(null);

  const preset = PRESETS.find((p) => p.id === presetId) || null;

  const rows = useMemo(() => {
    let r = STOCKS.filter((s) => {
      if (sector !== 'All' && s.sector !== sector) return false;
      if (sharia !== 'all' && s.sharia !== sharia) return false;
      if (s.total < f.minScore) return false;
      if (s.pe && s.pe > f.maxPe) return false;
      if ((s.divYield || 0) < f.minDiv) return false;
      if (s.discount < f.minDiscount) return false;
      if (preset && !preset.test(s)) return false;
      return true;
    });
    const { key, dir } = sort;
    r = [...r].sort((a, b) => {
      const av = a[key] ?? 0, bv = b[key] ?? 0;
      return dir === 'desc' ? bv - av : av - bv;
    });
    return r;
  }, [sector, sharia, f, sort, preset]);

  const toggleSort = (key) => setSort((p) => (p.key === key ? { key, dir: p.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));

  const applyPreset = (p) => {
    if (presetId === p.id) { setPresetId(null); return; }
    setPresetId(p.id);
    setF(RANGE_DEFAULTS); setSector('All'); setSharia('all');
    if (p.sort) setSort(p.sort);
  };

  const reset = () => { setSector('All'); setSharia('all'); setF(RANGE_DEFAULTS); setPresetId(null); };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl font-bold">{t('Explorer')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t('Screen every TASI name by score, valuation, dividend and Sharia status. Build your own shortlist.')}
      </p>

      {/* Preset strategies */}
      <div className="mt-6">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" /> {t('Preset strategies')}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => applyPreset(p)}
              className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                presetId === p.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground/80 hover:border-primary/40')}>
              <span>{p.emoji}</span> {t(p.label)}
            </button>
          ))}
        </div>
        {preset && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            <span className="text-foreground/80">{t(preset.desc)}</span>
            <button onClick={() => setPresetId(null)} className="ml-auto shrink-0 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* Filters */}
        <Card className="h-fit p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-serif text-lg font-bold"><SlidersHorizontal className="h-4 w-4 text-primary" /> {t('Filters')}</div>
            <button onClick={reset} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="h-3 w-3" /> {t('Reset')}</button>
          </div>

          <label className="mt-4 block text-xs font-medium text-muted-foreground">{t('Sector')}</label>
          <select value={sector} onChange={(e) => setSector(e.target.value)} className="mt-1 w-full text-sm">
            <option value="All">{t('All sectors')}</option>
            {SECTORS.map((s) => <option key={s} value={s}>{t(s)}</option>)}
          </select>

          <label className="mt-4 block text-xs font-medium text-muted-foreground">{t('Sharia')}</label>
          <div className="mt-1 flex flex-wrap gap-1">
            {['all', 'compliant', 'doubtful', 'non-compliant'].map((id) => (
              <button key={id} onClick={() => setSharia(id)}
                className={cn('rounded-full px-3 py-1 text-xs font-medium capitalize', sharia === id ? 'bg-sharia text-white' : 'bg-muted text-muted-foreground hover:text-foreground')}>
                {id === 'all' ? t('All') : id === 'compliant' ? t('Compliant') : id === 'doubtful' ? t('Doubtful') : t('Non-compliant')}
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
                  <th className="px-4 py-2.5 text-left font-medium">{t('Sharia')}</th>
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
