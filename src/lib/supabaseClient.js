import { createClient } from '@supabase/supabase-js';

// EquScore Supabase project (free tier). URL + publishable/anon key are PUBLIC by
// design — they ship in every client bundle and are protected by Row Level Security.
// Hard-coded as defaults so the app works even when the build host has no .env
// (e.g. Hostinger's own `npm run build`); an env var still overrides if present.
// Server-side secrets (service_role, Groq, etc.) stay in the Python .env, never here.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://zmfxcwdnjevgjnwtutet.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JV8UZLJZb2sPz_7FNaVhIA_NbbEUtym';

export const supabase = url && key ? createClient(url, key) : null;
export const HAS_SUPABASE = Boolean(supabase);
