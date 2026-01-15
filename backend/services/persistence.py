import logging
import os
from typing import List, Optional, Dict, Any
from supabase import create_client, Client
from datetime import datetime
from core.config import settings

logger = logging.getLogger(__name__)


def get_supabase_client() -> Optional[Client]:
    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        return None
    try:
        return create_client(url, key)
    except Exception as e:
        logger.error(f"Failed to create Supabase client: {e}")
        return None

class BotaniquePersistenceService:
    def __init__(self):
        self.supabase = get_supabase_client()


    def save_plant(self, plant_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Saves a botanical plant result to the database.
        """
        if not self.supabase:
            return None

        try:
            # Extract main fields for columns
            taxonomie = plant_data.get("taxonomie", {})
            nom_commun = taxonomie.get("nom_commun", "Inconnu")
            espece = f"{taxonomie.get('genre', '')} {taxonomie.get('espece', '')}".strip()
            variete = taxonomie.get("variete")

            payload = {
                "nom_commun": nom_commun,
                "espece": espece,
                "variete": variete,
                "data": plant_data
            }

            response = self.supabase.table("botanique_plantes").insert(payload).execute()
            
            # Debug log
            logger.info(f"Supabase Insert Response: {response}")

            if response.data and len(response.data) > 0:
                return response.data[0]
            
            # If we get here, insertion failed silently?
            logger.error(f"Insert returned no data. Response: {response}")
            raise Exception(f"Supabase Insert Failed: No data returned. Props: {response}")
            
        except Exception as e:
            logger.error(f"Error saving plant: {e}")
            raise e

    def update_plant(self, plant_id: str, plant_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Updates an existing plant in the database.
        """
        if not self.supabase:
            return None

        try:
            # Extract main fields for columns
            taxonomie = plant_data.get("taxonomie", {})
            nom_commun = taxonomie.get("nom_commun", "Inconnu")
            espece = f"{taxonomie.get('genre', '')} {taxonomie.get('espece', '')}".strip()
            variete = taxonomie.get("variete")

            payload = {
                "nom_commun": nom_commun,
                "espece": espece,
                "variete": variete,
                "data": plant_data
                # "created_at": ... DO NOT update creation date
            }

            response = self.supabase.table("botanique_plantes").update(payload).eq("id", plant_id).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Error updating plant {plant_id}: {e}")
            raise e

    def get_all_plants(self) -> List[Dict[str, Any]]:
        """
        Retrieves all saved plants (summary only).
        """
        if not self.supabase:
            return []

        try:
            response = self.supabase.table("botanique_plantes")\
                .select("id, nom_commun, espece, variete, created_at, data")\
                .order("created_at", desc=True)\
                .execute()
            
            # Enrichir avec les données extraites du JSON
            results = []
            for item in response.data:
                data_json = item.get("data", {}) or {}
                # Parsing défensif
                cycle_vie = data_json.get("cycle_vie", {})
                categorisation = data_json.get("categorisation", {})
                
                item["cycle_vie_type"] = cycle_vie.get("type")
                item["categorie"] = categorisation.get("categorie")
                
                # Version Logic
                plant_version = data_json.get("version", "0.0")
                item["version"] = plant_version
                item["needs_update"] = (plant_version != settings.BOTANIQUE_AGENT_VERSION)
                
                # On retire 'data' pour ne pas le renvoyer si non nécessaire dans le modèle de résumé
                # (bien que Pydantic le filtrerait, c'est plus propre)
                if "data" in item:
                    del item["data"]
                
                results.append(item)
                
            return results
        except Exception as e:
            logger.error(f"Error fetching plants: {e}")
            return []

    def get_plant_by_id(self, plant_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves detailed plant data by ID.
        """
        if not self.supabase:
            return None

        try:
            response = self.supabase.table("botanique_plantes")\
                .select("*")\
                .eq("id", plant_id)\
                .execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error fetching plant {plant_id}: {e}")
            return None

    def delete_plant(self, plant_id: str) -> bool:
        """
        Deletes a plant by ID.
        """
        if not self.supabase:
            return False

        try:
            self.supabase.table("botanique_plantes").delete().eq("id", plant_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting plant {plant_id}: {e}")
            return False
    def find_best_match(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Attempts to find a plant matching the query string (Name + Variety).
        Improvement: Token-based search + Python Scoring.
        """
        if not self.supabase or not query:
            return None

        try:
            # 1. Broad candidate search using the first meaningful word
            # We assume the user query starts with the plant name (e.g. "Tomate ...", "Carotte ...")
            words = query.strip().split()
            if not words:
                return None
            
            first_word = words[0]
            # Strip punctuation if needed? Let's keep it simple.
            
            response = self.supabase.table("botanique_plantes")\
                .select("id, nom_commun, variete")\
                .or_(f"nom_commun.ilike.%{first_word}%,variete.ilike.%{first_word}%")\
                .execute()
            
            candidates = response.data
            if not candidates:
                return None

            # 2. Python Scoring: Word Intersection
            # We want the candidate whose (Nom + Variete) shares the most words with Query.
            best_c = None
            best_score = -1 
            
            query_tokens = set(q.lower() for q in words)
            
            for c in candidates:
                c_tokens = set(f"{c['nom_commun']} {c.get('variete') or ''}".lower().split())
                
                # Score = Intersection count
                common = query_tokens.intersection(c_tokens)
                score = len(common)
                
                # Bonus for exact full string match? (Optional)
                
                if score > best_score:
                    best_score = score
                    best_c = c
            
            # Threshold? If score is 0, maybe filter out?
            # But since we filtered with first_word, score is likely at least 1.
            
            return best_c

        except Exception as e:
            logger.error(f"Error searching plant for query '{query}': {e}")
            return None

    def get_all_varieties_summary(self) -> str:
        """
        Returns a formatted text list of all available varieties.
        Format: "- [Nom Commun] [Variété] (Catégorie: X, Cycle: Y)"
        """
        if not self.supabase:
            return "Référentiel botanique indisponible."
        
        try:
            # Fetch minimal needed fields
            response = self.supabase.table("botanique_plantes")\
                .select("nom_commun, variete, data")\
                .order("nom_commun", desc=False)\
                .execute()

            lines = []
            for item in response.data:
                nom = item.get("nom_commun", "Inconnu")
                variete = item.get("variete") or ""
                data = item.get("data") or {}
                
                cat = data.get("categorisation", {}).get("categorie", "Inconnu")
                cycle = data.get("cycle_vie", {}).get("type", "Inconnu")
                
                line = f"- {nom} {variete}".strip() + f" [Catégorie: {cat}, Cycle: {cycle}]"
                lines.append(line)
            
            if not lines:
                return "Aucune variété définie dans le référentiel."
                
            return "\n".join(lines)

        except Exception as e:
            logger.error(f"Error getting varieties summary: {e}")
            return "Erreur lors de la récupération du référentiel."
