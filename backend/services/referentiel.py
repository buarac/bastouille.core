import logging
from typing import List, Optional, Dict, Any
from services.persistence import BotaniquePersistenceService

logger = logging.getLogger(__name__)

class ReferentielService:
    def __init__(self):
        self.persistence = BotaniquePersistenceService()
        self.supabase = self.persistence.supabase

    async def get_gestes(self, famille: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieves gestures, optionally filtered by family.
        """
        try:
            query = self.supabase.table("referentiel_gestes").select("*")
            
            if famille:
                query = query.eq("famille", famille)
                
            response = query.order("famille").order("verbe").execute()
            return response.data
        except Exception as e:
            logger.error(f"Failed to fetch gestes: {e}")
            return []

    async def get_familles(self) -> List[str]:
        """
        Retrieves all unique families.
        """
        try:
            # Supabase doesn't support distinct() directly in simple client easily without rpc sometimes, 
            # but let's try .select('famille').
            # Or just fetch all and dedup in python if small dataset (28 items).
            # For scalability, RPC is better, but here Python dedup is fine.
            response = self.supabase.table("referentiel_gestes").select("famille").execute()
            familles = sorted(list(set(item['famille'] for item in response.data)))
            return familles
        except Exception as e:
            logger.error(f"Failed to fetch familles: {e}")
            return []
