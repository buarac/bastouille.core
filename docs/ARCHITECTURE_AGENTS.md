# Architecture des Agents - Baštouille.Core

> [!IMPORTANT]
> Cette documentation définit les règles strictes pour le développement de tout nouvel agent AI dans le projet.

## Philosophie : "Prompt as Data"

Dans Baštouille.Core, le comportement (la "personnalité" et l'intelligence) d'un agent doit être **découplé** de son code d'exécution.
Nous appliquons le principe : **Le Code est le Moteur, la Donnée (Prompt) est le Carburant.**

Aucun `System Prompt` ne doit être hardcodé dans les fichiers Python.

## Règles d'Implémentation

### 1. Externalisation du System Prompt
Chaque agent doit récupérer son prompt système depuis la base de données au démarrage de son analyse.

- **Table** : `agent_configurations`
- **Clé** : `agent_key` (ex: `botanique_v1`, `qa_specialist`, `architecte`)

### 2. Few-Shot Prompting (Apprentissage par l'exemple)
Pour garantir la robustesse, en particulier pour les formats de sortie stricts (JSON), tous les agents doivent utiliser la technique du Few-Shot Prompting.
Au lieu de longues instructions théoriques, nous injectons des exemples concrets "Question -> Réponse Attendue".

- **Table** : `agent_few_shot_examples`
- **Injection** : Les exemples sont sélectionnés aléatoirement ou sémantiquement et ajoutés dynamiquement au prompt final.

### 3. Cycle de Vie d'un Agent

1.  **Code (Python)** : Gère l'appel API (Gemini/Ollama), le parsing de la réponse, et la gestion des erreurs. Il est agnostique du contenu.
2.  **Configuration (DB)** : Définit qui est l'agent (Prompt) et comment il doit répondre (Exemples).
3.  **Évolution** : Pour changer le comportement, on modifie la DB. On ne touche au code que pour ajouter de nouvelles capacités techniques (ex: accès à internet, nouvel outil).

## Schéma de Données

### `agent_configurations`
| Colonne | Type | Description |
| :--- | :--- | :--- |
| `agent_key` | `text` (PK) | Identifiant unique de l'agent (ex: `botanique_v1`) |
| `system_prompt` | `text` | Le prompt système principal |
| `is_active` | `boolean` | Indique si cette version est active |

### `agent_few_shot_examples`
| Colonne | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | ID unique |
| `agent_key` | `text` (FK) | Lien vers l'agent parent |
| `input_text` | `text` | Simulation de la phrase utilisateur |
| `output_json` | `jsonb` | La réponse parfaite attendue (format strict) |
| `description` | `text` | Méta-data (ex: "Cas nominal", "Cas erreur") |
