"""
Sitemap crawler for ingesting documents from websites.
"""

import logging
from typing import List, Dict, Any
from urllib.parse import urlparse
import hashlib
import time

import httpx
from bs4 import BeautifulSoup
import trafilatura

logger = logging.getLogger(__name__)


class SitemapCrawler:
    """Crawl and extract content from websites using sitemaps."""

    def __init__(
        self,
        max_pages: int = 100,
        delay_seconds: float = 1.0,
    ):
        """
        Initialize crawler.

        Args:
            max_pages: Maximum number of pages to crawl.
            delay_seconds: Delay between requests to be respectful.
        """
        self.max_pages = max_pages
        self.delay_seconds = delay_seconds
        self.client = httpx.Client(timeout=30.0)

        logger.info(
            f"Initialized SitemapCrawler (max_pages={max_pages}, delay={delay_seconds}s)"
        )

    def crawl_sitemap(self, sitemap_url: str) -> List[Dict[str, Any]]:
        """
        Crawl a sitemap and extract content from all pages.

        Args:
            sitemap_url: URL of the sitemap.xml file.

        Returns:
            List of document dicts with content and metadata.
        """
        logger.info(f"Fetching sitemap: {sitemap_url}")

        # Fetch sitemap
        try:
            response = self.client.get(sitemap_url)
            response.raise_for_status()
        except Exception as e:
            logger.error(f"Failed to fetch sitemap: {e}")
            raise

        # Parse sitemap
        urls = self._parse_sitemap(response.text)
        logger.info(f"Found {len(urls)} URLs in sitemap")

        # Limit number of URLs
        if len(urls) > self.max_pages:
            logger.warning(
                f"Limiting to {self.max_pages} pages (found {len(urls)})"
            )
            urls = urls[: self.max_pages]

        # Crawl each URL
        documents = []
        for i, url in enumerate(urls):
            try:
                logger.info(f"Crawling ({i+1}/{len(urls)}): {url}")
                doc = self._crawl_page(url)
                if doc:
                    documents.append(doc)

                # Be respectful - delay between requests
                if i < len(urls) - 1:
                    time.sleep(self.delay_seconds)

            except Exception as e:
                logger.error(f"Failed to crawl {url}: {e}")
                continue

        logger.info(f"Successfully crawled {len(documents)} pages")
        return documents

    def _parse_sitemap(self, sitemap_xml: str) -> List[str]:
        """
        Parse sitemap XML and extract URLs.

        Args:
            sitemap_xml: Sitemap XML content.

        Returns:
            List of URLs.
        """
        soup = BeautifulSoup(sitemap_xml, "xml")

        # Handle regular sitemap
        urls = [loc.text for loc in soup.find_all("loc")]

        # Handle sitemap index (nested sitemaps)
        if not urls:
            sitemap_urls = [
                s.find("loc").text
                for s in soup.find_all("sitemap")
                if s.find("loc") is not None
            ]
            urls = []
            for sitemap_url in sitemap_urls:
                try:
                    response = self.client.get(sitemap_url)
                    nested_soup = BeautifulSoup(response.text, "xml")
                    urls.extend([loc.text for loc in nested_soup.find_all("loc")])
                except Exception as e:
                    logger.error(f"Failed to parse nested sitemap {sitemap_url}: {e}")

        return urls

    def _crawl_page(self, url: str) -> Dict[str, Any] | None:
        """
        Crawl a single page and extract content.

        Args:
            url: Page URL.

        Returns:
            Document dict or None if extraction failed.
        """
        try:
            # Fetch page
            response = self.client.get(url)
            response.raise_for_status()

            # Extract main content using Trafilatura
            # This removes navigation, ads, etc. and keeps main content
            content = trafilatura.extract(
                response.text,
                include_comments=False,
                include_tables=True,
                no_fallback=False,
            )

            if not content or not content.strip():
                logger.warning(f"No content extracted from {url}")
                return None

            # Extract title
            soup = BeautifulSoup(response.text, "html.parser")
            title = soup.find("title")
            title_text = title.text.strip() if title else urlparse(url).path

            # Generate document ID
            doc_id = self._generate_doc_id(url)

            # Build metadata
            metadata = {
                "doc_id": doc_id,
                "title": title_text,
                "source": url,
                "url": url,
                "file_type": "html",
            }

            return {
                "content": content,
                "metadata": metadata,
            }

        except Exception as e:
            logger.error(f"Error crawling {url}: {e}")
            return None

    def _generate_doc_id(self, url: str) -> str:
        """
        Generate a unique document ID from URL.

        Args:
            url: Document URL.

        Returns:
            Unique document identifier.
        """
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
        return f"doc_{url_hash}"

    def close(self):
        """Close the HTTP client."""
        self.client.close()

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()