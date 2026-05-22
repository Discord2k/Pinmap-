-- PINMAP Production Readiness SQL Script
-- Run this in your Supabase SQL Editor
--
-- UPDATED: Explicit GRANT statements added for Supabase Data API compatibility.
-- Required for all new projects from May 30, 2026 and all projects from Oct 30, 2026.
-- See: https://supabase.com/docs/guides/database/postgres/roles

-- 0. Explicit Grants for PostgREST / Data API access
--    anon  = unauthenticated visitors (read-only on public content)
--    authenticated = signed-in users
--    service_role  = server-side / edge functions (bypass RLS)

-- PINS
GRANT SELECT                         ON public.pins TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pins TO service_role;

-- COMMENTS
GRANT SELECT                         ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO service_role;

-- PROFILES
GRANT SELECT                         ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE         ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

-- FOLLOWS (tag follows)
GRANT SELECT, INSERT, DELETE         ON public.follows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follows TO service_role;

-- USER FOLLOWS
GRANT SELECT, INSERT, DELETE         ON public.user_follows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_follows TO service_role;

-- NOTIFICATIONS (only the owning user or service_role should see these)
GRANT SELECT, UPDATE, DELETE         ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO service_role;

-- PRESENCE (real-time; anyone can read, authenticated users write their own)
GRANT SELECT                         ON public.presence TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presence TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presence TO service_role;

-- PUSH SUBSCRIPTIONS (private; only authenticated users and service_role)
GRANT SELECT, INSERT, DELETE         ON public.push_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO service_role;

-- 1. Enable Row Level Security on all tables
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Define Policies
-- Note: Policies are dropped before re-creation so this script is safely re-runnable.

-- Helper function to retrieve the end-user's username from their JWT claims
CREATE OR REPLACE FUNCTION public.current_username()
RETURNS TEXT AS $$
  SELECT coalesce(
    NULLIF(auth.jwt() -> 'user_metadata' ->> 'full_name', ''),
    split_part(auth.jwt() ->> 'email', '@', 1)
  );
$$ LANGUAGE sql STABLE;

-- PINS
DROP POLICY IF EXISTS "Public pins are viewable by everyone" ON pins;
DROP POLICY IF EXISTS "Public and insider pins are viewable by everyone" ON pins;
DROP POLICY IF EXISTS "Users can insert their own pins" ON pins;
DROP POLICY IF EXISTS "Users can update their own pins" ON pins;
DROP POLICY IF EXISTS "Users can delete their own pins" ON pins;
CREATE POLICY "Public and insider pins are viewable by everyone" ON pins FOR SELECT USING (privacy IN ('public', 'insider') OR owner = public.current_username());
CREATE POLICY "Users can insert their own pins" ON pins FOR INSERT WITH CHECK (owner = public.current_username());
CREATE POLICY "Users can update their own pins" ON pins FOR UPDATE USING (owner = public.current_username());
CREATE POLICY "Users can delete their own pins" ON pins FOR DELETE USING (owner = public.current_username());

-- COMMENTS
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON comments FOR INSERT WITH CHECK (owner = public.current_username());
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (owner = public.current_username());
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (owner = public.current_username());

-- PROFILES
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (id = coalesce(NULLIF(auth.jwt() -> 'user_metadata' ->> 'full_name', ''), split_part(auth.jwt() ->> 'email', '@', 1)));
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (id = coalesce(NULLIF(auth.jwt() -> 'user_metadata' ->> 'full_name', ''), split_part(auth.jwt() ->> 'email', '@', 1)));

-- FOLLOWS (Tag Follows)
DROP POLICY IF EXISTS "Users can view their own tag follows" ON follows;
DROP POLICY IF EXISTS "Users can insert their own tag follows" ON follows;
DROP POLICY IF EXISTS "Users can delete their own tag follows" ON follows;
CREATE POLICY "Users can view their own tag follows" ON follows FOR SELECT USING (owner = public.current_username());
CREATE POLICY "Users can insert their own tag follows" ON follows FOR INSERT WITH CHECK (owner = public.current_username());
CREATE POLICY "Users can delete their own tag follows" ON follows FOR DELETE USING (owner = public.current_username());

-- USER FOLLOWS
DROP POLICY IF EXISTS "Users can view their own user follows" ON user_follows;
DROP POLICY IF EXISTS "Users can insert their own user follows" ON user_follows;
DROP POLICY IF EXISTS "Users can delete their own user follows" ON user_follows;
CREATE POLICY "Users can view their own user follows" ON user_follows FOR SELECT USING (owner = public.current_username());
CREATE POLICY "Users can insert their own user follows" ON user_follows FOR INSERT WITH CHECK (owner = public.current_username());
CREATE POLICY "Users can delete their own user follows" ON user_follows FOR DELETE USING (owner = public.current_username());

-- PUSH SUBSCRIPTIONS
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can view their own push subscriptions" ON push_subscriptions FOR SELECT USING (owner = public.current_username());
CREATE POLICY "Users can insert their own push subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (owner = public.current_username());
CREATE POLICY "Users can delete their own push subscriptions" ON push_subscriptions FOR DELETE USING (owner = public.current_username());

-- PRESENCE
DROP POLICY IF EXISTS "Presence is viewable by everyone" ON presence;
DROP POLICY IF EXISTS "Users can insert their own presence" ON presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON presence;
DROP POLICY IF EXISTS "Users can delete their own presence" ON presence;
CREATE POLICY "Presence is viewable by everyone" ON presence FOR SELECT USING (true);
CREATE POLICY "Users can insert their own presence" ON presence FOR INSERT WITH CHECK (owner = public.current_username());
CREATE POLICY "Users can update their own presence" ON presence FOR UPDATE USING (owner = public.current_username());
CREATE POLICY "Users can delete their own presence" ON presence FOR DELETE USING (owner = public.current_username());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (owner = public.current_username());
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (owner = public.current_username());
CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE USING (owner = public.current_username());


CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id TEXT REFERENCES public.pins(id) ON DELETE CASCADE,
  visitor TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  CONSTRAINT unique_visitor_pin UNIQUE (visitor, pin_id)
);

-- Grants for checkins
GRANT SELECT, INSERT                  ON public.checkins TO authenticated;
GRANT SELECT                          ON public.checkins TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.checkins TO service_role;

-- Enable RLS
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Policies for checkins
DROP POLICY IF EXISTS "Check-ins are viewable by everyone" ON public.checkins;
DROP POLICY IF EXISTS "Users can insert their own check-ins" ON public.checkins;
CREATE POLICY "Check-ins are viewable by everyone" ON public.checkins FOR SELECT USING (true);
CREATE POLICY "Users can insert their own check-ins" ON public.checkins FOR INSERT WITH CHECK (
  visitor = coalesce(NULLIF(auth.jwt() -> 'user_metadata' ->> 'full_name', ''), split_part(auth.jwt() ->> 'email', '@', 1))
);


-- 3. Set up Auto-Delete for Expired Pins (using pg_cron)
-- Requires pg_cron extension to be enabled in Supabase Database settings.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'delete-expired-pins', -- Job name
  '0 * * * *',           -- Run every hour
  $$
    DELETE FROM public.pins WHERE expires_at < now();
  $$
);


-- 4. Account Deletion Function (Google Play Store compliance)
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void AS $$
DECLARE
  v_username TEXT;
  v_user_id UUID;
BEGIN
  -- Resolve Auth User ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Resolve username matching the profile ID logic
  v_username := coalesce(
    NULLIF(auth.jwt() -> 'user_metadata' ->> 'full_name', ''),
    split_part(auth.jwt() ->> 'email', '@', 1)
  );

  -- Delete user content across all tables
  DELETE FROM public.profiles WHERE id = v_username;
  DELETE FROM public.pins WHERE owner = v_username;
  DELETE FROM public.comments WHERE owner = v_username;
  DELETE FROM public.checkins WHERE visitor = v_username;
  DELETE FROM public.follows WHERE owner = v_username;
  DELETE FROM public.user_follows WHERE owner = v_username;
  DELETE FROM public.presence WHERE owner = v_username;
  DELETE FROM public.push_subscriptions WHERE owner = v_username;
  DELETE FROM public.notifications WHERE owner = v_username;

  -- Delete Auth User from auth.users (requires SECURITY DEFINER bypass)
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Phase 1 Expansion: Field Journals (with photo uploads)
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create storage bucket for journal photos (run via Supabase dashboard or SQL if enabled)
-- Requires public read access and authenticated upload access.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('journal-photos', 'journal-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access to journal photos" 
  ON storage.objects FOR SELECT USING (bucket_id = 'journal-photos');

CREATE POLICY "Allow authenticated users to upload journal photos" 
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'journal-photos' AND auth.role() = 'authenticated'
  );


-- =========================================================================
-- 6. Phase 2 Expansion: Curated Map Packs & Challenges
-- =========================================================================

-- Map Packs table
CREATE TABLE IF NOT EXISTS public.mappacks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner TEXT NOT NULL, -- references profiles.id (username)
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Mapping table linking Map Packs to Pins
CREATE TABLE IF NOT EXISTS public.mappack_pins (
  mappack_id TEXT REFERENCES public.mappacks(id) ON DELETE CASCADE,
  pin_id TEXT REFERENCES public.pins(id) ON DELETE CASCADE,
  PRIMARY KEY (mappack_id, pin_id)
);

-- Challenges table (Supports both System-defined and User-created quests)
CREATE TABLE IF NOT EXISTS public.challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Emoji character
  tags TEXT[], -- Target hashtags (e.g. ['cafe', 'coffee'])
  required_count INTEGER DEFAULT 3,
  owner TEXT NOT NULL, -- Username of creator, or 'system'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Grants for Supabase Data API/PostgREST
GRANT SELECT ON public.mappacks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mappacks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mappacks TO service_role;

GRANT SELECT ON public.mappack_pins TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mappack_pins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mappack_pins TO service_role;

GRANT SELECT ON public.challenges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO service_role;

-- Enable Row Level Security
ALTER TABLE public.mappacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mappack_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Select policies
DROP POLICY IF EXISTS "Anyone can view public mappacks" ON public.mappacks;
CREATE POLICY "Anyone can view public mappacks" ON public.mappacks
  FOR SELECT USING (is_public = true OR owner = public.current_username());

DROP POLICY IF EXISTS "Anyone can view mappack pins" ON public.mappack_pins;
CREATE POLICY "Anyone can view mappack pins" ON public.mappack_pins
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view challenges" ON public.challenges;
CREATE POLICY "Anyone can view challenges" ON public.challenges
  FOR SELECT USING (true);

-- Edit/Delete policies for Map Packs
DROP POLICY IF EXISTS "Users can create their own mappacks" ON public.mappacks;
CREATE POLICY "Users can create their own mappacks" ON public.mappacks
  FOR INSERT WITH CHECK (owner = public.current_username());

DROP POLICY IF EXISTS "Users can edit their own mappacks" ON public.mappacks;
CREATE POLICY "Users can edit their own mappacks" ON public.mappacks
  FOR UPDATE USING (owner = public.current_username());

DROP POLICY IF EXISTS "Users can delete their own mappacks" ON public.mappacks;
CREATE POLICY "Users can delete their own mappacks" ON public.mappacks
  FOR DELETE USING (owner = public.current_username());

DROP POLICY IF EXISTS "Mappack owners can modify mappack pins" ON public.mappack_pins;
CREATE POLICY "Mappack owners can modify mappack pins" ON public.mappack_pins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mappacks 
      WHERE mappacks.id = mappack_pins.mappack_id AND mappacks.owner = public.current_username()
    )
  );

-- Edit/Delete policies for Challenges
DROP POLICY IF EXISTS "Authenticated users can create challenges" ON public.challenges;
CREATE POLICY "Authenticated users can create challenges" ON public.challenges
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND owner = public.current_username());

DROP POLICY IF EXISTS "Owners can delete their challenges" ON public.challenges;
CREATE POLICY "Owners can delete their challenges" ON public.challenges
  FOR DELETE USING (owner = public.current_username());

-- Populate initial default system challenges
INSERT INTO public.challenges (id, title, description, icon, tags, required_count, owner)
VALUES 
  ('summit_seeker', 'Summit Seeker', 'Check in to 3 pins tagged with #hiking or #summit', '🥾', ARRAY['hiking', 'summit'], 3, 'system'),
  ('water_explorer', 'Water Explorer', 'Check in to 3 pins tagged with #waterfall, #lake, or #beach', '🌊', ARRAY['waterfall', 'lake', 'beach'], 3, 'system'),
  ('caffeine_connoisseur', 'Caffeine Connoisseur', 'Check in to 3 pins tagged with #cafe or #coffee', '☕', ARRAY['cafe', 'coffee'], 3, 'system'),
  ('foodie_explorer', 'Local Foodie', 'Check in to 3 pins tagged with #food, #restaurant, or #pub', '🍔', ARRAY['food', 'restaurant', 'pub'], 3, 'system'),
  ('historic_wanderer', 'Historic Wanderer', 'Check in to 3 pins tagged with #history, #museum, or #monument', '🏛️', ARRAY['history', 'museum', 'monument'], 3, 'system')
ON CONFLICT (id) DO NOTHING;

-- Optimize queries
CREATE INDEX IF NOT EXISTS idx_mappacks_owner ON public.mappacks(owner);
CREATE INDEX IF NOT EXISTS idx_mappack_pins_pack ON public.mappack_pins(mappack_id);
CREATE INDEX IF NOT EXISTS idx_challenges_owner ON public.challenges(owner);

-- =========================================================================
-- TRAILS & GPX ROUTES SYSTEM
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.trails (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#2a5d3c',
  coordinates JSONB NOT NULL, -- Array of [lat, lng] coordinates
  distance_km NUMERIC DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  owner TEXT NOT NULL,
  pin_id TEXT REFERENCES public.pins(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT ON public.trails TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trails TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trails TO service_role;

-- Enable RLS
ALTER TABLE public.trails ENABLE ROW LEVEL SECURITY;

-- Select policies
DROP POLICY IF EXISTS "Anyone can view public trails" ON public.trails;
CREATE POLICY "Anyone can view public trails" ON public.trails
  FOR SELECT USING (is_public = true OR owner = public.current_username());

-- Insert policies
DROP POLICY IF EXISTS "Users can insert their own trails" ON public.trails;
CREATE POLICY "Users can insert their own trails" ON public.trails
  FOR INSERT WITH CHECK (owner = public.current_username());

-- Update policies
DROP POLICY IF EXISTS "Users can edit their own trails" ON public.trails;
CREATE POLICY "Users can edit their own trails" ON public.trails
  FOR UPDATE USING (owner = public.current_username());

-- Delete policies
DROP POLICY IF EXISTS "Users can delete their own trails" ON public.trails;
CREATE POLICY "Users can delete their own trails" ON public.trails
  FOR DELETE USING (owner = public.current_username());

-- Optimize queries
CREATE INDEX IF NOT EXISTS idx_trails_owner ON public.trails(owner);
CREATE INDEX IF NOT EXISTS idx_trails_pin_id ON public.trails(pin_id);


-- =========================================================================
-- SAVED TRAILS / BOOKMARKS SYSTEM
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.saved_trails (
  owner TEXT NOT NULL,
  trail_id TEXT REFERENCES public.trails(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (owner, trail_id)
);

-- Grants
GRANT SELECT ON public.saved_trails TO anon;
GRANT SELECT, INSERT, DELETE ON public.saved_trails TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_trails TO service_role;

-- Enable RLS
ALTER TABLE public.saved_trails ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can view saved trails" ON public.saved_trails;
CREATE POLICY "Anyone can view saved trails" ON public.saved_trails FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own saved trails" ON public.saved_trails;
CREATE POLICY "Users can insert their own saved trails" ON public.saved_trails FOR INSERT WITH CHECK (owner = public.current_username());

DROP POLICY IF EXISTS "Users can delete their own saved trails" ON public.saved_trails;
CREATE POLICY "Users can delete their own saved trails" ON public.saved_trails FOR DELETE USING (owner = public.current_username());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_trails_owner ON public.saved_trails(owner);
CREATE INDEX IF NOT EXISTS idx_saved_trails_trail_id ON public.saved_trails(trail_id);


-- =========================================================================
-- ADDITIONAL UPDATES & AUTOMATIONS
-- =========================================================================

-- Add is_public column to challenges if it doesn't exist
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Update SELECT policy for challenges to restrict non-public ones
DROP POLICY IF EXISTS "Anyone can view challenges" ON public.challenges;
CREATE POLICY "Anyone can view challenges" ON public.challenges
  FOR SELECT USING (is_public = true OR owner = public.current_username() OR owner = 'system');

-- Restrict SELECT policy for mappack_pins for privacy
DROP POLICY IF EXISTS "Anyone can view mappack pins" ON public.mappack_pins;
CREATE POLICY "Anyone can view mappack pins" ON public.mappack_pins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mappacks 
      WHERE mappacks.id = mappack_pins.mappack_id
    )
  );

-- Trigger to automatically create a profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist (re-runnable)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();



