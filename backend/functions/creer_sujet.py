from typing import Dict, Any, List, Optional
from services.operations import OperationsService
from schemas.operations import SujetCreate, UniteSujet, StadeSujet

# -- Logic --
def creer_sujet(nom: str, quantite: int, unite: str, variete_id: Optional[str] = None, data: Dict[str, Any] = {}) -> Dict[str, Any]:
    """
    Crée une nouvelle culture (Sujet) dans la saison active.
    Example: Nom='Tomate', Qte=10, Unite='PLANT'.
    """
    service = OperationsService()
    
    # 1. Get Active Season
    active_season = service.get_active_season()
    if not active_season:
        return {"error": "Aucune saison active. Impossible de créer un sujet."}

    # 2. Validate Unit
    try:
        # Flexible mapping
        u = unite.upper().strip()
        if u in ["GRAINE", "GRAINES"]: 
            safe_unit = UniteSujet.INDIVIDU
        elif u in [e.value for e in UniteSujet]:
            safe_unit = UniteSujet(u)
        else:
            # Fallback default or error? Let's default to INDIVIDU if unknown for robustness
            safe_unit = UniteSujet.INDIVIDU
    except:
        return {"error": f"Unité invalide '{unite}'. Valeurs: {[e.value for e in UniteSujet]}"}

    # 3. Create Payload
    try:
        payload = SujetCreate(
            saison_origine_id=active_season.id,
            nom=nom,
            quantite=quantite,
            unite=safe_unit,
            variete_id=variete_id, # Can be None if not linked
            stade=StadeSujet.SEMIS # Default start stage? Or Argument?
            # Note: Legacy tool defaulted to SEMIS. We might want to expose it later.
        )
        
        # 4. Execute Service
        created = service.create_subject(payload, initial_event_data=data)
        return {
            "success": True, 
            "message": f"Sujet '{created.nom}' créé.", 
            "tracking_id": created.tracking_id,
            "id": created.id
        }
    except Exception as e:
        return {"error": str(e)}

# -- Definition --
creer_sujet_definition = {
    "name": "creer_sujet",
    "description": "Crée une nouvelle culture (sujet) dans le jardin (Saison Active).",
    "parameters": {
        "type": "object",
        "properties": {
            "nom": {
                "type": "string",
                "description": "Nom usuel (ex: 'Tomates Cerises')",
            },
            "quantite": {
                "type": "integer",
                "description": "Nombre d'unités",
            },
            "unite": {
                "type": "string",
                "description": "Unité de comptage: 'PLANT', 'M2', 'METRE_LINEAIRE', 'INDIVIDU'",
                "enum": ["PLANT", "M2", "METRE_LINEAIRE", "INDIVIDU"]
            },
            "variete_id": {
                "type": "string",
                "description": "UUID de la variété botanique (Referentiel) si connue via 'rechercher'. Optionnel.",
            },
            "data": {
                "type": "object",
                "description": "Metadonnées additionnelles JSON (ex: {mode_semis: 'TERRINE'}).",
            }
        },
        "required": ["nom", "quantite", "unite"],
    },
}
