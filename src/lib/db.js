// EquScore data layer — Supabase queries for predictions, decisions, leaderboard.
import { supabase, HAS_SUPABASE } from '@/lib/supabaseClient.js';
import { LEADERBOARD as SAMPLE_LB } from '@/data/community.js';
import { isRamadanLate } from '@/lib/islamicCalendar.js';

const TYPE_LABEL = { crowd: 'Crowd', analyst: 'Analyst', corporate: 'Corporate', ai: 'AI' };

function currentPeriod() {
  const d = new Date();
  return { monthly: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` };
}

// ── Predictions (Contest) ─────────────────────────────────────────────
export async function submitPrediction({ user, ticker, predictionType, value, horizonDays }) {
  if (!HAS_SUPABASE || !user) throw new Error('Sign in required');
  const { error } = await supabase.from('predictions').insert({
    user_id: user.id,
    user_name: user.username || user.email?.split('@')[0],
    user_type: 'crowd',
    ticker,
    prediction_type: predictionType,
    predicted_value: value,
    horizon_days: horizonDays,
    locked_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function getMyPredictions(userId) {
  if (!HAS_SUPABASE || !userId) return [];
  const { data, error } = await supabase
    .from('predictions')
    .select('id, ticker, prediction_type, predicted_value, horizon_days, locked_at, resolved, accuracy_pct, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Live leaderboard aggregated from predictions; falls back to the sample if empty.
export async function getLeaderboard() {
  if (!HAS_SUPABASE) return { rows: SAMPLE_LB, live: false };
  const { data, error } = await supabase
    .from('predictions')
    .select('user_name, user_type, resolved, accuracy_pct');
  if (error || !data || data.length === 0) return { rows: SAMPLE_LB, live: false };

  const byUser = new Map();
  for (const r of data) {
    const k = r.user_name || 'anon';
    if (!byUser.has(k)) byUser.set(k, { name: k, type: r.user_type, calls: 0, sum: 0, n: 0 });
    const u = byUser.get(k);
    u.calls += 1;
    if (r.resolved && r.accuracy_pct != null) { u.sum += Number(r.accuracy_pct); u.n += 1; }
  }
  const rows = [...byUser.values()]
    .map((u) => ({
      name: u.name, type: TYPE_LABEL[u.type] || 'Crowd', org: 'Individual',
      predictions: u.calls, avgUpside: 0,
      hitRate: u.n ? Math.round((u.sum / u.n) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.hitRate - a.hitRate || b.predictions - a.predictions)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return { rows, live: true };
}

// ── Decisions (Decision Journal -> Mirror) ────────────────────────────
export async function addDecision({ user, ticker, action, reason, note }) {
  if (!HAS_SUPABASE || !user) throw new Error('Sign in required');
  const { error } = await supabase.from('decisions').insert({
    user_id: user.id, ticker, action, reason, note: note || null,
  });
  if (error) throw error;
}

export async function getMyDecisions(userId) {
  if (!HAS_SUPABASE || !userId) return [];
  const { data, error } = await supabase
    .from('decisions')
    .select('id, ticker, action, reason, note, result_pct, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Decision Mirror — aggregate the user's own behaviour by reason (Barber-Odean style).
export function computeMirror(decisions) {
  const byReason = {};
  let withResult = 0;
  for (const d of decisions) {
    const r = d.reason || 'other';
    byReason[r] = byReason[r] || { reason: r, count: 0, sum: 0, scored: 0 };
    byReason[r].count += 1;
    if (d.result_pct != null) { byReason[r].sum += Number(d.result_pct); byReason[r].scored += 1; withResult += 1; }
  }
  const rows = Object.values(byReason).map((b) => ({
    reason: b.reason, count: b.count,
    avg: b.scored ? Math.round((b.sum / b.scored) * 10) / 10 : null,
  })).sort((a, b) => b.count - a.count);
  return { rows, total: decisions.length, withResult };
}

// Saudi-specific behavioural-bias pack (research §6.4) — computed from the user's own
// decisions + stock signals. level: 'warning' | 'info' | 'ok'.
export function computeBiases(decisions, stockByTicker = {}) {
  const out = [];
  if (!decisions.length) return out;
  const now = Date.now();

  // Overconfidence — trading frequency (Barber-Odean; SAMA)
  const last30 = decisions.filter((d) => now - new Date(d.created_at).getTime() < 30 * 864e5);
  out.push(last30.length >= 10
    ? { key: 'overconfidence', level: 'warning', title: 'Overconfidence', detail: `${last30.length} decisions in 30 days — high trading frequency is linked to lower returns.` }
    : { key: 'overconfidence', level: 'ok', title: 'Trading pace', detail: `${last30.length} decisions in the last 30 days — measured.` });

  // Concentration / blue-chip familiarity bias
  const byTicker = {};
  decisions.forEach((d) => { byTicker[d.ticker] = (byTicker[d.ticker] || 0) + 1; });
  const top = Object.entries(byTicker).sort((a, b) => b[1] - a[1])[0];
  if (top && decisions.length >= 3) {
    const share = Math.round((top[1] / decisions.length) * 100);
    out.push(share >= 40
      ? { key: 'concentration', level: 'warning', title: 'Concentration', detail: `${share}% of your decisions are on ${top[0]} — familiarity bias raises hidden risk.` }
      : { key: 'concentration', level: 'ok', title: 'Diversification', detail: `Most-touched name ${top[0]} is ${share}% of decisions.` });
  }

  // MAX / lottery-trap tendency (Tadawul-specific)
  const trapBuys = decisions.filter((d) => d.action === 'buy' && stockByTicker[d.ticker]?.maxFlag === 'trap');
  if (trapBuys.length) out.push({
    key: 'max_trap', level: 'warning', title: 'Lottery / MAX trap',
    detail: `${trapBuys.length} buy(s) on high-attention, weak-profit names — value-trap risk on Tadawul.`,
  });

  // Ramadan sell-timing (§5.1)
  const ramSells = decisions.filter((d) => d.action === 'sell' && isRamadanLate(d.created_at));
  if (ramSells.length) out.push({
    key: 'ramadan_sell', level: 'info', title: 'Ramadan sell-timing',
    detail: `${ramSells.length} sell(s) in Ramadan's final 10 days — a historically weak, liquidity-driven window.`,
  });

  return out;
}

// ── Virtual Portfolio ─────────────────────────────────────────────────
export async function getPortfolio(userId) {
  if (!HAS_SUPABASE || !userId) return [];
  const { data, error } = await supabase
    .from('portfolio')
    .select('id, ticker, shares, buy_price, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function addHolding({ user, ticker, shares, buyPrice }) {
  if (!HAS_SUPABASE || !user) throw new Error('Sign in required');
  const { error } = await supabase.from('portfolio').insert({
    user_id: user.id, ticker, shares: Number(shares), buy_price: Number(buyPrice),
  });
  if (error) throw error;
}
export async function removeHolding(id) {
  if (!HAS_SUPABASE) return;
  const { error } = await supabase.from('portfolio').delete().eq('id', id);
  if (error) throw error;
}

// ── Showcase (Vitrin) portfolios — public, followable ─────────────────
export async function getShowcase(userId) {
  if (!HAS_SUPABASE || !userId) return null;
  const { data, error } = await supabase
    .from('showcase').select('user_id, display_name, blurb, is_public').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function upsertShowcase({ user, displayName, blurb, isPublic }) {
  if (!HAS_SUPABASE || !user) throw new Error('Sign in required');
  const { error } = await supabase.from('showcase').upsert({
    user_id: user.id,
    display_name: displayName,
    blurb: blurb || null,
    is_public: !!isPublic,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

// Public showcases + their holdings + follower counts, ready for client-side scoring.
export async function getPublicShowcases() {
  if (!HAS_SUPABASE) return [];
  const { data: profiles, error } = await supabase
    .from('showcase').select('user_id, display_name, blurb').eq('is_public', true);
  if (error || !profiles?.length) return [];
  const ids = profiles.map((p) => p.user_id);

  const [{ data: holdings }, { data: follows }] = await Promise.all([
    supabase.from('portfolio').select('user_id, ticker, shares, buy_price').in('user_id', ids),
    supabase.from('showcase_follows').select('target_id').in('target_id', ids),
  ]);

  const byUser = new Map(profiles.map((p) => [p.user_id, { ...p, holdings: [], followers: 0 }]));
  (holdings || []).forEach((h) => byUser.get(h.user_id)?.holdings.push(h));
  (follows || []).forEach((f) => { const u = byUser.get(f.target_id); if (u) u.followers += 1; });
  return [...byUser.values()];
}

export async function getMyFollows(userId) {
  if (!HAS_SUPABASE || !userId) return [];
  const { data, error } = await supabase
    .from('showcase_follows').select('target_id').eq('follower_id', userId);
  if (error) throw error;
  return (data || []).map((r) => r.target_id);
}

export async function followShowcase(user, targetId) {
  if (!HAS_SUPABASE || !user) throw new Error('Sign in required');
  const { error } = await supabase.from('showcase_follows').insert({ follower_id: user.id, target_id: targetId });
  if (error) throw error;
}

export async function unfollowShowcase(user, targetId) {
  if (!HAS_SUPABASE || !user) throw new Error('Sign in required');
  const { error } = await supabase.from('showcase_follows').delete().eq('follower_id', user.id).eq('target_id', targetId);
  if (error) throw error;
}

// ── Membership (admin-approved access) ────────────────────────────────
export async function getMembership(userId) {
  if (!HAS_SUPABASE || !userId) return null;
  const { data, error } = await supabase
    .from('memberships').select('status, requested_at, reviewed_at').eq('user_id', userId).maybeSingle();
  if (error) { console.warn('getMembership', error.message); return null; }
  return data;
}
export async function requestMembership({ user, fullName, linkedin }) {
  if (!HAS_SUPABASE || !user) throw new Error('Sign in required');
  const { error } = await supabase.from('memberships').upsert({
    user_id: user.id, email: user.email, full_name: fullName, linkedin, status: 'pending',
    requested_at: new Date().toISOString(),
  });
  if (error) throw error;
}
export async function getMemberships(status = 'pending') {
  if (!HAS_SUPABASE) return [];
  let q = supabase.from('memberships').select('user_id, email, full_name, linkedin, status, requested_at');
  if (status !== 'all') q = q.eq('status', status);
  const { data, error } = await q.order('requested_at', { ascending: false });
  if (error) { console.warn('getMemberships', error.message); return []; }
  return data || [];
}
export async function reviewMembership(userId, status) {
  if (!HAS_SUPABASE) return;
  const { error } = await supabase.from('memberships')
    .update({ status, reviewed_at: new Date().toISOString() }).eq('user_id', userId);
  if (error) throw error;
}

// ── Verification (VerifOK) ────────────────────────────────────────────
export async function getMyVerification(userId) {
  if (!HAS_SUPABASE || !userId) return null;
  const { data, error } = await supabase
    .from('verifications').select('display_name, handle, statement, status').eq('user_id', userId).maybeSingle();
  if (error) { console.warn('getMyVerification', error.message); return null; }
  return data;
}
export async function requestVerification({ user, displayName, handle, statement }) {
  if (!HAS_SUPABASE || !user) throw new Error('Sign in required');
  const { error } = await supabase.from('verifications').upsert({
    user_id: user.id, display_name: displayName, handle, statement, status: 'pending',
  });
  if (error) throw error;
}
export async function getVerifiedInvestors() {
  if (!HAS_SUPABASE) return [];
  const { data, error } = await supabase
    .from('verifications').select('display_name, handle, statement, status').eq('status', 'approved');
  if (error) { console.warn('getVerifiedInvestors', error.message); return []; }
  return data || [];
}
export async function getVerifications(status = 'pending') {
  if (!HAS_SUPABASE) return [];
  let q = supabase.from('verifications').select('user_id, display_name, handle, statement, status');
  if (status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) { console.warn('getVerifications', error.message); return []; }
  return data || [];
}
export async function reviewVerification(userId, status) {
  if (!HAS_SUPABASE) return;
  const { error } = await supabase.from('verifications').update({ status }).eq('user_id', userId);
  if (error) throw error;
}

// Admin check (client-side mirror of the SQL is_admin allowlist)
export const ADMIN_EMAILS = ['orhhanisik@gmail.com'];
export function isAdmin(user) {
  return !!user && ADMIN_EMAILS.includes(user.email);
}

export { currentPeriod };
