"""
Chat API endpoint.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Header, HTTPException

from src.models.schemas import ChatRequest, ChatResponse, ErrorResponse
from src.core.rag import get_rag_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/chat",
    response_model=ChatResponse,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
async def chat(
    request: ChatRequest,
    x_user_id: Optional[str] = Header(None),
    x_user_email: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None),
):
    """
    Process a chat request using RAG.

    The frontend Next.js proxy sends user context in headers:
    - X-User-ID: User identifier from Better Auth
    - X-User-Email: User email
    - X-User-Name: User display name

    Request body:
    - query: User's question (required)
    - k: Number of chunks to retrieve (default: 5)
    - session_id: Session ID for conversation continuity (optional)

    Returns:
    - answer: Generated response
    - citations: List of source references
    - metadata: Processing information
    """
    try:
        # Log user context (useful for analytics/debugging)
        logger.info(
            f"Chat request from user_id={x_user_id}, "
            f"email={x_user_email}, "
            f"session={request.session_id}"
        )

        # Get RAG service
        rag_service = get_rag_service()

        # Process query
        response = await rag_service.process_query(
            query=request.query,
            k=request.k,
            session_id=request.session_id,
        )

        return response

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.error(f"Error processing chat request: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your request",
        )