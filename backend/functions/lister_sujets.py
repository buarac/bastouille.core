from typing import Dict, Any, List, Optional
from services.operations import OperationsService

# -- Logic --
def lister_sujets(season_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Rapporte tous les sujets (cultures) actifs du jardin.
    Si season_id est omis, retourne tout ce qui n'est pas terminé.
    """
    service = OperationsService()
    try:
        subjects = service.list_subjects(season_id)
        # Convert Pydantic models to dicts
        return [s.model_dump() for s in subjects]
    except Exception as e:
        return [{"error": str(e)}]

# -- Definition --
lister_sujets_definition = {
    "name": "lister_sujets",
    "description": "Liste les cultures actives (Sujets) du jardin. Donne l'état, la quantité et le Tracking ID.",
    "parameters": {
        "type": "object",
        "properties": {
            "season_id": {
                "type": "string",
                "description": "Filtrer par saison spécifique (optionnel). Lasser vide pour tout voir.",
            }
        },
        "required": [],
    },
}
