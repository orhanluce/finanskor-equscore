import { createClient } from '@supabase/supabase-js';

// EquScore Supabase project (free tier). URL + publishable/anon key are public by
// design — protected by Row Level Security. Server-side secrets stay in the
// Python ingestion .env, never here.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
export const HAS_SUPABASE = Boolean(supabase);
