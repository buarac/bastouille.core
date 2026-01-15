from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.botanique import BotaniqueAgent
from schemas.agent import AgentResponse

router = APIRouter(prefix="/agents", tags=["Agents"])

class AgentRequest(BaseModel):
    query: str

@router.post("/botanique", response_model=AgentResponse)
async def ask_botanique(request: AgentRequest):
    """
    Interroge l'agent Botanique.
    """
    try:
        agent = BotaniqueAgent()
        response = await agent.analyze(request.query)
        return response
    except ValueError as e:
         raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from agents.culture import CultureAgent
from pydantic import BaseModel

# The original router definition is updated to include the new parameters
# and the new router definition from the instruction is integrated.
# Note: The instruction provided a new `router = APIRouter(...)` block.
# To avoid re-defining the router, the existing one is modified.
# If the intent was to have two separate routers, the instruction would need to specify a different variable name.
router.tags = ["Agents", "agents"] # Merging tags, keeping original "Agents" and adding "agents"
router.responses = {404: {"description": "Not found"}} # Adding new responses

from typing import List, Dict, Optional, Any

class ChatRequest(BaseModel):
    query: str
    history: Optional[List[Dict[str, str]]] = []

@router.post("/culture/chat")
async def chat_culture(request: ChatRequest):
    """
    Dialogue avec l'agent Chef de Culture.
    """
    try:
        agent = CultureAgent()
        response = await agent.chat(request.query, request.history)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/botanique/meta")
async def get_botanique_meta():
    """
    Retourne les métadonnées de l'agent (version, etc.)
    """
    return {
        "version": "1.0",
        "model": "gemini-1.5-flash"
    }
