-- Consolidated schema for HabitHero

-- First, drop all triggers that depend on tables
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop all tables with CASCADE to automatically remove dependent objects (including policies)
-- Drop in reverse order of dependencies
DROP TABLE IF EXISTS public.family_activity CASCADE;
DROP TABLE IF EXISTS public.habit_completions CASCADE;
DROP TABLE IF EXISTS public.weekly_pools CASCADE;
DROP TABLE IF EXISTS public.medals CASCADE;
DROP TABLE IF EXISTS public.habits CASCADE;
DROP TABLE IF EXISTS public.family_invites CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.families CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create families table
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    avatar_url TEXT,
    family_id UUID REFERENCES families(id),
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create habits table
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    two_minute_version TEXT NOT NULL,
    habit_stack TEXT,
    category TEXT NOT NULL,
    target_frequency INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    streak_count INTEGER DEFAULT 0,
    last_completed TIMESTAMP WITH TIME ZONE,
    location_reminder JSONB DEFAULT '{"enabled": false, "locations": []}'::jsonb
);

-- Create habit_completions table
CREATE TABLE habit_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 10,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create weekly_pools table
CREATE TABLE weekly_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) NOT NULL,
    week_start TIMESTAMP WITH TIME ZONE NOT NULL,
    week_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_amount DECIMAL(10,2) DEFAULT 0,
    participants UUID[] DEFAULT '{}',
    winners JSONB DEFAULT '[]',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paid_out')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create medals table
CREATE TABLE medals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    category TEXT NOT NULL,
    points_required INTEGER NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    three_d_model_url TEXT,
    animation_type TEXT CHECK (animation_type IN ('spin', 'glow', 'particle_effect')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create family_activity table
CREATE TABLE family_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('habit_completed', 'streak_milestone', 'joined_family', 'medal_earned')),
    activity_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create family_invites table
CREATE TABLE family_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) NOT NULL,
    invited_by UUID REFERENCES users(id) NOT NULL,
    email TEXT NOT NULL,
    invite_code TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '7 days') NOT NULL
);

-- Create indexes after all tables are created
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_family_activity_family_id ON family_activity(family_id);
CREATE INDEX IF NOT EXISTS idx_family_activity_user_id ON family_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_family_activity_created_at ON family_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_weekly_pools_family_id ON weekly_pools(family_id);
CREATE INDEX IF NOT EXISTS idx_medals_user_id ON medals(user_id);
CREATE INDEX IF NOT EXISTS idx_family_invites_family_id ON family_invites(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invites_email ON family_invites(email);
CREATE INDEX IF NOT EXISTS idx_family_invites_invite_code ON family_invites(invite_code);

-- Enable Row Level Security after all tables and indexes are created
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

-- Create helper function for checking same family
CREATE OR REPLACE FUNCTION is_same_family(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM users u1
        JOIN users u2 ON u1.family_id = u2.family_id
        WHERE u1.id = user1_id
        AND u2.id = user2_id
        AND u1.family_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS Policies

-- Users table policies
CREATE POLICY "Users can view own data"
    ON users FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can view family members"
    ON users FOR SELECT
    USING (is_same_family(auth.uid(), id));

CREATE POLICY "Users can update own data"
    ON users FOR UPDATE
    USING (id = auth.uid());

-- Families table policies
CREATE POLICY "Users can view own family"
    ON families FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.family_id = families.id
    ) OR created_by = auth.uid());

CREATE POLICY "Users can create family"
    ON families FOR INSERT
    WITH CHECK (true);  -- Allow any authenticated user to create a family

-- Habits table policies
CREATE POLICY "Users can view own habits"
    ON habits FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view family habits"
    ON habits FOR SELECT
    USING (is_same_family(auth.uid(), user_id));

CREATE POLICY "Users can create own habits"
    ON habits FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own habits"
    ON habits FOR UPDATE
    USING (user_id = auth.uid());

-- Habit completions table policies
CREATE POLICY "Users can view own completions"
    ON habit_completions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view family completions"
    ON habit_completions FOR SELECT
    USING (is_same_family(auth.uid(), user_id));

CREATE POLICY "Users can create own completions"
    ON habit_completions FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Family activity policies
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

-- Medals policies
CREATE POLICY "Users can view own medals"
    ON medals FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view family medals"
    ON medals FOR SELECT
    USING (is_same_family(auth.uid(), user_id));

-- Weekly pools policies
CREATE POLICY "Users can view family pools"
    ON weekly_pools FOR SELECT
    USING (family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create family pools"
    ON weekly_pools FOR INSERT
    WITH CHECK (family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    ));

-- Family invites policies
CREATE POLICY "Users can create invites for their family"
    ON family_invites FOR INSERT
    WITH CHECK (family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can view invites for their family"
    ON family_invites FOR SELECT
    USING (family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    ) OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their received invites"
    ON family_invites FOR UPDATE
    USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Create trigger function for automatic user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for users table updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create policy to allow the trigger function to insert users
CREATE POLICY "Allow handle_new_user to insert users"
  ON users FOR INSERT
  WITH CHECK (true);
