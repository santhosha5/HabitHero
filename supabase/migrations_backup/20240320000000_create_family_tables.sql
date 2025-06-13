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

-- Create RLS policies
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_pools ENABLE ROW LEVEL SECURITY;

-- Families policies
CREATE POLICY "Users can view their own family"
    ON families FOR SELECT
    USING (id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create families"
    ON families FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can view family members"
    ON users FOR SELECT
    USING (family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

-- Medals policies
CREATE POLICY "Users can view their own medals"
    ON medals FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view family members' medals"
    ON medals FOR SELECT
    USING (user_id IN (
        SELECT id FROM users WHERE family_id IN (
            SELECT family_id FROM users WHERE id = auth.uid()
        )
    ));

-- Weekly pools policies
CREATE POLICY "Users can view their family's weekly pools"
    ON weekly_pools FOR SELECT
    USING (family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create weekly pools for their family"
    ON weekly_pools FOR INSERT
    WITH CHECK (family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    ));

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user already exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        INSERT INTO public.users (
            id,
            full_name,
            avatar_url,
            total_points,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 