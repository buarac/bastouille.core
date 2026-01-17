from typing import Dict, List, Any
from google.genai import types
from services.persistence import get_supabase_client

# -- Tool Implementation --
def liste_varietes(limit: int = 50) -> List[Dict[str, Any]]:
    """
    Récupère la liste des variétés botaniques disponibles dans le système.
    Utile pour connaître les plantes supportées (Tomates, Radis, etc.).
    """
    supabase = get_supabase_client()
    if not supabase:
        return []

    try:
        # Fetch generic plant list
        res = supabase.table("botanique_plantes")\
            .select("id, nom_commun, variete, espece")\
            .limit(limit)\
            .execute()
        
        return res.data if res.data else []
    except Exception as e:
        return [{"error": str(e)}]

# -- Tool Declaration (Gemini Native) --
liste_varietes_definition = {
    "name": "liste_varietes",
    "description": "Récupère la liste des variétés botaniques (Plantes) disponibles. Ne liste PAS les sujets du jardin, mais le référentiel.",
    "parameters": {
        "type": "object",
        "properties": {
            "limit": {
                "type": "integer",
                "description": "Nombre maximum de résultats (défaut 50)",
            }
        },
        "required": [],
    },
}
