from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from agents.agronome import AgronomeAgent

router = APIRouter(
    prefix="/agronome",
    tags=["agronome_chercheur"]
)

from models.agronome import FichePlant

class AnalyzeRequestV1(BaseModel):
    question: str

@router.post("/v1/analyze", response_model=FichePlant)
async def analyze_v1(request: AnalyzeRequestV1, fastapi_request: Request):
    from agents.agronome import AgronomeAgent
    conversation_id = fastapi_request.headers.get("X-Conversation-ID")
    agent = AgronomeAgent()
    try:
        # Returns FichePlant Pydantic model directly
        return await agent.analyze(request.question, conversation_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

