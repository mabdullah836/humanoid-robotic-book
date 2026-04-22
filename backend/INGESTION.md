# Ingestion: Local Files vs Sitemap

The RAG backend can ingest content in two ways. **For local Docusaurus docs in this repo, use local mode.** Use sitemap when your docs are already built and deployed (e.g. on GitHub Pages).

---

## Recommendation: Local Docusaurus Docs

You have **local docs** under `docs/` (MDX/Markdown). Use **local ingestion**:

- **Faster**: No HTTP, no crawling; reads files directly.
- **Offline**: Works without a running Docusaurus server.
- **Accurate**: Uses the same source files as your site (no HTML parsing).
- **Supports .mdx**: The local loader supports `.md`, `.mdx`, `.txt`, `.pdf`, `.html`, `.docx`.

### Run local ingestion (from repo root)

```bash
cd backend
uv run python -m scripts.run_ingestion --mode local --path ../docs
```

Or with custom extensions (default includes `.md`, `.mdx`, `.txt`, `.pdf`, `.html`, `.docx`):

```bash
uv run python -m scripts.run_ingestion --mode local --path ../docs --extensions .md .mdx
```

To **reset** the vector collection and re-ingest from scratch:

```bash
uv run python -m scripts.run_ingestion --mode local --path ../docs --reset-collection
```

---

## When to Use Sitemap

Use **sitemap** when:

- Your documentation is **already built and deployed** (e.g. Docusaurus `build` + GitHub Pages).
- You have a **public URL** and a `sitemap.xml` (Docusaurus can generate one via `@docusaurus/plugin-sitemap`).
- You prefer to index the **live HTML** (same as users see) rather than raw MDX.

### Run sitemap ingestion

1. Build and deploy Docusaurus (e.g. `npm run build` and deploy to GitHub Pages).
2. Get your sitemap URL (e.g. `https://your-org.github.io/your-repo/sitemap.xml`).
3. Run:

```bash
cd backend
uv run python -m scripts.run_ingestion --mode sitemap --sitemap https://your-org.github.io/your-repo/sitemap.xml --max-pages 200
```

---

## Summary

| Scenario                         | Use        | Command / note                                                |
|----------------------------------|------------|----------------------------------------------------------------|
| Local Docusaurus `docs/` in repo | **Local**  | `--mode local --path ../docs` (from `backend/`)               |
| Deployed site with sitemap       | **Sitemap**| `--mode sitemap --sitemap <url>`                              |

For your current setup (local Docusaurus docs in `docs/`), **use local ingestion** and point `--path` at the `docs` directory.
