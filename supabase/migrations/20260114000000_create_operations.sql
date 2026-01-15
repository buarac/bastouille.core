-- Create saisons table
create table if not exists public.saisons (
    id uuid default gen_random_uuid() primary key,
    nom text not null unique,
    date_debut date not null,
    date_fin date not null,
    statut text not null check (statut in ('PLANIFIEE', 'ACTIVE', 'ARCHIVEE')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Constraint: Only one ACTIVE season
create unique index on public.saisons (statut) where (statut = 'ACTIVE');

-- Create sujets table
create table if not exists public.sujets (
    id uuid default gen_random_uuid() primary key,
    tracking_id text not null unique,
    variete_id uuid references public.botanique_plantes(id), -- Nullable for generic subjects if needed
    saison_origine_id uuid references public.saisons(id) not null,
    nom text,
    quantite integer not null default 1,
    unite text not null check (unite in ('INDIVIDU', 'PLANT', 'METRE_LINEAIRE', 'M2')),
    stade text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create evenements table
create table if not exists public.evenements (
    id uuid default gen_random_uuid() primary key,
    sujet_id uuid references public.sujets(id) on delete cascade not null,
    saison_id uuid references public.saisons(id) not null,
    type_geste text not null, -- SEMIS, REPIQUAGE, etc.
    geste_id uuid, -- Reserved for link to Gesture Repertoire if implemented later
    date timestamp with time zone default timezone('utc'::text, now()) not null,
    data jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.saisons enable row level security;
alter table public.sujets enable row level security;
alter table public.evenements enable row level security;

-- Policies (Open for now, similar to other tables)
create policy "Allow read access for authenticated users"
on public.saisons for select to authenticated, service_role using (true);
create policy "Allow all access for authenticated users"
on public.saisons for all to authenticated, service_role using (true);

create policy "Allow read access for authenticated users"
on public.sujets for select to authenticated, service_role using (true);
create policy "Allow all access for authenticated users"
on public.sujets for all to authenticated, service_role using (true);

create policy "Allow read access for authenticated users"
on public.evenements for select to authenticated, service_role using (true);
create policy "Allow all access for authenticated users"
on public.evenements for all to authenticated, service_role using (true);

-- Seed initial Season 2026
insert into public.saisons (nom, date_debut, date_fin, statut)
values ('Saison 2026', '2025-10-01', '2026-12-31', 'ACTIVE')
on conflict (nom) do nothing;
