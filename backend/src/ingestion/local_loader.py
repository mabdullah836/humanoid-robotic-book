"""
Local file loader for ingesting documents from the filesystem.
Supports: .txt, .md, .mdx (Docusaurus), .pdf, .html, .docx
"""

import logging
from pathlib import Path
from typing import List, Dict, Any
import hashlib

from pypdf import PdfReader
from bs4 import BeautifulSoup
import docx

logger = logging.getLogger(__name__)


class LocalFileLoader:
    """Load documents from local files."""

    def __init__(self, base_path: str | Path):
        """
        Initialize loader.

        Args:
            base_path: Base directory containing files.
        """
        self.base_path = Path(base_path)
        if not self.base_path.exists():
            raise ValueError(f"Base path does not exist: {base_path}")

        logger.info(f"Initialized LocalFileLoader with base path: {self.base_path}")

    def load_file(self, file_path: str | Path) -> Dict[str, Any]:
        """
        Load a single file.

        Args:
            file_path: Path to the file (relative to base_path or absolute).

        Returns:
            Document dict with content and metadata.
        """
        # Resolve path
        if not Path(file_path).is_absolute():
            file_path = self.base_path / file_path

        file_path = Path(file_path)

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        logger.info(f"Loading file: {file_path}")

        # Determine file type and use appropriate loader
        suffix = file_path.suffix.lower()

        try:
            if suffix in [".txt", ".md", ".mdx"]:
                content = self._load_text_file(file_path)

            elif suffix == ".pdf":
                content = self._load_pdf_file(file_path)

            elif suffix in [".html", ".htm"]:
                content = self._load_html_file(file_path)

            elif suffix == ".docx":
                content = self._load_docx_file(file_path)

            else:
                raise ValueError(f"Unsupported file type: {suffix}")

            # Generate document ID from file path
            doc_id = self._generate_doc_id(file_path)

            # Extract metadata
            metadata = {
                "doc_id": doc_id,
                "title": file_path.stem,
                "source": str(file_path),
                "url": str(file_path),
                "file_type": suffix,
            }

            return {
                "content": content,
                "metadata": metadata,
            }

        except Exception as e:
            logger.error(f"Error loading file {file_path}: {e}")
            raise

    def _load_text_file(self, file_path: Path) -> str:
        """Load a text or markdown file."""
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    def _load_pdf_file(self, file_path: Path) -> str:
        """Load a PDF file."""
        reader = PdfReader(file_path)
        
        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        
        return "\n\n".join(text_parts)

    def _load_html_file(self, file_path: Path) -> str:
        """Load an HTML file."""
        with open(file_path, "r", encoding="utf-8") as f:
            soup = BeautifulSoup(f.read(), "html.parser")
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get text
            text = soup.get_text()
            
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = "\n".join(chunk for chunk in chunks if chunk)
            
            return text

    def _load_docx_file(self, file_path: Path) -> str:
        """Load a Word document."""
        doc = docx.Document(file_path)
        
        paragraphs = []
        for para in doc.paragraphs:
            if para.text.strip():
                paragraphs.append(para.text)
        
        return "\n\n".join(paragraphs)

    def load_directory(
        self,
        pattern: str = "**/*",
        extensions: List[str] | None = None,
    ) -> List[Dict[str, Any]]:
        """
        Load all files in a directory matching a pattern.

        Args:
            pattern: Glob pattern for file matching.
            extensions: List of file extensions to include (e.g., ['.txt', '.pdf']).

        Returns:
            List of document dicts.
        """
        if extensions is None:
            extensions = [".txt", ".md", ".mdx", ".pdf", ".html", ".htm", ".docx"]

        # Find matching files
        files = [
            f
            for f in self.base_path.glob(pattern)
            if f.is_file() and f.suffix.lower() in extensions
        ]

        logger.info(f"Found {len(files)} files matching pattern '{pattern}'")

        # Load all files
        documents = []
        for file_path in files:
            try:
                doc = self.load_file(file_path)
                documents.append(doc)
            except Exception as e:
                logger.error(f"Failed to load {file_path}: {e}")
                continue

        logger.info(f"Successfully loaded {len(documents)} documents")
        return documents

    def _generate_doc_id(self, file_path: Path) -> str:
        """
        Generate a unique document ID.

        Args:
            file_path: Path to the file.

        Returns:
            Unique document identifier.
        """
        # Use relative path from base_path if possible
        try:
            rel_path = file_path.relative_to(self.base_path)
        except ValueError:
            rel_path = file_path

        # Generate hash from path
        path_str = str(rel_path)
        doc_hash = hashlib.md5(path_str.encode()).hexdigest()[:8]

        # Create ID
        doc_id = f"doc_{doc_hash}"

        return doc_id