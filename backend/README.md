# RAG Backend with Qdrant & Gemini

A production-ready Retrieval-Augmented Generation (RAG) backend built with FastAPI, Qdrant, and Gemini.

## 🌟 Features

- **Vector Search**: Qdrant for efficient similarity search
- **Free Embeddings**: Sentence Transformers (no API costs)
- **Powerful LLM**: Gemini via OpenAI-compatible API
- **Flexible Ingestion**: Local files or sitemap crawling
- **Conversation Memory**: Session-based context retention
- **Production Ready**: Type safety, logging, error handling
- **Fast Package Management**: Uses `uv` for lightning-fast installs

## 📋 Prerequisites

- Python 3.11+
- Docker (for Qdrant)
- Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## 🚀 Quick Start

### 1. Install uv

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. Clone and Setup

```bash
# Clone repository
cd backend

# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv sync

# Copy environment file and configure
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 3. Start Qdrant

```bash
docker run -d -p 6333:6333 -p 6334:6334 \
    -v $(pwd)/qdrant_storage:/qdrant/storage:z \
    --name qdrant \
    qdrant/qdrant
```

### 4. Initialize Vector Database

```bash
uv run python scripts/setup_qdrant.py
```

### 5. Ingest Data

#### Option A: Local Files (Recommended for Textbooks)

```bash
# Single file
uv run python -m src.ingestion.ingest \
    --mode local \
    --path /path/to/textbook.pdf \
    --reset-collection

# Directory
uv run python -m src.ingestion.ingest \
    --mode local \
    --path /path/to/documents/ \
    --extensions .pdf .txt .md .html .docx
```

#### Option B: Sitemap Crawling (For Documentation Sites)

```bash
uv run python -m src.ingestion.ingest \
    --mode sitemap \
    --sitemap https://docs.example.com/sitemap.xml \
    --max-pages 100
```

### 6. Start the Server

```bash
# Development (with auto-reload)
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Production
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at `http://localhost:8000`

## 📚 API Documentation

Once the server is running:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main Endpoint

**POST /api/v1/chat**

Request:
```json
{
  "query": "What is photosynthesis?",
  "k": 5,
  "session_id": "optional-uuid"
}
```

Response:
```json
{
  "answer": "Photosynthesis is the process by which plants...",
  "citations": [
    {
      "title": "Chapter 3: Plant Biology",
      "url": "https://textbook.example.com/chapter3",
      "excerpt": "Photosynthesis occurs in chloroplasts...",
      "score": 0.89
    }
  ],
  "metadata": {
    "chunks_retrieved": 5,
    "processing_time_ms": 342,
    "model": "gemini-1.5-pro-latest",
    "session_id": "uuid-here"
  }
}
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── main.py                 # FastAPI app
│   ├── config.py               # Configuration
│   ├── api/routes/             # API endpoints
│   ├── core/                   # Core services
│   │   ├── embeddings.py       # Embedding generation
│   │   ├── vector_store.py     # Qdrant operations
│   │   ├── llm.py             # Gemini integration
│   │   └── rag.py             # RAG pipeline
│   ├── services/               # Business logic
│   │   └── session_manager.py  # Conversation context
│   ├── models/                 # Data models
│   │   └── schemas.py          # Pydantic models
│   └── ingestion/              # Data ingestion
│       ├── chunker.py          # Text chunking
│       ├── local_loader.py     # Local file loading
│       ├── sitemap_crawler.py  # Web crawling
│       └── ingest.py          # Main ingestion script
├── scripts/                    # Utility scripts
├── tests/                      # Tests
├── pyproject.toml             # Project config
└── .env                       # Environment variables
```

## ⚙️ Configuration

Key environment variables (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `EMBEDDING_MODEL` | HuggingFace model name | `sentence-transformers/all-MiniLM-L6-v2` |
| `CHUNK_SIZE` | Characters per chunk | `1000` |
| `CHUNK_OVERLAP` | Overlap between chunks | `200` |
| `MAX_CHUNKS_TO_RETRIEVE` | Top-k retrieval | `5` |
| `LLM_TEMPERATURE` | LLM creativity (0-2) | `0.7` |

### Embedding Model Options

| Model | Dimension | Speed | Quality | Use Case |
|-------|-----------|-------|---------|----------|
| `all-MiniLM-L6-v2` | 384 | Fast ⚡ | Good | General purpose |
| `BAAI/bge-small-en-v1.5` | 384 | Medium | Better | Higher accuracy |
| `all-mpnet-base-v2` | 768 | Slow | Best | Maximum quality |

Change `EMBEDDING_MODEL` in `.env` and update `EMBEDDING_DIMENSION` accordingly.

## 🔄 Data Ingestion: Local vs Sitemap

### Local Files: Best For
- ✅ Static textbooks and PDFs
- ✅ Proprietary content
- ✅ Offline availability
- ✅ Content that requires preprocessing

### Sitemap Crawling: Best For
- ✅ Public documentation sites
- ✅ Frequently updated content
- ✅ Large-scale web content
- ✅ Automatic content discovery

### Recommendation for Educational Use
**Use Local Files** for your primary textbook content:
1. Better control over content quality
2. Consistent availability
3. Ability to preprocess PDFs (remove headers/footers)
4. No network dependencies

## 🧪 Testing

```bash
# Run tests
uv run pytest

# With coverage
uv run pytest --cov=src tests/
```

## 🐳 Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy project
COPY pyproject.toml .
COPY src/ ./src/

# Install dependencies
RUN uv sync --frozen

# Run app
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t rag-backend .
docker run -p 8000:8000 --env-file .env rag-backend
```

## 📊 Monitoring

Check system health:
```bash
curl http://localhost:8000/health
```

Response includes status of:
- Qdrant connection
- Embedding service
- LLM service

## 🔧 Troubleshooting

### Qdrant Connection Failed
```bash
# Check if Qdrant is running
docker ps | grep qdrant

# View Qdrant logs
docker logs qdrant
```

### Embedding Model Download Issues
```bash
# Models download to ~/.cache/huggingface/
# Clear cache if corrupted
rm -rf ~/.cache/huggingface/hub
```

### Out of Memory During Ingestion
```bash
# Reduce batch size in chunker.py and vector_store.py
# Or process files in smaller batches
```

## 🚀 Performance Tips

1. **Batch Processing**: Ingest documents in batches of 100-1000
2. **GPU Acceleration**: Use CUDA for faster embeddings (if available)
3. **Caching**: Consider Redis for session storage in production
4. **Connection Pooling**: Configure Qdrant connection pool
5. **Async Operations**: Use async/await for I/O operations

## 📝 Development

```bash
# Format code
uv run black src/

# Lint
uv run ruff check src/

# Type checking
uv run mypy src/
```

## 🤝 Integration with Frontend

The backend is designed to work with the Next.js frontend. The frontend proxy will:

1. Authenticate users (Better Auth)
2. Forward requests to `POST /api/v1/chat`
3. Include user context in headers:
   - `X-User-ID`
   - `X-User-Email`
   - `X-User-Name`

Set `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000` in your frontend `.env`

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the [troubleshooting section](#-troubleshooting)
2. Review API documentation at `/docs`
3. Check Qdrant and Gemini documentation
4. Open an issue on GitHub

---

**Built with ❤️ using FastAPI, Qdrant, and Gemini**