-- Fix RLS policy for creating families
DROP POLICY IF EXISTS "Users can create family" ON families;

-- Create a more permissive policy for creating families
CREATE POLICY "Users can create family" ON families
    FOR INSERT
    WITH CHECK (true);

-- Add policy for updating families
CREATE POLICY "Users can update own family" ON families
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.family_id = families.id
        )
    );

-- Add policy for deleting families (only creator can delete)
CREATE POLICY "Users can delete own family" ON families
    FOR DELETE
    USING (created_by = auth.uid());

-- Update policy for users to see any family they are part of
DROP POLICY IF EXISTS "Users can view own family" ON families;
CREATE POLICY "Users can view own family" ON families
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.family_id = families.id
        ) OR 
        created_by = auth.uid()
    );

-- Policy to check families by invite code (for joining)
CREATE POLICY "Users can view families by invite code" ON families
    FOR SELECT
    USING (true);