-- Phase 5 Migration: Team Redesign & Scheduling Upgrades
-- Run this in your Supabase SQL Editor

-- 1. Alter public.hunts table to add configuration parameters for teams
ALTER TABLE public.hunts ADD COLUMN IF NOT EXISTS team_assignment_mode TEXT DEFAULT 'self_select';
ALTER TABLE public.hunts ADD COLUMN IF NOT EXISTS max_players_per_team INTEGER DEFAULT 10;

-- 2. Alter public.hunt_teams table to add colors and adjust constraints
ALTER TABLE public.hunt_teams ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#2a5d3c';

-- Drop the unique invite code constraint if it exists (since joining is done via private hunt invitation rather than globally unique team code)
ALTER TABLE public.hunt_teams DROP CONSTRAINT IF EXISTS hunt_teams_invite_code_key;
ALTER TABLE public.hunt_teams ALTER COLUMN invite_code DROP NOT NULL;

-- Drop and recreate unique color constraint per hunt
ALTER TABLE public.hunt_teams DROP CONSTRAINT IF EXISTS unique_team_color_per_hunt;
ALTER TABLE public.hunt_teams ADD CONSTRAINT unique_team_color_per_hunt UNIQUE (hunt_id, color);
