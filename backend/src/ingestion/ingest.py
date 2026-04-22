"""
Main ingestion script.
Loads documents, chunks them, generates embeddings, and stores in Qdrant.
"""

import logging
import argparse
from pathlib import Path
from typing import List, Dict, Any

from src.config import settings
from src.core.embeddings import get_embedding_service
from src.core.vector_store import get_vector_store
from src.ingestion.chunker import DocumentChunker
from src.ingestion.local_loader import LocalFileLoader
from src.ingestion.sitemap_crawler import SitemapCrawler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


class DataIngestionPipeline:
    """Complete data ingestion pipeline."""

    def __init__(self):
        """Initialize pipeline components."""
        logger.info("Initializing ingestion pipeline...")

        self.embedding_service = get_embedding_service()
        self.vector_store = get_vector_store()
        self.chunker = DocumentChunker()

        logger.info("Pipeline initialized successfully")

    def ingest_from_local(
        self,
        path: str | Path,
        extensions: List[str] | None = None,
    ):
        """
        Ingest documents from local filesystem.

        Args:
            path: Path to file or directory.
            extensions: File extensions to include (for directories).
        """
        logger.info(f"Starting local ingestion from: {path}")

        # Load documents
        loader = LocalFileLoader(base_path=Path(path).parent if Path(path).is_file() else path)

        if Path(path).is_file():
            documents = [loader.load_file(path)]
        else:
            documents = loader.load_directory(extensions=extensions)

        # Process documents
        self._process_documents(documents)

        logger.info("Local ingestion completed")

    def ingest_from_sitemap(
        self,
        sitemap_url: str,
        max_pages: int = 100,
    ):
        """
        Ingest documents from a sitemap.

        Args:
            sitemap_url: URL of the sitemap.xml file.
            max_pages: Maximum number of pages to crawl.
        """
        logger.info(f"Starting sitemap ingestion from: {sitemap_url}")

        # Crawl sitemap
        with SitemapCrawler(max_pages=max_pages) as crawler:
            documents = crawler.crawl_sitemap(sitemap_url)

        # Process documents
        self._process_documents(documents)

        logger.info("Sitemap ingestion completed")

    def _process_documents(self, documents: List[Dict[str, Any]]):
        """
        Process documents: chunk, embed, and store.

        Args:
            documents: List of documents with content and metadata.
        """
        if not documents:
            logger.warning("No documents to process")
            return

        logger.info(f"Processing {len(documents)} documents...")

        # Step 1: Chunk documents
        logger.info("Chunking documents...")
        chunks = self.chunker.chunk_multiple_documents(documents)
        logger.info(f"Created {len(chunks)} chunks")

        if not chunks:
            logger.warning("No chunks created")
            return

        # Step 2: Generate embeddings
        logger.info("Generating embeddings...")
        texts = [chunk["content"] for chunk in chunks]
        embeddings = self.embedding_service.embed_batch(texts, batch_size=32)
        logger.info(f"Generated {len(embeddings)} embeddings")

        # Step 3: Prepare chunks for Qdrant
        for chunk, embedding in zip(chunks, embeddings):
            chunk["embedding"] = embedding

        # Step 4: Store in Qdrant
        logger.info("Storing chunks in Qdrant...")
        count = self.vector_store.upsert_chunks(chunks, batch_size=100)
        logger.info(f"Successfully stored {count} chunks")

        # Step 5: Summary
        collection_info = self.vector_store.get_collection_info()
        logger.info(f"Collection info: {collection_info}")


def main():
    """Main entry point for ingestion script."""
    parser = argparse.ArgumentParser(description="Ingest documents into Qdrant")

    parser.add_argument(
        "--mode",
        choices=["local", "sitemap"],
        required=True,
        help="Ingestion mode: 'local' or 'sitemap'",
    )

    parser.add_argument(
        "--path",
        type=str,
        help="Path to local file or directory (for local mode)",
    )

    parser.add_argument(
        "--sitemap",
        type=str,
        help="URL of sitemap.xml (for sitemap mode)",
    )

    parser.add_argument(
        "--extensions",
        nargs="+",
        default=[".txt", ".md", ".mdx", ".pdf", ".html", ".docx"],
        help="File extensions to include (for local mode). Use .mdx for Docusaurus docs.",
    )

    parser.add_argument(
        "--max-pages",
        type=int,
        default=100,
        help="Maximum pages to crawl (for sitemap mode)",
    )

    parser.add_argument(
        "--reset-collection",
        action="store_true",
        help="Delete and recreate the collection before ingesting",
    )

    args = parser.parse_args()

    try:
        # Initialize pipeline
        pipeline = DataIngestionPipeline()

        # Reset collection if requested
        if args.reset_collection:
            logger.info("Resetting collection...")
            embedding_dim = pipeline.embedding_service.get_dimension()
            pipeline.vector_store.create_collection(
                embedding_dim=embedding_dim,
                force_recreate=True,
            )

        # Run appropriate ingestion
        if args.mode == "local":
            if not args.path:
                parser.error("--path is required for local mode")
            pipeline.ingest_from_local(
                path=args.path,
                extensions=args.extensions,
            )

        elif args.mode == "sitemap":
            if not args.sitemap:
                parser.error("--sitemap is required for sitemap mode")
            pipeline.ingest_from_sitemap(
                sitemap_url=args.sitemap,
                max_pages=args.max_pages,
            )

        logger.info("✅ Ingestion completed successfully!")

    except Exception as e:
        logger.error(f"❌ Ingestion failed: {e}", exc_info=True)
        return 1

    return 0


if __name__ == "__main__":
    exit(main())