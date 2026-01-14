import logging
from datetime import datetime
from services.persistence import BotaniquePersistenceService
from typing import Optional

logger = logging.getLogger(__name__)

class TraceabilityService:
    def __init__(self):
        self.persistence = BotaniquePersistenceService()
        self.supabase = self.persistence.supabase

    async def log_interaction(self, 
                            agent_name: str, 
                            agent_version: str, 
                            model_name: str, 
                            input_content: str, 
                            full_prompt: str, 
                            response_content: str, 
                            input_tokens: int,
                            output_tokens: int, 
                            duration_ms: int):
        """
        Logs an agent interaction to the 'agent_trace_logs' table.
        """
        try:
            payload = {
                "agent_name": agent_name,
                "agent_version": agent_version,
                "model_name": model_name,
                "input_content": input_content,
                "full_prompt": full_prompt,
                "response_content": response_content,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "duration_ms": duration_ms,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Fire and forget - or await if we want to be sure
            response = self.supabase.table("agent_trace_logs").insert(payload).execute()
            logger.info(f"Logged interaction for {agent_name} (Duration: {duration_ms}ms)")
            return response
        except Exception as e:
            logger.error(f"Failed to log agent interaction: {str(e)}")
            # We don't want to break the main flow if logging fails
            return None

    async def get_logs(self, limit: int = 50, offset: int = 0):
        try:
            response = self.supabase.table("agent_trace_logs")\
                .select("*")\
                .order("created_at", desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()
            return response.data
        except Exception as e:
            logger.error(f"Failed to fetch logs: {str(e)}")
            return []
