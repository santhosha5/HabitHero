-- Drop existing policies
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

-- Create a function to check if users are in the same family
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

-- RLS Policies for Users table
CREATE POLICY "Users can view own data" ON users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can view family members" ON users
    FOR SELECT
    USING (is_same_family(auth.uid(), id));

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
    USING (is_same_family(auth.uid(), user_id));

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
    USING (is_same_family(auth.uid(), user_id));

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
    USING (is_same_family(auth.uid(), user_id));

CREATE POLICY "Users can create own medals" ON medals
    FOR INSERT
    WITH CHECK (user_id = auth.uid()); 