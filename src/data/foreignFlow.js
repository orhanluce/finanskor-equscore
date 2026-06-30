// QFI / foreign-flow signal — the MENA-critical "smart money" layer (doc §3.4).
// Reads the foreignFlow ('in'|'out'|'flat') + foreignOwn (%) fields already on each
// stock. These are sample/EOD today; the otomasyon pipeline refreshes them from the
// Tadawul weekly QFI report in production (same pattern as SAHMK money flow).

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
