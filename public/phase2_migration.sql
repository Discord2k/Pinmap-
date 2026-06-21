-- Phase 2 Migration: Social Engine & Photostream for Scavenger Hunts
-- Run this in your Supabase SQL Editor

-- 1. Add hide_spoilers toggle to hunts
ALTER TABLE public.hunts ADD COLUMN IF NOT EXISTS hide_spoilers BOOLEAN DEFAULT true;

-- 2. Create hunt_submissions table
CREATE TABLE IF NOT EXISTS public.hunt_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id UUID REFERENCES public.hunts(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.hunt_steps(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  likes TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  comments JSONB DEFAULT '[]'::JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.hunt_submissions ENABLE ROW LEVEL SECURITY;

-- 4. Explicit Grants for PostgREST / Data API access
GRANT SELECT                         ON public.hunt_submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hunt_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hunt_submissions TO service_role;

-- 5. Policies
DROP POLICY IF EXISTS "Anyone can view submissions" ON public.hunt_submissions;
CREATE POLICY "Anyone can view submissions" ON public.hunt_submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert submissions" ON public.hunt_submissions;
CREATE POLICY "Authenticated users can insert submissions" ON public.hunt_submissions FOR INSERT WITH CHECK (
  username = coalesce(NULLIF(auth.jwt() -> 'user_metadata' ->> 'full_name', ''), split_part(auth.jwt() ->> 'email', '@', 1))
);

DROP POLICY IF EXISTS "Authenticated users can update their own submissions or modify social metrics" ON public.hunt_submissions;
CREATE POLICY "Authenticated users can update their own submissions or modify social metrics" ON public.hunt_submissions FOR UPDATE USING (
  -- Allows either the owner to update/delete, or any authenticated user to update the record (specifically for appending likes/comments)
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can delete their own submissions" ON public.hunt_submissions;
CREATE POLICY "Users can delete their own submissions" ON public.hunt_submissions FOR DELETE USING (
  username = coalesce(NULLIF(auth.jwt() -> 'user_metadata' ->> 'full_name', ''), split_part(auth.jwt() ->> 'email', '@', 1))
);
