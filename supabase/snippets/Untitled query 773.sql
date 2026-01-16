-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Add embedding column to botanique_plantes
-- Dimension 768 corresponds to Gemini text-embedding-004
alter table botanique_plantes 
add column if not exists embedding vector(768);

-- 3. Create an index for faster search (IVFFlat or HNSW)
-- We use IVFFlat for better performance/recall balance on small/medium datasets
-- Note: Requires at least a few rows to be effective, but creating it early is fine.
create index if not exists botanique_plantes_embedding_idx 
on botanique_plantes 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- 4. Create RPC function for Similarity Search
-- This allows access via Supabase Client .rpc('match_botanique', {...})
create or replace function match_botanique (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  nom_commun text,
  variete text,
  espece text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    botanique_plantes.id,
    botanique_plantes.nom_commun,
    botanique_plantes.variete,
    botanique_plantes.espece,
    1 - (botanique_plantes.embedding <=> query_embedding) as similarity
  from botanique_plantes
  where 1 - (botanique_plantes.embedding <=> query_embedding) > match_threshold
  order by botanique_plantes.embedding <=> query_embedding
  limit match_count;
end;
$$;
