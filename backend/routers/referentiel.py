from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from services.referentiel import ReferentielService
from pydantic import BaseModel

router = APIRouter(
    prefix="/referentiel",
    tags=["Referentiel"]
)

# Pydantic models for response documentation
class Geste(BaseModel):
    id: int
    famille: str
    verbe: str
    action: str
    obj_principal: Optional[str] = None
    schema_json: Optional[dict] = {}

class FamilleList(BaseModel):
    familles: List[str]

@router.get("/gestes", response_model=List[Geste])
async def get_gestes(famille: Optional[str] = None):
    service = ReferentielService()
    return await service.get_gestes(famille)

@router.get("/gestes/familles", response_model=FamilleList)
async def get_familles():
    service = ReferentielService()
    familles = await service.get_familles()
    return {"familles": familles}
