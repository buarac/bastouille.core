from pydantic import BaseModel, ConfigDict, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class FicheBotaniqueDB(BaseModel):
    id: UUID
    data: Dict[str, Any]
    variete: str
    espece: str
    nom: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    embedding_nom: Optional[List[float]] = None
    similarity: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)

    @field_validator("embedding_nom", mode="before")
    @classmethod
    def parse_vector(cls, v):
        import json
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v

class FicheBotaniqueSummary(BaseModel):
    id: UUID
    nom: str
    variete: Optional[str] = None
    espece: Optional[str] = None
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    similarity: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)
