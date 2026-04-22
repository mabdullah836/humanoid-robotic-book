"""
Qdrant vector store service.
Handles vector storage, retrieval, and collection management.
"""

import logging
import uuid
from typing import List, Dict, Any, Optional

from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.exceptions import UnexpectedResponse

from src.config import settings
from src.models.schemas import RetrievalResult

logger = logging.getLogger(__name__)


class VectorStore:
    """Wrapper for Qdrant vector database operations."""

    def __init__(self):
        """Initialize Qdrant client."""
        self.collection_name = settings.qdrant_collection_name

        logger.info(f"Connecting to Qdrant at {settings.qdrant_url}")
        try:
            self.client = QdrantClient(**settings.qdrant_config)
            logger.info("Connected to Qdrant successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {e}")
            raise

    def create_collection(self, embedding_dim: int, force_recreate: bool = False):
        """
        Create or recreate the collection.

        Args:
            embedding_dim: Dimension of embedding vectors.
            force_recreate: If True, delete existing collection first.
        """
        try:
            # Check if collection exists
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)

            if exists:
                if force_recreate:
                    logger.info(f"Deleting existing collection: {self.collection_name}")
                    self.client.delete_collection(self.collection_name)
                else:
                    logger.info(f"Collection already exists: {self.collection_name}")
                    return

            # Create collection with optimal settings
            logger.info(
                f"Creating collection: {self.collection_name} (dim={embedding_dim})"
            )
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=embedding_dim,
                    distance=models.Distance.COSINE,  # Cosine similarity
                ),
                # Enable indexing for faster search
                optimizers_config=models.OptimizersConfigDiff(
                    indexing_threshold=10000,
                ),
                # Use HNSW for efficient approximate search
                hnsw_config=models.HnswConfigDiff(
                    m=16,  # Number of connections per element
                    ef_construct=100,  # Size of dynamic candidate list
                ),
            )
            logger.info(f"Collection created successfully: {self.collection_name}")

        except Exception as e:
            logger.error(f"Failed to create collection: {e}")
            raise

    def upsert_chunks(
        self,
        chunks: List[Dict[str, Any]],
        batch_size: int = 100,
    ) -> int:
        """
        Insert or update chunks in the vector store.

        Args:
            chunks: List of chunks with 'id', 'embedding', 'content', and 'metadata'.
            batch_size: Number of chunks to insert per batch.

        Returns:
            Number of chunks inserted.
        """
        if not chunks:
            return 0

        total_inserted = 0

        try:
            # Process in batches
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i : i + batch_size]

                points = [
                    models.PointStruct(
                        id=self._to_qdrant_point_id(chunk["id"]),
                        vector=chunk["embedding"],
                        payload={
                            "content": chunk["content"],
                            **chunk.get("metadata", {}),
                        },
                    )
                    for chunk in batch
                ]

                self.client.upsert(
                    collection_name=self.collection_name,
                    points=points,
                )

                total_inserted += len(batch)
                logger.info(f"Inserted batch {i // batch_size + 1}: {len(batch)} chunks")

            logger.info(f"Total chunks inserted: {total_inserted}")
            return total_inserted

        except Exception as e:
            logger.error(f"Failed to upsert chunks: {e}")
            raise

    @staticmethod
    def _to_qdrant_point_id(raw_id: Any) -> str | int:
        """Convert arbitrary chunk IDs into Qdrant-compatible point IDs."""
        if isinstance(raw_id, int):
            return raw_id
        # Deterministic UUID so repeated ingestions update the same point.
        return str(uuid.uuid5(uuid.NAMESPACE_URL, str(raw_id)))

    def search(
        self,
        query_vector: List[float],
        limit: int = 5,
        score_threshold: Optional[float] = None,
        filter_conditions: Optional[Dict[str, Any]] = None,
    ) -> List[RetrievalResult]:
        """
        Search for similar vectors.

        Args:
            query_vector: Query embedding vector.
            limit: Maximum number of results.
            score_threshold: Minimum similarity score (0-1).
            filter_conditions: Optional metadata filters.

        Returns:
            List of retrieval results.
        """
        try:
            # Build filter if provided
            search_filter = None
            if filter_conditions:
                search_filter = models.Filter(
                    must=[
                        models.FieldCondition(
                            key=key,
                            match=models.MatchValue(value=value),
                        )
                        for key, value in filter_conditions.items()
                    ]
                )

            # Execute search (qdrant-client API changed from `search` to `query_points`)
            threshold = score_threshold or settings.score_threshold
            if hasattr(self.client, "query_points"):
                query_response = self.client.query_points(
                    collection_name=self.collection_name,
                    query=query_vector,
                    limit=limit,
                    score_threshold=threshold,
                    query_filter=search_filter,
                )
                results = query_response.points
            else:
                results = self.client.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector,
                    limit=limit,
                    score_threshold=threshold,
                    query_filter=search_filter,
                )

            # Convert to RetrievalResult
            retrieval_results = [
                RetrievalResult(
                    chunk_id=str(result.id),
                    content=result.payload.get("content", ""),
                    score=result.score,
                    metadata={
                        k: v for k, v in result.payload.items() if k != "content"
                    },
                )
                for result in results
            ]

            logger.info(f"Retrieved {len(retrieval_results)} chunks")
            return retrieval_results

        except Exception as e:
            logger.error(f"Search failed: {e}")
            raise

    def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the collection."""
        try:
            info = self.client.get_collection(self.collection_name)
            vectors_config = info.config.params.vectors
            vector_size = (
                vectors_config.size
                if hasattr(vectors_config, "size")
                else next(iter(vectors_config.values())).size
            )
            return {
                "name": self.collection_name,
                "vector_size": vector_size,
                "points_count": getattr(info, "points_count", None),
                "indexed_vectors_count": getattr(info, "indexed_vectors_count", None),
                "status": str(info.status),
            }
        except UnexpectedResponse:
            return {"error": "Collection does not exist"}
        except Exception as e:
            logger.error(f"Failed to get collection info: {e}")
            return {"error": str(e)}

    def delete_collection(self):
        """Delete the collection."""
        try:
            self.client.delete_collection(self.collection_name)
            logger.info(f"Collection deleted: {self.collection_name}")
        except Exception as e:
            logger.error(f"Failed to delete collection: {e}")
            raise


# Global vector store instance
_vector_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    """Get or create the global vector store instance."""
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store