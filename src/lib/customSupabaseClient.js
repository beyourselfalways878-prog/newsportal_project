import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.');
  if (import.meta.env.DEV) {
    throw new Error('Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
}

// Explicit auth storage to avoid lost sessions on refresh and cross-tab desync
const authOptions = {
  persistSession: true,
  autoRefreshToken: true,
  storageKey: 'sb-24x7-auth',
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: authOptions });
