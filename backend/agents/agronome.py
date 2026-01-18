import os
from typing import Optional
from google.genai import types
from core.gemini import get_gemini_client
from models.agronome import FichePlant

class AgronomeAgent:
    def __init__(self):
        self.client = get_gemini_client()
        self.model = "gemini-3-pro-preview"
        self.system_prompt_path = "../docs/agents/agronome/system_prompt.txt"
        self._load_system_prompt()

    def _load_system_prompt(self):
        try:
            # Try to load from file relative to backend root or absolute
            # Assuming backend is CWD or we start from there
            base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # backend/
            path = os.path.join(base_path, "docs/agents/agronome/system_prompt.txt") 
            # Note: docs is sibling to backend usually? 
            # /Volumes/Donnees/devs/bastouille.core/docs/...
            # /Volumes/Donnees/devs/bastouille.core/backend/...
            # So ../docs is reachable from backend root.
            
            # Let's try absolute path based on known structure if relative fails
            real_path = "/Volumes/Donnees/devs/bastouille.core/docs/agents/agronome/system_prompt.txt"
            
            if os.path.exists(real_path):
                with open(real_path, "r") as f:
                    self.system_prompt = f.read()
            else:
                 # Fallback if file not found (hardcoded safety)
                 self.system_prompt = "Tu es un expert agronome. Remplis la fiche plante JSON demandée."
                 print(f"Warning: System prompt file not found at {real_path}")
                 
        except Exception as e:
            print(f"Error loading system prompt: {e}")
            self.system_prompt = "Tu es un expert agronome."

    async def analyze(self, user_input: str, conversation_id: Optional[str] = None) -> FichePlant:
        """
        Analyse une demande utilisateur et retourne une FichePlant structurée.
        """
        response = await self.client.generate_content(
            contents=user_input,
            config=types.GenerateContentConfig(
                temperature=0.1, # Low temp for factual data
                system_instruction=self.system_prompt,
                response_mime_type="application/json",
                response_schema=FichePlant
            ),
            agent_name="Agronome v1.0",
            conversation_id=conversation_id,
            model=self.model
        )
        
        # Parse Pydantic object from response
        if response.parsed:
            return response.parsed
        # Fallback if parsed is missing but text exists (should not happen with handled SDK)
        # But our GeminiClient returns 'response' object from google-genai
        # which has .parsed property if schema was provided.
        
        raise ValueError("Failed to generate structured data")
