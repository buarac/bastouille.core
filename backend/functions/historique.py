from typing import Dict, Any, List, Optional
from services.operations import OperationsService

# -- Logic --
def historique(tracking_id: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Consulte l'historique des événements du jardin.
    Filtrable par Sujet (via Tracking ID).
    """
    service = OperationsService()
    
    internal_id = None
    if tracking_id:
        # Resolve ID from Tracking ID
        # Optimization: Fetch only ID? service.list_subjects() fetches all. 
        # Ideally we add get_subject_by_tracking_id to service.
        # For now reusing pattern:
        all_subjects = service.list_subjects()
        target = next((s for s in all_subjects if s.tracking_id == tracking_id), None)
        if not target:
            return [{"error": f"Sujet '{tracking_id}' introuvable."}]
        internal_id = target.id
    
    events = service.list_events(limit=limit, subject_id=internal_id)
    
    # Format for Agent
    summary = []
    for e in events:
        summary.append({
            "date": e["date"],
            "sujet": f"{e['sujet_nom']} ({e['sujet_tracking']})",
            "action": e["type_geste"],
            "details": e["data"],
            "observation": e.get("observation", "") # Ensure observation is there if backend returns it
        })
    return summary

# -- Definition --
historique_definition = {
    "name": "historique",
    "description": "Consulte l'historique des actions passées (Journal de bord).",
    "parameters": {
        "type": "object",
        "properties": {
            "tracking_id": {
                "type": "string",
                "description": "Filtrer pour un sujet précis (ex: '2024-SUJ-XYZ'). Laisser vide pour le journal global.",
            },
            "limit": {
                "type": "integer",
                "description": "Nombre de lignes à remonter (défaut 10).",
            }
        },
        "required": [],
    },
}
