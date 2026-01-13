-- Create table for storing botanical search results
CREATE TABLE IF NOT EXISTS botanique_plantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_commun TEXT NOT NULL,
    espece TEXT,
    variete TEXT,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better search performance if needed
CREATE INDEX IF NOT EXISTS idx_botanique_plantes_nom_commun ON botanique_plantes(nom_commun);
CREATE INDEX IF NOT EXISTS idx_botanique_plantes_created_at ON botanique_plantes(created_at DESC);

-- Add comment
COMMENT ON TABLE botanique_plantes IS 'Stores AI-generated botanical plant data saved by the user';
