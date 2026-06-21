-- Phase 4 Migration: Creator Customizations & Dynamic Modifiers
-- Run this in your Supabase SQL Editor

-- 1. Add start_time, end_time, and reward_voucher to public.hunts
ALTER TABLE public.hunts ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.hunts ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.hunts ADD COLUMN IF NOT EXISTS reward_voucher TEXT;

-- 2. Add status to public.hunt_submissions
ALTER TABLE public.hunt_submissions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'APPROVED';
