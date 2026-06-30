import React, { useState } from 'react';
import { motion } from 'framer-motion';
import IntelligenceCube from '@/components/IntelligenceCube.jsx';
import { t } from '@/i18n.js';

// Interactive 7-dimension Equity Star (port of FinanSkor's Hisse Yıldızı):
//  · hover/select a corner -> highlighted slice + synced cube face
//  · toggle dimensions on/off (checkbox) -> score recomputes over enabled dims, saved to localStorage
//  · per-dimension explanation built from the stock's live driver metrics
const AXES = ['Value', 'Growth', 'Quality', 'Health', 'Dividend', 'Consensus', 'Money Flow'];
const FUND = '#6D5AA6', KONS = '#D4AF37', PARA = '#4F7942';
const colorFor = (i) => (i <= 4 ? FUND : i === 5 ? KONS : PARA);
const LS_KEY = 'equscore_star_dims';

function buildExplanations(s) {
  const m = s.metrics || {};
  const sr = s.shariaRatios || {};
  const a = s.analysts || {};
  const nf = (v, d = 1) => (v == null ? null : Number(v).toFixed(d));
  return [
    // Value
    `P/E ${s.pe || '—'} · P/B ${s.pb || '—'}. ` +
      (s.discount >= 0 ? `${nf(s.discount)}% ${t('below USD-native fair value.')}` : `${nf(-s.discount)}% ${t('above fair value.')}`),
    // Growth
    m.revGrowth != null ? `${t('Revenue growth')} ${nf(m.revGrowth)}% ${t('YoY.')}` : t('Expected earnings & revenue expansion.'),
    // Quality
    [m.roe != null ? `ROE ${nf(m.roe)}%` : null, m.roa != null ? `ROA ${nf(m.roa)}%` : null,
     m.margin != null ? `${t('net margin')} ${nf(m.margin)}%` : null].filter(Boolean).join(' · ') || t('Returns on assets/equity & margins.'),
    // Health
    sr.debt != null ? `${t('Interest-bearing debt is')} ${nf(sr.debt)}% ${t('of market cap')}` +
      (sr.debt < 30 ? t(' — comfortably below the 30% line.') : t(' — above the 30% Sharia threshold.')) : t('Balance-sheet strength & leverage.'),
    // Dividend
    s.divYield ? `${t('Dividend yield')} ${nf(s.divYield)}%.` : t('No dividend — low score on this dimension.'),
    // Consensus ★
    a.count ? `${a.count} ${t('analysts')}` + (a.target ? `, ${t('median target')} ${nf(a.target, 2)} SAR` : '') +
      (m.upside != null ? ` (${nf(m.upside)}% ${m.upside >= 0 ? t('upside') : t('downside')}).` : '.') +
      t(' Hit-rate weighting activates with a licensed feed (Argaam).') : t('No analyst coverage on the free feed.'),
    // Money Flow ★
    `${t('Institutional ownership')} ${s.instOwn != null ? s.instOwn + '%' : '—'} — ${t('a smart-money proxy: institutions trade on value while retail (90% of Tadawul volume) chases attention. True QFI foreign-flow is a paid upgrade.')}`,
  ];
}

export default function EquityStarFull({ stock }) {
  const scores = [stock.star.value, stock.star.growth, stock.star.quality, stock.star.health,
    stock.star.dividend, stock.star.consensus, stock.star.flow];
  const explanations = buildExplanations(stock);

  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [enabled, setEnabled] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(LS_KEY)); if (Array.isArray(s) && s.length === 7) return s; } catch { /* ignore */ }
    return [true, true, true, true, true, true, true];
  });
  const toggleDim = (i) => setEnabled((prev) => {
    const next = prev.map((v, j) => (j === i ? !v : v));
    if (!next.some(Boolean)) return prev;
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    return next;
  });

  const size = 300, center = size / 2, maxRadius = 100, seg = (2 * Math.PI) / 7;
  const apo = maxRadius * Math.cos(Math.PI / 7);
  const active = selected !== null ? selected : hovered;
  const aktif = enabled.filter(Boolean).length;
  const totalScore = scores.reduce((sum, sc, i) => sum + (enabled[i] ? sc : 0), 0);
  const maxScore = aktif * 6;

  const pointAt = (angle, r) => [center + r * Math.sin(angle), center - r * Math.cos(angle)];
  const getPoint = (val, idx) => {
    const r = (val / 6) * maxRadius, angle = idx * seg;
    return `${center + r * Math.sin(angle)},${center - r * Math.cos(angle)}`;
  };
  const highlightPath = (idx) => {
    const a = idx * seg;
    const [vx, vy] = pointAt(a, maxRadius), [lx, ly] = pointAt(a - seg / 2, apo), [rx, ry] = pointAt(a + seg / 2, apo);
    return `M ${center},${center} L ${lx},${ly} L ${vx},${vy} L ${rx},${ry} Z`;
  };
  const hitPath = (idx) => {
    const a = idx * seg;
    const [x1, y1] = pointAt(a - seg / 2, maxRadius + 30), [x2, y2] = pointAt(a + seg / 2, maxRadius + 30);
    return `M ${center},${center} L ${x1},${y1} L ${x2},${y2} Z`;
  };
  const ringPoints = [2, 4, 6].map((val) => AXES.map((_, i) => getPoint(val, i)).join(' '));
  const dataPoints = AXES.map((_, i) => getPoint(scores[i], i)).join(' ');
  const labelPos = (idx) => { const r = maxRadius + 20, a = idx * seg; return { x: center + r * Math.sin(a), y: center - r * Math.cos(a) }; };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-9">
      <div className="text-center mb-6">
        <h2 className="font-serif text-3xl md:text-4xl font-bold">{t('Equity Star')}</h2>
        <p className="text-foreground/60 mt-1">{aktif === 7 ? t('7 dimensions · max 42 points') : `${aktif} ${t('of 7 selected · out of')} ${maxScore}`}</p>
      </div>

      {/* Star */}
      <div className="relative flex justify-center items-center w-full max-w-xl mx-auto mb-10">
        <div className="absolute top-0 right-0 bg-card border-2 border-primary text-primary px-4 py-2 rounded-xl shadow-sm z-10">
          <div className="font-serif text-3xl font-bold tracking-tight">{totalScore}<span className="text-xl text-primary/60">/{maxScore}</span></div>
        </div>
        <svg width="100%" viewBox="0 0 300 300" className="max-w-[520px] overflow-visible">
          {ringPoints.map((p, i) => <polygon key={`ring-${i}`} points={p} fill="none" stroke="#D9D3C5" strokeWidth="1" />)}
          {AXES.map((_, i) => {
            const dest = getPoint(6, i).split(',');
            const dash = i === 5 ? '4 4' : i === 6 ? '4 4' : 'none';
            const stroke = i === 5 ? KONS : i === 6 ? PARA : '#D9D3C5';
            return <line key={`ax-${i}`} x1={center} y1={center} x2={dest[0]} y2={dest[1]} stroke={stroke} strokeWidth="1.5" strokeDasharray={dash} />;
          })}
          {active !== null && (
            <motion.path key={active} d={highlightPath(active)} fill={colorFor(active)}
              fillOpacity={selected === active ? 0.32 : 0.18} stroke={colorFor(active)} strokeWidth="2" strokeLinejoin="round"
              className="pointer-events-none" style={{ filter: 'drop-shadow(0 5px 7px rgba(0,0,0,0.22))' }}
              initial={{ opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 18 }} />
          )}
          <polygon points={dataPoints} fill="rgba(109, 90, 166, 0.15)" stroke={FUND} strokeWidth="2" />
          {AXES.map((_, i) => {
            const [cx, cy] = getPoint(scores[i], i).split(',');
            let r = i >= 5 ? 6 : 4; if (active === i) r += 2;
            return <circle key={`dot-${i}`} cx={cx} cy={cy} r={r} fill={colorFor(i)} stroke="#fff" strokeWidth="1.5"
              opacity={enabled[i] ? 1 : 0.25} style={active === i ? { filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.3))' } : undefined} />;
          })}
          {AXES.map((label, i) => {
            const { x, y } = labelPos(i);
            return <text key={`lab-${i}`} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill={colorFor(i)}
              fontSize="11.5" fontWeight={i > 4 ? 'bold' : '600'} opacity={enabled[i] ? 1 : 0.35}>{t(label)}{i > 4 ? ' ★' : ''}</text>;
          })}
          {AXES.map((_, i) => (
            <path key={`hit-${i}`} d={hitPath(i)} fill="transparent" className="cursor-pointer"
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(selected === i ? null : i)}>
              <title>{AXES[i]}: {scores[i]}/6</title>
            </path>
          ))}
        </svg>
      </div>

      {/* bars + cube */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div>
          <div className="space-y-2.5 mb-3">
            {AXES.map((label, i) => {
              const barColor = i <= 4 ? 'bg-[#6D5AA6]' : i === 5 ? 'bg-[#D4AF37]' : 'bg-[#4F7942]';
              return (
                <div key={`row-${i}`} className={`flex items-center gap-2 transition-opacity ${enabled[i] ? '' : 'opacity-40'}`}>
                  <button type="button" onClick={() => toggleDim(i)}
                    title={enabled[i] ? `${t('Remove')} ${t(label)}` : `${t('Add')} ${t(label)}`}
                    className="shrink-0 w-5 h-5 rounded border flex items-center justify-center"
                    style={enabled[i] ? { backgroundColor: colorFor(i), borderColor: colorFor(i) } : { borderColor: '#D9D3C5' }}>
                    {enabled[i] && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </button>
                  <button type="button" onClick={() => setSelected(selected === i ? null : i)}
                    onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                    className={`flex-1 flex items-center gap-4 text-left rounded-lg px-2 py-1.5 transition-colors ${selected === i ? 'bg-muted' : 'hover:bg-muted/60'}`}>
                    <div className="w-28 text-sm font-medium shrink-0">{t(label)} {i > 4 && <span style={{ color: colorFor(i) }}>★</span>}</div>
                    <div className="w-8 text-right font-mono font-bold text-sm shrink-0">{scores[i]}/6</div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className={`h-full ${barColor} rounded-full`} style={{ width: `${(scores[i] / 6) * 100}%` }} /></div>
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-foreground/50">
            {t('Tick to add/remove a dimension — the score is computed over the selected ones')} ({aktif}/7, {t('out of')} {maxScore}).
            {aktif < 7 && <button type="button" onClick={() => { setEnabled([true, true, true, true, true, true, true]); try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ } }} className="ml-1 text-primary font-medium hover:underline">{t('Restore all')}</button>}
          </p>
          {active !== null && (
            <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-serif font-bold" style={{ color: colorFor(active) }}>{t(AXES[active])}{active > 4 ? ' ★' : ''}</span>
                <span className="font-mono font-bold text-sm">{scores[active]}/6</span>
              </div>
              <p className="text-sm text-foreground/75 leading-snug">{explanations[active]}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center">
          <h3 className="font-serif text-xl font-bold mb-1">{t('Intelligence Cube')}</h3>
          <p className="text-sm text-foreground/55 text-center mb-6 max-w-xs">{t('Each face is a dimension — why this stock earned that score. Rotate, explore, or pick from the Star.')}</p>
          <IntelligenceCube axes={AXES} scores={scores} explanations={explanations} activeIndex={selected} onSelect={(i) => setSelected(selected === i ? null : i)} />
        </div>
      </div>

      {/* three mini cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10 pt-8 border-t border-border">
        <div className="bg-muted p-5 rounded-r-xl border-l-[4px]" style={{ borderLeftColor: FUND }}>
          <h4 className="font-serif font-bold mb-1">{t('How is the company?')}</h4>
          <p className="text-sm text-foreground/70 font-medium">{t('Value · Growth · Quality · Health · Dividend')}</p>
        </div>
        <div className="bg-muted p-5 rounded-r-xl border-l-[4px]" style={{ borderLeftColor: KONS }}>
          <h4 className="font-serif font-bold mb-1">{t('Are the forecasters right?')} <span style={{ color: KONS }}>★</span></h4>
          <p className="text-sm text-foreground/70 font-medium">{t('Hit-rate-weighted analyst consensus')}</p>
        </div>
        <div className="bg-muted p-5 rounded-r-xl border-l-[4px]" style={{ borderLeftColor: PARA }}>
          <h4 className="font-serif font-bold mb-1">{t("Where's the money going?")} <span style={{ color: PARA }}>★</span></h4>
          <p className="text-sm text-foreground/70 font-medium">{t('Foreign + institutional smart-money flow')}</p>
        </div>
      </div>
    </div>
  );
}
