"""
Health check endpoint.
"""

import logging
from typing import Dict, Any

from fastapi import APIRouter

from src.config import settings
from src.core.vector_store import get_vector_store

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint.

    Returns system status and component health.
    """
    health_status = {
        "status": "healthy",
        "environment": settings.environment,
        "components": {},
    }

    # Check Qdrant
    try:
        vector_store = get_vector_store()
        collection_info = vector_store.get_collection_info()
        health_status["components"]["qdrant"] = {
            "status": "healthy",
            "collection": settings.qdrant_collection_name,
            "info": collection_info,
        }
    except Exception as e:
        logger.error(f"Qdrant health check failed: {e}")
        health_status["components"]["qdrant"] = {
            "status": "unhealthy",
            "error": str(e),
        }
        health_status["status"] = "degraded"

    # Check embedding service
    try:
        from src.core.embeddings import get_embedding_service

        embedding_service = get_embedding_service()
        health_status["components"]["embeddings"] = {
            "status": "healthy",
            "model": settings.embedding_model,
            "dimension": embedding_service.get_dimension(),
        }
    except Exception as e:
        logger.error(f"Embedding service health check failed: {e}")
        health_status["components"]["embeddings"] = {
            "status": "unhealthy",
            "error": str(e),
        }
        health_status["status"] = "degraded"

    # Check LLM service
    try:
        from src.core.llm import get_llm_service

        get_llm_service()  # Just check initialization
        health_status["components"]["llm"] = {
            "status": "healthy",
            "model": settings.gemini_model,
        }
    except Exception as e:
        logger.error(f"LLM service health check failed: {e}")
        health_status["components"]["llm"] = {
            "status": "unhealthy",
            "error": str(e),
        }
        health_status["status"] = "degraded"

    return health_status