---
description: Vérifie les logs applicatifs et effectue un smoke test visuel du frontend
---

1. **Vérification des Logs**
   - Utilise `read_terminal` pour lire les logs des terminaux actifs (backend et frontend).
   - Recherche des erreurs critiques (Traceback, Error, Exception, Failed to compile).
   - Si des erreurs sont trouvées, analyse-les et corrige-les avant de continuer.

2. **Smoke Test Frontend (Navigation)**
   - Utilise `browser_subagent` pour naviguer sur l'application.
   - **Tâche du subagent** :
     "Navigue sur les pages suivantes et vérifie qu'elles ne sont pas blanches (vérifie la présence du header/sidebar et d'un titre) :
      1. Accueil (/)
      2. Agronome IA (/agents/agronome-v1)
      3. Opérationnel - Sujets (/operationnel/sujets)
      4. Saisons (/saisons)
      
      Si une page semble cassée (écran blanc, erreur console visible), prends une capture d'écran et signale-le."

3. **Rapport**
   - Fais un résumé de l'état de santé de l'application.
