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

-- PINS
DROP POLICY IF EXISTS "Public pins are viewable by everyone" ON pins;
DROP POLICY IF EXISTS "Users can insert their own pins" ON pins;
DROP POLICY IF EXISTS "Users can update their own pins" ON pins;
DROP POLICY IF EXISTS "Users can delete their own pins" ON pins;
CREATE POLICY "Public pins are viewable by everyone" ON pins FOR SELECT USING (privacy = 'public' OR owner = current_user);
CREATE POLICY "Users can insert their own pins" ON pins FOR INSERT WITH CHECK (owner = current_user);
CREATE POLICY "Users can update their own pins" ON pins FOR UPDATE USING (owner = current_user);
CREATE POLICY "Users can delete their own pins" ON pins FOR DELETE USING (owner = current_user);

-- COMMENTS
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON comments FOR INSERT WITH CHECK (owner = current_user);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (owner = current_user);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (owner = current_user);

-- PROFILES
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (id = current_user);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (id = current_user);

-- FOLLOWS (Tag Follows)
DROP POLICY IF EXISTS "Users can view their own tag follows" ON follows;
DROP POLICY IF EXISTS "Users can insert their own tag follows" ON follows;
DROP POLICY IF EXISTS "Users can delete their own tag follows" ON follows;
CREATE POLICY "Users can view their own tag follows" ON follows FOR SELECT USING (owner = current_user);
CREATE POLICY "Users can insert their own tag follows" ON follows FOR INSERT WITH CHECK (owner = current_user);
CREATE POLICY "Users can delete their own tag follows" ON follows FOR DELETE USING (owner = current_user);

-- USER FOLLOWS
DROP POLICY IF EXISTS "Users can view their own user follows" ON user_follows;
DROP POLICY IF EXISTS "Users can insert their own user follows" ON user_follows;
DROP POLICY IF EXISTS "Users can delete their own user follows" ON user_follows;
CREATE POLICY "Users can view their own user follows" ON user_follows FOR SELECT USING (owner = current_user);
CREATE POLICY "Users can insert their own user follows" ON user_follows FOR INSERT WITH CHECK (owner = current_user);
CREATE POLICY "Users can delete their own user follows" ON user_follows FOR DELETE USING (owner = current_user);

-- PUSH SUBSCRIPTIONS
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can view their own push subscriptions" ON push_subscriptions FOR SELECT USING (owner = current_user);
CREATE POLICY "Users can insert their own push subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (owner = current_user);
CREATE POLICY "Users can delete their own push subscriptions" ON push_subscriptions FOR DELETE USING (owner = current_user);

-- PRESENCE
DROP POLICY IF EXISTS "Presence is viewable by everyone" ON presence;
DROP POLICY IF EXISTS "Users can insert their own presence" ON presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON presence;
DROP POLICY IF EXISTS "Users can delete their own presence" ON presence;
CREATE POLICY "Presence is viewable by everyone" ON presence FOR SELECT USING (true);
CREATE POLICY "Users can insert their own presence" ON presence FOR INSERT WITH CHECK (owner = current_user);
CREATE POLICY "Users can update their own presence" ON presence FOR UPDATE USING (owner = current_user);
CREATE POLICY "Users can delete their own presence" ON presence FOR DELETE USING (owner = current_user);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (owner = current_user);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (owner = current_user);
CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE USING (owner = current_user);


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
