import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from supabase import Client
from core.config import settings
from services.persistence import get_supabase_client, BotaniquePersistenceService
from schemas.operations import (
    Saison, SaisonCreate, SaisonStatut,
    Sujet, SujetCreate, SujetSummary,
    Evenement, EvenementCreate, TypeGeste
)

logger = logging.getLogger(__name__)

class OperationsService:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.persistence = BotaniquePersistenceService()

    # --- SAISONS ---
    def get_active_season(self) -> Optional[Saison]:
        response = self.supabase.table("saisons").select("*").eq("statut", "ACTIVE").execute()
        if response.data and len(response.data) > 0:
            return Saison(**response.data[0])
        return None

    def create_season(self, season: SaisonCreate) -> Saison:
        # If new season is ACTIVE, archive others? 
        # For simplicity, we assume the UI handles archiving previous season first, 
        # or we enforce constraint error handling.
        res = self.supabase.table("saisons").insert(season.model_dump(mode='json')).execute()
        return Saison(**res.data[0])

    def list_seasons(self) -> List[Saison]:
        res = self.supabase.table("saisons").select("*").order("date_debut", desc=True).execute()
        return [Saison(**s) for s in res.data]

    # --- SUJETS ---
    def list_subjects(self, season_id: Optional[str] = None) -> List[SujetSummary]:
        """
        Lists subjects. If season_id provided, filter by origin OR active/vivace logic.
        For now, simple filter by season_origine_id or just all generic listing.
        Better: List all subjects linked to this season via Lifecycle? 
        Simplified V1: List ALL subjects that are NOT 'TERMINE' + created in this season or Vivace.
        """
        query = self.supabase.table("sujets").select("*, botanique_plantes(nom_commun, variete)")
        
        # TODO: Implement complex filter (Active Season OR Vivace)
        # For V1, just list all non-terminated
        # query = query.neq("stade", "TERMINE")
        
        res = query.order("created_at", desc=True).execute()
        
        summary_list = []
        for item in res.data:
            # Enrich with plant name
            plant_data = item.get("botanique_plantes")
            plant_name = "Inconnu"
            if plant_data:
                plant_name = f"{plant_data.get('nom_commun')} {plant_data.get('variete') or ''}".strip()
            elif item.get("nom"):
                 plant_name = item.get("nom")

            summary_list.append(SujetSummary(
                id=item["id"],
                tracking_id=item["tracking_id"],
                nom=plant_name,
                quantite=item["quantite"],
                unite=item["unite"],
                stade=item["stade"],
                variete_nom=plant_name
            ))
        return summary_list

    def create_subject(self, subject: SujetCreate, initial_event_data: Dict[str, Any] = {}) -> Sujet:
        # Generate Tracking ID
        # Logic: 2026-TOM-MAR-01
        # Simplified: YYYY-RANDOM
        import random
        import string
        suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        year = datetime.now().year
        tracking_id = f"{year}-SUJ-{suffix}"

        data = subject.model_dump(mode='json')
        data["tracking_id"] = tracking_id
        
        res = self.supabase.table("sujets").insert(data).execute()
        created_subject = Sujet(**res.data[0])

        # Auto-Log Creation Event (Semis or Plantation)
        try:
            initial_gesture = TypeGeste.SEMIS
            if subject.stade == "PLANT": # If stage is PLANT, it's likely a planting
                 initial_gesture = TypeGeste.PLANTATION
            
            event_data = {
                "observation": f"Création automatique du sujet {created_subject.nom}.",
                "quantite_initiale": subject.quantite
            }
            # Merge provided extra data (e.g. zone, mode_semis)
            if initial_event_data:
                event_data.update(initial_event_data)

            event = EvenementCreate(
                sujet_id=created_subject.id,
                saison_id=subject.saison_origine_id,
                type_geste=initial_gesture,
                data=event_data
            )
            # Log event (without side-effect on subject as it's already fresh)
            self.supabase.table("evenements").insert(event.model_dump(mode='json')).execute()
            logger.info(f"Auto-logged creation event for {created_subject.tracking_id}")
            
        except Exception as e:
            logger.error(f"Failed to auto-log creation event: {e}")

        return created_subject

    def get_subject(self, subject_id: str) -> Optional[Sujet]:
        res = self.supabase.table("sujets").select("*").eq("id", subject_id).execute()
        if res.data:
            return Sujet(**res.data[0])
        return None

    # --- EVENEMENTS & TRANSACTIONAL LOGIC ---
    def log_event(self, event: EvenementCreate) -> Evenement:
        """
        Logs an event AND updates the subject state/quantity.
        """
        # 1. Insert Event
        res_event = self.supabase.table("evenements").insert(event.model_dump(mode='json')).execute()
        created_event = Evenement(**res_event.data[0])

        # 2. Update Subject based on Event Data
        # Logic: Check event data for 'quantite_finale' or 'stade_final'
        updates = {}
        event_data = event.data or {}
        
        if "quantite_finale" in event_data:
            updates["quantite"] = event_data["quantite_finale"]
        
        if "stade_final" in event_data:
            updates["stade"] = event_data["stade_final"]
            
        # Specific Logic for LOSS
        if event.type_geste == TypeGeste.PERTE and "pertes" in event_data:
            # Fetch current to subtract? trusted quantite_finale is safer if agent computed it
            pass

        if updates:
            updates["updated_at"] = datetime.utcnow().isoformat()
            self.supabase.table("sujets").update(updates).eq("id", event.sujet_id).execute()
            logger.info(f"Updated subject {event.sujet_id} with {updates}")

        return created_event
