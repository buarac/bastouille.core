from pydantic import BaseModel
from typing import Any, Dict, Optional

class TokenUsage(BaseModel):
    input: int
    output: int
    total: int

class AgentResponse(BaseModel):
    data: Any  # Le résultat métier (ex: ReponseBotanique ou dict)
    usage: TokenUsage
    meta: Dict[str, Any] = {}
