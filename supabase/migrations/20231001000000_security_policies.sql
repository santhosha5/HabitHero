-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_challenges ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can read and update their own profile
CREATE POLICY users_select ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can read other users in their family
CREATE POLICY users_in_family_select ON users
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    ) AND family_id IS NOT NULL
  );

-- Families table policies
-- Users can see their own family
CREATE POLICY families_select ON families
  FOR SELECT USING (
    id IN (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Only family creator can update family details
CREATE POLICY families_update ON families
  FOR UPDATE USING (
    created_by = auth.uid()
  );

-- Habits table policies
-- Users can CRUD their own habits
CREATE POLICY habits_select ON habits
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY habits_insert ON habits
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY habits_update ON habits
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY habits_delete ON habits
  FOR DELETE USING (user_id = auth.uid());

-- Habit completions policies
-- Users can CRUD their own habit completions
CREATE POLICY habit_completions_select ON habit_completions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY habit_completions_insert ON habit_completions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY habit_completions_update ON habit_completions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY habit_completions_delete ON habit_completions
  FOR DELETE USING (user_id = auth.uid());

-- Family can see each other's habit completions
CREATE POLICY family_habit_completions_select ON habit_completions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE family_id = (
        SELECT family_id FROM users WHERE id = auth.uid()
      ) AND family_id IS NOT NULL
    )
  );

-- Habit locations policies
-- Users can CRUD their own habit locations
CREATE POLICY habit_locations_select ON habit_locations
  FOR SELECT USING (
    habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid())
  );

CREATE POLICY habit_locations_insert ON habit_locations
  FOR INSERT WITH CHECK (
    habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid())
  );

CREATE POLICY habit_locations_update ON habit_locations
  FOR UPDATE USING (
    habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid())
  );

CREATE POLICY habit_locations_delete ON habit_locations
  FOR DELETE USING (
    habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid())
  );

-- Family activity policies
-- Users can see their family's activity
CREATE POLICY family_activity_select ON family_activity
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Users can create activity items for their family
CREATE POLICY family_activity_insert ON family_activity
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Weekly pools policies
-- Users can see their family's weekly pools
CREATE POLICY weekly_pools_select ON weekly_pools
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Only admins can manage weekly pools
CREATE POLICY weekly_pools_insert ON weekly_pools
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT created_by FROM families WHERE id = family_id
    )
  );

CREATE POLICY weekly_pools_update ON weekly_pools
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT created_by FROM families WHERE id = family_id
    )
  );

-- User payment details policies
-- Users can manage their own payment details
CREATE POLICY user_payment_details_select ON user_payment_details
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_payment_details_insert ON user_payment_details
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY user_payment_details_update ON user_payment_details
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY user_payment_details_delete ON user_payment_details
  FOR DELETE USING (user_id = auth.uid());

-- Payment transactions and failed payments are admin-only
-- No policies for regular users, will be managed by service role

-- Family challenges policies
-- Users can see their family's challenges
CREATE POLICY family_challenges_select ON family_challenges
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Any family member can create a challenge
CREATE POLICY family_challenges_insert ON family_challenges
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Only challenge creator can update or delete a challenge
CREATE POLICY family_challenges_update ON family_challenges
  FOR UPDATE USING (
    created_by = auth.uid()
  );

CREATE POLICY family_challenges_delete ON family_challenges
  FOR DELETE USING (
    created_by = auth.uid()
  );