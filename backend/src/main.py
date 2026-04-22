"""
FastAPI application entry point.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import settings
from src.api.routes import chat, health

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info(f"Starting RAG backend (environment: {settings.environment})")
    logger.info(f"Qdrant URL: {settings.qdrant_url}")
    logger.info(f"Embedding model: {settings.embedding_model}")
    logger.info(f"LLM model: {settings.gemini_model}")

    # Initialize services (lazy loading will happen on first use)
    # This just validates connections
    try:
        from src.core.vector_store import get_vector_store

        vector_store = get_vector_store()
        info = vector_store.get_collection_info()
        logger.info(f"Qdrant collection info: {info}")
    except Exception as e:
        logger.warning(f"Could not connect to Qdrant on startup: {e}")
        logger.warning("Services will initialize on first request")

    yield

    # Shutdown
    logger.info("Shutting down RAG backend")


# Create FastAPI app
app = FastAPI(
    title="RAG Backend API",
    description="Retrieval-Augmented Generation backend with Qdrant and Gemini",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred"},
    )


# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(chat.router, prefix="/api/v1", tags=["Chat"])


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "RAG Backend API",
        "version": "0.1.0",
        "status": "operational",
        "environment": settings.environment,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=not settings.is_production,
    )