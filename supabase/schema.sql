-- Job Application Tracker Database Schema
-- Run this in your Supabase SQL Editor

-- Job Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    application_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'Applied',
    source_domain TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status History / Events table
CREATE TABLE application_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'Interview Scheduled', 'Test Scheduled', etc.
    event_date DATE,
    result TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_events ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own applications
CREATE POLICY "Users can view own applications" ON applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications" ON applications
    FOR DELETE USING (auth.uid() = user_id);

-- Users can only see/edit events for their own applications
CREATE POLICY "Users can view own events" ON application_events
    FOR SELECT USING (
        application_id IN (SELECT id FROM applications WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own events" ON application_events
    FOR INSERT WITH CHECK (
        application_id IN (SELECT id FROM applications WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own events" ON application_events
    FOR UPDATE USING (
        application_id IN (SELECT id FROM applications WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete own events" ON application_events
    FOR DELETE USING (
        application_id IN (SELECT id FROM applications WHERE user_id = auth.uid())
    );

-- Create index for faster queries
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_application_events_application_id ON application_events(application_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on applications
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
