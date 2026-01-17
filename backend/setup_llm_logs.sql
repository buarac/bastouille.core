-- Table for low-level LLM Traceability (Raw Payloads)
create table if not exists llm_logs (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    
    -- Context
    agent_name text, -- e.g. "Baštouille.Chef"
    trace_id text, -- Optional correlation ID for grouping turns
    
    -- Technical Details
    model_name text,
    method_name text, -- e.g. "generate_content", "embed_content"
    
    -- Metrics
    duration_ms int,
    input_tokens int,
    output_tokens int,
    
    -- Payloads (JSONB for flexibility)
    input_payload jsonb,
    output_payload jsonb,
    error_message text
);

-- Index for faster analysis/filtering
create index if not exists llm_logs_created_at_idx on llm_logs(created_at desc);
create index if not exists llm_logs_agent_name_idx on llm_logs(agent_name);
