"""
LLM service using Gemini via OpenAI-compatible API.
"""

import logging
from typing import List, Dict, Any

from openai import OpenAI

from src.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """Service for generating text using Gemini."""

    def __init__(self):
        """Initialize Gemini client using OpenAI SDK."""
        logger.info(f"Initializing Gemini client with model: {settings.gemini_model}")
        if not settings.gemini_api_key:
            raise ValueError(
                "GEMINI_API_KEY is required for the LLM service. "
                "Set it in .env to use the chat API."
            )
        self.client = OpenAI(
            api_key=settings.gemini_api_key,
            base_url=settings.gemini_base_url,
        )
        self.model = settings.gemini_model

    def generate_response(
        self,
        query: str,
        context_chunks: List[str],
        conversation_history: List[Dict[str, str]] | None = None,
    ) -> str:
        """
        Generate a response using RAG context.

        Args:
            query: User's question.
            context_chunks: Retrieved relevant text chunks.
            conversation_history: Previous messages in the conversation.

        Returns:
            Generated answer text.
        """
        try:
            # Build the system prompt with context
            system_prompt = self._build_system_prompt(context_chunks)

            # Build messages
            messages = [{"role": "system", "content": system_prompt}]

            # Add conversation history if available
            if conversation_history:
                messages.extend(conversation_history)

            # Add current query
            messages.append({"role": "user", "content": query})

            # Generate response
            logger.info(f"Generating response with {len(context_chunks)} context chunks")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=settings.llm_temperature,
                max_tokens=settings.llm_max_tokens,
                top_p=settings.llm_top_p,
            )

            answer = response.choices[0].message.content
            logger.info(f"Generated response: {len(answer)} characters")

            return answer

        except Exception as e:
            logger.error(f"Failed to generate response: {e}")
            raise

    def _build_system_prompt(self, context_chunks: List[str]) -> str:
        """
        Build the system prompt with retrieved context.

        Args:
            context_chunks: List of relevant text chunks.

        Returns:
            Formatted system prompt.
        """
        context_text = "\n\n".join(
            [f"[Source {i+1}]\n{chunk}" for i, chunk in enumerate(context_chunks)]
        )

        system_prompt = f"""You are a helpful AI assistant answering questions based on the provided context.

CONTEXT:
{context_text}

INSTRUCTIONS:
1. Answer the user's question based ONLY on the context provided above.
2. If the answer is not in the context, say "I don't have enough information to answer that question based on the available sources."
3. Be concise and accurate.
4. When referencing information, you can mention "According to the sources..." or "Based on the provided information..."
5. Do not make up information or use knowledge outside the provided context.
6. If you quote directly from the context, use quotation marks.

Remember: Only use information from the context provided above."""

        return system_prompt

    def generate_streaming_response(
        self,
        query: str,
        context_chunks: List[str],
        conversation_history: List[Dict[str, str]] | None = None,
    ):
        """
        Generate a streaming response (for future use).

        Args:
            query: User's question.
            context_chunks: Retrieved relevant text chunks.
            conversation_history: Previous messages.

        Yields:
            Chunks of the generated response.
        """
        try:
            system_prompt = self._build_system_prompt(context_chunks)

            messages = [{"role": "system", "content": system_prompt}]
            if conversation_history:
                messages.extend(conversation_history)
            messages.append({"role": "user", "content": query})

            stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=settings.llm_temperature,
                max_tokens=settings.llm_max_tokens,
                top_p=settings.llm_top_p,
                stream=True,
            )

            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            logger.error(f"Streaming generation failed: {e}")
            raise


# Global LLM service instance
_llm_service: LLMService | None = None


def get_llm_service() -> LLMService:
    """Get or create the global LLM service instance."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service