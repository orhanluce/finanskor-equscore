import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { COUNTRY } from '@/data/stocks.js';

// CLOU-style 2.5D equity ring: cards fan along an ellipse, front big/bright, back small/faint.
// Drag/throw → inertia, snaps to nearest card; hover lifts a card; centre info → stock page.
const colorFor = (sk) => (sk >= 30 ? '#4F7942' : sk >= 20 ? '#B5651D' : '#963838');
const mod = (a, n) => ((a % n) + n) % n;

export default function EquityRing({ stocks }) {
  const N = stocks.length;
  const step = N > 0 ? 360 / N : 0;
  const sektorHue = useMemo(() => {
    const uniq = [...new Set(stocks.map((s) => s.sector).filter(Boolean))].sort();
    const m = {};
    uniq.forEach((s, i) => { m[s] = Math.round((i * 360) / Math.max(1, uniq.length)); });
    return m;
  }, [stocks]);
  const hueFor = (sec) => (sec && sektorHue[sec] != null ? sektorHue[sec] : 30);
  const navigate = useNavigate();

  const [rot, setRotState] = useState(0);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [w, setW] = useState(900);
  const rotRef = useRef(0);
  const velRef = useRef(0);
  const rafRef = useRef(0);
  const dragging = useRef(false);
  const drag = useRef(null);
  const moved = useRef(false);
  const wrapRef = useRef(null);

  const setRot = (v) => { rotRef.current = v; setRotState(v); };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || 900));
    ro.observe(el);
    setW(el.clientWidth || 900);
    return () => ro.disconnect();
  }, []);

  const animate = () => {
    velRef.current *= 0.93;
    rotRef.current += velRef.current;
    if (Math.abs(velRef.current) < 0.06) {
      rotRef.current = Math.round(rotRef.current / (step || 1)) * step;
      setRotState(rotRef.current);
      velRef.current = 0; rafRef.current = 0;
      return;
    }
    setRotState(rotRef.current);
    rafRef.current = requestAnimationFrame(animate);
  };
  const startAnim = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(animate); };
  const stopAnim = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; } };
  useEffect(() => () => stopAnim(), []);

  const mobil = w < 640;
  const A = Math.min(440, w * 0.46);
  const B = mobil ? 150 : 200;
  const KW = mobil ? 96 : 118, KH = mobil ? 128 : 152;
  const front = mod(Math.round(-rot / (step || 1)), N || 1);
  const aktifIdx = hoverIdx != null ? hoverIdx : front;
  const aktif = stocks[aktifIdx] || null;

  const onPointerDown = (e) => {
    stopAnim();
    drag.current = { px: e.clientX, py: e.clientY, lastX: e.clientX, lastY: e.clientY, r: rotRef.current };
    moved.current = false; velRef.current = 0; dragging.current = true;
    setHoverIdx(null);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.lastX;
    const dy = drag.current.lastY - e.clientY;
    const d = dx + dy;
    if (Math.abs(e.clientX - drag.current.px) > 4 || Math.abs(e.clientY - drag.current.py) > 4) moved.current = true;
    velRef.current = d * 0.30;
    setRot(rotRef.current + d * 0.30);
    drag.current.lastX = e.clientX; drag.current.lastY = e.clientY;
  };
  const onPointerUp = () => {
    if (drag.current) { dragging.current = false; drag.current = null; startAnim(); }
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e) => { e.preventDefault(); velRef.current += -e.deltaY * 0.06; startAnim(); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [step]);

  if (N === 0) return null;
  const anim = dragging.current || rafRef.current;
  const cur = COUNTRY.currency;

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
      style={{ height: mobil ? 470 : 580 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {aktif && (
        <div key={aktif.ticker} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[300px] text-center pointer-events-none animate-in fade-in zoom-in-95 duration-300">
          <div
            role="link" tabIndex={0}
            onClick={() => navigate(`/stock/${aktif.ticker}`)}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/stock/${aktif.ticker}`); }}
            className="group inline-block pointer-events-auto cursor-pointer rounded-2xl px-2 pt-1 pb-2 transition-transform hover:scale-[1.03]"
          >
            <div className="font-serif text-5xl sm:text-6xl font-bold text-foreground leading-none mb-1 group-hover:text-primary transition-colors">{aktif.ticker}</div>
            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{aktif.name}</p>
            {aktif.sector && (
              <div className="mb-4">
                <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full text-white shadow-sm" style={{ backgroundColor: `hsl(${hueFor(aktif.sector)} 62% 48%)` }}>{aktif.sector}</span>
              </div>
            )}
            <div className="inline-flex items-center gap-4 bg-card/90 backdrop-blur border border-border group-hover:border-primary/50 rounded-2xl px-5 py-3 shadow-lg transition-colors">
              <div className="text-center">
                <div className="font-mono text-3xl font-bold" style={{ color: colorFor(aktif.total) }}>{aktif.total ?? 0}</div>
                <div className="text-[10px] text-muted-foreground font-mono">/42 score</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-left">
                <div className="font-mono text-lg font-bold text-foreground">{(aktif.price ?? 0).toFixed(2)} {cur}</div>
                <div className={`font-mono text-xs flex items-center gap-0.5 ${(aktif.change ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  <ArrowUpRight className={`w-3.5 h-3.5 ${(aktif.change ?? 0) < 0 && 'rotate-90'}`} strokeWidth={2.5} />
                  {(aktif.change ?? 0) >= 0 ? '+' : ''}{(aktif.change ?? 0).toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:underline">
                See {aktif.ticker}&apos;s Star <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      )}

      {stocks.map((s, i) => {
        const phi = ((i * step + rot) * Math.PI) / 180;
        const cosp = Math.cos(phi);
        const x = A * Math.sin(phi);
        const wave = Math.sin(phi * 2) * (mobil ? 26 : 42);
        const y = B * cosp + wave;
        const t = (cosp + 1) / 2;
        const scale = 0.5 + t * 0.62;
        const opacity = 0.30 + t * 0.70;
        const z = Math.round(t * 1000);
        const fan = (x / A) * 9;
        const h = hueFor(s.sector);
        const skorRenk = colorFor(s.total);
        const onde = i === front;
        const yakin = t > 0.6;
        const hovered = i === hoverIdx;
        const lift = hovered ? (mobil ? -26 : -40) : 0;
        return (
          <div
            key={s.ticker}
            onMouseEnter={() => { if (!dragging.current) setHoverIdx(i); }}
            onMouseLeave={() => setHoverIdx((hh) => (hh === i ? null : hh))}
            onClick={() => { if (!moved.current) navigate(`/stock/${s.ticker}`); }}
            className="absolute left-1/2 top-1/2 cursor-pointer"
            style={{
              transform: `translate(-50%,-50%) translate(${x}px, ${y + lift}px) rotate(${hovered ? 0 : fan}deg) scale(${hovered ? scale * 1.18 : (onde ? scale * 1.05 : scale)})`,
              opacity: hovered ? 1 : opacity,
              zIndex: hovered ? 1500 : z,
              width: KW, height: KH,
              transition: anim ? 'none' : 'transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.4s',
            }}
          >
            <div
              className={`w-full h-full rounded-xl border flex flex-col items-center justify-center gap-1 px-2 ${hovered ? '' : 'halka-bob'}`}
              style={{
                animationDelay: `${(i % 8) * 0.42}s`,
                borderTopColor: `hsl(${h} 62% 48%)`, borderTopWidth: 3,
                backgroundImage: `linear-gradient(155deg, rgba(255,255,255,0.32), rgba(255,255,255,0) 46%), linear-gradient(0deg, hsla(${h},60%,55%,0.18), hsla(${h},60%,55%,0.18))`,
                backgroundColor: 'hsl(var(--card))',
                boxShadow: hovered
                  ? `0 22px 48px -10px hsla(${h},60%,38%,0.75)`
                  : onde ? `0 10px 26px -6px hsla(${h},60%,40%,0.55)` : '0 4px 12px -4px rgba(0,0,0,0.25)',
              }}
            >
              <span className="font-mono text-2xl font-bold tabular-nums drop-shadow-sm" style={{ color: skorRenk }}>{s.total ?? 0}</span>
              <span className="font-serif text-base font-bold text-foreground leading-none">{s.ticker}</span>
              {yakin && <span className="text-[10px] text-muted-foreground line-clamp-1 text-center leading-tight">{s.sector || ''}</span>}
              {yakin && (
                <span className={`text-[11px] font-mono font-semibold ${(s.change ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {(s.change ?? 0) >= 0 ? '+' : ''}{(s.change ?? 0).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        );
      })}

      <p className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-foreground/45 italic text-center z-[110] pointer-events-none">
        Drag/throw any direction · hover a card (it lifts) · tap the centre → stock page
      </p>
    </div>
  );
}
