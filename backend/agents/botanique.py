import json
import logging
from typing import Optional, List, Dict
from schemas.botanique import ReponseBotanique
from schemas.agent import AgentResponse, TokenUsage
from services.llm import GeminiProvider
from services.agent_config import AgentConfigService

logger = logging.getLogger(__name__)

# Version actuelle de l'agent
CURRENT_AGENT_VERSION = "1.0"

class BotaniqueAgent:
    def __init__(self):
        # L'agent Botanique utilise EXCLUSIVEMENT Gemini (gemini-3-flash-preview)
        self.llm = GeminiProvider()
        self.config_service = AgentConfigService()
        self.agent_key = "botanique_v1"

    async def _build_prompt(self, user_input: str) -> tuple[str, str]:
        """
        Retrieves the system prompt and builds the user prompt with few-shot examples.
        Returns (system_prompt, user_prompt)
        """
        # 1. Get System Prompt
        system_prompt = self.config_service.get_system_prompt(self.agent_key)
        if not system_prompt:
            logger.warning("Using fallback system prompt (DB fetch failed or empty).")
            # Fallback en dur au cas où la DB est inaccessible
            system_prompt = """
            Tu es un expert en botanique et jardinage pour l'application Baštouille.
            Tu DOIS répondre UNIQUEMENT au format JSON strict.
            """

        # 2. Get Few-Shot Examples
        examples = self.config_service.get_few_shot_examples(self.agent_key)
        
        # 3. Build User Prompt with Examples
        example_text = ""
        if examples:
            example_text = "\n\nVoici des exemples de la structure JSON attendue :\n"
            for i, ex in enumerate(examples, 1):
                example_text += f"\n--- Exemple {i} ---\n"
                example_text += f"Input: {ex.get('input_text')}\n"
                # Ensure output is stringified json
                output_str = json.dumps(ex.get('output_json'), indent=2, ensure_ascii=False)
                example_text += f"Output:\n{output_str}\n"
            example_text += "\n--- Fin des exemples ---\n"
        
        # 4. Inject Schema explicitly (redundancy is good for Gemini Flash)
        schema_instruction = f"""
        Rappel du Format JSON Schema attendu:
        {json.dumps(ReponseBotanique.model_json_schema(), indent=2)}
        """

        full_user_prompt = f"{example_text}\n{schema_instruction}\n\nRequete Utilisateur : {user_input}"
        
        return system_prompt, full_user_prompt

    async def analyze(self, plant_name: str) -> AgentResponse:
        logger.info(f"BotaniqueAgent analyzing: {plant_name}")
        
        # Build dynamic prompts
        system_prompt, user_prompt = await self._build_prompt(plant_name)
        
        # Now returns tuple (text, usage)
        raw_response, usage_data = await self.llm.generate(user_prompt, system_prompt=system_prompt)
        
        try:
            # Nettoyage basique si le LLM est bavard (markdown blocks)
            cleaned_response = raw_response.replace("```json", "").replace("```", "").strip()
            data_dict = json.loads(cleaned_response)
            
            # Inject Version
            data_dict["version"] = CURRENT_AGENT_VERSION

            botanique_data = ReponseBotanique(**data_dict)
            
            # Construct Generic Agent Response
            return AgentResponse(
                data=botanique_data,
                usage=TokenUsage(
                    input=usage_data.get("prompt_tokens", 0),
                    output=usage_data.get("completion_tokens", 0),
                    total=usage_data.get("total_tokens", 0)
                ),
                meta={"agent_version": CURRENT_AGENT_VERSION}
            )
            
        except json.JSONDecodeError:
            logger.error(f"Failed to parse JSON from LLM: {raw_response}")
            raise ValueError("L'agent n'a pas renvoyé un JSON valide.")
        except Exception as e:
            logger.error(f"Validation error: {str(e)}")
            raise e
