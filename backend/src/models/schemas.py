"""
Pydantic schemas for API request/response and internal models.
Matches frontend contract: POST /api/v1/chat expects query, k?, session_id?;
returns answer, citations[], metadata?.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# Chat API (frontend contract)
# -----------------------------------------------------------------------------


class ChatRequest(BaseModel):
    """Request body for POST /api/v1/chat (from Next.js proxy)."""

    query: str = Field(..., min_length=1, description="User's question")
    k: int = Field(default=5, ge=1, le=20, description="Number of chunks to retrieve")
    session_id: Optional[str] = Field(default=None, description="Conversation session ID")


class Citation(BaseModel):
    """A single citation from RAG retrieval. Frontend expects title, url, optional excerpt & score."""

    title: str = Field(..., description="Source document/section title")
    url: str = Field(..., description="URL or path to the source")
    excerpt: Optional[str] = Field(default=None, description="Relevant text snippet")
    score: Optional[float] = Field(default=None, ge=0, le=1, description="Relevance score 0-1")


class ChatMetadata(BaseModel):
    """Optional response metadata."""

    chunks_retrieved: Optional[int] = None
    processing_time_ms: Optional[int] = None
    model: Optional[str] = None
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Response for POST /api/v1/chat. Frontend expects 'answer' and 'citations'."""

    answer: str = Field(..., description="Assistant reply text")
    citations: List[Citation] = Field(default_factory=list, description="Source citations")
    metadata: Optional[ChatMetadata] = Field(default=None)


class ErrorResponse(BaseModel):
    """Error response body for 4xx/5xx."""

    detail: Optional[str] = Field(default=None, description="Human-readable error message")
    error: Optional[str] = Field(default=None, description="Error code or type")


# -----------------------------------------------------------------------------
# Internal RAG / vector store
# -----------------------------------------------------------------------------


class RetrievalResult(BaseModel):
    """A single chunk returned from vector search. Used by RAG and vector_store."""

    chunk_id: str
    content: str
    score: float = Field(..., ge=0, le=1)
    metadata: Dict[str, Any] = Field(default_factory=dict)
