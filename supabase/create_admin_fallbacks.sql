-- Create table to log server-side fallback events (uploads and article inserts)
CREATE TABLE IF NOT EXISTS public.admin_fallbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  event_type TEXT NOT NULL, -- 'upload' | 'article_upsert' | 'other'
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_fallbacks_user_id ON public.admin_fallbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_fallbacks_event_type ON public.admin_fallbacks(event_type);

-- RLS: allow admins/superusers to view fallback logs
ALTER TABLE public.admin_fallbacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_fallbacks_select_admin_policy" ON public.admin_fallbacks;
CREATE POLICY "admin_fallbacks_select_admin_policy"
  ON public.admin_fallbacks FOR SELECT TO authenticated
  USING ( public.is_admin_or_superuser(auth.uid()) );

GRANT SELECT ON public.admin_fallbacks TO authenticated;