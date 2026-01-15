import logging
from typing import List, Dict, Any, Optional
from services.persistence import get_supabase_client

logger = logging.getLogger(__name__)

class CultureSearchTool:
    def __init__(self):
        self.supabase = get_supabase_client()

    def search_garden(self, query: str) -> Dict[str, Any]:
        """
        Searches the garden for plants (Botanical Referentiel) and existing subjects (Inventory).
        Used by the Agent to resolve ambiguities or check existence before actions.
        
        Args:
            query: The name of the plant or subject to look for (e.g. "Tomate Marmande", "Radis").
        
        Returns:
            JSON with two lists: "plants" (Catalog matches) and "subjects" (Inventory matches).
        """
        # 1. Search Botanical Reference
        # Heuristic: split query to detect variety? For now, broad ILIKE.
        # We search in 'nom_commun' OR 'espece' OR 'variete'
        
        # Clean query
        q = query.strip()
        if not q:
            return {"plants": [], "subjects": [], "message": "Query empty"}

        # BOTANICAL SEARCH
        # Using Supabase 'or' filter
        bot_res = self.supabase.table("botanique_plantes")\
            .select("id, nom_commun, variete")\
            .or_(f"nom_commun.ilike.%{q}%,variete.ilike.%{q}%")\
            .limit(10)\
            .execute()
        
        plants = bot_res.data or []

        # SUBJECT SEARCH
        # We search subjects by Name OR by linkage to found plants
        
        plant_ids = [p["id"] for p in plants]
        
        # Base query on subjects
        suj_query = self.supabase.table("sujets").select("*").neq("stade", "TERMINE")
        
        if plant_ids:
            # If we found plants, check subjects linked to them OR matching name
            # Supabase doesn't easily support mixed OR condition across relations and text columns in one go with JS/Python client comfortably without RPC.
            # We'll do two queries merged in Python for simplicity/robustness.
            
            # A. Linked Subjects
            res_linked = self.supabase.table("sujets")\
                .select("id, tracking_id, nom, stade, quantite, variete_id")\
                .in_("variete_id", plant_ids)\
                .neq("stade", "TERMINE")\
                .execute()
            
            # B. Name Match Subjects (for those not linked or loosely named)
            res_named = self.supabase.table("sujets")\
                .select("id, tracking_id, nom, stade, quantite, variete_id")\
                .ilike("nom", f"%{q}%")\
                .neq("stade", "TERMINE")\
                .execute()
                
            # Merge unique by ID
            all_sujets = {s["id"]: s for s in (res_linked.data or []) + (res_named.data or [])}
            subjects = list(all_sujets.values())
            
        else:
            # No plants found, just search subjects by name
            res = suj_query.ilike("nom", f"%{q}%").execute()
            subjects = res.data or []

        return {
            "plants": plants,
            "subjects": subjects,
            "count_plants": len(plants),
            "count_subjects": len(subjects)
        }
