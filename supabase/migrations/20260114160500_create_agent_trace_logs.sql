-- Create agent_trace_logs table
create table if not exists public.agent_trace_logs (
    id uuid default gen_random_uuid() primary key,
    agent_name text not null,
    agent_version text,
    model_name text,
    input_content text,
    full_prompt text,
    response_content text,
    input_tokens integer,
    output_tokens integer,
    duration_ms integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Optional depending on policy, generally good practice)
alter table public.agent_trace_logs enable row level security;

-- Policy: Allow read access to anyone (for now, or admin only in real app)
-- Policy: Allow read access to anyone (for now, or admin only in real app)
-- For this "minimalist" app without auth active on frontend, we might just allow public
DROP POLICY IF EXISTS "Enable read access for all users" ON public.agent_trace_logs;
create policy "Enable read access for all users" on public.agent_trace_logs
    for select using (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON public.agent_trace_logs;
create policy "Enable insert access for all users" on public.agent_trace_logs
    for insert with check (true);
