import React from 'react';
import { islamicSignal } from '@/lib/islamicCalendar.js';
import { cn } from '@/lib/utils.js';

// Thin always-on strip under the header (mirrors FinanSkor's macro strip): shows the
// Umm al-Qura date and, when relevant, the active Islamic-calendar market signal.
export default function IslamicCalendarStrip() {
  const sig = islamicSignal();
  if (!sig) return null;
  const warn = sig.level === 'warning';
  const info = sig.level === 'info';

  return (
    <div className={cn('border-b text-sm',
      warn ? 'border-medal-bronze/30 bg-medal-bronze/10'
        : info ? 'border-primary/20 bg-primary/5'
          : 'border-border bg-card/40')}>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-1.5 sm:px-6 lg:px-8">
        <span className="text-base">{sig.icon}</span>
        <span className={cn('font-semibold', warn ? 'text-medal-bronze' : info ? 'text-primary' : 'text-foreground/80')}>
          {sig.title}
        </span>
        {sig.note && <span className="hidden truncate text-xs text-muted-foreground md:inline">— {sig.note}</span>}
        {sig.level === 'normal'
          ? null
          : <span className="ml-auto shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">Hijri risk overlay</span>}
      </div>
    </div>
  );
}
