from typing import Dict, Any, List
from services.persistence import get_supabase_client

# -- Logic --
def rechercher(query: str) -> Dict[str, Any]:
    """
    Recherche floue dans le référentiel botanique ET les sujets du jardin.
    Utile pour trouver des ID, comprendre ce qui est planté, ou vérifier l'orthographe.
    """
    supabase = get_supabase_client()
    if not supabase:
        return {"error": "DB Connection failed"}

    # 1. Search Botanical Reference (Catalog)
    q = query.strip()
    if not q:
        return {"plants": [], "subjects": [], "message": "Query empty"}
    
    words = q.split()
    first_word = words[0]
    
    # Candidate Search (Broad)
    try:
        bot_res = supabase.table("botanique_plantes")\
            .select("id, nom_commun, variete")\
            .or_(f"nom_commun.ilike.%{first_word}%,variete.ilike.%{first_word}%")\
            .limit(20)\
            .execute()
        raw_candidates = bot_res.data or []
    except Exception as e:
        raw_candidates = []
        # log error?

    # Ranking (Python side for simplicity as before)
    scored = []
    q_tokens = set(w.lower() for w in words)
    
    for p in raw_candidates:
        full_str = f"{p['nom_commun']} {p['variete'] or ''}".lower()
        p_tokens = set(full_str.split())
        score = len(q_tokens.intersection(p_tokens))
        if q.lower() in full_str: score += 5
        scored.append((score, p))
        
    scored.sort(key=lambda x: x[0], reverse=True)
    plants = [item[1] for item in scored if item[0] > 0][:5]

    # 2. Search Subjects (Inventory)
    plant_ids = [p["id"] for p in plants]
    
    # Strategy: Find subjects linked to found plants OR subjects matching the name textually
    # Note: reusing logic from older tool but simplified for clarity
    
    subjects = []
    try:
        # A. Linked Subjects
        if plant_ids:
            res_linked = supabase.table("sujets")\
                .select("id, tracking_id, nom, stade, quantite, variete_id")\
                .in_("variete_id", plant_ids)\
                .neq("stade", "TERMINE")\
                .execute()
            subjects.extend(res_linked.data or [])

        # B. Textual Match Subjects
        res_named = supabase.table("sujets")\
            .select("id, tracking_id, nom, stade, quantite, variete_id")\
            .ilike("nom", f"%{q}%")\
            .neq("stade", "TERMINE")\
            .execute()
        subjects.extend(res_named.data or [])
        
        # Deduplicate by ID
        unique_subjects = {s["id"]: s for s in subjects}
        subjects = list(unique_subjects.values())
        
    except Exception as e:
        return {"plants": plants, "subjects": [], "error_subjects": str(e)}

    return {
        "plants_catalog": plants,
        "active_subjects": subjects,
        "count_plants": len(plants),
        "count_subjects": len(subjects)
    }

# -- Definition --
rechercher_definition = {
    "name": "rechercher",
    "description": "Recherche hybride (Plantes et Sujets). Utiliser pour résoudre une ambiguïté ('C'est quoi 2024-SUJ-X ?') ou vérifier si une plante existe avant de créer.",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Le terme de recherche (Nom plante, Tracking ID, Espèce...)",
            }
        },
        "required": ["query"],
    },
}
