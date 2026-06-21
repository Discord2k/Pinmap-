-- Phase 1 Migration: Multi-Dimensional Challenge Tasks for Scavenger Hunts
-- Run this in your Supabase SQL Editor

-- Add challenge fields to hunt_steps
ALTER TABLE public.hunt_steps ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'GPS';
ALTER TABLE public.hunt_steps ADD COLUMN IF NOT EXISTS expected_answer TEXT;
ALTER TABLE public.hunt_steps ADD COLUMN IF NOT EXISTS choices JSONB;

-- Secure Answer Verification RPC
CREATE OR REPLACE FUNCTION public.verify_checkpoint_answer(step_id UUID, user_answer TEXT)
RETURNS boolean AS $$
DECLARE
  v_expected TEXT;
  v_type TEXT;
BEGIN
  SELECT expected_answer, type INTO v_expected, v_type
  FROM public.hunt_steps
  WHERE id = step_id;
  
  -- If step not found
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- If it's a GPS/standard check-in, verify_checkpoint_answer is implicitly true
  IF v_type = 'GPS' OR v_expected IS NULL OR v_expected = '' THEN
    RETURN TRUE;
  END IF;
  
  -- Case-insensitive, trimmed comparison
  RETURN lower(trim(user_answer)) = lower(trim(v_expected));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.verify_checkpoint_answer(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_checkpoint_answer(UUID, TEXT) TO anon;
