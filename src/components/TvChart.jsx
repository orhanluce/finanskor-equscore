import React, { useEffect, useRef } from 'react';
import { COUNTRY } from '@/data/stocks.js';

// Map an EquScore stock to a TradingView symbol (exchange prefix per market/board).
const PREFIX = { SA: 'TADAWUL', EG: 'EGX' };
export function tvSymbol(stock) {
  if (COUNTRY.id === 'AE') return `${stock.board || 'DFM'}:${stock.ticker}`;
  return `${PREFIX[COUNTRY.id] || 'TADAWUL'}:${stock.ticker}`;
}

// Free, embeddable TradingView Advanced Chart (display only — no data extraction).
export default function TvChart({ stock, height = 440 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const dark = document.documentElement.classList.contains('dark');
    el.innerHTML = '<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      symbol: tvSymbol(stock),
      autosize: true,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: dark ? 'dark' : 'light',
      style: '1',
      locale: 'en',
      hide_side_toolbar: true,
      allow_symbol_change: false,
      hide_volume: false,
      backgroundColor: dark ? 'rgba(22,27,34,1)' : 'rgba(255,255,255,1)',
      support_host: 'https://www.tradingview.com',
    });
    el.appendChild(script);
    return () => { el.innerHTML = ''; };
  }, [stock.ticker]);

  return (
    <div className="tradingview-widget-container overflow-hidden rounded-xl border border-border" ref={ref} style={{ height }} />
  );
}
