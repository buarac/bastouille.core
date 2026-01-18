import time
import logging
import json
import asyncio
from typing import Optional, Dict, Any, List, Union
from google import genai
from google.genai import types
from datetime import datetime

from core.config import settings
from services.persistence import get_supabase_client

logger = logging.getLogger(__name__)

class GeminiClient:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GeminiClient, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set")
            
        # Initialize Native Client
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL_NAME or "gemini-2.0-flash-exp" # Default to latest efficient model
        self.supabase = get_supabase_client()
        self._initialized = True
        
        logger.info(f"GeminiClient initialized with model: {self.model_name}")

    async def generate_content(self, 
                             contents: Union[str, List[Any]], 
                             config: Optional[types.GenerateContentConfig] = None,
                              agent_name: str = "Unknown",
                              trace_id: Optional[str] = None,
                              conversation_id: Optional[str] = None,
                              model: Optional[str] = None) -> types.GenerateContentResponse:
        """
        Wrapper for generate_content with automatic logging to llm_logs.
        """
        start_time = time.time()
        error_msg = None
        response_payload = None
        input_tokens = 0
        output_tokens = 0
        
        # Determine effective model
        effective_model = model or self.model_name
        
        try:
            # Execute Call
            # Note: client.models.generate_content is sync or async? 
            # The google-genai SDK 0.x has async methods?
            # It seems 'generate_content' is sync by default in the new client unless using async_generate_content?
            # Creating wrapper for async execution if sync
            
            # According to docs, client.aio is for async
            response = await self.client.aio.models.generate_content(
                model=effective_model,
                contents=contents,
                config=config
            )
            
            # Extract Metrics
            if response.usage_metadata:
                input_tokens = response.usage_metadata.prompt_token_count
                output_tokens = response.usage_metadata.candidates_token_count
            
            # Serialize Response for logging (simplified)
            # using to_json() or manual dict
            # We want to store a readable structure
            try:
                # The response object might not be easily JSON serializable directly
                response_payload = {
                    "text": response.text if response.candidates and response.candidates[0].content.parts else None,
                    "function_calls": [
                        part.function_call.name 
                        for candidate in response.candidates 
                        for part in candidate.content.parts 
                        if part.function_call
                    ] if response.candidates else []
                }
            except:
                response_payload = {"raw": str(response)}

            return response
            
        except Exception as e:
            error_msg = str(e)
            raise e
        finally:
            duration = int((time.time() - start_time) * 1000)
            
            # Prepare Input Payload Log
            input_payload = {
                "contents": str(contents)[:5000], # Truncate if huge
                "config": str(config) if config else None
            }
            
            # Log synchronously to ensure persistence
            await self._log_to_db(
                agent_name=agent_name,
                trace_id=trace_id,
                conversation_id=conversation_id,
                method="generate_content",
                duration=duration,
                in_tok=input_tokens,
                out_tok=output_tokens,
                inp=input_payload,
                out=response_payload,
                err=error_msg,
                model_used=effective_model
            )

    async def _log_to_db(self, agent_name, trace_id, conversation_id, method, duration, in_tok, out_tok, inp, out, err, model_used=None):
        if not self.supabase:
            return
            
        try:
            payload = {
                "agent_name": agent_name,
                "trace_id": trace_id,
                "conversation_id": conversation_id,
                "model_name": model_used or self.model_name,
                "method_name": method,
                "duration_ms": duration,
                "input_tokens": in_tok,
                "output_tokens": out_tok,
                "input_payload": inp,
                "output_payload": out,
                "error_message": err,
                "created_at": datetime.utcnow().isoformat()
            }
            # We use a separate task, so we await here but it's detached from main flow
            self.supabase.table("llm_logs").insert(payload).execute()
        except Exception as e:
            logger.error(f"Failed to write llm_logs: {e}")

    async def embed_content(self, text: str) -> List[float]:
        """
        Generate embedding for the given text using gemini-embedding-001.
        """
        try:
            # Execute Call
            response = await self.client.aio.models.embed_content(
                model="text-embedding-004",
                contents=text,
                config=types.EmbedContentConfig(
                    task_type="SEMANTIC_SIMILARITY"
                )
            )
            
            # Extract embedding vector
            # Response structure has embeddings list
            if response.embeddings:
                return response.embeddings[0].values
            return []
            
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise e

# Global Accessor
_gemini_client = None
def get_gemini_client():
    global _gemini_client
    if not _gemini_client:
        _gemini_client = GeminiClient()
    return _gemini_client
