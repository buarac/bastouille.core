from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from uuid import UUID

class FicheBotaniqueDB(BaseModel):
    id: UUID
    data: Dict[str, Any]
    variete: str
    espece: str
    nom: str
    created_at: datetime
    updated_at: datetime
    # embedding_nom is hidden from standard response unless needed, usually not returned to frontend
    embedding_nom: Optional[List[float]] = None
    similarity: Optional[float] = None

    class Config:
        from_attributes = True

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
