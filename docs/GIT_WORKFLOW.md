# Workflow Git - Baštouille.Core

Ce projet suit un **Feature Branch Workflow** strict pour maintenir la stabilité de la branche `main`.

## 1. Démarrer une nouvelle fonctionnalité
Toujours partir de la branche `main` à jour.

```bash
git checkout main
git pull origin main
git checkout -b feature/nom-de-la-feature
```

## 2. Développement
Effectuer les modifications, tests et commits sur cette branche.

```bash
git add .
git commit -m "feat: description de la fonctionnalité"
```

## 3. Finaliser et Merger
Une fois la fonctionnalité terminée et validée :

1. Retourner sur `main` et la mettre à jour :
   ```bash
   git checkout main
   git pull origin main
   ```

2. Fusionner la branche feature :
   ```bash
   git merge feature/nom-de-la-feature
   ```

3. Pousser vers le serveur :
   ```bash
   git push origin main
   ```

4. Nettoyer (Supprimer la branche feature) :
   ```bash
   # Localement
   git branch -d feature/nom-de-la-feature
   
   # Sur le serveur (si elle a été poussée)
   git push origin --delete feature/nom-de-la-feature
   ```
