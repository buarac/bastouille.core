from typing import List, Dict
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agents.bastouille_chef import BastouilleChef

router = APIRouter(
    prefix="/bastouille",
    tags=["bastouille_chef"]
)

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []

@router.post("/chat")
async def chat(request: ChatRequest, fastapi_request: Request):
    """
    Endpoint natif pour l'agent Baštouille (Gemini V2).
    Retourne un stream SSE (Server-Sent Events).
    """
    # Extract Conversation ID from headers (optional)
    conversation_id = fastapi_request.headers.get("X-Conversation-ID")
    
    agent = BastouilleChef()
    
    return StreamingResponse(
        agent.chat_stream(request.message, history=request.history, conversation_id=conversation_id),
        media_type="text/event-stream"
    )
