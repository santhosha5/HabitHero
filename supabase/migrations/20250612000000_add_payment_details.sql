-- Create user_payment_details table
CREATE TABLE IF NOT EXISTS user_payment_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('venmo', 'paypal')),
    account_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, provider)
);

-- Add RLS policies
ALTER TABLE user_payment_details ENABLE ROW LEVEL SECURITY;

-- Users can read their own payment details
CREATE POLICY "Users can view own payment details"
    ON user_payment_details FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own payment details
CREATE POLICY "Users can insert own payment details"
    ON user_payment_details FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own payment details
CREATE POLICY "Users can update own payment details"
    ON user_payment_details FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_payment_details_updated_at
    BEFORE UPDATE ON user_payment_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
