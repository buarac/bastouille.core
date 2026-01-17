from typing import Dict, Any, List, Optional
import unicodedata
from services.operations import OperationsService
from schemas.operations import EvenementCreate, TypeGeste

# -- Logic --
def noter_evenement(tracking_id: str, action: str, observation: str = "", quantite_nouvelle: Optional[int] = None, data: Dict[str, Any] = {}) -> Dict[str, Any]:
    """
    Enregistre un événement (Geste) sur un sujet donné par son Tracking ID.
    Ex: '2024-SUJ-A', 'ARROSAGE', 'Bien mouillé'
    """
    service = OperationsService()
    
    # 1. Resolve Subject
    all_subjects = service.list_subjects()
    subject = next((s for s in all_subjects if s.tracking_id == tracking_id), None)
    
    if not subject:
        return {"error": f"Sujet introuvable avec ID: {tracking_id}"}

    # 2. Normalize Action
    try:
        normalized = unicodedata.normalize('NFD', action).encode('ascii', 'ignore').decode('utf-8')
        geste = TypeGeste(normalized.upper())
    except ValueError:
        return {"error": f"Action '{action}' invalide. Actions possibles: {[t.value for t in TypeGeste]}"}

    # 3. Prepare Payload
    event_data = data.copy()
    if quantite_nouvelle is not None:
        event_data["quantite_finale"] = quantite_nouvelle
    if observation:
        event_data["observation"] = observation

    active_season = service.get_active_season()
    if not active_season:
         return {"error": "Aucune saison active."}

    payload = EvenementCreate(
        sujet_id=subject.id,
        saison_id=active_season.id,
        type_geste=geste,
        data=event_data
    )

    # 4. Execute
    try:
        created_event = service.log_event(payload)
        
        # Refetch subject to get updated state
        updated_subject = service.get_subject(subject.id)
        new_stage = updated_subject.stade if updated_subject else "Inconnu"

        return {
            "success": True,
            "message": f"Événement {geste.value} noté sur {subject.nom}.",
            "nouveau_stade": new_stage
        }
    except Exception as e:
        return {"error": str(e)}

# -- Definition --
noter_evenement_definition = {
    "name": "noter_evenement",
    "description": "Note une action réalisée sur une culture (Sujet).",
    "parameters": {
        "type": "object",
        "properties": {
            "tracking_id": {
                "type": "string",
                "description": "L'identifiant visible (ex: '2024-SUJ-XYZ')",
            },
            "action": {
                "type": "string",
                "description": "Type d'action: 'SEMIS', 'PLANTATION', 'SOIN', 'ARROSAGE', 'TAILLE', 'RECOLTE', 'OBSERVATION', 'PERTE'",
                "enum": ["SEMIS", "PLANTATION", "SOIN", "ARROSAGE", "TAILLE", "RECOLTE", "OBSERVATION", "PERTE"]
            },
            "observation": {
                "type": "string",
                "description": "Note textuelle libre (optionnel).",
            },
            "quantite_nouvelle": {
                "type": "integer",
                "description": "Nouvelle quantité APRES l'action (optionnel, si changement).",
            },
            "data": {
                "type": "object",
                "description": "Données structurelles additionnelles (optionnel).",
            }
        },
        "required": ["tracking_id", "action"],
    },
}
