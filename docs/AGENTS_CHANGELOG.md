# Historique des Versions des Agents Baštouille

Ce document retrace les évolutions des Agents IA du système (capacités, outils, comportements).

## 🟢 Chef de Culture (CultureAgent)

### v1.5 (En cours)
**Date :** 16 Janvier 2026
**Nouveautés :**
- **Accès à l'Historique (Events)** : L'agent peut désormais consulter le journal des événements passés (`list_garden_events`).
- **Filtrage par Sujet** : Possibilité de demander l'historique spécifique d'une plante via son Tracking ID.
- **Support Hybrid Streaming** : Amélioration confirmée du streaming (Pensée/Réponse).

### v1.1 - v1.4
**Date :** Janvier 2026
**Focus :** Stabilisation et Streaming
- Ajout du mode "Streaming" (Token-by-token).
- Séparation visuelle des "Pensées" et "Réponses".
- Correction de bugs de scope (`import re`) et de JSON parsing.

### v1.0
**Date :** Décembre 2025
**Lancement initial**
- Capacité de **Lister les sujets** actifs.
- Capacité de **Rechercher** dans le référentiel botanique/jardin.
- Capacité de **Créer un sujet** (Semis/Plantation).
- Capacité de **Noter un événement** (Log).
- Mode "Sécurité" (Confirmation requise pour les actions d'écriture).
