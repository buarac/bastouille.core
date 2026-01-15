from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from services.operations import OperationsService
from schemas.operations import (
    Saison, SaisonCreate,
    Sujet, SujetCreate, SujetSummary,
    Evenement, EvenementCreate
)

router = APIRouter(
    prefix="/operations",
    tags=["operations"]
)

service = OperationsService()

# --- SAISONS ---
@router.get("/saisons", response_model=List[Saison])
async def list_seasons():
    return service.list_seasons()

@router.get("/saisons/active", response_model=Optional[Saison])
async def get_active_season():
    return service.get_active_season()

@router.post("/saisons", status_code=status.HTTP_201_CREATED, response_model=Saison)
async def create_season(season: SaisonCreate):
    try:
        return service.create_season(season)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- SUJETS ---
@router.get("/sujets", response_model=List[SujetSummary])
async def list_subjects(season_id: Optional[str] = None):
    return service.list_subjects(season_id)

@router.post("/sujets", status_code=status.HTTP_201_CREATED, response_model=Sujet)
async def create_subject(subject: SujetCreate):
    try:
        return service.create_subject(subject)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sujets/{subject_id}", response_model=Sujet)
async def get_subject(subject_id: str):
    subject = service.get_subject(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Sujet non trouvé")
    return subject

# --- EVENEMENTS ---
@router.post("/evenements", status_code=status.HTTP_201_CREATED, response_model=Evenement)
async def log_event(event: EvenementCreate):
    try:
        return service.log_event(event)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
