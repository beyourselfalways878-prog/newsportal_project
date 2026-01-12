import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import process from 'process';

const argv = Object.fromEntries(process.argv.slice(2).map(s => {
  const [k, v] = s.split('=');
  return [k.replace(/^--/, ''), v];
}));
const id = argv.id || argv.u;
if (!id) {
  console.error('Usage: node scripts/get_profile.mjs --id=<user-id>');
  process.exit(2);
}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(2);
}

(async () => {
  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await admin.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error) {
      console.error('Query error:', error);
      process.exit(3);
    }
    console.log('Profile row:', data);
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err?.message || err);
    process.exit(99);
  }
})();