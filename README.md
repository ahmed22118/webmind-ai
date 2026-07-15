# 📘 WebMind AI

**Understand Any Website. Instantly.**

An AI-powered RAG (Retrieval-Augmented Generation) platform that crawls any website, builds a searchable knowledge base from its content, and lets users ask questions in natural language — getting grounded, source-cited answers instead of digging through pages manually.

🔗 **Live demo:** https://webmind-ai-pi.vercel.app
🔗 **Backend API:** https://webmind-ai-backend.onrender.com/api/health

---

## ✨ Features

- **Website crawling** — Playwright-powered crawler with SSRF protection, JS-rendering support (networkidle + scroll-triggered lazy-load handling), and smart pagination prioritization
- **Content pipeline** — HTML cleaning, link-preserving Markdown conversion, and adaptive chunking (per-product chunking for e-commerce/catalog pages, word-based chunking for regular content)
- **Semantic search** — local embedding model (`all-MiniLM-L6-v2` via Transformers.js) + ChromaDB vector store, zero external embedding API needed
- **RAG-powered chat** — retrieval-grounded answers via OpenRouter LLMs, with prompt hardening against indirect prompt injection from untrusted crawled content
- **Conversation history** — persisted per user, per website
- **Auth** — JWT-based, strong password policy, Gmail-alias deduplication, per-IP + per-account rate limiting with exponential backoff
- **Security-first design** — SSRF-guarded crawler, strict Zod schema validation on all inputs, restricted CORS, environment-aware error responses, dependency audit clean

---

## 🛠️ Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS v4, Framer Motion, React Router, TanStack Query, react-markdown

**Backend:** Node.js, Express, MongoDB (Mongoose), ChromaDB, Playwright, Cheerio, Transformers.js (local embeddings), JWT, Zod

**AI:** OpenRouter (LLM inference), local `all-MiniLM-L6-v2` embeddings

**Deployment:** Vercel (frontend), Render (backend + ChromaDB, Docker-based for Playwright support), MongoDB Atlas

---

## 🏗️ Architecture
Website URL → Crawler (Playwright) → HTML Cleaning (Cheerio)
→ Chunking (per-product / word-based) → Embedding (local model)
→ ChromaDB storage
│
User Question → Question Embedding → Similarity Search
→ Top-K Chunks → Prompt Construction → OpenRouter LLM
→ Grounded Answer + Source Citations

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+ (for running ChromaDB locally)
- MongoDB Atlas account (free tier works)
- OpenRouter API key (free models available)

### 1. ChromaDB
```bash
pip install chromadb
chroma run --path ./chroma_data --port 8000
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Fill in your values (see Environment Variables below)
npm install
npx playwright install chromium
npm run dev
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Visit `http://localhost:5173`, register an account, and paste a URL to analyze.

---

## 🔑 Environment Variables

See `backend/.env.example` and `frontend/.env.example` for the full reference list.

---

## ⚠️ Known Limitations

Built honestly, with real tradeoffs documented rather than hidden:

- **Heavily bot-protected sites** (e.g., large marketplaces with anti-scraping measures) may not crawl fully — this is a known, industry-wide limitation of lightweight crawlers, not unique to this project
- **Very large catalogs**: RAG retrieval is top-K based, so an "list everything matching X" query on a catalog with hundreds of items may not return every single match in one response
- **No email verification or password reset flow** — out of scope for this build
- **Render/Vercel free tier**: ChromaDB's storage is ephemeral on Render's free tier and resets on redeploy/restart
- **Synchronous crawling**: requests wait for the crawl to complete rather than using a background job queue — fine at demo scale, would need revisiting for high concurrent usage

---

## 🔒 Security Highlights

- SSRF guard on the crawler (blocks internal/private network targets, re-validated on every redirect and followed link)
- Prompt-injection hardening (crawled content is explicitly treated as untrusted reference data, never as instructions)
- Strict Zod schema validation on all API inputs
- Per-IP and per-account rate limiting with exponential backoff on auth routes
- No hardcoded secrets — verified via dependency scans and build-output checks
- Passwords hashed with bcrypt, JWT-based auth, Gmail alias-aware duplicate account prevention

---

## 📄 License

MIT
