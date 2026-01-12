# Agent d'Information Botanique

## Objectif
Aider l'utilisateur à constituer son référentiel botanique propre, à partir des especes et variétés réellement cultivées

## Entrée Utilisateur
L'utilisateur fournit le nom d'une espèce ou le nom d'une espèce suivi de sa variété.

## Architecture & Gestion des Prompts
Cet agent suit l'architecture **"Prompt as Data"** du projet Baštouille.Core. Son comportement est défini par des données externes et non par son code.

### 1. Configuration (System Prompt)
Le prompt système n'est pas stocké dans le code. Il est récupéré dynamiquement depuis la base de données.
*   **Source** : Table `agent_configurations` (Supabase)
*   **Clé** : `botanique_v1`
*   **Modification** : Toute mise à jour des instructions doit se faire via Supabase Studio.

### 2. Apprentissage (Few-Shot Prompting)
L'agent utilise des exemples "Question -> Réponse JSON" pour garantir la stabilité de son format de sortie et le respect des règles métier.
*   **Source** : Table `agent_few_shot_examples` (Supabase)
*   **Injection** : Les exemples sont injectés dans le prompt utilisateur au moment de l'appel.

## Sortie de l'Agent (Format JSON Requis)
L'agent est tenu de fournir les informations suivantes pour l'espèce ou la variété recherchée :

### 1. Taxonomie Botanique
* Fournir la hiérarchie complète : Ordre, Famille, Genre, Espèce, Variété.  
* Pour l'Espèce : Inclure le nom scientifique ainsi que le 'nom commun' (ex: Tomate).

### 2. Cycle de Vie
* Identifier si la plante est **VIVACE** (permanente dans le jardin) ou **ANNUELLE** (ne subsiste pas après son cycle de vie).  
* *Note : Les plantes bisannuelles doivent être classées comme ANNUELLES.*

### 3. Catégorisation
* **Pour les VIVACES :**  
  * Arbres fruitiers (ex: pommier)  
  * Arbustes d'ornement (ex: oranger du mexique)  
  * Fleurs (ex: les rosiers)  
* **Pour les ANNUELLES :**  
  * Légumes-fruits ou fruits (ex: Tomate, Melon)  
  * Légumes-feuilles (ex: céleri, salade)  
  * Légumes-racines (ex: carotte, pomme de terre, betterave)

### 4. Calendrier Cultural
Fournir les périodes (mois) associées aux pratiques culturales :
* Semis sous abris (spécifique aux annuelles)  
* Semis en pleine terre (spécifique aux annuelles)  
* Récoltes (applicable aux annuelles et vivaces)  
* Floraison (spécifique aux vivaces)

### 5. Caractéristiques Clés (Espèce et/ou Variété)
* Lister les caractéristiques jugées pertinentes par l'agent.  
* Inclure *a minima* les attributs suivants : couleur, calibre, origine, forme, texture, pour les arbres fruitiers les variétés pollinisateur ( auto-fertile si non applicable )

## Format de Sortie
Le résultat doit impérativement être structuré au format JSON, en respectant le schéma prédéfini dans le code (`backend/schemas/botanique.py`).
