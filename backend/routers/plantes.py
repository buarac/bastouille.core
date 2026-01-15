from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from services.persistence import BotaniquePersistenceService

router = APIRouter(
    prefix="/botanique",
    tags=["botanique"]
)

service = BotaniquePersistenceService()

class PlantCreate(BaseModel):
    data: Dict[str, Any]

class PlantSummary(BaseModel):
    id: str
    nom_commun: str
    espece: str
    variete: Optional[str] = None
    created_at: str
    cycle_vie_type: Optional[str] = None
    categorie: Optional[str] = None
    needs_update: bool = False

@router.post("/plantes", status_code=status.HTTP_201_CREATED)
async def save_plant(plant_input: Dict[str, Any]):
    """
    Sauvegarde une fiche plante reçue de l'agent.
    Attend le JSON complet de ReponseBotanique.
    """
    try:
        # Note: plant_input est le JSON complet (ReponseBotanique)
        result = service.save_plant(plant_input)
        if not result:
            raise HTTPException(status_code=500, detail="Erreur inconnue lors de la sauvegarde (pas de résultat retourné)")
        return result
    except Exception as e:
        # En dev, on retourne l'erreur explicite
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/plantes/{plant_id}", status_code=status.HTTP_200_OK)
async def update_plant(plant_id: str, plant_input: Dict[str, Any]):
    """
    Met à jour une fiche plante existante.
    """
    try:
        result = service.update_plant(plant_id, plant_input)
        if not result:
            raise HTTPException(status_code=404, detail="Plante non trouvée ou erreur mise à jour")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plantes", response_model=List[PlantSummary])
async def list_plants():
    """
    Liste toutes les plantes sauvegardées (résumé).
    """
    return service.get_all_plants()

@router.get("/plantes/summary")
async def get_varieties_summary():
    """
    Retourne la liste textuelle formatée des variétés pour inclusion dans un prompt ou autre usage.
    """
    text = service.get_all_varieties_summary()
    return {"summary": text}

@router.get("/plantes/{plant_id}")
async def get_plant(plant_id: str):
    """
    Récupère la fiche complète d'une plante.
    """
    plant = service.get_plant_by_id(plant_id)
    if not plant:
        raise HTTPException(status_code=404, detail="Plante non trouvée")
    return plant

@router.delete("/plantes/{plant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plant(plant_id: str):
    """
    Supprime une plante sauvegardée.
    """
    success = service.delete_plant(plant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Plante non trouvée ou erreur suppression")
    return None
