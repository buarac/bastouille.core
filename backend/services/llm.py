import google.generativeai as genai
import httpx
import json
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from core.config import settings

class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> tuple[str, Dict[str, int]]:
        pass

class GeminiProvider(LLMProvider):
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set")
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL_NAME or "gemini-3-flash")

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> tuple[str, Dict[str, int]]:
        # Note: Google's API usually handles system prompts via specific configuration or prepending.
        # For simplicity, we prepend it here if provided.
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"System Instruction: {system_prompt}\n\nUser Query: {prompt}"
        
        response = self.model.generate_content(full_prompt)
        
        # Extract usage
        usage = {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        }
        
        if hasattr(response, "usage_metadata"):
            usage["prompt_tokens"] = response.usage_metadata.prompt_token_count
            usage["completion_tokens"] = response.usage_metadata.candidates_token_count
            usage["total_tokens"] = response.usage_metadata.total_token_count
            
        return response.text, usage

class OllamaProvider(LLMProvider):
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model_name = settings.OLLAMA_MODEL_NAME or "mistral"

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> tuple[str, Dict[str, int]]:
        url = f"{self.base_url}/api/generate"
        
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "system": system_prompt if system_prompt else "",
            "format": "json" # Force JSON output for Ollama if needed, but we handle it via schema usually
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=60.0)
                response.raise_for_status()
                data = response.json()
                
                usage = {
                    "prompt_tokens": data.get("prompt_eval_count", 0),
                    "completion_tokens": data.get("eval_count", 0),
                    "total_tokens": data.get("prompt_eval_count", 0) + data.get("eval_count", 0)
                }
                
                return data.get("response", ""), usage
            except Exception as e:
                raise RuntimeError(f"Ollama call failed: {str(e)}")

def get_llm_provider() -> LLMProvider:
    provider = settings.LLM_PROVIDER.lower()
    if provider == "gemini":
        return GeminiProvider()
    elif provider == "ollama":
        return OllamaProvider()
    else:
        raise ValueError(f"Unknown LLM Provider: {provider}")
