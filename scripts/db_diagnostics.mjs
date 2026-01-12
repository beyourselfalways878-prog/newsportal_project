import 'dotenv/config';
import { Client } from 'pg';

const argv = Object.fromEntries(process.argv.slice(2).map(s => { const [k,v] = s.split('='); return [k.replace(/^--/,''), v]; }));
const conn = argv.db || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!conn) { console.error('Usage: node scripts/db_diagnostics.mjs --db=<DATABASE_URL> or set DATABASE_URL'); process.exit(2); }

(async () => {
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    console.log('Connected to DB, running diagnostics...');

    const queries = [
      {
        name: 'roles_existing',
        sql: `SELECT rolname FROM pg_roles WHERE rolname ILIKE '%admin%';`
      },
      {
        name: 'functions_with_admin_or_set_role',
        sql: `SELECT n.nspname as schema, p.proname as name, pg_get_functiondef(p.oid) as def
              FROM pg_proc p
              JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE pg_get_functiondef(p.oid) ILIKE '%admin%' OR pg_get_functiondef(p.oid) ILIKE '%SET ROLE%';`
      },
      {
        name: 'triggers_with_admin',
        sql: `SELECT c.relname as table, t.tgname as trigger, pg_get_triggerdef(t.oid) as def
              FROM pg_trigger t
              JOIN pg_class c ON c.oid = t.tgrelid
              WHERE pg_get_triggerdef(t.oid) ILIKE '%admin%' OR pg_get_triggerdef(t.oid) ILIKE '%SET ROLE%';`
      },
      {
        name: 'policies_with_admin',
        sql: `SELECT polname, polrelid::regclass::text as table_name, pg_get_expr(polqual, polrelid) as using_expr, pg_get_expr(polwithcheck, polrelid) as with_check_expr
              FROM pg_policy
              WHERE pg_get_expr(polqual, polrelid) ILIKE '%admin%' OR pg_get_expr(polwithcheck, polrelid) ILIKE '%admin%';`
      },
      {
        name: 'event_triggers_with_admin',
        sql: `SELECT evtname, pg_get_event_triggerdef(e.oid) as def FROM pg_event_trigger e WHERE pg_get_event_triggerdef(e.oid) ILIKE '%admin%';`
      },
      {
        name: 'functions_with_role_literal',
        sql: `SELECT n.nspname as schema, p.proname as name, pg_get_functiondef(p.oid) as def
              FROM pg_proc p
              JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE pg_get_functiondef(p.oid) ILIKE '%\'admin\'%';`
      }
    ];

    for (const q of queries) {
      const res = await client.query(q.sql);
      console.log('\n== ' + q.name + ' ==');
      if (res.rows.length === 0) console.log('(no results)');
      else console.log(res.rows.slice(0,50));
    }

    await client.end();
    console.log('\nDiagnostics finished.');
    process.exit(0);
  } catch (err) {
    console.error('Diagnostics failed:', err.message || err);
    try { await client.end(); } catch(e){}
    process.exit(1);
  }
})();