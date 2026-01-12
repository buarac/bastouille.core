# Baštouille.Core 🌱

**Baštouille** est un assistant de jardinage "AI-First" conçu pour transformer le jardinage amateur en un système résilient et sans charge mentale. Il agit comme une boussole horticole, guidant l'utilisateur avec des conseils prescriptifs hyper-localisés.

## 🛠 Stack Technique (Vision Supabase-First)

Cette architecture privilégie une approche **Serverless** pour la gestion des données et de l'authentification, déléguant exclusivement l'intelligence complexe au backend Python.

### ⚡️ Core Platform (Supabase)
*   **Base de Données** : **PostgreSQL** (Managed).
    *   Stockage hybride relationnel & JSONB pour la flexibilité des données botaniques.
*   **Authentification** : **Supabase Auth**.
    *   Gestion utilisateurs sécurisée (Email, Social Login).
    *   Row Level Security (RLS) native.
*   **API Data** : **PostgREST**.
    *   Exposition automatique et sécurisée de la DB via API REST pour le Frontend.
*   **Realtime** : **Supabase Realtime**.
    *   Notifications instantanées via WebSocket (ex: Alertes Gel/Canicule).
*   **Edge Functions** : TypeScript (Deno) pour les logiques événementielles légères.

### 🧠 Intelligence Service (Microservice Python)
*   **Rôle** : Cerveau déporté, sollicité uniquement pour les tâches à forte valeur cognitive.
*   **Framework** : **FastAPI**.
*   **Agents IA** : Utilisation des modeles Gemini ou en local pour la réalisation des agents
*   **Modèles** :
    *   **Cloud** : Google Gemini 3 Raisonnement complexe).
    *   **Local** : Ollama (Confidentialité & Offline).

### 🎨 Frontend (Le Visage)
*   **Framework** : **React 19** + **Vite**.
*   **Design System** : **Tailwind CSS v4** (Interface Premium "Glassmorphism").
*   **Connectivité** :
    *   `@supabase/supabase-js` : Auth, Data & Realtime.
    *   `Axios` : Communication directe avec le Service Intelligence Python.

### ⚙️ Ops & Dev
*   **CLI** : `supabase` (dev local, migrations, seed).
*   **Orchestration** : Scripts unifiés pour le démarrage parallèle.


---

