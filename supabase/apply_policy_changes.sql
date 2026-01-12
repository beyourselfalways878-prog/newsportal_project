-- RUN THIS IN SUPABASE SQL EDITOR
-- This script creates the helper functions and replaces policies to avoid RLS recursion
-- Make sure to BACKUP existing policies before running (see notes below)

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_admin_or_superuser(uid UUID)
RETURNS boolean AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = uid AND role IN ('admin','superuser'));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_superuser(uid UUID)
RETURNS boolean AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = uid AND role = 'superuser');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ARTICLES policies
DROP POLICY IF EXISTS "articles_insert_policy" ON public.articles;
CREATE POLICY "articles_insert_policy"
  ON public.articles FOR INSERT TO authenticated
  WITH CHECK ( public.is_admin_or_superuser(auth.uid()) );

DROP POLICY IF EXISTS "articles_update_policy" ON public.articles;
CREATE POLICY "articles_update_policy"
  ON public.articles FOR UPDATE TO authenticated
  USING ( public.is_admin_or_superuser(auth.uid()) )
  WITH CHECK ( public.is_admin_or_superuser(auth.uid()) );

-- PROFILES policies
DROP POLICY IF EXISTS "profiles_select_admin_policy" ON public.profiles;
CREATE POLICY "profiles_select_admin_policy"
  ON public.profiles FOR SELECT TO authenticated
  USING ( public.is_admin_or_superuser(auth.uid()) );

DROP POLICY IF EXISTS "profiles_update_admin_policy" ON public.profiles;
CREATE POLICY "profiles_update_admin_policy"
  ON public.profiles FOR UPDATE TO authenticated
  USING ( public.is_superuser(auth.uid()) );

-- TRENDING TOPICS
DROP POLICY IF EXISTS "trending_topics_insert_policy" ON public.trending_topics;
CREATE POLICY "trending_topics_insert_policy"
  ON public.trending_topics FOR INSERT TO authenticated
  WITH CHECK ( public.is_admin_or_superuser(auth.uid()) );

DROP POLICY IF EXISTS "trending_topics_update_policy" ON public.trending_topics;
CREATE POLICY "trending_topics_update_policy"
  ON public.trending_topics FOR UPDATE TO authenticated
  USING ( public.is_admin_or_superuser(auth.uid()) );

-- SUBSCRIBERS SELECT
DROP POLICY IF EXISTS "subscribers_select_policy" ON public.subscribers;
CREATE POLICY "subscribers_select_policy"
  ON public.subscribers FOR SELECT TO authenticated
  USING ( public.is_admin_or_superuser(auth.uid()) );

-- STORAGE POLICIES (storage.objects)
DROP POLICY IF EXISTS "Authenticated users can upload article-images" ON storage.objects;
CREATE POLICY "Authenticated users can upload article-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK ( bucket_id = 'article-images' AND public.is_admin_or_superuser(auth.uid()) );

DROP POLICY IF EXISTS "Admins can update article-images" ON storage.objects;
CREATE POLICY "Admins can update article-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING ( bucket_id = 'article-images' AND public.is_admin_or_superuser(auth.uid()) );

DROP POLICY IF EXISTS "Superusers can delete article-images" ON storage.objects;
CREATE POLICY "Superusers can delete article-images"
  ON storage.objects FOR DELETE TO authenticated
  USING ( bucket_id = 'article-images' AND public.is_superuser(auth.uid()) );

-- ARTICLE-VIDEOS
DROP POLICY IF EXISTS "Authenticated users can upload article-videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload article-videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK ( bucket_id = 'article-videos' AND public.is_admin_or_superuser(auth.uid()) );

DROP POLICY IF EXISTS "Admins can update article-videos" ON storage.objects;
CREATE POLICY "Admins can update article-videos"
  ON storage.objects FOR UPDATE TO authenticated
  USING ( bucket_id = 'article-videos' AND public.is_admin_or_superuser(auth.uid()) );

DROP POLICY IF EXISTS "Superusers can delete article-videos" ON storage.objects;
CREATE POLICY "Superusers can delete article-videos"
  ON storage.objects FOR DELETE TO authenticated
  USING ( bucket_id = 'article-videos' AND public.is_superuser(auth.uid()) );

-- NOTES:
-- 1) Before running, BACKUP your current policies by running the following query in SQL editor and saving the results:
--    SELECT polname, polrelid::regclass::text as table_name, polcmd, pg_get_expr(polqual, polrelid) as using_expr, pg_get_expr(polwithcheck, polrelid) as with_check_expr
--    FROM pg_policy
--    WHERE polrelid::regclass::text IN ('storage.objects','public.articles','public.profiles','public.trending_topics','public.subscribers');
-- 2) After running this script, re-run the E2E client upload test (locally):
--    node scripts/e2e_client_upload_test.mjs
-- 3) If you want me to re-run tests after you apply this, tell me and I'll execute the E2E test here (if network allows) or you can paste the test output here and I'll analyze.
