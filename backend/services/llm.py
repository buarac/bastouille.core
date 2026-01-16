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

    @abstractmethod
    async def generate_stream(self, prompt: str, system_prompt: Optional[str] = None):
        """Yields chunks of text"""
        pass

    @abstractmethod
    async def embed_text(self, text: str) -> list[float]:
        """Embeds text into a vector"""
        pass

class GeminiProvider(LLMProvider):
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set")
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(
            settings.GEMINI_MODEL_NAME or "gemini-3-flash",
            generation_config=genai.types.GenerationConfig(
                temperature=0.2, # Lower temperature for better instruction following (tools)
            )
        )

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> tuple[str, Dict[str, int]]:
        # Note: Google's API usually handles system prompts via specific configuration or prepending.
        # For simplicity, we prepend it here if provided.
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"System Instruction: {system_prompt}\n\nUser Query: {prompt}"
        
        response = await self.model.generate_content_async(full_prompt)
        
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

    async def generate_stream(self, prompt: str, system_prompt: Optional[str] = None):
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"System Instruction: {system_prompt}\n\nUser Query: {prompt}"
        
        # stream=True returns a synchronous iterator or async?
        # generate_content_async(stream=True) returns an async iterator
        response = await self.model.generate_content_async(full_prompt, stream=True)
        
        async for chunk in response:
            try:
                if chunk.text:
                    yield chunk.text
            except ValueError:
                # Accessing chunk.text raises if the response is blocked or empty (finish_reason)
                continue

    async def embed_text(self, text: str) -> list[float]:
        """
        Embeds a single string using models/text-embedding-004.
        Returns a list of floats (768 dim).
        """
        try:
            result = await genai.embed_content_async(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document" # Optimized for storage
            )
            return result["embedding"]
        except Exception as e:
            raise RuntimeError(f"Gemini Embed failed: {e}")

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

    async def generate_stream(self, prompt: str, system_prompt: Optional[str] = None):
        # Implementation for Ollama Stream if needed later
        yield "Not implemented"

    async def embed_text(self, text: str) -> list[float]:
        # TODO: Implement using /api/embeddings or similar
        raise NotImplementedError("Vector search not yet supported with Ollama provider")

def get_llm_provider() -> LLMProvider:
    provider = settings.LLM_PROVIDER.lower()
    if provider == "gemini":
        return GeminiProvider()
    elif provider == "ollama":
        return OllamaProvider()
    else:
        raise ValueError(f"Unknown LLM Provider: {provider}")
