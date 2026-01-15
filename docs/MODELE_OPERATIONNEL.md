# Modèle Opérationnel & Cycle de Vie du Végétal

> [!NOTE]
> Ce document définit les règles de gestion du "Miroir Physique" du jardin (Seasons, Sujets, Événements).

## 1. Concepts Fondamentaux

### Le "Sujet" vs le "Référentiel"
*   **Référentiel (Botanique)** : La fiche théorique ("Tomate Marmande"). Immuable.
*   **Sujet (Opérationnel)** : L'instance physique au jardin ("Mes 6 plants de Marmande 2026"). Dynamique.

### L'Unité de Gestion
La granularité de gestion dépend de la nature de la plante.

| Type | Catégorie | Unité par Défaut | Exemple |
| :--- | :--- | :--- | :--- |
| **Vivace** | Arbre Fruitier | `INDIVIDU` | 1 Pommier |
| **Vivace** | Arbuste | `INDIVIDU` (ou `PLANT` pour haies) | 30 Photinias (Haie) |
| **Annuelle** | Légume-Fruit | `PLANT` | 6 Tomates |
| **Annuelle** | Légume-Racine | `METRE_LINEAIRE` | 3m de Carottes |
| **Annuelle** | Légume-Feuille | `PLANT` (Salades) ou `M2` (Epinards) | 12 Laitues |

## 2. Le Cycle de Vie Dynamique (Workflow)

Un Sujet n'est pas statique. Sa quantité et son état évoluent au fil des **Événements Culturaux**.
Le système suit une logique d'entonnoir (perte/sélection numéraire au fil du temps).

#### Exemple Typique : Tomate (Annuelle)

1.  **Phase 1 : Semis (Création)**
    *   *Action* : "Semis en terrine"
    *   *Quantité* : **12**
    *   *Unité* : `GRAINE` (ou `ALVEOLE`)
    *   *Lieu* : Pépinière / Serre

2.  **Phase 2 : Repiquage n°1 (Sélection)**
    *   *Événement* : "Repiquage en godet"
    *   *Logique* : On ne garde que les plus belles levées.
    *   *Nouvelle Quantité* : **8**
    *   *Unité* : `PLANT`

3.  **Phase 3 : Repiquage n°2 (Fortification - Optionnel)**
    *   *Événement* : "Repiquage grand pot"
    *   *Nouvelle Quantité* : **6**
    *   *Unité* : `PLANT`

4.  **Phase 4 : Plantation (Mise en Place)**
    *   *Événement* : "Plantation pleine terre"
    *   *Logique* : On ne garde que les plants qui ont survécu/prospéré et on remplit l'espace disponible.
    *   *Nouvelle Quantité* : **4**
    *   *Unité* : `PLANT`
    *   *Lieu* : Potager (Zone finale)

## 3. Modèle de Données Cible

### Entité `Saison`
Conteneur temporel flexible.
*   `nom` (ex: "Saison 2026")
*   `date_debut` (ex: 01/10/2025 pour inclure l'Ail d'automne et les Fèves)
*   `date_fin` (ex: 31/12/2026)
*   `statut` (PLANIFIEE, ACTIVE, ARCHIVEE) - *Règle : Une seule saison ACTIVE à la fois.*

### Entité `Sujet`
L'objet suivi.
*   `tracking_id` (ex: 2026-TOM-MAR-01)
*   `variete_id` (Lien Botanique)
*   `saison_origine_id` (Pour savoir quand il a été créé, crucial pour les Vivaces)
*   `quantite_actuelle` (ex: 4)
*   `unite_actuelle` (ex: PLANT)
*   `stade_actuel` (ex: EN_PLACE)

### Entité `Evenement` (Traceability)
L'historique des actions.
*   `sujet_id`
*   `saison_id` (Saison durant laquelle l'événement a lieu)
*   `geste_id` (Lien vers le Référentiel des Gestes, ex: "Semis", "Taille", "Récolte")
*   `date`
*   `data` (`jsonb`) : Données contextuelles flexibles selon le type de geste.

#### Propositions de Schémas JSON (`data`) par Famille de Geste

**1. Événement : SEMIS**
*Initialise la vie de la plante.*
```json
{
  "mode_semis": "PLEINE_TERRE", // ou "PEPINIERE"
  "zone": "Bac 2",                // Requis si PLEINE_TERRE
  "ref_alveole": null,            // Requis si PEPINIERE (ex: "Plateau A - Rang 3")
  "quantite_graine": 50,
  "profondeur_cm": 1,             // Optionnel
  "meteo": "Pluvieux"             // Optionnel
}
```

**2. Événement : PLANTATION (Mise en place)**
*Transfert définitif vers la zone de culture.*
```json
{
  "quantite_plant": 12,           // Nombre de plants mis en terre
  "zone": "Serre Tunnel 1",       // Nouvel emplacement
  "espacement_cm": 40,            // Optionnel
  "amendement": "Compost mûr"     // Optionnel
}
```

**3. Événement : REPIQUAGE (Intermédiaire)**
*Transfert temporaire pour fortifier.*
```json
{
  "quantite_repiquee": 12,
  "contenant": "Godet 9x9",
  "substrat": "Terreau Semis+Repiquage"
}
```

**4. Événement : RECOLTE**
*Produit de la valeur.*
```json
{
  "poids_kg": 2.5,
  "calibre": "Moyen",
  "qualite": "A",
  "destination": "Consommation fraiche"
}
```
