// Foreign & institutional flow signal — the MENA-critical "smart money" layer (doc §3.4).
// Reads the foreignFlow ('in'|'out'|'flat') + foreignOwn (%) fields on each stock.
// Sample/EOD today; the pipeline refreshes from the Saudi Exchange weekly
// ownership-by-nationality report in production (same pattern as SAHMK money flow).
// NOTE: the QFI framework was abolished in Feb 2026 — Tadawul is now open to all
// foreign investors, so "foreign flow" is a broad signal, no longer QFI-only.

export function foreignSignal(s) {
  const flow = s.foreignFlow;
  const own = s.foreignOwn ?? null;
  if (flow === 'in' && own != null && own >= 8) {
    return { key: 'validation', label: 'Institutional validation', tone: 'success', rank: 3,
      note: 'Foreign institutions are buying a name they already hold heavily — a strong quality signal.' };
  }
  if (flow === 'in') {
    return { key: 'building', label: 'Foreign accumulation', tone: 'success', rank: 2,
      note: 'Net foreign buying — institutions are building a position.' };
  }
  if (flow === 'out') {
    return { key: 'distribution', label: 'Foreign distribution', tone: 'destructive', rank: 0,
      note: 'Net foreign selling — institutions are trimming exposure.' };
  }
  return { key: 'neutral', label: 'Neutral', tone: 'muted', rank: 1,
    note: 'No clear net foreign flow.' };
}

export const FOREIGN_TONE = {
  success: 'text-success', destructive: 'text-destructive', muted: 'text-muted-foreground',
};
