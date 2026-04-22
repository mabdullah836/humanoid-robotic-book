"""
Configuration management using Pydantic Settings.
Loads environment variables and provides type-safe config access.
"""

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # API Keys (Gemini required for chat; optional for ingestion/setup only)
    gemini_api_key: str | None = Field(
        default=None, description="Google Gemini API key (required for /api/v1/chat)"
    )

    # Qdrant Configuration
    qdrant_url: str = Field(
        default="http://localhost:6333", description="Qdrant server URL"
    )
    qdrant_api_key: str | None = Field(
        default=None, description="Qdrant API key (optional for local)"
    )
    qdrant_collection_name: str = Field(
        default="rag_documents", description="Qdrant collection name"
    )

    # Embedding Configuration
    embedding_model: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2",
        description="HuggingFace embedding model",
    )
    embedding_dimension: int = Field(
        default=384,
        description="Embedding dimension (384 for all-MiniLM-L6-v2, 768 for bge-small)",
    )

    # LLM Configuration
    gemini_model: str = Field(
        default="gemini-1.5-flash", description="Gemini model name"
    )
    gemini_base_url: str = Field(
        default="https://generativelanguage.googleapis.com/v1beta/openai/",
        description="Gemini OpenAI-compatible base URL",
    )
    llm_temperature: float = Field(
        default=0.7, ge=0.0, le=2.0, description="LLM temperature"
    )
    llm_max_tokens: int = Field(
        default=2048, gt=0, description="Maximum tokens in LLM response"
    )
    llm_top_p: float = Field(default=0.9, ge=0.0, le=1.0, description="Top-p sampling")

    # RAG Configuration
    max_chunks_to_retrieve: int = Field(
        default=5, gt=0, description="Number of chunks to retrieve"
    )
    chunk_size: int = Field(default=1000, gt=0, description="Chunk size in characters")
    chunk_overlap: int = Field(
        default=200, ge=0, description="Overlap between chunks"
    )
    score_threshold: float = Field(
        default=0.5, ge=0.0, le=1.0, description="Minimum similarity score"
    )

    # Application Settings
    environment: str = Field(default="development", description="Environment name")
    log_level: str = Field(default="INFO", description="Logging level")
    allowed_origins: List[str] = Field(
        default=["http://localhost:3000"],
        description="CORS allowed origins",
    )

    # Session Management
    session_timeout_minutes: int = Field(
        default=60, gt=0, description="Session timeout in minutes"
    )
    max_conversation_history: int = Field(
        default=10, gt=0, description="Max messages to keep in conversation history"
    )

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment.lower() == "production"

    @property
    def qdrant_config(self) -> dict:
        """Get Qdrant client configuration."""
        config = {
            "url": self.qdrant_url,
        }
        if self.qdrant_api_key:
            config["api_key"] = self.qdrant_api_key
        return config


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global settings instance
settings = get_settings()