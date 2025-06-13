-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop all policies first
DROP POLICY IF EXISTS "Users can view their own family" ON families;
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view family members" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Allow handle_new_user to insert users" ON users;
DROP POLICY IF EXISTS "Users can view their own habits" ON habits;
DROP POLICY IF EXISTS "Users can view family members' habits" ON habits;
DROP POLICY IF EXISTS "Users can create their own habits" ON habits;
DROP POLICY IF EXISTS "Users can update their own habits" ON habits;
DROP POLICY IF EXISTS "Users can delete their own habits" ON habits;
DROP POLICY IF EXISTS "Users can view their own habit completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can view family members' habit completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can create their own habit completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can update their own habit completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can delete their own habit completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can view their own medals" ON medals;
DROP POLICY IF EXISTS "Users can view family members' medals" ON medals;
DROP POLICY IF EXISTS "Users can update their own medals" ON medals;
DROP POLICY IF EXISTS "Users can delete their own medals" ON medals;
DROP POLICY IF EXISTS "Users can view their family's weekly pools" ON weekly_pools;
DROP POLICY IF EXISTS "Users can create weekly pools for their family" ON weekly_pools;
DROP POLICY IF EXISTS "Users can update their family's weekly pools" ON weekly_pools;
DROP POLICY IF EXISTS "Users can delete their family's weekly pools" ON weekly_pools;

-- Drop functions after policies
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.get_user_family_id();

-- Drop tables
DROP TABLE IF EXISTS public.habit_completions CASCADE;
DROP TABLE IF EXISTS public.weekly_pools CASCADE;
DROP TABLE IF EXISTS public.medals CASCADE;
DROP TABLE IF EXISTS public.habits CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.families CASCADE;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create families table
CREATE TABLE IF NOT EXISTS families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create users table with family relationship
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    avatar_url TEXT,
    family_id UUID REFERENCES families(id),
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create habits table
CREATE TABLE IF NOT EXISTS habits (
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
    last_completed TIMESTAMP WITH TIME ZONE
);

-- Create habit_completions table
CREATE TABLE IF NOT EXISTS habit_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create medals table
CREATE TABLE IF NOT EXISTS medals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    category TEXT NOT NULL,
    points_required INTEGER NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    three_d_model_url TEXT,
    animation_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create weekly_pools table
CREATE TABLE IF NOT EXISTS weekly_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) NOT NULL,
    week_start TIMESTAMP WITH TIME ZONE NOT NULL,
    week_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_amount DECIMAL(10,2) DEFAULT 0,
    participants UUID[] DEFAULT '{}',
    winners JSONB DEFAULT '[]',
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'paid_out')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_is_active ON habits(is_active);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_medals_user_id ON medals(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_pools_family_id ON weekly_pools(family_id);

-- Create RLS policies
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_pools ENABLE ROW LEVEL SECURITY;

-- Create a function to get user's family_id
CREATE OR REPLACE FUNCTION get_user_family_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT family_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Families policies
CREATE POLICY "Users can view their own family"
    ON families FOR SELECT
    USING (id = get_user_family_id());

CREATE POLICY "Users can create families"
    ON families FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can view family members"
    ON users FOR SELECT
    USING (family_id = get_user_family_id());

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

-- Allow the handle_new_user function to insert new users
CREATE POLICY "Allow handle_new_user to insert users"
    ON users FOR INSERT
    WITH CHECK (true);

-- Habits policies
CREATE POLICY "Users can view their own habits"
    ON habits FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view family members' habits"
    ON habits FOR SELECT
    USING (user_id IN (
        SELECT id FROM users WHERE family_id = get_user_family_id()
    ));

-- Simplified policy for creating habits
CREATE POLICY "Users can create their own habits"
    ON habits FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own habits"
    ON habits FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own habits"
    ON habits FOR DELETE
    USING (user_id = auth.uid());

-- Habit completions policies
CREATE POLICY "Users can view their own habit completions"
    ON habit_completions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view family members' habit completions"
    ON habit_completions FOR SELECT
    USING (user_id IN (
        SELECT id FROM users WHERE family_id = get_user_family_id()
    ));

CREATE POLICY "Users can create their own habit completions"
    ON habit_completions FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own habit completions"
    ON habit_completions FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own habit completions"
    ON habit_completions FOR DELETE
    USING (user_id = auth.uid());

-- Medals policies
CREATE POLICY "Users can view their own medals"
    ON medals FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view family members' medals"
    ON medals FOR SELECT
    USING (user_id IN (
        SELECT id FROM users WHERE family_id = get_user_family_id()
    ));

CREATE POLICY "Users can update their own medals"
    ON medals FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own medals"
    ON medals FOR DELETE
    USING (user_id = auth.uid());

-- Weekly pools policies
CREATE POLICY "Users can view their family's weekly pools"
    ON weekly_pools FOR SELECT
    USING (family_id = get_user_family_id());

CREATE POLICY "Users can create weekly pools for their family"
    ON weekly_pools FOR INSERT
    WITH CHECK (family_id = get_user_family_id());

CREATE POLICY "Users can update their family's weekly pools"
    ON weekly_pools FOR UPDATE
    USING (family_id = get_user_family_id());

CREATE POLICY "Users can delete their family's weekly pools"
    ON weekly_pools FOR DELETE
    USING (family_id = get_user_family_id());

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id UUID;
BEGIN
    new_user_id := NEW.id;
    
    -- Check if user already exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = new_user_id) THEN
        INSERT INTO public.users (
            id,
            full_name,
            avatar_url,
            total_points,
            created_at,
            updated_at
        )
        VALUES (
            new_user_id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'Anonymous'),
            NEW.raw_user_meta_data->>'avatar_url',
            0,
            NOW(),
            NOW()
        );
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column(); 