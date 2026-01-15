import json
import logging
import time
from typing import List, Dict, Any, Optional
from core.config import settings
from services.llm import get_llm_provider
from services.persistence import get_supabase_client
from agents.tools.culture import CultureTools
from agents.tools.culture_search import CultureSearchTool
from services.traceability import TraceabilityService

logger = logging.getLogger(__name__)

class CultureAgent:
    def __init__(self):
        self.llm = get_llm_provider()
        self.supabase = get_supabase_client()
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

        # 4. Tool Execution Logic (Simple ReAct Loop)
        final_response = response_text
        
        # Parse and execute tool if any...
        tool_call = self._parse_tool_call(response_text)
        
        if tool_call:
            tool_name = tool_call.get("tool")
            tool_args = tool_call.get("args")
            
            logger.info(f"Tool Call detected: {tool_name} with {tool_args}")
            
            if tool_name in self.tools_map:
                try:
                    result = self.tools_map[tool_name](**tool_args)
                    tool_output_str = json.dumps(result, ensure_ascii=False)

                    # Re-Prompting
                    follow_up_prompt = f"""{full_prompt}

ASSISTANT (TOI): J'utilise l'outil {tool_name} avec {tool_args}

RÉSULTAT DE L'OUTIL:
{tool_output_str}

INSTRUCTION: 
Grâce à ces informations:
1. Si c'était une recherche/lecture, formule une réponse naturelle pour l'utilisateur.
2. Si c'était une action (création/log), confirme simplement le succès.
3. Si une suite est nécessaire (ex: après recherche -> création), génère le prochain appel d'outil.
"""
                    final_response, usage_re = await self.llm.generate(follow_up_prompt)
                    self._accumulate_usage(total_usage, usage_re)
                    
                    # Nested Tool Check
                    nested_tool_call = self._parse_tool_call(final_response)
                    if nested_tool_call:
                         n_name = nested_tool_call.get("tool")
                         n_args = nested_tool_call.get("args")
                         if n_name in self.tools_map:
                             if n_name == tool_name and n_name == "search_garden":
                                  final_response += "\n\n(Boucle détectée, arrêt.)"
                             else:
                                 action_res = self.tools_map[n_name](**n_args)
                                 final_response += f"\n\n[Système] Action effectuée : {action_res}"

                except Exception as e:
                    final_response = f"Erreur lors de l'exécution de l'outil {tool_name}: {e}"
            else:
                final_response = f"Outil inconnu : {tool_name}"
        
        # LOGGING TRACEABILITY
        duration_ms = int((time.time() - start_time) * 1000)
        try:
            await self.traceability.log_interaction(
                agent_name="Culture",
                agent_version="v6", # or fetch from settings
                model_name=settings.GEMINI_MODEL_NAME, 
                input_content=user_query,
                full_prompt=full_prompt, # Logging initial prompt
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
        """
        try:
            if "```json" in text:
                import re
                match = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
                if match:
                    return json.loads(match.group(1))
            return None
        except Exception:
            return None
