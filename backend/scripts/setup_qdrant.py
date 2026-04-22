"""
Setup script to initialize Qdrant collection.
Run this before starting the ingestion process.
"""

import logging
import sys

# Add parent directory to path
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent))

from src.config import settings
from src.core.embeddings import get_embedding_service
from src.core.vector_store import get_vector_store

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


def main():
    """Initialize Qdrant collection."""
    try:
        logger.info("Starting Qdrant collection setup...")

        # Initialize services
        embedding_service = get_embedding_service()
        vector_store = get_vector_store()

        # Get embedding dimension
        embedding_dim = embedding_service.get_dimension()
        logger.info(f"Embedding dimension: {embedding_dim}")

        # Create collection
        logger.info(f"Creating collection: {settings.qdrant_collection_name}")
        vector_store.create_collection(
            embedding_dim=embedding_dim,
            force_recreate=False,  # Don't delete existing collection
        )

        # Verify collection
        info = vector_store.get_collection_info()
        logger.info(f"Collection created successfully: {info}")

        logger.info("✅ Setup completed successfully!")
        return 0

    except Exception as e:
        logger.error(f"❌ Setup failed: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    exit(main())