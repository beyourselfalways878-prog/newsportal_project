import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    const token = authHeader.split(' ')[1];

    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return res.status(500).json({ error: 'Missing server-side Supabase credentials (service role key not set)' });

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    // Validate token and get user
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const user = userData.user;

    // Check profile role
    const { data: profileRow, error: profileErr } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profileErr) return res.status(500).json({ error: 'Profile lookup failed' });
    const role = (profileRow?.role || '').toLowerCase();
    if (!(role === 'admin' || role === 'superuser')) {
      return res.status(403).json({ error: 'Insufficient privileges' });
    }

    const payload = req.body || {};
    // Basic validation
    if (!payload.title_hi || !payload.content_hi) return res.status(400).json({ error: 'Missing required fields' });

    // If id present, upsert (update), else insert
    const toUpsert = {
      ...payload,
      updated_at: new Date().toISOString(),
    };

    const { data: insertData, error: insertErr } = await admin.from('articles').upsert([toUpsert]).select().single();
    if (insertErr) {
      // Log the failed server attempt
      try {
        await admin.from('admin_fallbacks').insert([{ user_id: user.id, event_type: 'article_upsert', details: { payload: toUpsert, error: insertErr } }]);
      } catch (logErr) { console.warn('Failed to log admin fallback:', logErr); }
      return res.status(500).json({ error: insertErr.message || insertErr });
    }

    // Log successful admin insert/upsert
    try {
      await admin.from('admin_fallbacks').insert([{ user_id: user.id, event_type: 'article_upsert', details: { article_id: insertData.id, method: 'service' } }]);
    } catch (logErr) { console.warn('Failed to log admin fallback:', logErr); }

    return res.status(200).json({ ok: true, data: insertData });

  } catch (err) {
    console.error('create-article error:', err);
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}
