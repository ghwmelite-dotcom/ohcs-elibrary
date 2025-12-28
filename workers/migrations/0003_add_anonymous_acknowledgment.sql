-- Add anonymous_id column to broadcast_acknowledgments table
-- This allows anonymous users to acknowledge emergency broadcasts

ALTER TABLE broadcast_acknowledgments ADD COLUMN anonymous_id TEXT;

-- Create index for efficient lookups by anonymous_id
CREATE INDEX IF NOT EXISTS idx_broadcast_ack_anonymous ON broadcast_acknowledgments(anonymous_id);
