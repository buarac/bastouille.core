-- Create table for Referentiel Gestes
CREATE TABLE IF NOT EXISTS public.referentiel_gestes (
    id SERIAL PRIMARY KEY,
    famille TEXT NOT NULL,
    verbe TEXT NOT NULL,
    action TEXT NOT NULL,
    obj_principal TEXT,
    schema_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.referentiel_gestes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for all
CREATE POLICY "Allow read access for all" ON public.referentiel_gestes
    FOR SELECT USING (true);

-- Create policy to allow insert/update for all (since we are in local dev/admin mode for now)
CREATE POLICY "Allow full access for all" ON public.referentiel_gestes
    FOR ALL USING (true) WITH CHECK (true);
