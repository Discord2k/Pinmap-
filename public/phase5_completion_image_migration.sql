-- Phase 5 Migration: Hunt Completion Image
-- Run this in your Supabase SQL Editor

ALTER TABLE public.hunts ADD COLUMN IF NOT EXISTS completion_image_url TEXT;
