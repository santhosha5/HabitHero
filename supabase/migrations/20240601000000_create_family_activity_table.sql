-- Create family_activity table
CREATE TABLE IF NOT EXISTS family_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('habit_completed', 'streak_milestone', 'joined_family', 'medal_earned')),
    activity_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_family_activity_family_id ON family_activity(family_id);
CREATE INDEX idx_family_activity_user_id ON family_activity(user_id);
CREATE INDEX idx_family_activity_created_at ON family_activity(created_at);

-- Enable RLS
ALTER TABLE family_activity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view family activity"
    ON family_activity FOR SELECT
    USING (family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create family activity"
    ON family_activity FOR INSERT
    WITH CHECK (family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    ));
