-- Create family_invites table
CREATE TABLE IF NOT EXISTS family_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) NOT NULL,
    invited_by UUID REFERENCES users(id) NOT NULL,
    email TEXT NOT NULL,
    invite_code TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '7 days') NOT NULL
);

-- Create indexes
CREATE INDEX idx_family_invites_family_id ON family_invites(family_id);
CREATE INDEX idx_family_invites_email ON family_invites(email);
CREATE INDEX idx_family_invites_invite_code ON family_invites(invite_code);

-- Enable RLS
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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
