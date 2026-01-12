# Walkthrough - Baštouille.Core Init

Ce document résume l'installation et l'utilisation de la stack technique initialisée pour **Baštouille.Core**.

> [!IMPORTANT]
> Ce document doit être **impérativement mis à jour** à chaque fois qu'une nouvelle fonctionnalité est implémentée ou que la configuration change.

## 🚀 Démarrage Rapide

Le projet utilise un script unifié pour lancer le Frontend (React) et le Backend (FastAPI) en parallèle.

### 1. Pré-requis
Assurez-vous d'avoir installé les dépendances :
```bash
# Backend (dans un terminal)
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Frontend (dans un autre terminal ou à la racine)
cd frontend
npm install
```

### 2. Lancer le serveur de développement
Depuis la racine du projet (`/Volumes/Donnees/devs/bastouille.core`) :

```bash
npm run dev
```

Cela ouvrira :
*   **Frontend** : `http://localhost:5173`
*   **Backend** : `http://localhost:8000` (API Docs: `http://localhost:8000/docs`)

## 🌍 Accès Réseau (Multi-Device)
Le projet est configuré pour être accessible depuis d'autres appareils sur le réseau local (ex: MacBook, iPad).

*   **URL Frontend** : `http://macmini-m4.local:5173`
*   **URL Backend** : `http://macmini-m4.local:8000`

## 🗄️ Base de Données (Supabase Local)
L'infrastructure tourne via Docker.
*   **Démarrer** : `npx supabase start`
*   **Arrêter** : `npx supabase stop`
*   **DB URL** : `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
*   **Studio (UI)** : `http://127.0.0.1:54323` (Si non accessible, vérifier les logs Docker).
*   **API Gateway** : `http://127.0.0.1:54321`

> [!TIP]
> Si Supabase Studio ne répond pas, vous pouvez vous connecter directement à la base de données avec un outil comme **TablePlus** ou **pgAdmin** en utilisant l'URL DB ci-dessus.

> [!NOTE]
> Nous avons configuré `vite.config.js` pour autoriser le hostname `macmini-m4.local` et le Backend pour accepter les requêtes CORS depuis n'importe quelle origine en dev.


## 🤖 Agents IA & API
Le backend expose des interfaces pour dialoguer avec des Agents Intelligents (Gemini ou Ollama).

### Configuration
1.  Modifier le fichier `backend/.env` :
    ```env
    LLM_PROVIDER=gemini # ou "ollama"
    GEMINI_API_KEY=votre_cle_api
    OLLAMA_BASE_URL=http://localhost:11434
    ```
2.  Endpoint disponible : `POST /api/agents/botanique`
    *   Payload : `{"query": "Tomate coeur de boeuf"}`
    *   Réponse : JSON structuré (champs en français : `taxonomie`, `cycle_vie`, etc.)

## 📂 Structure du Projet

```text
/
├── frontend/           # React 19 + Vite 6 + Tailwind CSS v4
│   ├── src/
│   │   ├── index.css   # Point d'entrée Tailwind (@import "tailwindcss")
│   │   └── App.jsx     # Composant principal (Design System Clean)
│   └── vite.config.js  # Config Vite (Plugins + Network)
│
├── backend/            # FastAPI (Python 3.9+)
│   ├── .venv/          # Environnement virtuel (isolé)
│   ├── main.py         # Point d'entrée API + CORS
│   └── requirements.txt
│
├── supabase/           # Configuration Supabase (locale)
│   └── config.toml
│
├── package.json        # Orchestrateur (concurrently)
└── README.md           # Documentation générale
```

## 🛠 Notes Techniques
*   **Tailwind CSS v4** : Configuré avec le plugin `@tailwindcss/vite`.
    *   *Bugfix appliqué* : Création d'un `postcss.config.js` vide et downgrade vers Vite v6 pour résoudre une incompatibilité.
*   **Python venv** : Le script `npm run dev` utilise automatiquement via le chemin relatif `.venv/bin/uvicorn`, donc pas besoin d'activer le venv manuellement pour le lancer via npm.
