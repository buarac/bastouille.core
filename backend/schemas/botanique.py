from pydantic import BaseModel, Field
from typing import List, Optional

class Taxonomie(BaseModel):
    ordre: Optional[str] = Field(None, description="Ordre botanique")
    famille: Optional[str] = Field(None, description="Famille botanique")
    genre: Optional[str] = Field(None, description="Genre botanique")
    espece: str = Field(..., description="Nom scientifique de l'espèce (ex: Solanum lycopersicum)")
    variete: Optional[str] = Field(None, description="Nom de la variété")
    nom_commun: str = Field(..., description="Nom commun principal (ex: Tomate)")

class CycleVie(BaseModel):
    type: str = Field(..., description="VIVACE ou ANNUELLE (inclut les bisannuelles)")

class Categorisation(BaseModel):
    categorie: str = Field(..., description="Catégorie (Arbre fruitier, Arbuste, Fleur, Légume-fruit, Légume-feuille, Légume-racine, etc.)")

class Calendrier(BaseModel):
    semis_sous_abri: List[str] = Field(default=[], description="Mois de semis sous abris (ex: ['Mars', 'Avril'])")
    semis_pleine_terre: List[str] = Field(default=[], description="Mois de semis en pleine terre")
    recolte: List[str] = Field(default=[], description="Mois de récolte")
    floraison: List[str] = Field(default=[], description="Mois de floraison (pour les vivaces)")
    espacement_plants: Optional[str] = Field(None, description="Espacement recommandé entre les plants (ex: '40-50 cm')")
    espacement_rangs: Optional[str] = Field(None, description="Espacement recommandé entre les rangs (ex: '60 cm')")

class Caracteristiques(BaseModel):
    couleur: Optional[str] = Field(None)
    calibre: Optional[str] = Field(None, description="Calibre ou taille adulte")
    origine: Optional[str] = Field(None)
    forme: Optional[str] = Field(None)
    texture: Optional[str] = Field(None)
    saveur: Optional[str] = Field(None, description="Goût ou saveur (ex: sucrée, acidulée)")
    pollinisateurs: Optional[str] = Field(None, description="Pour les fruitiers : variétés pollinisatrices ou 'auto-fertile'")
    autres: List[str] = Field(default=[], description="Autres caractéristiques pertinentes")

class ReponseBotanique(BaseModel):
    version: Optional[str] = Field(None, description="Version de l'agent ayant généré la fiche")
    taxonomie: Taxonomie
    cycle_vie: CycleVie
    categorisation: Categorisation
    calendrier: Calendrier
    caracteristiques: Caracteristiques
