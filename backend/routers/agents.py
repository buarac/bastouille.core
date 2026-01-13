from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.botanique import BotaniqueAgent
from schemas.agent import AgentResponse

router = APIRouter(prefix="/api/agents", tags=["Agents"])

class AgentRequest(BaseModel):
    query: str

@router.post("/botanique", response_model=AgentResponse)
async def ask_botanique_agent(request: AgentRequest):
    """
    Interroge l'agent Botanique pour obtenir des informations structurées sur une plante.
    """
    agent = BotaniqueAgent()
    try:
        response = await agent.analyze(request.query)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
