-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    family_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    total_points INTEGER DEFAULT 0
);

-- Families table
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add foreign key constraint after both tables exist
ALTER TABLE users
ADD CONSTRAINT fk_family
FOREIGN KEY (family_id)
REFERENCES families(id);

-- Habits table
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    two_minute_version TEXT NOT NULL,
    habit_stack TEXT,
    category TEXT NOT NULL,
    target_frequency INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Habit Completions table
CREATE TABLE habit_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID REFERENCES habits(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    points_earned INTEGER NOT NULL,
    streak_day INTEGER NOT NULL
);

-- Family Challenges table
CREATE TABLE family_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_metric INTEGER NOT NULL,
    bonus_points INTEGER NOT NULL,
    created_by UUID REFERENCES users(id) NOT NULL
);

-- Weekly Money Pool table
CREATE TABLE weekly_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    participants JSONB NOT NULL,
    winners JSONB,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paid_out')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3D Medals table
CREATE TABLE medals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    medal_type TEXT NOT NULL CHECK (medal_type IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    medal_category TEXT NOT NULL,
    points_required INTEGER NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    three_d_model_url TEXT,
    animation_type TEXT CHECK (animation_type IN ('spin', 'glow', 'particle_effect'))
);

-- Create indexes for better query performance
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_user_id ON habit_completions(user_id);
CREATE INDEX idx_family_challenges_family_id ON family_challenges(family_id);
CREATE INDEX idx_weekly_pools_family_id ON weekly_pools(family_id);
CREATE INDEX idx_medals_user_id ON medals(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE medals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can view family members" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own family" ON families;
DROP POLICY IF EXISTS "Users can create family" ON families;
DROP POLICY IF EXISTS "Users can view own habits" ON habits;
DROP POLICY IF EXISTS "Users can view family habits" ON habits;
DROP POLICY IF EXISTS "Users can create own habits" ON habits;
DROP POLICY IF EXISTS "Users can update own habits" ON habits;
DROP POLICY IF EXISTS "Users can view own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can view family completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can create own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can view family challenges" ON family_challenges;
DROP POLICY IF EXISTS "Users can create family challenges" ON family_challenges;
DROP POLICY IF EXISTS "Users can view family pools" ON weekly_pools;
DROP POLICY IF EXISTS "Users can create family pools" ON weekly_pools;
DROP POLICY IF EXISTS "Users can view own medals" ON medals;
DROP POLICY IF EXISTS "Users can view family medals" ON medals;
DROP POLICY IF EXISTS "Users can create own medals" ON medals;

-- RLS Policies for Users table
CREATE POLICY "Users can view own data" ON users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can view family members" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.family_id = users.family_id
        )
    );

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for Families table
CREATE POLICY "Users can view own family" ON families
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.family_id = families.id
        )
    );

CREATE POLICY "Users can create family" ON families
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- RLS Policies for Habits table
CREATE POLICY "Users can view own habits" ON habits
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view family habits" ON habits
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.family_id = (
                SELECT family_id FROM users WHERE id = habits.user_id
            )
        )
    );

CREATE POLICY "Users can create own habits" ON habits
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own habits" ON habits
    FOR UPDATE
    USING (user_id = auth.uid());

-- RLS Policies for Habit Completions table
CREATE POLICY "Users can view own completions" ON habit_completions
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view family completions" ON habit_completions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.family_id = (
                SELECT family_id FROM users WHERE id = habit_completions.user_id
            )
        )
    );

CREATE POLICY "Users can create own completions" ON habit_completions
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- RLS Policies for Family Challenges table
CREATE POLICY "Users can view family challenges" ON family_challenges
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.family_id = family_challenges.family_id
        )
    );

CREATE POLICY "Users can create family challenges" ON family_challenges
    FOR INSERT
    WITH CHECK (created_by = auth.uid());

-- RLS Policies for Weekly Pools table
CREATE POLICY "Users can view family pools" ON weekly_pools
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.family_id = weekly_pools.family_id
        )
    );

CREATE POLICY "Users can create family pools" ON weekly_pools
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.family_id = weekly_pools.family_id
        )
    );

-- RLS Policies for Medals table
CREATE POLICY "Users can view own medals" ON medals
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view family medals" ON medals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.family_id = (
                SELECT family_id FROM users WHERE id = medals.user_id
            )
        )
    );

CREATE POLICY "Users can create own medals" ON medals
    FOR INSERT
    WITH CHECK (user_id = auth.uid()); 