from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from uuid import UUID

from models.agronome import FichePlant
from models.fiche_botanique import FicheBotaniqueDB
from services.fiche_service import FicheService

router = APIRouter(prefix="/botanique/fiches", tags=["Botanique V2"])
service = FicheService()

@router.post("/", response_model=FicheBotaniqueDB)
async def create_fiche(fiche: FichePlant):
    """
    Crée une nouvelle fiche botanique avec embedding automatique.
    """
    result = await service.create_fiche(fiche)
    if not result:
        raise HTTPException(status_code=500, detail="Erreur lors de la création de la fiche")
    return result

@router.put("/{fiche_id}", response_model=FicheBotaniqueDB)
async def update_fiche(fiche_id: str, fiche: FichePlant):
    """
    Met à jour une fiche existante et recalcule son embedding.
    """
    result = await service.update_fiche(fiche_id, fiche)
    if not result:
        raise HTTPException(status_code=404, detail="Fiche non trouvée ou erreur de mise à jour")
    return result

@router.get("/search", response_model=List[FicheBotaniqueDB])
async def search_exact(q: str = Query(..., min_length=1)):
    """
    Recherche exacte par nom, variété ou espèce.
    """
    return await service.search_exact(q)

@router.get("/vector", response_model=List[FicheBotaniqueDB])
async def search_vector(
    q: str = Query(..., min_length=1), 
    limit: int = 5,
    verbose: bool = Query(False, description="Si true, renvoie tous les résultats sans limite de score")
):
    """
    Recherche vectorielle (sémantique) par similarité.
    Par défaut filtre > 0.85.
    """
    return await service.search_vector(q, limit=limit, verbose=verbose)
