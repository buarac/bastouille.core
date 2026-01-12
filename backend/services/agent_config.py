import os
import logging
from typing import List, Dict, Optional
from supabase import create_client, Client

logger = logging.getLogger(__name__)

class AgentConfigService:
    def __init__(self):
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")
        
        if not url or not key:
            logger.warning("Supabase credentials not found in env. AgentConfigService will fail.")
            self.supabase: Optional[Client] = None
        else:
            self.supabase: Client = create_client(url, key)

    def get_system_prompt(self, agent_key: str) -> str:
        """
        Retrieves the active system prompt for a given agent.
        Falls back to a default if not found or DB error.
        """
        if not self.supabase:
            return ""

        try:
            response = self.supabase.table("agent_configurations")\
                .select("system_prompt")\
                .eq("agent_key", agent_key)\
                .eq("is_active", True)\
                .execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]["system_prompt"]
            else:
                logger.warning(f"No active system prompt found for agent: {agent_key}")
                return ""
        except Exception as e:
            logger.error(f"Error fetching system prompt for {agent_key}: {e}")
            return ""

    def get_few_shot_examples(self, agent_key: str, limit: int = 3) -> List[Dict]:
        """
        Retrieves a list of few-shot examples for the agent.
        """
        if not self.supabase:
            return []

        try:
            # Random selection is not native easily in simple select without RPC, 
            # so we just take the latest ones or simple selection for now.
            # Ideally we would use a semantic search or randomized RPC.
            response = self.supabase.table("agent_few_shot_examples")\
                .select("input_text, output_json")\
                .eq("agent_key", agent_key)\
                .limit(limit)\
                .execute()
            
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error fetching examples for {agent_key}: {e}")
            return []
