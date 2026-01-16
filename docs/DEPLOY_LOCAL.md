# Guide de Déploiement Local (Production)

Ce guide explique comment installer et lancer "Bastouille Core" sur une machine locale (ex: Mini PC Ubuntu) en mode autonome.

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) installé.
- [Docker Compose](https://docs.docker.com/compose/install/) installé.
- Python 3+ (pour générer les clés).

## Installation

1.  **Cloner le dépôt** sur la machine cible.
    ```bash
    git clone ...
    cd bastouille.core
    ```

2.  **Configuration**
    Copiez le fichier d'exemple et générez les clés de sécurité.
    ```bash
    cp .env.example .env
    python3 scripts/generate_keys.py
    ```
    Copiez les valeurs affichées par le script dans votre fichier `.env`.
    
    > **Note** : N'oubliez pas d'ajouter votre `GEMINI_API_KEY` dans le fichier `.env`.

3.  **Lancement**
    Utilisez le script de déploiement pour construire et lancer les conteneurs.
    ```bash
    chmod +x deploy.sh
    ./deploy.sh
    ```

## Accès aux Services

Une fois redémarré :

- **Application (Frontend)** : [http://localhost:3000](http://localhost:3000)
- **Supabase Studio (Admin DB)** : [http://localhost:54324](http://localhost:54324)
    - Default user/pass: (Pas d'auth sur cette version locale de Studio, ou admin/admin selon config)
- **API Gateway** : [http://localhost:54321](http://localhost:54321)

## Maintenance

- **Arrêter** : `docker-compose down`
- **Mise à jour** : `git pull && ./deploy.sh`
- **Logs** : `docker-compose logs -f backend`
