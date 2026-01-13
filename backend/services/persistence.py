import logging
import os
from typing import List, Optional, Dict, Any
from supabase import create_client, Client
from datetime import datetime

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
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error saving plant: {e}")
            raise e

    def get_all_plants(self) -> List[Dict[str, Any]]:
        """
        Retrieves all saved plants (summary only).
        """
        if not self.supabase:
            return []

        try:
            response = self.supabase.table("botanique_plantes")\
                .select("id, nom_commun, espece, variete, created_at")\
                .order("created_at", desc=True)\
                .execute()
            return response.data
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
