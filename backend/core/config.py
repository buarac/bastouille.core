import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "Bastouille.Core"
    VERSION: str = "0.1.0"
    
    # LLM Configuration
    LLM_PROVIDER: str = "ollama"  # "ollama" or "gemini"
    
    # Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL_NAME: str = "gemini-1.5-flash"
    
    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL_NAME: str = "mistral"
    
    # Botanique Agent Specific
    BOTANIQUE_MODEL_NAME: str = "gemini-3-flash"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
