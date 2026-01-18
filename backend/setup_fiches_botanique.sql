-- Enable pgvector extension if not exists
CREATE EXTENSION IF NOT EXISTS vector;

-- Create fiches_botanique table
CREATE TABLE IF NOT EXISTS fiches_botanique (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data JSONB NOT NULL,
    variete TEXT NOT NULL,
    espece TEXT NOT NULL,
    nom TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    embedding_nom VECTOR(768) -- gemini-embedding-001 dimension
);

-- Index for vector search (Cosine similarity)
CREATE INDEX IF NOT EXISTS fiches_botanique_embedding_idx ON fiches_botanique USING ivfflat (embedding_nom vector_cosine_ops) WITH (lists = 100);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fiches_botanique_modtime
    BEFORE UPDATE ON fiches_botanique
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function for vector search
CREATE OR REPLACE FUNCTION match_fiches (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  data JSONB,
  variete TEXT,
  espece TEXT,
  nom TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fiches_botanique.id,
    fiches_botanique.data,
    fiches_botanique.variete,
    fiches_botanique.espece,
    fiches_botanique.nom,
    fiches_botanique.created_at,
    fiches_botanique.updated_at,
    1 - (fiches_botanique.embedding_nom <=> query_embedding) AS similarity
  FROM fiches_botanique
  WHERE 1 - (fiches_botanique.embedding_nom <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
