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

    // Use a short-lived verifier client to avoid mutating the admin client's auth state
    const verifier = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userErr } = await verifier.auth.getUser(token);
    if (userErr || !userData?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const user = userData.user;

    // Create a fresh admin client for privileged actions (do not reuse verifier)
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    // Check profile role
    const { data: profileRow, error: profileErr } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profileErr) return res.status(500).json({ error: 'Profile lookup failed' });
    const role = (profileRow?.role || '').toLowerCase();
    if (!(role === 'admin' || role === 'superuser')) {
      return res.status(403).json({ error: 'Insufficient privileges' });
    }

    const { filename, content_type, data } = req.body || {};
    if (!filename || !content_type || !data) return res.status(400).json({ error: 'Missing filename, content_type or data' });

    const buffer = Buffer.from(data, 'base64');

    const { data: uploadData, error: uploadErr } = await admin.storage.from('article-images').upload(filename, buffer, { contentType: content_type });
    if (uploadErr) {
      console.error('Service upload error:', uploadErr);
      // Log fallback attempt
      try {
        await admin.from('admin_fallbacks').insert([{ user_id: user.id, event_type: 'upload', details: { filename, error: uploadErr } }]);
      } catch (logErr) { console.warn('Failed to log admin fallback:', logErr); }
      return res.status(500).json({ error: uploadErr.message || uploadErr });
    }

    const { data: urlData } = admin.storage.from('article-images').getPublicUrl(uploadData.path);

    // Log successful service upload
    try {
      await admin.from('admin_fallbacks').insert([{ user_id: user.id, event_type: 'upload', details: { filename, path: uploadData.path, publicUrl: urlData.publicUrl, method: 'service' } }]);
    } catch (logErr) { console.warn('Failed to log admin fallback:', logErr); }

    return res.status(200).json({ path: uploadData.path, publicUrl: urlData.publicUrl });

  } catch (err) {
    console.error('upload-image error:', err);
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}
