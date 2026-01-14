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

@router.get("/botanique/meta")
async def get_botanique_meta():
    """
    Retourne les métadonnées de l'agent (version, etc.)
    """
    return {
        "version": "1.0",
        "model": "gemini-1.5-flash"
    }
