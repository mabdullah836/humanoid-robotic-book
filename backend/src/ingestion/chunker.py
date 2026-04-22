"""
Text chunking strategies for document processing.
"""

import logging
import re
from typing import List, Dict, Any
import hashlib

from src.config import settings

logger = logging.getLogger(__name__)


class DocumentChunker:
    """Handles text chunking with various strategies."""

    def __init__(
        self,
        chunk_size: int | None = None,
        chunk_overlap: int | None = None,
    ):
        """
        Initialize chunker.

        Args:
            chunk_size: Size of each chunk in characters.
            chunk_overlap: Overlap between consecutive chunks.
        """
        self.chunk_size = chunk_size or settings.chunk_size
        self.chunk_overlap = chunk_overlap or settings.chunk_overlap
        
        # Define separators for recursive splitting
        self.separators = [
            "\n\n",  # Paragraph breaks
            "\n",    # Line breaks
            ". ",    # Sentence breaks
            "! ",    # Exclamation breaks
            "? ",    # Question breaks
            "; ",    # Semicolon breaks
            ", ",    # Comma breaks
            " ",     # Word breaks
            "",      # Character breaks (last resort)
        ]

    def chunk_document(
        self,
        content: str,
        metadata: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """
        Chunk a document into smaller pieces.

        Args:
            content: Full document text.
            metadata: Document metadata (title, url, etc.).

        Returns:
            List of chunks with metadata.
        """
        if not content or not content.strip():
            logger.warning("Empty content provided for chunking")
            return []

        try:
            # Split text into chunks using recursive splitting
            text_chunks = self._split_text(content)

            # Create chunk objects with metadata
            chunks = []
            for i, chunk_text in enumerate(text_chunks):
                if not chunk_text.strip():
                    continue

                # Generate unique ID for chunk
                chunk_id = self._generate_chunk_id(
                    content=chunk_text,
                    doc_id=metadata.get("doc_id", "unknown"),
                    index=i,
                )

                chunk = {
                    "id": chunk_id,
                    "content": chunk_text.strip(),
                    "metadata": {
                        **metadata,
                        "chunk_index": i,
                        "total_chunks": len(text_chunks),
                    },
                }

                chunks.append(chunk)

            logger.info(
                f"Chunked document into {len(chunks)} chunks "
                f"(size={self.chunk_size}, overlap={self.chunk_overlap})"
            )

            return chunks

        except Exception as e:
            logger.error(f"Error chunking document: {e}")
            raise

    def _split_text(self, text: str) -> List[str]:
        """
        Recursively split text into chunks.

        Args:
            text: Text to split.

        Returns:
            List of text chunks.
        """
        # Base case: if text is already small enough
        if len(text) <= self.chunk_size:
            return [text] if text.strip() else []

        # Try each separator
        for separator in self.separators:
            if separator == "":
                # Last resort: split by character
                return self._split_by_character(text)

            if separator in text:
                # Split by this separator
                splits = text.split(separator)
                
                # Merge splits into chunks
                chunks = []
                current_chunk = []
                current_length = 0

                for split in splits:
                    split_length = len(split) + len(separator)

                    # If adding this split would exceed chunk size
                    if current_length + split_length > self.chunk_size and current_chunk:
                        # Save current chunk
                        chunk_text = separator.join(current_chunk)
                        if chunk_text.strip():
                            chunks.append(chunk_text)
                        
                        # Start new chunk with overlap
                        overlap_start = max(0, len(current_chunk) - 1)
                        current_chunk = current_chunk[overlap_start:] if self.chunk_overlap > 0 else []
                        current_length = sum(len(s) + len(separator) for s in current_chunk)

                    current_chunk.append(split)
                    current_length += split_length

                # Add remaining chunk
                if current_chunk:
                    chunk_text = separator.join(current_chunk)
                    if chunk_text.strip():
                        chunks.append(chunk_text)

                return chunks

        # Fallback to character splitting
        return self._split_by_character(text)

    def _split_by_character(self, text: str) -> List[str]:
        """
        Split text by character count with overlap.

        Args:
            text: Text to split.

        Returns:
            List of text chunks.
        """
        chunks = []
        start = 0

        while start < len(text):
            # Get chunk
            end = min(start + self.chunk_size, len(text))
            chunk = text[start:end]
            
            if chunk.strip():
                chunks.append(chunk)
            
            # Move to next chunk with overlap
            start = end - self.chunk_overlap if self.chunk_overlap > 0 else end

        return chunks

    def _generate_chunk_id(
        self,
        content: str,
        doc_id: str,
        index: int,
    ) -> str:
        """
        Generate a unique ID for a chunk.

        Uses hash of content + document ID + index for uniqueness.

        Args:
            content: Chunk content.
            doc_id: Parent document ID.
            index: Chunk index.

        Returns:
            Unique chunk identifier.
        """
        # Create a hash of the content for uniqueness
        content_hash = hashlib.md5(content.encode()).hexdigest()[:8]

        # Combine with doc_id and index
        chunk_id = f"{doc_id}_chunk_{index}_{content_hash}"

        return chunk_id

    def chunk_multiple_documents(
        self,
        documents: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Chunk multiple documents efficiently.

        Args:
            documents: List of documents with 'content' and 'metadata' keys.

        Returns:
            Flattened list of all chunks.
        """
        all_chunks = []

        for doc in documents:
            chunks = self.chunk_document(
                content=doc["content"],
                metadata=doc["metadata"],
            )
            all_chunks.extend(chunks)

        logger.info(
            f"Chunked {len(documents)} documents into {len(all_chunks)} total chunks"
        )

        return all_chunks