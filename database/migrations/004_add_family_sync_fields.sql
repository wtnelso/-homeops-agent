-- Migration: Add family sync tracking fields to agent_memories table
-- Purpose: Enable family profile synchronization with agent memory

-- Add fields for family sync tracking
ALTER TABLE agent_memories
ADD COLUMN IF NOT EXISTS family_member_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS outdated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS outdated_reason VARCHAR(100);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_memories_family_member_id
ON agent_memories (family_member_id);

CREATE INDEX IF NOT EXISTS idx_agent_memories_content_hash
ON agent_memories (content_hash);

CREATE INDEX IF NOT EXISTS idx_agent_memories_status
ON agent_memories (status);

CREATE INDEX IF NOT EXISTS idx_agent_memories_family_sync
ON agent_memories (account_id, family_member_id, status);

-- Add comment explaining the sync system
COMMENT ON COLUMN agent_memories.family_member_id IS 'ID of the family member this memory relates to (for sync tracking)';
COMMENT ON COLUMN agent_memories.content_hash IS 'SHA-256 hash of family data when memory was created (for change detection)';
COMMENT ON COLUMN agent_memories.status IS 'Memory status: active, outdated';
COMMENT ON COLUMN agent_memories.outdated_at IS 'When memory was marked as outdated';
COMMENT ON COLUMN agent_memories.outdated_reason IS 'Why memory was marked as outdated: family_data_changed, family_member_deleted';