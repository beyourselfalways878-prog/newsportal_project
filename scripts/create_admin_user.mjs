import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import process from 'process';

const argv = Object.fromEntries(process.argv.slice(2).map(s => {
  const [k, v] = s.split('=');
  return [k.replace(/^--/, ''), v];
}));

const id = argv.id || argv.userId || argv.u;
const email = argv.email || argv.e;
const password = argv.password || argv.p;
const name = argv.name || argv.full_name || 'Admin User';
const role = (argv.role || 'superuser').toLowerCase();
const skipUpload = argv['skip-upload'] === '1' || argv['skip-upload'] === 'true';

if (!email && !id) {
  console.error('Usage: node scripts/create_admin_user.mjs --email=<email> | --id=<user-id> [--password=<password>] [--name="Full Name"] [--role=superuser] [--skip-upload=1]');
  process.exit(2);
}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !serviceKey) {
  console.error('Missing server-side Supabase credentials. Set SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_SERVICE_ROLE_KEY) and SUPABASE_URL / VITE_SUPABASE_URL in environment.');
  process.exit(2);
}

(async () => {
  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    let userId = null;

    if (id) {
      userId = id;
      console.log('Using provided user id:', userId);
    } else {
      console.log('Creating auth user:', email);

      try {
        const createRes = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: name }
        });

        if (createRes.error) {
          // If user exists, we'll try to find it below; otherwise throw
          console.warn('createUser returned error:', createRes.error.message || createRes.error);
        } else {
          // Depending on SDK version createRes may be { data: { user } } or { user }
          const createUserData = createRes.data || createRes.user || createRes;
          userId = createUserData?.user?.id || createUserData?.id || createUserData?.user_id || null;
          console.log('User created with id:', userId);
        }
      } catch (err) {
        console.warn('createUser threw:', err?.message || err);
      }

      // If no userId yet, look up existing user by email
      if (!userId) {
        console.log('Looking up existing user by email...');
        const listRes = await admin.auth.admin.listUsers();
        const users = listRes?.data?.users || listRes?.users || [];
        const found = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        if (found) {
          userId = found.id;
          console.log('Found existing user id:', userId);
          // Try updating password to the provided one (if provided)
          if (password) {
            try {
              console.log('Updating password for existing user...');
              let updateRes;
              if (admin.auth && admin.auth.admin && typeof admin.auth.admin.updateUser === 'function') {
                updateRes = await admin.auth.admin.updateUser(userId, { password });
              } else if (admin.auth && typeof admin.auth.updateUser === 'function') {
                updateRes = await admin.auth.updateUser(userId, { password });
              } else {
                console.warn('No supported updateUser method on the Supabase admin client; skipping password update.');
              }

              if (updateRes?.error) {
                console.warn('updateUser returned error:', updateRes.error);
              } else if (updateRes) {
                console.log('Password updated for user');
              }
            } catch (err) {
              console.warn('updateUser threw:', err?.message || err);
            }
          } else {
            console.log('No password provided; skipping password update.');
          }
        } else {
          console.error('Could not find or create user for email:', email);
          process.exit(3);
        }
      }
    }

    // Upsert profile row with role and full_name
    try {
      const { data, error } = await admin.from('profiles').upsert([{
        id: userId,
        full_name: name,
        role
      }]);
      if (error) {
        console.error('Error upserting profile:', error);
        process.exit(4);
      }
      console.log('Profile upserted for user id:', userId, 'role:', role);
    } catch (err) {
      console.error('Unexpected error upserting profile:', err?.message || err);
      process.exit(99);
    }

    if (!skipUpload && anonKey) {
      // Verify we can sign in and access storage by uploading a tiny image via client flow
      let verificationFailed = false;
      if (!email || !password) {
        console.warn('Skipping client sign-in/storage verification because email or password was not provided. Run verification manually if needed.');
      } else {
        try {
          const client = createClient(url, anonKey, { auth: { persistSession: false } });
          console.log('Signing in as new user to verify credentials...');
          const { data: signData, error: signErr } = await client.auth.signInWithPassword({ email, password });
          if (signErr) {
            console.warn('Sign-in error during verification (non-fatal):', signErr);
            verificationFailed = true;
          }
          const session = signData?.session;
          if (!session) {
            console.warn('No session returned from sign-in; skipping verification upload.');
            verificationFailed = true;
          }

          if (!verificationFailed) {
            await client.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });

            // upload small PNG
            const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
            const buffer = Buffer.from(base64, 'base64');
            const fileName = `admin-verify/${Date.now()}.png`;
            console.log('Uploading test file to storage as the new user...');
            const { data: uploadData, error: uploadError } = await client.storage.from('article-images').upload(fileName, buffer, { contentType: 'image/png' });
            if (uploadError) {
              console.warn('Client upload error during verification (non-fatal):', uploadError);
              verificationFailed = true;
            } else {
              console.log('Client upload succeeded, path:', uploadData.path);

              // Cleanup test file
              try {
                await admin.storage.from('article-images').remove([uploadData.path]);
                console.log('Cleanup: removed test file');
              } catch (err) {
                console.warn('Cleanup failed:', err?.message || err);
              }
            }
          }
        } catch (err) {
          console.warn('Verification (sign-in/upload) failed (non-fatal):', err?.message || err);
          verificationFailed = true;
        }
      }
    } else if (!anonKey) {
      console.warn('Skipping client sign-in/storage verification because anon key is not available in environment. You may run verification manually.');
    } else {
      console.log('--skip-upload passed; skipping verification upload.');
    }

    console.log('Done. Created/updated user:', { email, userId });
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err?.message || err);
    process.exit(99);
  }
})();
