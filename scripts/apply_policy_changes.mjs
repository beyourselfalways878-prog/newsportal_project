import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

const argv = Object.fromEntries(process.argv.slice(2).map(s => {
  const [k, v] = s.split('=');
  return [k.replace(/^--/, ''), v];
}));

const conn = argv.db || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!conn) {
  console.error('Usage: node scripts/apply_policy_changes.mjs --db=<DATABASE_URL>');
  process.exit(2);
}

const backupDir = path.join(process.cwd(), 'scripts', 'sql_backups', `${Date.now()}`);
fs.mkdirSync(backupDir, { recursive: true });

const client = new Client({ connectionString: conn });

(async () => {
  try {
    console.log('Connecting to DB...');
    await client.connect();

    // Backup current function defs (if any)
    console.log('Backing up existing functions (if present)...');
    const funcs = ['handle_new_user','is_admin_or_superuser','is_superuser'];
    for (const fn of funcs) {
      const { rows } = await client.query("SELECT pg_get_functiondef(p.oid) as def FROM pg_proc p WHERE p.proname = $1;", [fn]);
      const def = rows.length ? rows[0].def : null;
      fs.writeFileSync(path.join(backupDir, `fn_${fn}.sql`), def || `-- no function ${fn} found\n`);
    }

    // Backup relevant policies
    console.log('Backing up relevant policies...');
    const { rows: policies } = await client.query(
      `SELECT polname, polrelid::regclass::text as table_name, polcmd, pg_get_expr(polqual, polrelid) as using_expr, pg_get_expr(polwithcheck, polrelid) as with_check_expr
       FROM pg_policy
       WHERE polrelid::regclass::text IN ('storage.objects','public.articles','public.profiles','public.trending_topics','public.subscribers')
       ORDER BY table_name, polname;`
    );

    fs.writeFileSync(path.join(backupDir, `policies_backup.json`), JSON.stringify(policies, null, 2));

    // Apply changes in a transaction
    console.log('Applying SQL changes (creating helper functions and replacing policies)...');
    await client.query('BEGIN');

    // Create helper functions
    await client.query(`CREATE OR REPLACE FUNCTION public.is_admin_or_superuser(uid UUID)
RETURNS boolean AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = uid AND role IN ('admin','superuser'));
$$ LANGUAGE sql STABLE SECURITY DEFINER;`);

    await client.query(`CREATE OR REPLACE FUNCTION public.is_superuser(uid UUID)
RETURNS boolean AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = uid AND role = 'superuser');
$$ LANGUAGE sql STABLE SECURITY DEFINER;`);

    // Replace articles policies
    await client.query(`DROP POLICY IF EXISTS "articles_insert_policy" ON public.articles;`);
    await client.query(`CREATE POLICY "articles_insert_policy"
      ON public.articles FOR INSERT TO authenticated
      WITH CHECK ( public.is_admin_or_superuser(auth.uid()) );`);

    await client.query(`DROP POLICY IF EXISTS "articles_update_policy" ON public.articles;`);
    await client.query(`CREATE POLICY "articles_update_policy"
      ON public.articles FOR UPDATE TO authenticated
      USING ( public.is_admin_or_superuser(auth.uid()) )
      WITH CHECK ( public.is_admin_or_superuser(auth.uid()) );`);

    // Profiles select admin policy
    await client.query(`DROP POLICY IF EXISTS "profiles_select_admin_policy" ON public.profiles;`);
    await client.query(`CREATE POLICY "profiles_select_admin_policy"
      ON public.profiles FOR SELECT TO authenticated
      USING ( public.is_admin_or_superuser(auth.uid()) );`);

    // Profiles update admin (superuser) policy
    await client.query(`DROP POLICY IF EXISTS "profiles_update_admin_policy" ON public.profiles;`);
    await client.query(`CREATE POLICY "profiles_update_admin_policy"
      ON public.profiles FOR UPDATE TO authenticated
      USING ( public.is_superuser(auth.uid()) );`);

    // Trending topics policies
    await client.query(`DROP POLICY IF EXISTS "trending_topics_insert_policy" ON public.trending_topics;`);
    await client.query(`CREATE POLICY "trending_topics_insert_policy"
      ON public.trending_topics FOR INSERT TO authenticated
      WITH CHECK ( public.is_admin_or_superuser(auth.uid()) );`);

    await client.query(`DROP POLICY IF EXISTS "trending_topics_update_policy" ON public.trending_topics;`);
    await client.query(`CREATE POLICY "trending_topics_update_policy"
      ON public.trending_topics FOR UPDATE TO authenticated
      USING ( public.is_admin_or_superuser(auth.uid()) );`);

    // Subscribers select policy
    await client.query(`DROP POLICY IF EXISTS "subscribers_select_policy" ON public.subscribers;`);
    await client.query(`CREATE POLICY "subscribers_select_policy"
      ON public.subscribers FOR SELECT TO authenticated
      USING ( public.is_admin_or_superuser(auth.uid()) );`);

    // Storage policies - note: storage.objects is in the storage schema
    await client.query(`DROP POLICY IF EXISTS "Authenticated users can upload article-images" ON storage.objects;`);
    await client.query(`CREATE POLICY "Authenticated users can upload article-images"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK ( bucket_id = 'article-images' AND public.is_admin_or_superuser(auth.uid()) );`);

    await client.query(`DROP POLICY IF EXISTS "Admins can update article-images" ON storage.objects;`);
    await client.query(`CREATE POLICY "Admins can update article-images"
      ON storage.objects FOR UPDATE TO authenticated
      USING ( bucket_id = 'article-images' AND public.is_admin_or_superuser(auth.uid()) );`);

    await client.query(`DROP POLICY IF EXISTS "Superusers can delete article-images" ON storage.objects;`);
    await client.query(`CREATE POLICY "Superusers can delete article-images"
      ON storage.objects FOR DELETE TO authenticated
      USING ( bucket_id = 'article-images' AND public.is_superuser(auth.uid()) );`);

    // Article videos policies
    await client.query(`DROP POLICY IF EXISTS "Authenticated users can upload article-videos" ON storage.objects;`);
    await client.query(`CREATE POLICY "Authenticated users can upload article-videos"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK ( bucket_id = 'article-videos' AND public.is_admin_or_superuser(auth.uid()) );`);

    await client.query(`DROP POLICY IF EXISTS "Admins can update article-videos" ON storage.objects;`);
    await client.query(`CREATE POLICY "Admins can update article-videos"
      ON storage.objects FOR UPDATE TO authenticated
      USING ( bucket_id = 'article-videos' AND public.is_admin_or_superuser(auth.uid()) );`);

    await client.query(`DROP POLICY IF EXISTS "Superusers can delete article-videos" ON storage.objects;`);
    await client.query(`CREATE POLICY "Superusers can delete article-videos"
      ON storage.objects FOR DELETE TO authenticated
      USING ( bucket_id = 'article-videos' AND public.is_superuser(auth.uid()) );`);

    await client.query('COMMIT');
    console.log('SQL changes applied successfully. Backups are in:', backupDir);

    await client.end();

    // Re-run the e2e client upload test
    console.log('Re-running E2E client upload test...');
    const { exec } = await import('child_process');
    const child = exec('node scripts/e2e_client_upload_test.mjs', { env: { ...process.env, VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY } });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    child.on('exit', (code) => {
      console.log('E2E test exited with code', code);
      process.exit(code === null ? 0 : code);
    });

  } catch (err) {
    console.error('Error applying SQL changes:', err);
    try { await client.query('ROLLBACK'); } catch (e) {}
    await client.end();
    process.exit(1);
  }
})();