import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// SAR / AED / QAR formatting (USD-pegged, so values are stable)
export function money(v, currency = 'SAR') {
  if (v == null || Number.isNaN(v)) return '—';
  return `${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function pct(v, withSign = true) {
  if (v == null || Number.isNaN(v)) return '—';
  const s = withSign && v > 0 ? '+' : '';
  return `${s}${Number(v).toFixed(2)}%`;
}

export function bn(v, currency = 'SAR') {
  if (v == null) return '—';
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B ${currency}`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(0)}M ${currency}`;
  return `${v} ${currency}`;
}
