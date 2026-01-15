from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum

# Enums
class SaisonStatut(str, Enum):
    PLANIFIEE = "PLANIFIEE"
    ACTIVE = "ACTIVE"
    ARCHIVEE = "ARCHIVEE"

class UniteSujet(str, Enum):
    INDIVIDU = "INDIVIDU"
    PLANT = "PLANT"
    METRE_LINEAIRE = "METRE_LINEAIRE"
    M2 = "M2"

class StadeSujet(str, Enum):
    SEMIS = "SEMIS"
    PLANTULE = "PLANTULE"
    EN_PLACE = "EN_PLACE"
    RECOLTE = "RECOLTE"
    TERMINE = "TERMINE"

class TypeGeste(str, Enum):
    SEMIS = "SEMIS"
    REPIQUAGE = "REPIQUAGE"
    PLANTATION = "PLANTATION"
    SOIN = "SOIN"
    TAILLE = "TAILLE"
    RECOLTE = "RECOLTE"
    OBSERVATION = "OBSERVATION"
    PERTE = "PERTE" # New explicit type for loss

# -- Saisons --
class SaisonBase(BaseModel):
    nom: str
    date_debut: date
    date_fin: date
    statut: SaisonStatut

class SaisonCreate(SaisonBase):
    pass

class Saison(SaisonBase):
    id: str
    created_at: datetime

# -- Evenements --
class EvenementBase(BaseModel):
    sujet_id: str
    saison_id: str
    type_geste: TypeGeste
    date: datetime = Field(default_factory=datetime.utcnow)
    data: Dict[str, Any] = Field(default={})

class EvenementCreate(EvenementBase):
    pass

class Evenement(EvenementBase):
    id: str
    created_at: datetime

# -- Sujets --
class SujetBase(BaseModel):
    variete_id: Optional[str] = None
    saison_origine_id: str
    nom: str
    quantite: int
    unite: UniteSujet
    stade: StadeSujet

class SujetCreate(SujetBase):
    # Optional logic: if quantity > 1 and Individual, might trigger multiple creates in service
    pass

class Sujet(SujetBase):
    id: str
    tracking_id: str
    created_at: datetime
    updated_at: datetime

class SujetSummary(BaseModel):
    id: str
    tracking_id: str
    nom: str
    quantite: int
    unite: str
    stade: str
    variete_nom: Optional[str] = None # Enriched
