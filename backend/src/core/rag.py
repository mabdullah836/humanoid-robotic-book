"""
RAG (Retrieval-Augmented Generation) orchestration.
Combines embedding, retrieval, and generation into a complete pipeline.
"""

import logging
import time
from typing import List, Dict, Any, Optional

from src.config import settings
from src.core.embeddings import get_embedding_service
from src.core.vector_store import get_vector_store
from src.core.llm import get_llm_service
from src.services.session_manager import get_session_manager
from src.models.schemas import ChatResponse, Citation, ChatMetadata, RetrievalResult

logger = logging.getLogger(__name__)


class RAGService:
    """Main RAG pipeline orchestrator."""

    def __init__(self):
        """Initialize RAG service with all dependencies."""
        self.embedding_service = get_embedding_service()
        self.vector_store = get_vector_store()
        self.llm_service = get_llm_service()
        self.session_manager = get_session_manager()

    async def process_query(
        self,
        query: str,
        k: int = 5,
        session_id: Optional[str] = None,
    ) -> ChatResponse:
        """
        Process a user query through the complete RAG pipeline.

        Args:
            query: User's question.
            k: Number of chunks to retrieve.
            session_id: Optional session ID for conversation continuity.

        Returns:
            ChatResponse with answer, citations, and metadata.
        """
        start_time = time.time()

        try:
            # Step 1: Generate query embedding
            logger.info(f"Processing query: {query[:100]}...")
            query_embedding = self.embedding_service.embed_text(query)

            # Step 2: Retrieve relevant chunks
            retrieval_results = self.vector_store.search(
                query_vector=query_embedding,
                limit=k,
                score_threshold=settings.score_threshold,
            )

            if not retrieval_results:
                logger.warning("No relevant chunks found")
                return self._generate_no_context_response(
                    query, session_id, start_time
                )

            # Step 3: Extract context and build citations
            context_chunks = [result.content for result in retrieval_results]
            citations = self._build_citations(retrieval_results)

            # Step 4: Get conversation history if session exists
            conversation_history = None
            if session_id:
                conversation_history = self.session_manager.get_history(
                    session_id,
                    max_messages=settings.max_conversation_history - 2,
                )

            # Step 5: Generate answer using LLM
            answer = self.llm_service.generate_response(
                query=query,
                context_chunks=context_chunks,
                conversation_history=conversation_history,
            )

            # Step 6: Update session history
            if session_id:
                self.session_manager.add_message(session_id, "user", query)
                self.session_manager.add_message(session_id, "assistant", answer)

            # Step 7: Build response
            processing_time = int((time.time() - start_time) * 1000)

            response = ChatResponse(
                answer=answer,
                citations=citations,
                metadata=ChatMetadata(
                    chunks_retrieved=len(retrieval_results),
                    processing_time_ms=processing_time,
                    model=settings.gemini_model,
                    session_id=session_id,
                ),
            )

            logger.info(
                f"Query processed successfully in {processing_time}ms "
                f"({len(retrieval_results)} chunks, {len(answer)} chars)"
            )

            return response

        except Exception as e:
            logger.error(f"Error processing query: {e}", exc_info=True)
            raise

    def _build_citations(self, results: List[RetrievalResult]) -> List[Citation]:
        """
        Build citation objects from retrieval results.

        Args:
            results: List of retrieval results.

        Returns:
            List of Citation objects.
        """
        citations = []

        for result in results:
            # Extract title and URL from metadata
            title = result.metadata.get("title", "Untitled Document")
            url = result.metadata.get("url", result.metadata.get("source", "#"))

            # Create excerpt (first 200 characters of content)
            excerpt = (
                result.content[:200] + "..."
                if len(result.content) > 200
                else result.content
            )

            citations.append(
                Citation(
                    title=title,
                    url=url,
                    excerpt=excerpt,
                    score=result.score,
                )
            )

        return citations

    def _generate_no_context_response(
        self,
        query: str,
        session_id: Optional[str],
        start_time: float,
    ) -> ChatResponse:
        """
        Generate a response when no relevant context is found.

        Args:
            query: User's question.
            session_id: Session ID.
            start_time: Query start time.

        Returns:
            ChatResponse with no-context message.
        """
        answer = (
            "I don't have enough information to answer that question based on "
            "the available sources. Could you rephrase your question or ask "
            "something else?"
        )

        processing_time = int((time.time() - start_time) * 1000)

        return ChatResponse(
            answer=answer,
            citations=[],
            metadata=ChatMetadata(
                chunks_retrieved=0,
                processing_time_ms=processing_time,
                model=settings.gemini_model,
                session_id=session_id,
            ),
        )


# Global RAG service instance
_rag_service: RAGService | None = None


def get_rag_service() -> RAGService:
    """Get or create the global RAG service instance."""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service