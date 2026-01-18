from typing import List, Optional
from pydantic import BaseModel, Field

from enum import Enum

# --- ENUMS ---
class TypePlante(str, Enum):
    ANNUELLE = "Annuelle"
    VIVACE = "Vivace"

class CategoriePlante(str, Enum):
    ARBRE_FRUITIER = "Arbre Fruitier"
    ARBUSTE_ORNEMENT = "Arbuste d'ornement"
    FLEUR = "Fleur"
    LEGUME_FRUIT = "Legume-Fruit"
    LEGUME_RACINE = "Legume-Racine"
    LEGUME_FEUILLE = "Legume-Feuille"
    PLANTE_AROMATIQUE = "Plante Aromatique"

class Exposition(str, Enum):
    OMBRE = "Ombre"
    MI_OMBRE = "Mi-Ombre"
    SOLEIL = "Soleil"

class BesoinEau(str, Enum):
    FAIBLE = "Faible"
    MOYEN = "Moyen"
    FORT = "Fort"

# --- 1. IDENTITÉ ---
class Botanique(BaseModel):
    ordre: str = Field(..., description="Ordre botanique (Latin)")
    famille: str = Field(..., description="Famille botanique (Latin)")
    genre: str = Field(..., description="Genre botanique (Latin)")
    espece: str = Field(..., description="Espèce botanique (Latin)")

class Identite(BaseModel):
    variete: str = Field(..., description="Nom commun de la variété")
    espece: str = Field(..., description="Nom commun de l'espèce")
    nom: str = Field(..., description="Nom complet (Espèce + Variété)")
    botanique: Botanique
    type: TypePlante = Field(..., description="Type de plante")
    categorie: CategoriePlante = Field(..., description="Catégorie")
    pollinisateurs: List[str] = Field(default_factory=list, description="Liste des pollinisateurs")

# --- 2. PORTRAIT ---
class Morphologie(BaseModel):
    couleur: str
    forme: str
    texture: str
    gout: str
    calibre: str

class Portrait(BaseModel):
    description: str = Field(..., description="Description poétique et esthétique")
    poeme: str = Field(..., description="Poème court de 4 lignes")
    pays_origine: str
    morphologie: Morphologie

# --- 3. AGRONOMIE ---
class Agronomie(BaseModel):
    exposition: Exposition = Field(..., description="Exposition")
    besoin_eau: BesoinEau = Field(..., description="Niveau de besoin en eau")
    sol_ideal: str = Field(..., description="Type de sol idéal")
    sol_ideal_ph: List[float] = Field(..., description="Plage de pH idéal (min, max)")
    rusticite: str = Field(..., description="Température minimale de résistance")
    densite: str = Field(..., description="Densité de plantation")

# --- 4. CALENDRIER ---
class Calendrier(BaseModel):
    semis: List[int] = Field(default_factory=list, description="Mois de semis (1-12)")
    plantation: List[int] = Field(default_factory=list, description="Mois de plantation (1-12)")
    floraison: List[int] = Field(default_factory=list, description="Mois de floraison (1-12)")
    recolte: List[int] = Field(default_factory=list, description="Mois de récolte (1-12)")
    taille: List[int] = Field(default_factory=list, description="Mois de taille/entretien (1-12)")

# --- 5. GUIDE ---
class Guide(BaseModel):
    installation: str
    entretien: str
    arrosage: str
    maladies: List[str] = Field(default_factory=list)
    signes_alerte: List[str] = Field(default_factory=list)
    actions_sanitaire: List[str] = Field(default_factory=list)

# --- 6. VALORISATION ---
class Valorisation(BaseModel):
    nombre_jour_recolte: Optional[int] = Field(None, description="Nombre de jours avant récolte (estimation)")
    signes_maturite: List[str] = Field(default_factory=list)
    conservation: str

# --- ROOT MODEL ---
class FichePlant(BaseModel):
    identite: Identite
    portrait: Portrait
    agronomie: Agronomie
    calendrier: Calendrier
    guide: Guide
    valorisation: Valorisation
