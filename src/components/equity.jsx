import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { STAR_DIMS, SHARIA_LABEL, scoreColor } from '@/data/stocks.js';
import { Badge } from '@/components/ui.jsx';

export function ScorePill({ total, size = 'md' }) {
  const cls = size === 'lg' ? 'text-4xl' : 'text-2xl';
  return (
    <span className="inline-flex items-baseline gap-1 font-serif font-bold">
      <span className={cn(cls, scoreColor(total))}>{total}</span>
      <span className="text-sm text-muted-foreground">/42</span>
    </span>
  );
}

export function ShariaBadge({ status, withRatios }) {
  const meta = SHARIA_LABEL[status];
  const Icon = status === 'compliant' ? ShieldCheck : status === 'doubtful' ? ShieldAlert : ShieldX;
  const variant = status === 'compliant' ? 'sharia' : status === 'doubtful' ? 'muted' : 'danger';
  return (
    <Badge variant={variant} className={status === 'doubtful' ? 'text-medal-bronze border-medal-bronze/30 bg-medal-bronze/10' : ''}>
      <Icon className="h-3.5 w-3.5" />
      {meta.text}
    </Badge>
  );
}

export function StarRadar({ star, height = 240 }) {
  const data = STAR_DIMS.map((d) => ({ dim: d.label.replace(' ★', ''), v: star[d.key] }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
        <PolarRadiusAxis domain={[0, 6]} tick={false} axisLine={false} />
        <Radar dataKey="v" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.32} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function StarBars({ star }) {
  return (
    <div className="space-y-2.5">
      {STAR_DIMS.map((d) => {
        const v = star[d.key];
        const isSignal = d.key === 'consensus' || d.key === 'flow';
        return (
          <div key={d.key} className="flex items-center gap-3">
            <div className="w-28 text-xs text-muted-foreground shrink-0">{d.label}</div>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full', isSignal ? 'bg-ai-navy' : 'bg-primary')}
                style={{ width: `${(v / 6) * 100}%` }}
              />
            </div>
            <div className="w-8 text-right text-xs font-mono font-semibold">{v}</div>
          </div>
        );
      })}
    </div>
  );
}
