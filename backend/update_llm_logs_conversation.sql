-- Migration: Add conversation_id to llm_logs
ALTER TABLE llm_logs ADD COLUMN IF NOT EXISTS conversation_id uuid;

-- Index for filtering by conversation
CREATE INDEX IF NOT EXISTS llm_logs_conversation_id_idx ON llm_logs(conversation_id);
