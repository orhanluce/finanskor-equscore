import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Treemap, ResponsiveContainer } from 'recharts';
import { Grid3x3 } from 'lucide-react';
import { Badge } from '@/components/ui.jsx';
import { STOCKS, SECTORS, COUNTRY } from '@/data/stocks.js';
import { cn, pct } from '@/lib/utils.js';
import { t } from '@/i18n.js';

// Colour scale for a daily % change — moomoo-style green→red ramp.
function changeColor(v) {
  if (v >= 5) return '#0D5C2E';
  if (v >= 3) return '#1D9E75';
  if (v >= 1) return '#4FAE86';
  if (v > 0) return '#9CCDB6';
  if (v === 0) return '#8A8A8A';
  if (v > -1) return '#E7A9A6';
  if (v > -3) return '#E2655F';
  if (v > -5) return '#C53A36';
  return '#8B1A17';
}
// Colour scale for an Equity Star (0–42).
function starColor(total) {
  if (total >= 32) return '#0D5C2E';
  if (total >= 26) return '#1D9E75';
  if (total >= 20) return '#9CCDB6';
  if (total >= 14) return '#E7A9A6';
  return '#C53A36';
}

const MODES = [
  { id: 'change', label: 'Today %' },
  { id: 'star', label: 'Equity Star' },
];

export default function HeatmapPage() {
  const [mode, setMode] = useState('change');
  const navigate = useNavigate();

  const { data, marketChange } = useMemo(() => {
    const bySector = SECTORS.map((sec) => {
      const list = STOCKS.filter((s) => s.sector === sec);
      if (!list.length) return null;
      const children = list.map((s) => ({
        name: s.ticker,
        fullName: s.name,
        size: s.mcap || 1,
        change: s.change,
        total: s.total,
        fill: mode === 'change' ? changeColor(s.change) : starColor(s.total),
      }));
      return { name: sec, children };
    }).filter(Boolean);

    const totMcap = STOCKS.reduce((a, s) => a + (s.mcap || 0), 0);
    const marketChange = totMcap
      ? STOCKS.reduce((a, s) => a + (s.change || 0) * (s.mcap || 0), 0) / totMcap
      : 0;
    return { data: bySector, marketChange };
  }, [mode]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3"><Grid3x3 className="h-3.5 w-3.5" /> {t('Market map')}</Badge>
      <h1 className="font-serif text-4xl font-bold">{t('Heat Map')}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t('The whole')} {COUNTRY.exchange} {t('on one screen — each tile is a company, sized by market cap and coloured by')}{' '}
        {mode === 'change' ? t("today's move") : t('its Equity Star')}{t('. Tap a tile to open the stock.')}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-border bg-card p-0.5">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={cn('rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                mode === m.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}>
              {t(m.label)}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {t('Market')}: <span className={cn('font-mono font-semibold', marketChange >= 0 ? 'text-success' : 'text-destructive')}>{pct(marketChange)}</span>
        </span>
        <Legend mode={mode} />
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-card p-2">
        <ResponsiveContainer width="100%" height={560}>
          <Treemap
            data={data}
            dataKey="size"
            aspectRatio={4 / 3}
            isAnimationActive={false}
            content={<Tile mode={mode} onPick={(tk) => navigate(`/stock/${tk}`)} />}
          />
        </ResponsiveContainer>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {t('Tile size = market capitalisation. Sample/delayed data; informational only, not investment advice.')}
      </p>
    </div>
  );
}

function Tile(props) {
  const { x, y, width, height, name, fullName, change, total, fill, depth, onPick, mode } = props;
  if (depth === 1) {
    // Sector frame label
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill="none" stroke="hsl(var(--border))" strokeWidth={2} />
        {width > 80 && height > 18 && (
          <text x={x + 6} y={y + 14} fill="hsl(var(--muted-foreground))" fontSize={11} fontWeight={600}>
            {t(name)}
          </text>
        )}
      </g>
    );
  }
  // Skip the invisible root node (depth 0) — only sector frames + leaves draw.
  if (!fullName) return null;
  const show = width > 38 && height > 24;
  const metric = mode === 'change' ? `${change >= 0 ? '+' : ''}${change?.toFixed(1)}%` : `${total}/42`;
  return (
    <g style={{ cursor: 'pointer' }} onClick={() => onPick(name)}>
      <title>{fullName} · {change >= 0 ? '+' : ''}{change?.toFixed(2)}% · {t('Star')} {total}/42</title>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="hsl(var(--background))" strokeWidth={1} />
      {show && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 4} textAnchor="middle" fill="#fff" fontSize={width > 70 ? 13 : 10} fontWeight={700}>
            {name}
          </text>
          <text x={x + width / 2} y={y + height / 2 + 11} textAnchor="middle" fill="#fff" fontSize={width > 70 ? 11 : 9} opacity={0.9}>
            {metric}
          </text>
        </>
      )}
    </g>
  );
}

function Legend({ mode }) {
  const stops = mode === 'change'
    ? [['-5%', '#8B1A17'], ['0', '#8A8A8A'], ['+5%', '#0D5C2E']]
    : [['0', '#C53A36'], ['21', '#9CCDB6'], ['42', '#0D5C2E']];
  return (
    <div className="ml-auto flex items-center gap-1.5">
      {stops.map(([lab, col]) => (
        <span key={lab} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <span className="h-3 w-3 rounded-sm" style={{ background: col }} /> {lab}
        </span>
      ))}
    </div>
  );
}
