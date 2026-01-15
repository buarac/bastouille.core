-- Add missing columns to agent_configurations
ALTER TABLE public.agent_configurations 
ADD COLUMN IF NOT EXISTS model text DEFAULT 'gemini-2.0-flash-exp',
ADD COLUMN IF NOT EXISTS temperature float DEFAULT 0.0;

-- Seed BOTANICAL_NORMALIZER Agent Configuration
INSERT INTO public.agent_configurations (agent_key, model, temperature, system_prompt)
VALUES (
    'BOTANICAL_NORMALIZER',
    'gemini-2.0-flash-exp',
    0.0,
    'Tu es un expert en agronomie agissant comme middleware de normalisation.

MISSION :
Transformer une phrase naturelle en un JSON structuré. Tu dois corriger les fautes de frappe et normaliser les noms d''espèces et variétés selon les standards botaniques (ex: ''Patate'' -> ''Pomme de terre'').

RÈGLES DE SORTIE :
1. Réponds EXCLUSIVEMENT en JSON.
2. Si la variété n''est pas mentionnée, variete doit être null.
3. Déduis l''unité logique si elle manque (graines pour semis, L pour arrosage).
4. Ne suppose jamais l''existence d''un lieu si non mentionné.

FORMAT JSON REQUIS :
{
  "action": "semis|arrosage|fertilisation|taille|recolte|observation",
  "entite": { "espece": "string", "variete": "string|null" },
  "mesure": { "valeur": number|null, "unite": "string|null" },
  "localisation": { "lieu": "string|null", "precisions": "string|null" },
  "brut": "string"
}'
) ON CONFLICT (agent_key) DO UPDATE
SET model = EXCLUDED.model,
    temperature = EXCLUDED.temperature,
    system_prompt = EXCLUDED.system_prompt;

-- Seed Few-Shot Examples for BOTANICAL_NORMALIZER
DELETE FROM public.agent_few_shot_examples WHERE agent_key = 'BOTANICAL_NORMALIZER';

INSERT INTO public.agent_few_shot_examples (agent_key, input_text, output_json)
VALUES
(
    'BOTANICAL_NORMALIZER',
    'J''ai mis 5L aux pieds des tomates cerises',
    '{"action":"arrosage","entite":{"espece":"Tomate","variete":"Cerise"},"mesure":{"valeur":5,"unite":"L"},"localisation":{"lieu":null,"precisions":null},"brut":"5L"}'::jsonb
),
(
    'BOTANICAL_NORMALIZER',
    'Semis de 20 graines de Noir de Crimée en alvéoles',
    '{"action":"semis","entite":{"espece":"Tomate","variete":"Noire de Crimée"},"mesure":{"valeur":20,"unite":"graines"},"localisation":{"lieu":"Seminarium","precisions":"alvéoles"},"brut":"20 graines"}'::jsonb
),
(
    'BOTANICAL_NORMALIZER',
    'Taille du pêcher',
    '{"action":"taille","entite":{"espece":"Pêcher","variete":null},"mesure":{"valeur":null,"unite":null},"localisation":{"lieu":null,"precisions":null},"brut":null}'::jsonb
);
