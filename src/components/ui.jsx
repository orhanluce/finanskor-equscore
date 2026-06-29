import React from 'react';
import { cn } from '@/lib/utils.js';

export function Card({ className, ...props }) {
  return <div className={cn('rounded-2xl border border-border bg-card text-card-foreground shadow-sm', className)} {...props} />;
}
export function CardHeader({ className, ...props }) {
  return <div className={cn('p-5 pb-2', className)} {...props} />;
}
export function CardTitle({ className, ...props }) {
  return <h3 className={cn('font-serif text-lg font-bold leading-tight', className)} {...props} />;
}
export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-2', className)} {...props} />;
}

const BTN = {
  primary: 'bg-foreground text-background hover:bg-foreground/90',
  accent: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-border text-foreground hover:bg-foreground/5',
  ghost: 'text-foreground hover:bg-foreground/5',
};
export function Button({ variant = 'accent', className, as: As = 'button', ...props }) {
  return (
    <As
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 text-sm font-medium transition-colors disabled:opacity-50',
        BTN[variant], className
      )}
      {...props}
    />
  );
}

export function Badge({ className, variant = 'muted', ...props }) {
  const styles = {
    muted: 'bg-muted text-muted-foreground',
    primary: 'border border-primary/30 text-primary bg-primary/5',
    success: 'bg-success/10 text-success border border-success/25',
    danger: 'bg-destructive/10 text-destructive border border-destructive/25',
    sharia: 'bg-sharia/10 text-sharia border border-sharia/25',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold', styles[variant], className)} {...props} />
  );
}

export function Stat({ value, label, accent = 'text-foreground', sub }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className={cn('font-serif text-2xl font-bold leading-none', accent)}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground leading-snug">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground/80">{sub}</div>}
    </div>
  );
}
