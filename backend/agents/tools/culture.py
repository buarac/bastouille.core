from typing import List, Dict, Any, Optional
from services.operations import OperationsService
from schemas.operations import EvenementCreate, SaisonCreate, SujetCreate, TypeGeste, SaisonStatut, UniteSujet, StadeSujet

class CultureTools:
    def __init__(self):
        self.service = OperationsService()

    def list_my_subjects(self, season_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Lists all active subjects in the garden.
        Returns a list of dictionaries with subject details (tracking_id, name, quantity, unit, stage).
        """
        subjects = self.service.list_subjects(season_id)
        return [s.model_dump() for s in subjects]

    def log_event(self, subject_tracking_id: str, action_type: str, quantity_final: Optional[int] = None, observation: str = "", data: Dict[str, Any] = {}) -> str:
        """
        Logs an event on a subject.
        args:
            subject_tracking_id: The exact tracking ID (e.g., '2026-SUJ-ABCD')
            action_type: One of 'SEMIS', 'REPIQUAGE', 'PLANTATION', 'SOIN', 'TAILLE', 'RECOLTE', 'OBSERVATION', 'PERTE'
            quantity_final: The new quantity AFTER the event (optional if no change)
            observation: Textual observation to store
            data: Additional JSON data specific to the event type (e.g. {mode_semis, zone...})
        """
        all_subjects = self.service.list_subjects()
        subject = next((s for s in all_subjects if s.tracking_id == subject_tracking_id), None)
        
        if not subject:
            return f"Error: Subject with tracking ID {subject_tracking_id} not found."

        try:
            # Normalize action type (handle accents like 'récolte' -> 'recolte')
            import unicodedata
            normalized = unicodedata.normalize('NFD', action_type).encode('ascii', 'ignore').decode('utf-8')
            geste = TypeGeste(normalized.upper())
        except ValueError:
             return f"Error: Invalid action type {action_type} (normalized: {normalized.upper()}). Allowed: {[t.value for t in TypeGeste]}"

        # Merge specific args into data if not already present
        # Robustness: Ensure data is a dict
        if isinstance(data, str):
            try:
                import json
                data = json.loads(data)
            except:
                data = {}
        
        event_data = data.copy() if isinstance(data, dict) else {}
        
        if quantity_final is not None:
            event_data["quantite_finale"] = quantity_final
        if observation:
            event_data["observation"] = observation

        active_season = self.service.get_active_season()
        if not active_season:
             return "Error: No active season found."

        event = EvenementCreate(
            sujet_id=subject.id,
            saison_id=active_season.id,
            type_geste=geste,
            data=event_data
        )

        try:
            created = self.service.log_event(event)
            return f"Success: Event {geste.value} recorded for {subject.nom}. New state logged."
        except Exception as e:
            return f"Error logging event: {str(e)}"

    def create_subject(self, name: str, quantity: int, unit: str, type_plant: str, data: Dict[str, Any] = {}) -> str:
        """
        Creates a new subject.
        """
        active_season = self.service.get_active_season()
        if not active_season:
             return "Error: No active season found to attach the subject."

        try:
            # Flexible UNIT mapping
            if unit.upper() in ["GRAINE", "GRAINES"]:
                safe_unit = UniteSujet.INDIVIDU # Or PLANT? Let's say INDIVIDU for a seed.
            else:
                safe_unit = UniteSujet(unit.upper())
        except ValueError:
             return f"Error: Invalid unit {unit}. Allowed: {[u.value for u in UniteSujet]}"

        # Try to link with Botanique Referentiel
        plantes_id = None
        plant_match = self.service.persistence.find_best_match(name)
        if plant_match:
            plantes_id = plant_match.get("id")

        subject = SujetCreate(
            saison_origine_id=active_season.id,
            nom=name,
            quantite=quantity,
            unite=safe_unit,
            variete_id=plantes_id,
            stade=StadeSujet.SEMIS 
        )
        
        try:
            created = self.service.create_subject(subject, initial_event_data=data)
            return f"Success: Created subject '{created.nom}' with Tracking ID {created.tracking_id}."
        except Exception as e:
            return f"Error creating subject: {str(e)}"

    def list_garden_events(self, limit: int = 20, subject_tracking_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Lists history of events in the garden.
        args:
            limit: max events to retrieve
            subject_tracking_id: (Optional) filter by specific subject tracking ID (e.g. '2026-SUJ-ABCD')
        """
        internal_subject_id = None
        if subject_tracking_id:
            # Resolve tracking ID
            all_subjects = self.service.list_subjects()
            target = next((s for s in all_subjects if s.tracking_id == subject_tracking_id), None)
            if not target:
                # Return error or empty list? Agent prefers error to know it failed finding
                return [{"error": f"Subject with tracking ID {subject_tracking_id} not found."}]
            internal_subject_id = target.id
            
        events = self.service.list_events(limit=limit, subject_id=internal_subject_id)
        
        # Simplify output for Agent (less noise)
        summary = []
        for e in events:
            summary.append({
                "date": e["date"],
                "subject": f"{e['sujet_nom']} ({e['sujet_tracking']})",
                "action": e["type_geste"],
                "details": e["data"]
            })
        return summary
