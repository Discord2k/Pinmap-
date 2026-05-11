-- PINMAP Production Readiness SQL Script
-- Run this in your Supabase SQL Editor

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
-- Note: Replace with your actual authentication logic if pinmap_username() is a custom function.
-- Assuming 'owner' column matches the authenticated user's identifier.

-- PINS
CREATE POLICY "Public pins are viewable by everyone" ON pins FOR SELECT USING (privacy = 'public' OR owner = current_user);
CREATE POLICY "Users can insert their own pins" ON pins FOR INSERT WITH CHECK (owner = current_user);
CREATE POLICY "Users can update their own pins" ON pins FOR UPDATE USING (owner = current_user);
CREATE POLICY "Users can delete their own pins" ON pins FOR DELETE USING (owner = current_user);

-- COMMENTS
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON comments FOR INSERT WITH CHECK (owner = current_user);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (owner = current_user);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (owner = current_user);

-- PROFILES
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (id = current_user);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (id = current_user);

-- FOLLOWS (Tag Follows)
CREATE POLICY "Users can view their own tag follows" ON follows FOR SELECT USING (owner = current_user);
CREATE POLICY "Users can insert their own tag follows" ON follows FOR INSERT WITH CHECK (owner = current_user);
CREATE POLICY "Users can delete their own tag follows" ON follows FOR DELETE USING (owner = current_user);

-- USER FOLLOWS
CREATE POLICY "Users can view their own user follows" ON user_follows FOR SELECT USING (owner = current_user);
CREATE POLICY "Users can insert their own user follows" ON user_follows FOR INSERT WITH CHECK (owner = current_user);
CREATE POLICY "Users can delete their own user follows" ON user_follows FOR DELETE USING (owner = current_user);

-- PUSH SUBSCRIPTIONS
CREATE POLICY "Users can view their own push subscriptions" ON push_subscriptions FOR SELECT USING (owner = current_user);
CREATE POLICY "Users can insert their own push subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (owner = current_user);
CREATE POLICY "Users can delete their own push subscriptions" ON push_subscriptions FOR DELETE USING (owner = current_user);

-- PRESENCE
CREATE POLICY "Presence is viewable by everyone" ON presence FOR SELECT USING (true);
CREATE POLICY "Users can insert their own presence" ON presence FOR INSERT WITH CHECK (owner = current_user);
CREATE POLICY "Users can update their own presence" ON presence FOR UPDATE USING (owner = current_user);
CREATE POLICY "Users can delete their own presence" ON presence FOR DELETE USING (owner = current_user);

-- NOTIFICATIONS
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
