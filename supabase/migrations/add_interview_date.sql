-- Migration: Add interview_date column to applications table
-- Run this in your Supabase SQL Editor

-- Add interview_date column
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS interview_date DATE;

-- Create index for faster queries on interview_date
CREATE INDEX IF NOT EXISTS idx_applications_interview_date ON applications(interview_date);
