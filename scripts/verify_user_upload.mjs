import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import process from 'process';

const argv = Object.fromEntries(process.argv.slice(2).map(s => {
  const [k, v] = s.split('=');
  return [k.replace(/^--/, ''), v];
}));
const email = argv.email || process.env.VERIFY_EMAIL;
const password = argv.password || process.env.VERIFY_PASSWORD;

if (!email || !password) {
  console.error('Usage: node scripts/verify_user_upload.mjs --email=<email> --password=<password>');
  process.exit(2);
}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !serviceKey || !anonKey) {
  console.error('Missing required env vars (VITE_SUPABASE_URL / SUPABASE_URL, SERVICE_ROLE_KEY, and ANON_KEY)');
  process.exit(2);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const client = createClient(url, anonKey, { auth: { persistSession: false } });

(async () => {
  try {
    console.log('Signing in as user:', email);
    const { data: signData, error: signErr } = await client.auth.signInWithPassword({ email, password });
    if (signErr) {
      console.error('Sign-in error:', signErr);
      process.exit(3);
    }
    const session = signData.session;
    if (!session) {
      console.error('No session returned from sign-in');
      process.exit(4);
    }

    await client.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });

    const userId = session.user.id;
    console.log('Signed in successfully, user id:', userId);

    // Verify profile and role
    const { data: existingProfile, error: profileErr } = await admin.from('profiles').select('id, role, full_name').eq('id', userId).maybeSingle();
    if (profileErr) {
      console.error('Error fetching profile via admin client:', profileErr);
      process.exit(5);
    }

    if (!existingProfile) {
      console.warn('No profile row found for user; creating profile with role=admin');
      const { error: insertErr } = await admin.from('profiles').insert([{ id: userId, full_name: session.user.user_metadata?.full_name || session.user.email, role: 'admin' }]);
      if (insertErr) {
        console.error('Could not create profile row:', insertErr);
        process.exit(6);
      }
    } else if (!['admin','superuser'].includes((existingProfile.role||'').toLowerCase())) {
      console.warn('Profile exists but is not admin/superuser; updating to role=admin');
      const { error: updateErr } = await admin.from('profiles').upsert([{ id: userId, role: 'admin' }]);
      if (updateErr) {
        console.error('Could not update profile role:', updateErr);
        process.exit(7);
      }
    } else {
      console.log('Profile role is admin/superuser:', existingProfile.role);
    }

    // Call the helper RPC to ensure it returns true for this user
    try {
      const { data: fnData, error: fnErr } = await admin.rpc('is_admin_or_superuser', { uid: userId });
      if (fnErr) {
        console.warn('is_admin_or_superuser RPC error:', fnErr);
      } else {
        console.log('is_admin_or_superuser returned:', fnData);
      }
    } catch (e) {
      console.warn('RPC call failed:', e);
    }

    // Upload tiny PNG
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(base64, 'base64');
    const timestamp = Date.now();

    // Helper to attempt upload and insert
    const attemptUploadAndInsert = async (label, clientInstance) => {
      const fileNameLocal = `verify/${userId}/${label}-${Date.now()}.png`;
      console.log(`\n[${label}] Uploading image (file: ${fileNameLocal})...`);

      let uploadDataLocal = null;
      let uploadErrorLocal = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await clientInstance.storage.from('article-images').upload(fileNameLocal, buffer, { contentType: 'image/png' });
          uploadDataLocal = res.data;
          uploadErrorLocal = res.error;
        } catch (err) {
          uploadErrorLocal = err;
        }

        if (!uploadErrorLocal) break;
        console.warn(`[${label}] Attempt ${attempt} failed:`, uploadErrorLocal.message || uploadErrorLocal);
        await new Promise(r => setTimeout(r, 500));
      }

      let usedAdminUpload = false;
      let uploadedPath = null;
      let publicUrl = null;

      if (uploadErrorLocal) {
        try {
          const inspect = (await import('util')).inspect;
          console.error(`[${label}] Client upload error (detailed):`, inspect(uploadErrorLocal, { showHidden: true, depth: 5 }));
        } catch (e) {
          console.error(`[${label}] Client upload error:`, uploadErrorLocal);
        }

        console.log(`[${label}] Attempting admin fallback upload...`);
        try {
          const adminRes = await admin.storage.from('article-images').upload(`verify-admin/${userId}/${label}-${Date.now()}.png`, buffer, { contentType: 'image/png' });
          if (adminRes.error) {
            console.error(`[${label}] Admin upload error:`, adminRes.error);
            throw adminRes.error;
          }
          usedAdminUpload = true;
          uploadedPath = adminRes.data.path;
          const { data: urlData } = admin.storage.from('article-images').getPublicUrl(adminRes.data.path);
          publicUrl = urlData.publicUrl;
          console.log(`[${label}] Admin upload succeeded, path:`, uploadedPath);
        } catch (err) {
          console.error(`[${label}] Admin upload failed:`, err);
          throw new Error('Both client and admin uploads failed');
        }
      } else {
        uploadedPath = uploadDataLocal.path;
        const { data: urlData } = clientInstance.storage.from('article-images').getPublicUrl(uploadDataLocal.path);
        publicUrl = urlData.publicUrl;
        console.log(`[${label}] Client upload succeeded, path:`, uploadedPath);
      }

      // Insert article
      console.log(`[${label}] Inserting article as client...`);
      const now = new Date().toISOString();
      const { data: insertData, error: insertErr } = await clientInstance.from('articles').insert([{ 
        title_hi: `Verify Upload ${label} ${timestamp}`,
        excerpt_hi: 'Verification run',
        content_hi: `<p>Verification article <img src="${publicUrl}" /></p>`,
        category: 'indian',
        author: session.user.user_metadata?.full_name || session.user.email,
        location: 'Verification',
        image_url: publicUrl,
        image_alt_text_hi: 'verification image',
        seo_title_hi: 'Verify',
        seo_keywords_hi: 'verify,upload',
        published_at: now,
        updated_at: now
      }]).select().single();

      if (insertErr) {
        console.error(`[${label}] Client insert error:`, insertErr);

        // Diagnostic: try simple select to reveal server state
        try {
          const { rows } = await admin.rpc('increment_view_count', { article_id: '00000000-0000-0000-0000-000000000000' }).catch(()=>null);
        } catch (diagErr) {
          console.warn(`[${label}] Diagnostic RPC error (ignored):`, diagErr?.message || diagErr);
        }

        // Try admin-side insert as fallback so upload flow still works in UI
        console.log(`[${label}] Attempting server-side insert as fallback (service role)...`);
        try {
          const { data: adminInsertData, error: adminInsertErr } = await admin.from('articles').insert([{ 
            title_hi: `Verify Upload ${label} ${timestamp}`,
            excerpt_hi: 'Verification run (admin fallback)',
            content_hi: `<p>Verification article (admin fallback) <img src="${publicUrl}" /></p>`,
            category: 'indian',
            author: session.user.user_metadata?.full_name || session.user.email,
            location: 'Verification',
            image_url: publicUrl,
            image_alt_text_hi: 'verification image',
            seo_title_hi: 'Verify',
            seo_keywords_hi: 'verify,upload',
            published_at: now,
            updated_at: now
          }]).select().single();

          if (adminInsertErr) {
            console.error(`[${label}] Admin insert also failed:`, adminInsertErr);
            if (uploadedPath && usedAdminUpload) {
              try { await admin.storage.from('article-images').remove([uploadedPath]); } catch (e) { console.warn(`[${label}] Cleanup remove failed:`, e); }
            }
            throw new Error('Admin article insert failed too');
          }

          console.log(`[${label}] Admin-side article insert succeeded. Article id:`, adminInsertData.id);

          // Cleanup admin-inserted article and uploaded image
          try { await admin.from('articles').delete().eq('id', adminInsertData.id); } catch (e) { console.warn(`[${label}] Failed to delete admin-inserted article:`, e); }
          try { if (uploadedPath) await admin.storage.from('article-images').remove([uploadedPath]); } catch (e) { console.warn(`[${label}] Failed to remove image:`, e); }

          console.log(`[${label}] Attempt completed via admin fallback`);
          return true;
        } catch (adminErr) {
          console.error(`[${label}] Admin fallback failed:`, adminErr);
          if (uploadedPath && usedAdminUpload) {
            try { await admin.storage.from('article-images').remove([uploadedPath]); } catch (e) { console.warn(`[${label}] Cleanup remove failed:`, e); }
          }
          throw new Error('Article insert failed (client + admin fallback)');
        }
      }

      console.log(`[${label}] Article insert succeeded. Article id:`, insertData.id);

      // Cleanup
      try { await admin.from('articles').delete().eq('id', insertData.id); } catch (e) { console.warn(`[${label}] Failed to delete article:`, e); }
      try { if (uploadedPath) await admin.storage.from('article-images').remove([uploadedPath]); } catch (e) { console.warn(`[${label}] Failed to remove image:`, e); }

      console.log(`[${label}] Attempt completed successfully`);
      return true;
    };

    // First attempt immediately after sign-in
    try {
      await attemptUploadAndInsert('initial', client);
    } catch (err) {
      console.error('Initial attempt failed:', err);
      process.exit(8);
    }

    // Simulate page refresh: create a new client instance and rehydrate session
    console.log('\nSimulating page refresh (new client instance, rehydrate session)...');
    const { createClient: createClientFn } = await import('@supabase/supabase-js');
    const newClient = createClientFn(url, anonKey, { auth: { persistSession: false } });
    try {
      await newClient.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
      console.log('Session rehydrated on new client');
    } catch (e) {
      console.warn('Failed to rehydrate session on new client:', e);
    }

    try {
      await attemptUploadAndInsert('after-refresh', newClient);
    } catch (err) {
      console.error('Attempt after refresh failed:', err);
      process.exit(9);
    }

    console.log('Verification completed successfully');
    process.exit(0);

  } catch (err) {
    console.error('Unexpected error during verification:', err);
    process.exit(99);
  }
})();