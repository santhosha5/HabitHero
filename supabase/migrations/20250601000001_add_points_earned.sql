-- Add points_earned column to habit_completions table
ALTER TABLE habit_completions ADD COLUMN IF NOT EXISTS points_earned INTEGER NOT NULL DEFAULT 10;
