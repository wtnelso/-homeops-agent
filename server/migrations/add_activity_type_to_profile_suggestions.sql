-- Add activity_type column to profile_suggestions table
-- This stores the AI-detected activity type for activity-related suggestions

ALTER TABLE profile_suggestions
ADD COLUMN IF NOT EXISTS activity_type VARCHAR(20);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profile_suggestions_activity_type
ON profile_suggestions (activity_type)
WHERE activity_type IS NOT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN profile_suggestions.activity_type IS 'AI-detected activity type for activity-related suggestions (Sport, Educational, Creative, etc.)';