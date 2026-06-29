import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Anasayfa hero'su için hafif WebGL "canlı borsa grafiği":
// Sağdan sola akan mum çubukları (yeşil/kırmızı) + altın ana fiyat çizgisi (altında
// yumuşak alan dolgusu) + arkada birkaç ince "ticker" çizgisi + soluk ızgara.
// Konseptimize (BIST karne katmanı) uygun, canlı piyasa hissi verir.
// Light arka planda şık durur, metni bozmaz (pointer-events yok). WebGL yoksa /
// reduced-motion'da nazikçe geri çekilir (mevcut görsel fallback kalır).

// FinanSkor 7-boyut paleti
const GOLD = 0xD4AF37;   // ana fiyat çizgisi
const UP   = 0x4F7942;   // yükseliş mumu (orman yeşili)
const DOWN = 0xB5651D;   // düşüş mumu (siena)
const TICKERS = [0x6D5AA6, 0x3E6E9E, 0x2FA89B]; // arka plan ticker çizgileri

const SPAN = 100;        // dünya genişliği (x: 0..SPAN)
const TOP = 1.18, BOTTOM = -1.18;
const DX = 1.7;          // mumlar arası mesafe
const OVER = 6;          // ekran dışı taşma payı (kenarlar boş kalmasın)

// 0..1 yumuşak rastgele yürüyüş üreteci (geri dönüşlü, hafif yukarı eğilimli)
function makeWalk(seed) {
  let v = seed;
  return (bias = 0.08, step = 0.22, lo = -0.95, hi = 1.02) => {
    v += (Math.random() - 0.5) * step + (bias - v) * 0.025;
    if (v < lo) v = lo; if (v > hi) v = hi;
    return v;
  };
}

export default function WebGLHero({ className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    let glOk = true;
    try {
      const test = document.createElement('canvas');
      glOk = !!(test.getContext('webgl') || test.getContext('webgl2'));
    } catch { glOk = false; }
    if (!glOk) return;

    const mobil = window.innerWidth < 768;

    const scene = new THREE.Scene();
    // Ortografik kamera: [0..SPAN] x [BOTTOM..TOP] alanını öğeyi dolduracak şekilde uzatır
    const camera = new THREE.OrthographicCamera(0, SPAN, TOP, BOTTOM, -10, 10);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobil ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';

    const group = new THREE.Group();
    scene.add(group);

    // M: ekranı + taşmayı kaplayacak mum/nokta sayısı
    const M = Math.ceil((SPAN + OVER * 2) / DX) + 1;
    const baseX = i => i * DX - OVER;        // i. noktanın temel x'i (kaydırma çıkarılır)

    // ---- Soluk yatay ızgara (statik) ----
    {
      const ys = [-0.65, -0.25, 0.15, 0.55, 0.9];
      const g = new Float32Array(ys.length * 2 * 3);
      ys.forEach((y, k) => {
        g[k * 6] = 0;    g[k * 6 + 1] = y; g[k * 6 + 2] = 0;
        g[k * 6 + 3] = SPAN; g[k * 6 + 4] = y; g[k * 6 + 5] = 0;
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(g, 3));
      const mat = new THREE.LineBasicMaterial({ color: 0x6D5AA6, transparent: true, opacity: 0.06 });
      group.add(new THREE.LineSegments(geo, mat));
    }

    // ---- Arka plan "ticker" çizgileri ----
    const tickers = TICKERS.map((color, idx) => {
      const walk = makeWalk(0.2 + idx * 0.25);
      const ys = new Array(M);
      const baseline = -0.55 + idx * 0.5;    // her ticker farklı yükseklikte gezinsin
      for (let i = 0; i < M; i++) ys[i] = baseline + walk(baseline, 0.16) * 0.35;
      const pos = new Float32Array(M * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.22 });
      group.add(new THREE.Line(geo, mat));
      return { ys, pos, geo, baseline, walk };
    });

    // ---- Ana seri (mum çubukları + altın çizgi + alan dolgusu) ----
    const pWalk = makeWalk(0.5);
    const closes = new Array(M);
    const wick = new Array(M);
    for (let i = 0; i < M; i++) { closes[i] = pWalk(); wick[i] = 0.02 + Math.random() * 0.06; }

    // Mum gövdeleri: 4 köşe / mum (2 üçgen)
    const bodyPos = new Float32Array(M * 4 * 3);
    const bodyCol = new Float32Array(M * 4 * 3);
    const bodyIdx = [];
    for (let i = 0; i < M; i++) {
      const o = i * 4;
      bodyIdx.push(o, o + 1, o + 2, o, o + 2, o + 3);
    }
    const bodyGeo = new THREE.BufferGeometry();
    bodyGeo.setAttribute('position', new THREE.BufferAttribute(bodyPos, 3));
    bodyGeo.setAttribute('color', new THREE.BufferAttribute(bodyCol, 3));
    bodyGeo.setIndex(bodyIdx);
    const bodyMat = new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide,
    });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Mum fitilleri (high-low)
    const wickPos = new Float32Array(M * 2 * 3);
    const wickGeo = new THREE.BufferGeometry();
    wickGeo.setAttribute('position', new THREE.BufferAttribute(wickPos, 3));
    const wickMat = new THREE.LineBasicMaterial({ color: 0x4a4a4a, transparent: true, opacity: 0.32 });
    group.add(new THREE.LineSegments(wickGeo, wickMat));

    // Altın ana fiyat çizgisi
    const linePos = new Float32Array(M * 3);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.55 });
    group.add(new THREE.Line(lineGeo, lineMat));

    // Çizgi altı alan dolgusu (altın, çok hafif)
    const areaPos = new Float32Array(M * 2 * 3);
    const areaIdx = [];
    for (let i = 0; i < M - 1; i++) {
      const o = i * 2;
      areaIdx.push(o, o + 1, o + 3, o, o + 3, o + 2);
    }
    const areaGeo = new THREE.BufferGeometry();
    areaGeo.setAttribute('position', new THREE.BufferAttribute(areaPos, 3));
    areaGeo.setIndex(areaIdx);
    const areaMat = new THREE.MeshBasicMaterial({
      color: GOLD, transparent: true, opacity: 0.055, depthWrite: false, side: THREE.DoubleSide,
    });
    group.add(new THREE.Mesh(areaGeo, areaMat));

    const cUp = new THREE.Color(UP), cDown = new THREE.Color(DOWN);
    const bw = DX * 0.32; // mum gövde yarı genişliği

    // Geometrileri mevcut diziye göre güncelle (frac: alt-piksel kaydırma)
    function writeGeometry(frac) {
      // ticker çizgileri
      for (const t of tickers) {
        for (let i = 0; i < M; i++) {
          t.pos[i * 3] = baseX(i) - frac;
          t.pos[i * 3 + 1] = t.ys[i];
          t.pos[i * 3 + 2] = 0;
        }
        t.geo.attributes.position.needsUpdate = true;
      }
      // ana seri
      for (let i = 0; i < M; i++) {
        const x = baseX(i) - frac;
        const close = closes[i];
        const open = i > 0 ? closes[i - 1] : close;
        const up = close >= open;
        let top = Math.max(open, close), bot = Math.min(open, close);
        if (top - bot < 0.012) { top += 0.012; bot -= 0.012; } // doji min boy
        const col = up ? cUp : cDown;
        // gövde 4 köşe
        const o = i * 4;
        bodyPos[o * 3] = x - bw;      bodyPos[o * 3 + 1] = bot; bodyPos[o * 3 + 2] = 0;
        bodyPos[(o + 1) * 3] = x + bw; bodyPos[(o + 1) * 3 + 1] = bot; bodyPos[(o + 1) * 3 + 2] = 0;
        bodyPos[(o + 2) * 3] = x + bw; bodyPos[(o + 2) * 3 + 1] = top; bodyPos[(o + 2) * 3 + 2] = 0;
        bodyPos[(o + 3) * 3] = x - bw; bodyPos[(o + 3) * 3 + 1] = top; bodyPos[(o + 3) * 3 + 2] = 0;
        for (let k = 0; k < 4; k++) {
          bodyCol[(o + k) * 3] = col.r; bodyCol[(o + k) * 3 + 1] = col.g; bodyCol[(o + k) * 3 + 2] = col.b;
        }
        // fitil
        wickPos[i * 6] = x;     wickPos[i * 6 + 1] = top + wick[i]; wickPos[i * 6 + 2] = 0;
        wickPos[i * 6 + 3] = x; wickPos[i * 6 + 4] = bot - wick[i]; wickPos[i * 6 + 5] = 0;
        // ana çizgi
        linePos[i * 3] = x; linePos[i * 3 + 1] = close; linePos[i * 3 + 2] = 0;
        // alan dolgusu (üst = close, alt = BOTTOM)
        areaPos[i * 6] = x;     areaPos[i * 6 + 1] = close;  areaPos[i * 6 + 2] = 0;
        areaPos[i * 6 + 3] = x; areaPos[i * 6 + 4] = BOTTOM; areaPos[i * 6 + 5] = 0;
      }
      bodyGeo.attributes.position.needsUpdate = true;
      bodyGeo.attributes.color.needsUpdate = true;
      wickGeo.attributes.position.needsUpdate = true;
      lineGeo.attributes.position.needsUpdate = true;
      areaGeo.attributes.position.needsUpdate = true;
    }

    // Bir mum kaydır: en soldakini at, sağa yeni mum ekle
    function shift() {
      closes.shift(); closes.push(pWalk());
      wick.shift();   wick.push(0.02 + Math.random() * 0.06);
      for (const t of tickers) { t.ys.shift(); t.ys.push(t.baseline + t.walk(t.baseline, 0.16) * 0.35); }
    }

    const resize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Hafif fare paralaksı
    const target = { x: 0, y: 0 };
    const onMove = (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const render = () => renderer.render(scene, camera);

    let raf = 0, frac = 0;
    const SPEED = 0.020; // dünya birimi / kare (çok yavaş, sakin — dikkat dağıtmaz)

    if (reduce) {
      writeGeometry(0);
      render();
    } else {
      const loop = () => {
        frac += SPEED;
        while (frac >= DX) { frac -= DX; shift(); }
        writeGeometry(frac);
        // metni bozmadan çok hafif paralaks (yumuşak)
        group.position.y += (target.y * 0.03 - group.position.y) * 0.03;
        group.position.x += (target.x * 0.5 - group.position.x) * 0.03;
        render();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('mousemove', onMove);
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  return <div ref={ref} className={className} aria-hidden="true" style={{ pointerEvents: 'none' }} />;
}
