import React, { useState } from 'react';
import { Rocket, CalendarClock, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, Badge, Stat } from '@/components/ui.jsx';
import JargonTip from '@/components/JargonTip.jsx';
import { IPOS } from '@/data/extras.js';
import { cn } from '@/lib/utils.js';

const STATUS = {
  open: { label: 'Subscription open', variant: 'success', dot: 'bg-success' },
  upcoming: { label: 'Upcoming', variant: 'primary', dot: 'bg-primary' },
  listed: { label: 'Listed', variant: 'muted', dot: 'bg-muted-foreground' },
};

export default function IpoPage() {
  const [tab, setTab] = useState('all');
  const rows = tab === 'all' ? IPOS : IPOS.filter((i) => i.status === tab);
  const counts = {
    open: IPOS.filter((i) => i.status === 'open').length,
    upcoming: IPOS.filter((i) => i.status === 'upcoming').length,
    listed: IPOS.filter((i) => i.status === 'listed').length,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Badge variant="primary" className="mb-3">Tadawul + NOMU</Badge>
      <h1 className="font-serif text-4xl font-bold">IPOs &amp; New Listings</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        The Saudi primary market is one of the most active in the world. Track subscription windows and how recent debuts have traded.
      </p>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat value={counts.open} label="Open now" accent="text-success" />
        <Stat value={counts.upcoming} label="Upcoming" accent="text-primary" />
        <Stat value={counts.listed} label="Recently listed" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {['all', 'open', 'upcoming', 'listed'].map((id) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors',
              tab === id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            {id}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {rows.map((ipo, i) => {
          const st = STATUS[ipo.status];
          return (
            <Card key={i}>
              <CardContent>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-primary" />
                      <h2 className="font-serif text-xl font-bold">{ipo.name}</h2>
                      {ipo.board === 'NOMU' && <Badge variant="muted" className="text-medal-bronze border-medal-bronze/30 bg-medal-bronze/10"><JargonTip term="NOMU" inline>NOMU</JargonTip></Badge>}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{ipo.sector} · {ipo.board} board {ipo.ticker !== '—' && <>· <span className="font-mono">{ipo.ticker}</span></>}</div>
                  </div>
                  <Badge variant={st.variant}><span className={cn('h-2 w-2 rounded-full', st.dot)} /> {st.label}</Badge>
                </div>

                <p className="mt-3 text-sm text-foreground/80">{ipo.note}</p>

                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                  <Field label="Price" value={ipo.priceRange} />
                  <Field label="Offer size" value={ipo.raise} />
                  <Field label="Float" value={`${ipo.offerPct}%`} />
                  {ipo.firstDay
                    ? <Field label="First day" value={ipo.firstDay} accent="text-success" />
                    : <Field label="Subscription" value={ipo.subscription} icon={CalendarClock} />}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">Illustrative listing data. Informational only, not investment advice or an offer to subscribe.</p>
    </div>
  );
}

function Field({ label, value, accent = 'text-foreground', icon: Icon }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn('mt-0.5 inline-flex items-center gap-1 font-medium', accent)}>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}{value}
      </div>
    </div>
  );
}
