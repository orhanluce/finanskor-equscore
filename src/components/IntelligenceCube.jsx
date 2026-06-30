import React, { useEffect, useRef, useState } from 'react';
import { t } from '@/i18n.js';

// Intelligence Cube — the 3D counterpart of the 7-dimension Equity Star.
// 6 faces (Health + Dividend share the left face). Drag to rotate freely; click a
// face to zoom + select; selecting a dimension in the Star rotates that face to front.
// Face map: Value->front · Growth->right · Quality->back · Health+Dividend->left ·
//           Consensus->top · Money Flow->bottom
const FACES = [
  { key: 'front', rot: 'rotateY(0deg)', dims: [0], tint: '#7C5CCB' },
  { key: 'right', rot: 'rotateY(90deg)', dims: [1], tint: '#3E84C4' },
  { key: 'back', rot: 'rotateY(180deg)', dims: [2], tint: '#D98A3D' },
  { key: 'left', rot: 'rotateY(-90deg)', dims: [3, 4], tint: '#2FA89B' },
  { key: 'top', rot: 'rotateX(90deg)', dims: [5], tint: '#C9A227' },
  { key: 'bottom', rot: 'rotateX(-90deg)', dims: [6], tint: '#5B9A4A' },
];
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
const FRONT_ROT = {
  front: { x: 0, y: 0 }, right: { x: 0, y: -90 }, back: { x: 0, y: -180 },
  left: { x: 0, y: 90 }, top: { x: -90, y: 0 }, bottom: { x: 90, y: 0 },
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const nearest = (cur, target) => target + 360 * Math.round((cur - target) / 360);

export default function IntelligenceCube({ axes, scores, explanations, activeIndex = null, onSelect }) {
  const SIZE = 280;
  const half = SIZE / 2;
  const [rot, setRot] = useState({ x: -20, y: 24 });
  const [dragging, setDragging] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const drag = useRef(null);
  const moved = useRef(false);
  const tapDim = useRef(null);

  useEffect(() => {
    if (activeIndex == null) return;
    const face = FACES.find((f) => f.dims.includes(activeIndex));
    if (!face) return;
    const t = FRONT_ROT[face.key];
    setRot((p) => ({ x: t.x, y: nearest(p.y, t.y) }));
  }, [activeIndex]);

  useEffect(() => {
    if (!zoomed) return;
    const close = () => setZoomed(false);
    const t = setTimeout(() => {
      window.addEventListener('pointerdown', close, true);
      window.addEventListener('wheel', close, { passive: true });
    }, 0);
    return () => { clearTimeout(t); window.removeEventListener('pointerdown', close, true); window.removeEventListener('wheel', close); };
  }, [zoomed]);

  const onPointerDown = (e) => {
    drag.current = { px: e.clientX, py: e.clientY, rx: rot.x, ry: rot.y };
    moved.current = false;
    const el = e.target.closest?.('[data-dim]');
    tapDim.current = el ? Number(el.dataset.dim) : null;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    if (Math.abs(dx) + Math.abs(dy) > 5) moved.current = true;
    setRot({ x: clamp(drag.current.rx - dy * 0.55, -90, 90), y: drag.current.ry + dx * 0.55 });
  };
  const onPointerUp = () => {
    if (!moved.current && tapDim.current != null && onSelect) { onSelect(tapDim.current); setZoomed(true); }
    drag.current = null; setDragging(false);
  };
  const selectDim = (i) => { if (onSelect) { onSelect(i); setZoomed(true); } };

  return (
    <div className="flex flex-col items-center select-none">
      <div style={{
        transform: zoomed ? 'scale(1.45)' : 'scale(1)', transformOrigin: 'center center',
        transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)', position: 'relative', zIndex: zoomed ? 30 : 'auto',
      }}>
        <div className="relative cursor-grab active:cursor-grabbing touch-none"
          style={{ width: SIZE, height: SIZE, perspective: '1300px' }}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
          <div className="absolute inset-0" style={{
            transformStyle: 'preserve-3d',
            transform: `translateZ(-${half}px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
            transition: dragging ? 'none' : 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
          }}>
            {FACES.map((face) => {
              const c = face.tint;
              return (
                <div key={face.key}
                  className="absolute bg-card border border-border rounded-2xl shadow-lg overflow-hidden flex flex-col"
                  style={{
                    width: SIZE, height: SIZE, transform: `${face.rot} translateZ(${half}px)`,
                    backfaceVisibility: 'hidden', borderTop: `4px solid ${c}`,
                    backgroundImage: `linear-gradient(0deg, ${rgba(c, 0.16)}, ${rgba(c, 0.16)})`,
                  }}>
                  {face.dims.map((i, k) => {
                    const starred = i > 4;
                    const shared = face.dims.length > 1;
                    return (
                      <div key={i} role="button" tabIndex={0} data-dim={i}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectDim(i); } }}
                        className={`flex-1 cursor-pointer text-left px-4 ${shared ? 'py-2.5' : 'py-4'} flex flex-col ${k > 0 ? 'border-t border-border' : ''} hover:bg-muted/40 transition-colors`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-serif font-bold text-foreground text-lg">
                            {t(axes[i])} {starred && <span style={{ color: c }}>★</span>}
                          </span>
                          <span className="font-mono font-bold text-base" style={{ color: c }}>{scores[i]}/6</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden mb-2.5">
                          <div className="h-full rounded-full" style={{ width: `${(scores[i] / 6) * 100}%`, backgroundColor: c }} />
                        </div>
                        <p className={`text-[13.5px] text-foreground/75 leading-snug overflow-hidden ${shared ? 'line-clamp-2' : 'line-clamp-6'}`}>
                          {explanations[i]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="mt-5 text-xs text-foreground/45 italic text-center">
        {t('Tap a face: cube zooms · drag to rotate · tap or scroll to reset')}
      </p>
    </div>
  );
}
