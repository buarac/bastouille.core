import logging
import os
from typing import List, Optional, Dict, Any
from supabase import create_client, Client
from datetime import datetime
from agents.botanique import CURRENT_AGENT_VERSION

logger = logging.getLogger(__name__)

class BotaniquePersistenceService:
    def __init__(self):
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")
        
        if not url or not key:
            logger.warning("Supabase credentials not found. Persistence will be disabled.")
            self.supabase: Optional[Client] = None
        else:
            try:
                self.supabase: Client = create_client(url, key)
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                self.supabase = None

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
                item["needs_update"] = (plant_version != CURRENT_AGENT_VERSION)
                
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
