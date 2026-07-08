-- ─── 1. TRIGGERS & FUNCTIONS ──────────────────────────────────────────
-- Auto profile creation when a user signs up through Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."User" (
    id, "fullName", phone, email, role, "coinsBalance", "subscriptionTier", "createdAt", "updatedAt"
  )
  VALUES (
    new.id::text,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User ' || substring(new.id::text from 1 for 4)),
    coalesce(new.phone, new.raw_user_meta_data->>'phone', ''),
    new.email,
    'user',
    10, -- default coin balance welcome bonus
    'free',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public."Profile" (
    id, "userId", bio, "isPublicFigure", "isVerified", "createdAt", "updatedAt"
  )
  VALUES (
    'profile-' || new.id::text,
    new.id::text,
    '',
    false,
    false,
    now(),
    now()
  )
  ON CONFLICT ("userId") DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─── 2. ENABLE ROW LEVEL SECURITY ──────────────────────────────────────
-- Automatically enable RLS on all tables in public schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END;
$$;


-- ─── 3. RLS POLICIES ──────────────────────────────────────────────────

-- Drop existing policies if any to prevent conflicts
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.' || quote_ident(pol.tablename) || ';';
    END LOOP;
END;
$$;

-- 3.1. Public Read / Admin Write (Static Tables)
-- Tables: Location, City, MusicLibrary, VideoCategory, VideoPlaylist, LongVideo, SpinPrize, Announcement, SiteSetting, PlatformSetting
DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY['Location', 'City', 'MusicLibrary', 'VideoCategory', 'VideoPlaylist', 'LongVideo', 'SpinPrize', 'Announcement', 'SiteSetting', 'PlatformSetting'];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE 'CREATE POLICY select_public ON public.' || quote_ident(t) || ' FOR SELECT USING (true);';
        EXECUTE 'CREATE POLICY write_admin ON public.' || quote_ident(t) || ' FOR ALL TO authenticated USING ((SELECT role FROM public."User" WHERE id = auth.uid()::text) IN (''super_admin'', ''city_admin''));';
    END LOOP;
END;
$$;

-- 3.2. User Table Policies
CREATE POLICY select_user ON public."User" 
  FOR SELECT USING (id = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY update_user ON public."User" 
  FOR UPDATE TO authenticated USING (id = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY insert_user ON public."User" 
  FOR INSERT WITH CHECK (true);

-- 3.3. Profile Table Policies
CREATE POLICY select_profile_public ON public."Profile" 
  FOR SELECT USING (true);

CREATE POLICY write_profile_owner ON public."Profile" 
  FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

-- 3.4. Listings Table Policies (Listing, RealEstateListing)
CREATE POLICY select_listing_public ON public."Listing" FOR SELECT USING (true);
CREATE POLICY write_listing_owner ON public."Listing" FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin', 'agent'));

CREATE POLICY select_re_public ON public."RealEstateListing" FOR SELECT USING (true);
CREATE POLICY write_re_owner ON public."RealEstateListing" FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

-- 3.5. Lead Table Policies
CREATE POLICY select_lead ON public."Lead" 
  FOR SELECT TO authenticated USING (
    "userId" = auth.uid()::text OR 
    (SELECT "userId" FROM public."Listing" WHERE id = "listingId") = auth.uid()::text OR
    (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin')
  );

CREATE POLICY insert_lead ON public."Lead" 
  FOR INSERT WITH CHECK (true);

CREATE POLICY write_lead ON public."Lead" 
  FOR ALL TO authenticated USING (
    (SELECT "userId" FROM public."Listing" WHERE id = "listingId") = auth.uid()::text OR 
    (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin')
  );

-- 3.6. Social Interactions / Reviews (Review, Comment, ShortComment, Post)
CREATE POLICY select_review ON public."Review" FOR SELECT USING (true);
CREATE POLICY write_review ON public."Review" FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY select_post ON public."Post" FOR SELECT USING (true);
CREATE POLICY write_post ON public."Post" FOR ALL TO authenticated USING ("authorId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY select_comment ON public."Comment" FOR SELECT USING (true);
CREATE POLICY write_comment ON public."Comment" FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY select_scomment ON public."ShortComment" FOR SELECT USING (true);
CREATE POLICY write_scomment ON public."ShortComment" FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

-- 3.7. Likes & Follows (Like, ShortLike, Follow)
CREATE POLICY select_like ON public."Like" FOR SELECT USING (true);
CREATE POLICY write_like ON public."Like" FOR ALL TO authenticated USING ("userId" = auth.uid()::text);

CREATE POLICY select_slike ON public."ShortLike" FOR SELECT USING (true);
CREATE POLICY write_slike ON public."ShortLike" FOR ALL TO authenticated USING ("userId" = auth.uid()::text);

CREATE POLICY select_follow ON public."Follow" FOR SELECT USING (true);
CREATE POLICY write_follow ON public."Follow" FOR ALL TO authenticated USING ("followerId" = auth.uid()::text);

-- 3.8. Media Feeds / Ads (Story, Short, News, Blog, BannerAd)
CREATE POLICY select_story ON public."Story" FOR SELECT USING (true);
CREATE POLICY write_story ON public."Story" FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY select_short ON public."Short" FOR SELECT USING (true);
CREATE POLICY write_short ON public."Short" FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY select_news ON public."News" FOR SELECT USING (true);
CREATE POLICY write_news ON public."News" FOR ALL TO authenticated USING ((SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY select_blog ON public."Blog" FOR SELECT USING (true);
CREATE POLICY write_blog ON public."Blog" FOR ALL TO authenticated USING ("authorId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

CREATE POLICY select_banner ON public."BannerAd" FOR SELECT USING (true);
CREATE POLICY write_banner ON public."BannerAd" FOR ALL TO authenticated USING ((SELECT role FROM public."User" WHERE id = auth.uid()::text) IN ('super_admin', 'city_admin'));

-- 3.9. Transactions, Subscriptions, Progress, Admin Requests (AdminRequest, VerificationRequest, PayoutRequest, Subscription, Transaction, CoinTransaction, VideoProgress, PushSubscription)
DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY['AdminRequest', 'VerificationRequest', 'PayoutRequest', 'Subscription', 'Transaction', 'CoinTransaction', 'VideoProgress', 'PushSubscription'];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE 'CREATE POLICY manage_own ON public.' || quote_ident(t) || ' FOR ALL TO authenticated USING ("userId" = auth.uid()::text OR (SELECT role FROM public."User" WHERE id = auth.uid()::text) IN (''super_admin'', ''city_admin''));';
    END LOOP;
END;
$$;
