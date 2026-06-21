-- Phase 3 Migration: Advanced Game Mechanics (Teams & Routing Modes)
-- Run this in your Supabase SQL Editor

-- 1. Add routing_mode to hunts
ALTER TABLE public.hunts ADD COLUMN IF NOT EXISTS routing_mode TEXT NOT NULL DEFAULT 'LINEAR';

-- 2. Create hunt_teams and hunt_team_members tables
CREATE TABLE IF NOT EXISTS public.hunt_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id UUID REFERENCES public.hunts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  creator TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.hunt_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.hunt_teams(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_team_member UNIQUE (team_id, username)
);

-- 3. Add team_id to hunt_participants
ALTER TABLE public.hunt_participants ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.hunt_teams(id) ON DELETE SET NULL;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.hunt_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hunt_team_members ENABLE ROW LEVEL SECURITY;

-- 5. Explicit Grants for PostgREST / Data API access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hunt_teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hunt_teams TO service_role;
GRANT SELECT                         ON public.hunt_teams TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hunt_team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hunt_team_members TO service_role;
GRANT SELECT                         ON public.hunt_team_members TO anon;

-- 6. RLS Policies
DROP POLICY IF EXISTS "Anyone can view teams" ON public.hunt_teams;
CREATE POLICY "Anyone can view teams" ON public.hunt_teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.hunt_teams;
CREATE POLICY "Authenticated users can create teams" ON public.hunt_teams FOR INSERT WITH CHECK (
  creator = coalesce(NULLIF(auth.jwt() -> 'user_metadata' ->> 'full_name', ''), split_part(auth.jwt() ->> 'email', '@', 1))
);

DROP POLICY IF EXISTS "Anyone can view team members" ON public.hunt_team_members;
CREATE POLICY "Anyone can view team members" ON public.hunt_team_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can join team" ON public.hunt_team_members;
CREATE POLICY "Authenticated users can join team" ON public.hunt_team_members FOR INSERT WITH CHECK (
  username = coalesce(NULLIF(auth.jwt() -> 'user_metadata' ->> 'full_name', ''), split_part(auth.jwt() ->> 'email', '@', 1))
);

-- 7. Real-Time Team Synchronization Trigger
-- Synchronizes activity logs across all team members when one logs an action
CREATE OR REPLACE FUNCTION public.sync_team_activity_logs()
RETURNS trigger AS $$
DECLARE
  v_team_id UUID;
  r_part RECORD;
BEGIN
  -- Get team_id for the participant
  SELECT team_id INTO v_team_id 
  FROM public.hunt_participants 
  WHERE id = NEW.participant_id;

  -- If participant is on a team, replicate the log for other team members
  IF v_team_id IS NOT NULL THEN
    FOR r_part IN 
      SELECT id 
      FROM public.hunt_participants 
      WHERE team_id = v_team_id AND id != NEW.participant_id
    LOOP
      -- Check if they already have this log to prevent duplicate trigger loops
      IF NOT EXISTS (
        SELECT 1 FROM public.hunt_activity_logs 
        WHERE participant_id = r_part.id 
          AND step_id = NEW.step_id 
          AND activity_type = NEW.activity_type
      ) THEN
        INSERT INTO public.hunt_activity_logs (participant_id, step_id, activity_type, points_awarded)
        VALUES (r_part.id, NEW.step_id, NEW.activity_type, NEW.points_awarded);
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_team_activity_logs ON public.hunt_activity_logs;
CREATE TRIGGER tr_sync_team_activity_logs
AFTER INSERT ON public.hunt_activity_logs
FOR EACH ROW
EXECUTE FUNCTION public.sync_team_activity_logs();

-- Synchronizes participant status & total_points across team members
CREATE OR REPLACE FUNCTION public.sync_team_participants_scores()
RETURNS trigger AS $$
BEGIN
  IF NEW.team_id IS NOT NULL AND (OLD.total_points != NEW.total_points OR OLD.status != NEW.status) THEN
    -- Disable triggers temporarily to prevent recursion loop
    ALTER TABLE public.hunt_participants DISABLE TRIGGER ALL;
    
    UPDATE public.hunt_participants
    SET total_points = NEW.total_points,
        status = NEW.status,
        completed_at = NEW.completed_at
    WHERE team_id = NEW.team_id AND id != NEW.id;
    
    ALTER TABLE public.hunt_participants ENABLE TRIGGER ALL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_team_participants_scores ON public.hunt_participants;
CREATE TRIGGER tr_sync_team_participants_scores
AFTER UPDATE ON public.hunt_participants
FOR EACH ROW
EXECUTE FUNCTION public.sync_team_participants_scores();
