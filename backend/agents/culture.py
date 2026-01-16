import json
import logging
import time
import re
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


    async def chat_stream(self, user_query: str, history: List[Dict[str, str]] = []):
        """
        Async Generator that streams the agent's thought process and final response.
        Yields JSON strings (SSE format).
        """
        start_time = time.time()
        
        # 1. Build Prompt
        system_prompt = self._build_prompt()
        varieties_summary = self.persistence.get_all_varieties_summary()
        
        context_block = f"""
[CONTEXTE BOTANIQUE (LISTE DES VARIÉTÉS)]
Voici la liste des variétés références dans la base. Tu peux t'en servir pour suggérer des corrections ou autocompléter les noms.
{varieties_summary}
[/CONTEXTE BOTANIQUE]
"""
        system_prompt += context_block
        
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
- Avant chaque action, explique ta réflexion en commençant par "PENSÉE :".
- SÉPARATEUR OBLIGATOIRE : Si tu écris une pensée, tu dois SAUTER DEUX LIGNES (\\n\\n) avant d'écrire ta réponse finale.
- Ne mentionne JAMAIS "j'utilise l'outil" ou le JSON dans la réponse finale.
- Parle comme un humain expert ("C'est noté", "Action effectuée").

```json
PENSÉE : Je vérifie si...
{{
  "tool": "nom_de_l_outil",
  "args": {{ ... }}
}}
```
"""
        
        total_usage = {"prompt_tokens": 0, "completion_tokens": 0}

        # 4. Tool Execution Logic (ReAct Loop)
        max_turns = 5
        current_turn = 0
        
        while current_turn < max_turns:
            current_turn += 1
            
            # Streaming Generation
            response_buffer = ""
            stream_state = "START" 
            
            # Use generate_stream for token-by-token output
            async for chunk in self.llm.generate_stream(full_prompt):
                if not chunk: continue
                response_buffer += chunk
                
                # Logic to decide what to show
                
                # Check entry to Tool Hiding
                if "```json" in response_buffer and stream_state != "TOOL_HIDING":
                    stream_state = "TOOL_HIDING"
                    continue
                
                if stream_state == "TOOL_HIDING":
                    continue 

                # Handle Thought vs Message
                if stream_state == "START":
                    cleaned_buffer = response_buffer.strip()
                    if cleaned_buffer.upper().startswith("PENSÉE"):
                        stream_state = "THOUGHT"
                        yield json.dumps({"type": "thought_token", "content": chunk}) + "\n"
                    elif len(cleaned_buffer) > 10: 
                        stream_state = "MESSAGE"
                        yield json.dumps({"type": "message_token", "content": chunk}) + "\n"
                    else:
                         yield json.dumps({"type": "message_token", "content": chunk}) + "\n"
                
                elif stream_state == "THOUGHT":
                    if "\n\n" in chunk:
                         stream_state = "MESSAGE"
                         parts = chunk.split("\n\n", 1)
                         yield json.dumps({"type": "thought_token", "content": parts[0]}) + "\n"
                         if len(parts) > 1:
                            yield json.dumps({"type": "message_token", "content": parts[1]}) + "\n"
                    else:
                        yield json.dumps({"type": "thought_token", "content": chunk}) + "\n"
                
                elif stream_state == "MESSAGE":
                     yield json.dumps({"type": "message_token", "content": chunk}) + "\n"


            # End of Stream (for this turn)
            tool_call = self._parse_tool_call(response_buffer)
            
            if not tool_call:
                logger.info(f"Turn {current_turn}: Response (No Tool) -> {len(response_buffer)} chars")
                break
            
            # 4b. Execute Tool
            tool_name = tool_call.get("tool")
            tool_args = tool_call.get("args")
            tool_output_str = ""
            
            logger.info(f"Turn {current_turn}: Executing {tool_name}")
            yield json.dumps({"type": "step_start", "tool": tool_name}) + "\n"
            
            step_start_ts = time.time()
            if tool_name in self.tools_map:
                try:
                    result = self.tools_map[tool_name](**tool_args)
                    tool_output_str = json.dumps(result, ensure_ascii=False)
                except Exception as e:
                    tool_output_str = f"Error: {e}"
            else:
                tool_output_str = f"Error: Tool {tool_name} not found."
            
            duration_ms = int((time.time() - step_start_ts) * 1000)
            
            yield json.dumps({"type": "step_end", "tool": tool_name, "duration": duration_ms, "result": tool_output_str}) + "\n"
            
            # 4c. Re-Prompt with Tool Output
            full_prompt += f"\nASSISTANT (Interne): {response_buffer}\n" 
            full_prompt += f"SYSTEM: Résultat de l'outil : {tool_output_str}\n"
            full_prompt += "SYSTEM: L'action est terminée. Formule maintenant ta réponse FINALE à l'utilisateur.\n"
            full_prompt += "IMPORTANT : Commence par 'PENSÉE :' pour expliquer ta conclusion, puis SAUTE DEUX LIGNES (\\n\\n) avant la réponse finale.\n"
            full_prompt += "CONSIGNE STRICTE : Ne mentionne PAS le nom des outils techniques ou des JSON. Parle naturellement."
            
            # Loop next turn...
            
        # LOGGING TRACEABILITY
        duration_ms = int((time.time() - start_time) * 1000)
        try:
            await self.traceability.log_interaction(
                agent_name="Culture",
                agent_version="v6-stream-true", 
                model_name=settings.GEMINI_MODEL_NAME, 
                input_content=user_query,
                full_prompt=full_prompt, 
                response_content="[Streamed Content]",
                input_tokens=total_usage["prompt_tokens"],
                output_tokens=total_usage["completion_tokens"],
                duration_ms=duration_ms
            )
        except Exception as e:
            logger.error(f"Failed to log trace: {e}")

        # Done
        yield ""

    async def chat(self, user_query: str, history: List[Dict[str, str]] = []) -> str:
        return "Chat method deprecated for streaming usage."

    def _accumulate_usage(self, total: Dict, new_usage: Dict):
        total["prompt_tokens"] += new_usage.get("prompt_tokens", 0)
        total["completion_tokens"] += new_usage.get("completion_tokens", 0)


    def _parse_tool_call(self, text: str) -> Optional[Dict]:
        import re
        try:
            match = re.search(r"```(?:\w+)?\s*(\{.*?\})\s*```", text, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            text_stripped = text.strip()
            if text_stripped.startswith("{") and text_stripped.endswith("}"):
                if '"tool"' in text_stripped:
                    return json.loads(text_stripped)
            return None
        except Exception as e:
            logger.warning(f"Failed to parse tool call JSON: {e}")
            return None
