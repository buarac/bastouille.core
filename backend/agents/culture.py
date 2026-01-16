import json
import logging
import time
from typing import List, Dict, Any, Optional
from core.config import settings
from services.llm import get_llm_provider
from services.persistence import get_supabase_client, BotaniquePersistenceService
from agents.tools.culture import CultureTools
from agents.tools.culture_search import CultureSearchTool
from services.traceability import TraceabilityService

logger = logging.getLogger(__name__)

class CultureAgent:
    def __init__(self):
        self.llm = get_llm_provider()
        self.supabase = get_supabase_client()
        self.persistence = BotaniquePersistenceService() # Used for context injection
        self.traceability = TraceabilityService()
        
        # Tools
        self.action_tools = CultureTools()
        self.search_tool = CultureSearchTool()
        
        # Tool Mapping for Execution
        self.tools_map = {
            "create_subject": self.action_tools.create_subject,
            "log_event": self.action_tools.log_event,
            "list_my_subjects": self.action_tools.list_my_subjects,
            "search_garden": self.search_tool.search_garden
        }

    def _build_prompt(self) -> str:
        # Fetch from DB to allow dynamic updates
        res = self.supabase.table("agent_configurations").select("system_prompt").eq("agent_key", "culture_v1").execute()
        if res.data:
            return res.data[0]["system_prompt"]
        return "Tu es le Chef de Culture." # Fallback


    async def chat(self, user_query: str, history: List[Dict[str, str]] = []) -> str:
        start_time = time.time()
        
        # 1. Build Prompt
        system_prompt = self._build_prompt()
        
        # 1b. Inject Context (Varieties)
        varieties_summary = self.persistence.get_all_varieties_summary()
        
        context_block = f"""
[CONTEXTE BOTANIQUE (LISTE DES VARIÉTÉS)]
Voici la liste des variétés références dans la base. Tu peux t'en servir pour suggérer des corrections ou autocompléter les noms.
{varieties_summary}
[/CONTEXTE BOTANIQUE]
"""
        system_prompt += context_block
        
        # 1c. Safety / Confirmation Logic
        if settings.AGENT_ACTION_CONFIRMATION:
            safety_block = """
[MODE SÉCURITÉ : ACTIF]
ATTENTION : Tu as l'INTERDICTION de toucher à la base de données (outils créations/logs) sans validation explicite.
Si l'utilisateur te demande une action (planter, noter, créer...) :
1. Reformule d'abord ce que tu comptes faire "Je vais créer X...", "Je note l'événement Y".
2. Attends la confirmation de l'utilisateur ("Oui", "Go", "C'est bon").
3. SEULEMENT ALORS, génère le JSON de l'outil.
Si l'utilisateur vient de confirmer, tu peux agir.
"""
            system_prompt += safety_block
        
        # Format History
        history_text = ""
        if history:
            history_text = "[HISTORIQUE DE CONVERSATION]\n"
            for msg in history:
                role = msg.get("role", "user").upper()
                content = msg.get("content", "")
                history_text += f"{role}: {content}\n"
            history_text += "[/HISTORIQUE DE CONVERSATION]\n"
        
        full_prompt = f"""{system_prompt}

{history_text}

USER_QUERY: {user_query}

NOTE IMPORTANTE :
- Si tu as besoin de vérifier l'existence d'une plante ou d'un sujet, utilise l'outil `search_garden`.
- Si tu décides d'effectuer une action, génère le bloc JSON ci-dessous.
- Sinon, réponds simplement en texte naturel.

STYLE DE RÉPONSE :
- Ne mentionne JAMAIS "j'utilise l'outil" ou le JSON.
- Parle comme un humain expert ("C'est noté", "Action effectuée").

```json
{{
  "tool": "nom_de_l_outil",
  "args": {{ ... }}
}}
```
"""
        
        # Track Usage
        total_usage = {"prompt_tokens": 0, "completion_tokens": 0}

        # 3. LLM Generation
        response_text, usage = await self.llm.generate(full_prompt)
        self._accumulate_usage(total_usage, usage)

        # 4. Tool Execution Logic (ReAct Loop)
        max_turns = 5
        current_turn = 0
        
        while current_turn < max_turns:
            current_turn += 1
            
            # 4a. Parse Tool Call
            tool_call = self._parse_tool_call(response_text)
            
            if not tool_call:
                # No tool call, just return text (Final Answer)
                final_response = response_text
                break
            
            # 4b. Execute Tool
            tool_name = tool_call.get("tool")
            tool_args = tool_call.get("args")
            tool_output_str = ""
            
            logger.info(f"Turn {current_turn}: Executing {tool_name}")
            
            if tool_name in self.tools_map:
                try:
                    result = self.tools_map[tool_name](**tool_args)
                    tool_output_str = json.dumps(result, ensure_ascii=False)
                except Exception as e:
                    tool_output_str = f"Error: {e}"
            else:
                tool_output_str = f"Error: Tool {tool_name} not found."
            
            # 4c. Re-Prompt with Tool Output
            # We append the assistant's action and the tool output to the history simulation
            # Note: We must strip the ```json block from the assistant's visible memory if possible?
            # Actually, standard ReAct keeps it to show "I decided to do this, here is result".
            # BUT we want to HIDE it from the user at the END.
            
            # Append context
            # We simulate that the assistant ALREADY said this internal thought.
            # But to prevent it from repeating it or thinking it's the "answer", we guide the next generation.
            
            full_prompt += f"\nASSISTANT (Interne): Action {tool_name} exécutée.\n"
            full_prompt += f"SYSTEM: Résultat de l'outil : {tool_output_str}\n"
            full_prompt += "SYSTEM: L'action est terminée. Formule maintenant ta réponse FINALE à l'utilisateur.\n"
            full_prompt += "CONSIGNE STRICTE : Ne mentionne PAS le nom des outils techniques ou des JSON. Parle naturellement (ex: 'C'est noté', 'C'est fait')."
            
            # Generate next step
            response_text, usage_re = await self.llm.generate(full_prompt)
            self._accumulate_usage(total_usage, usage_re)
            
            # Loop continues to check if new response is a tool call or text...
            
        final_response = response_text
        
        # Clean Final Response: Remove any leftover JSON blocks (e.g. if tool detected but max turns hit, or parse fail)
        if "```" in final_response:
             import re
             # Remove code blocks that look like tool calls or generic json
             clean_text = re.sub(r"```(?:\w+)?\s*\{.*?\}\s*```", "", final_response, flags=re.DOTALL)
             if clean_text.strip():
                 final_response = clean_text.strip()
        
        # LOGGING TRACEABILITY
        duration_ms = int((time.time() - start_time) * 1000)
        try:
            await self.traceability.log_interaction(
                agent_name="Culture",
                agent_version="v6", 
                model_name=settings.GEMINI_MODEL_NAME, 
                input_content=user_query,
                full_prompt=full_prompt, 
                response_content=final_response,
                input_tokens=total_usage["prompt_tokens"],
                output_tokens=total_usage["completion_tokens"],
                duration_ms=duration_ms
            )
        except Exception as e:
            logger.error(f"Failed to log trace: {e}")

        return final_response

    def _accumulate_usage(self, total: Dict, new_usage: Dict):
        total["prompt_tokens"] += new_usage.get("prompt_tokens", 0)
        total["completion_tokens"] += new_usage.get("completion_tokens", 0)


    def _parse_tool_call(self, text: str) -> Optional[Dict]:
        """
        Extracts JSON block from text.
        Supports:
        1. Markdown fences: ```json { ... } ```
        2. Raw JSON if text starts with { and contains "tool"
        """
        import re
        try:
            # 1. Try Markdown Fence (Best practice)
            match = re.search(r"```(?:\w+)?\s*(\{.*?\})\s*```", text, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            
            # 2. Try Raw JSON (Fallback)
            # If text looks like a JSON object { ... }
            text_stripped = text.strip()
            if text_stripped.startswith("{") and text_stripped.endswith("}"):
                # Basic check to avoid parsing random sentences starting with {
                if '"tool"' in text_stripped:
                    return json.loads(text_stripped)
            
            return None
        except Exception as e:
            logger.warning(f"Failed to parse tool call JSON: {e}")
            return None
