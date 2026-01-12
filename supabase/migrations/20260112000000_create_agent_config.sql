-- Create agent_configurations table
create table if not exists public.agent_configurations (
    agent_key text primary key,
    system_prompt text not null,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.agent_configurations enable row level security;

-- Create policy to allow read access to authenticated users and service_role
create policy "Allow read access for authenticated users"
on public.agent_configurations for select
to authenticated, service_role
using (true);


-- Create agent_few_shot_examples table
create table if not exists public.agent_few_shot_examples (
    id uuid default gen_random_uuid() primary key,
    agent_key text references public.agent_configurations(agent_key) on delete cascade not null,
    input_text text not null,
    output_json jsonb not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.agent_few_shot_examples enable row level security;

-- Create policy to allow read access
create policy "Allow read access for authenticated users"
on public.agent_few_shot_examples for select
to authenticated, service_role
using (true);

-- Insert initial data for Botanique Agent
insert into public.agent_configurations (agent_key, system_prompt)
values (
    'botanique_v1',
    'Tu es un expert en botanique et jardinage pour l''application Baštouille.
    Ta mission est de fournir des informations structurées sur une plante donnée (Espèce ou Variété).
    
    Tu DOIS répondre UNIQUEMENT au format JSON strict, respectant le schéma attendu.
    Aucun texte avant ou après le JSON.
    
    Règles métier :
    - Les bisannuelles sont classées comme ANNUELLES.
    - Pour les arbres fruitiers, indique les pollinisateurs ou ''auto-fertile''.
    - Si l''information est inconnue, mets null ou une liste vide, ne jamais inventer.'
) on conflict (agent_key) do nothing;

-- Insert few-shot examples for Botanique Agent
insert into public.agent_few_shot_examples (agent_key, input_text, output_json, description)
values 
(
    'botanique_v1',
    'Donne moi les informations botaniques pour : Tomate "Coeur de Boeuf"',
    '{
      "nom": "Solanum lycopersicum",
      "nom_commun": "Tomate",
      "variete": "Coeur de Boeuf",
      "famille": "Solanaceae",
      "type_plante": "ANNUELLE",
      "periode_semis": ["MARS", "AVRIL"],
      "periode_recolte": ["JUILLET", "AOUT", "SEPTEMBRE"],
      "exposition": "SOLEIL",
      "besoin_eau": "MOYEN",
      "description": "Excellente variété ancienne, très charnue, idéale en salade. Sensible au mildiou."
    }'::jsonb,
    'Cas nominal : Variété connue'
),
(
    'botanique_v1',
    'Infos sur le Chêne Centenaire',
    '{
      "nom": "Quercus",
      "nom_commun": "Chêne",
      "variete": null,
      "famille": "Fagaceae",
      "type_plante": "VIVACE",
      "periode_semis": [],
      "periode_recolte": [],
      "exposition": "SOLEIL",
      "besoin_eau": "FAIBLE",
      "description": "Grand arbre à feuilles caduques. Croissance lente."
    }'::jsonb,
    'Cas général : Espèce sans variété précise'
);
