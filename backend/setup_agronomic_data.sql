CREATE TABLE IF NOT EXISTS public.agronomic_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plant_name TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(name)
);

-- Policy? Assuming public/anon for now as access is local/admin.
ALTER TABLE public.agronomic_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for anon" ON public.agronomic_data
AS PERMISSIVE FOR ALL
TO anon
USING (true)
WITH CHECK (true);
