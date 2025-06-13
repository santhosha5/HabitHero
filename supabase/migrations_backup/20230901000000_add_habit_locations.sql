-- Add habit_locations table
CREATE TABLE habit_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for better performance
CREATE INDEX idx_habit_locations_habit_id ON habit_locations(habit_id);

-- Enable Row Level Security
ALTER TABLE habit_locations ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "Users can view their own habit locations" ON habit_locations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM habits
            WHERE habits.id = habit_locations.habit_id
            AND habits.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own habit locations" ON habit_locations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM habits
            WHERE habits.id = habit_locations.habit_id
            AND habits.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own habit locations" ON habit_locations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM habits
            WHERE habits.id = habit_locations.habit_id
            AND habits.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own habit locations" ON habit_locations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM habits
            WHERE habits.id = habit_locations.habit_id
            AND habits.user_id = auth.uid()
        )
    );

-- Add streak_count and last_completed columns to habits table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'habits' AND column_name = 'streak_count') THEN
        ALTER TABLE habits ADD COLUMN streak_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'habits' AND column_name = 'last_completed') THEN
        ALTER TABLE habits ADD COLUMN last_completed TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;