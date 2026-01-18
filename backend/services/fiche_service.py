import logging
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime

from core.gemini import get_gemini_client
from services.persistence import get_supabase_client
from models.agronome import FichePlant
from models.fiche_botanique import FicheBotaniqueDB, FicheBotaniqueSummary

logger = logging.getLogger(__name__)

class FicheService:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.gemini = get_gemini_client()

    async def create_fiche(self, fiche_data: FichePlant) -> Optional[FicheBotaniqueDB]:
        if not self.supabase:
            logger.warning("Supabase client not available")
            return None

        try:
            # Extract core fields
            nom = fiche_data.identite.nom
            variete = fiche_data.identite.variete
            espece = fiche_data.identite.espece
            
            # Generate embedding
            logger.info(f"Generating embedding for: {nom}")
            embedding = await self.gemini.embed_content(nom)
            
            # Serialize for DB
            payload = {
                "data": fiche_data.model_dump(mode="json"),
                "variete": variete,
                "espece": espece,
                "nom": nom,
                "embedding_nom": embedding
            }
            
            response = self.supabase.table("fiches_botanique").insert(payload).execute()
            
            if response.data:
                # We return the DB object. embedding_nom might be large, FicheBotaniqueDB includes it.
                return FicheBotaniqueDB(**response.data[0])
            return None

        except Exception as e:
            logger.error(f"Error creating fiche: {e}")
            raise e

    async def update_fiche(self, fiche_id: str, fiche_data: FichePlant) -> Optional[FicheBotaniqueDB]:
        if not self.supabase:
            return None
            
        try:
            nom = fiche_data.identite.nom
            variete = fiche_data.identite.variete
            espece = fiche_data.identite.espece
            
            logger.info(f"Regenerating embedding for update: {nom}")
            embedding = await self.gemini.embed_content(nom)
            
            payload = {
                "data": fiche_data.model_dump(mode="json"),
                "variete": variete,
                "espece": espece,
                "nom": nom,
                "embedding_nom": embedding,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            response = self.supabase.table("fiches_botanique").update(payload).eq("id", fiche_id).execute()
            
            if response.data:
                return FicheBotaniqueDB(**response.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error updating fiche: {e}")
            raise e

    async def get_fiche_by_id(self, fiche_id: str) -> Optional[FicheBotaniqueDB]:
        if not self.supabase:
            return None
        try:
            response = self.supabase.table("fiches_botanique").select("*").eq("id", fiche_id).execute()
            if response.data:
                return FicheBotaniqueDB(**response.data[0])
            return None
        except Exception as e:
            logger.error(f"Error getting fiche: {e}")
            return None

    async def search_exact(self, query: str) -> List[FicheBotaniqueDB]:
        """
        Search by exact match on nom, variete, or espece (case insensitive ilike)
        """
        if not self.supabase:
            return []
            
        try:
            # Using OR filter
            or_filter = f"nom.ilike.%{query}%,variete.ilike.%{query}%,espece.ilike.%{query}%"
            
            response = self.supabase.table("fiches_botanique")\
                .select("*")\
                .or_(or_filter)\
                .execute()
                
            return [FicheBotaniqueDB(**item) for item in response.data]
            
        except Exception as e:
            logger.error(f"Error searching fiches (exact): {e}")
            return []

    async def search_exact_summary(self, query: str) -> List[FicheBotaniqueSummary]:
        """
        Summary version of exact search.
        """
        if not self.supabase:
            return []
            
        try:
            or_filter = f"nom.ilike.%{query}%,variete.ilike.%{query}%,espece.ilike.%{query}%"
            
            # Select only necessary fields
            response = self.supabase.table("fiches_botanique")\
                .select("id, nom, variete, espece, created_at, updated_at")\
                .or_(or_filter)\
                .execute()
                
            return [FicheBotaniqueSummary(**item) for item in response.data]
            
        except Exception as e:
            logger.error(f"Error searching fiches summary (exact): {e}")
            return []

    async def search_vector(self, query: str, limit: int = 5, verbose: bool = False) -> List[FicheBotaniqueDB]:
        """
        Search by vector similarity on nom.
        Default threshold is 0.85. If verbose is True, threshold is -1 (return all).
        """
        if not self.supabase:
            return []
            
        try:
            # Generate query embedding
            embedding = await self.gemini.embed_content(query)
            
            # Determine threshold
            # If verbose, we want everything, so threshold -1 (similarity is -1 to 1 or 0 to 1) -> 0 is safe for cosine distance 1-dist
            # Cosine similarity is usually 0 to 1 for embeddings.
            threshold = 0.85
            if verbose:
                threshold = 0.0
            
            params = {
                "query_embedding": embedding,
                "match_threshold": threshold,
                "match_count": limit
            }
            
            # RPC call
            response = self.supabase.rpc("match_fiches", params).execute()
            
            results = []
            for item in response.data:
                results.append(FicheBotaniqueDB(**item))
                
            return results
            
        except Exception as e:
            logger.error(f"Error searching fiches (vector): {e}")
            return []

    async def search_vector_summary(self, query: str) -> List[FicheBotaniqueSummary]:
        """
        Search by vector similarity on nom and return summary.
        Think of this as 'unlimited' (limit=1000) with strict threshold (0.8).
        """
        if not self.supabase:
            return []
            
        try:
            # Generate query embedding
            embedding = await self.gemini.embed_content(query)
            
            # Strict threshold 0.8, high limit
            params = {
                "query_embedding": embedding,
                "match_threshold": 0.0,
                "match_count": 1000  # "No limit" practically
            }
            
            # RPC call
            response = self.supabase.rpc("match_fiches", params).execute()
            
            results = []
            for item in response.data:
                # Map to summary
                summary = FicheBotaniqueSummary(
                    id=item['id'],
                    nom=item['nom'],
                    variete=item.get('variete'),
                    espece=item.get('espece'),
                    created_at=item['created_at'],
                    updated_at=item['updated_at'],
                    similarity=item.get('similarity')
                )
                results.append(summary)
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching fiches summary: {e}")
            return []

    async def list_all_summary(self, limit: int = 100, offset: int = 0) -> List[FicheBotaniqueSummary]:
        """
        List all fiches (summary only).
        """
        if not self.supabase:
            return []
            
        try:
            response = self.supabase.table("fiches_botanique")\
                .select("id, nom, variete, espece, created_at, updated_at")\
                .range(offset, offset + limit - 1)\
                .order("updated_at", desc=True)\
                .execute()
                
            return [FicheBotaniqueSummary(**item) for item in response.data]
            
        except Exception as e:
            logger.error(f"Error listing fiches summary: {e}")
            return []
