# WebMind AI — 8-Day Build

## Day 1 status: ✅ Project scaffolding + auth

- Backend: Express + MongoDB + JWT auth (register/login/me) — runnable
- Frontend: Vite + React + TypeScript + Tailwind v4, login/register/home pages, auth context, protected routes — builds clean

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, OPENROUTER_API_KEY in .env
npm install
npm run dev
```
Backend runs at http://localhost:5000. Health check: `GET /api/health`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```
Frontend runs at http://localhost:5173 and proxies `/api` calls to the backend.

### 3. Try it

1. Go to http://localhost:5173/register, create an account
2. You'll be redirected to the home page (protected route) with the URL input placeholder
3. Log out / log back in to confirm JWT auth persists

## Roadmap

| Day | Focus |
|-----|-------|
| 1 ✅ | Accounts, scaffolding, auth |
| 2 | Playwright crawler |
| 3 | HTML cleaning + chunking |
| 4 | Embeddings + ChromaDB storage |
| 5 | RAG pipeline (retrieval + OpenRouter generation) |
| 6 | Conversation history + auth hardening |
| 7 | Frontend chat UI, sitemap, source citations |
| 8 | Integration testing + deployment |

## Required accounts (get these before Day 2)

- **OpenRouter** — https://openrouter.ai → API key
- **MongoDB Atlas** — https://mongodb.com/cloud/atlas → free M0 cluster → connection string
- **ChromaDB** — run locally via Docker for development: `docker run -p 8000:8000 chromadb/chroma`
