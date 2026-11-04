# AI Lead Finder — Enterprise B2B Discovery & Intelligence Platform

**AI Lead Finder** is a production-ready, full-stack B2B lead generation platform that discovers registered businesses across multiple countries and industries, crawls official corporate websites, extracts verified public contact details, cleans and deduplicates records, scores lead quality (0–100), and exports clean data to CSV or Excel.

---

## 1. Core Platform Capabilities

- **Interactive AI Search Assistant**:
  - Conversational chat input (e.g. *"I need 500 freight forwarding companies in the United Kingdom, mainly London and Manchester, with business emails, websites and phone numbers"*).
  - Step-by-step 11-question structured questionnaire wizard.
  - Multi-query AI search strategy generation with user approval before execution.
- **Multi-Source Discovery Engine**:
  - Independent provider adapters for **Tavily**, **SerpAPI**, **Google Places API**, and **Bing Search API**.
  - Rate limiting, usage tracking, latency benchmarking, and live connection test buttons.
- **Robots.txt-Compliant Website Data Extraction**:
  - Parses official websites using Cheerio & Playwright.
  - Extracts corporate descriptions, contact pages, business emails, telephone numbers, postal addresses, and LinkedIn company links.
- **Deduplication & Data Normalization**:
  - Normalizes domains, company names (stripping corporate suffixes), phone numbers, and addresses.
  - Multi-factor duplicate matching (domain, phone, company name + city/country, address).
  - Merges non-empty fields into canonical records while preserving field-level source provenance.
- **Lead Quality Scoring Engine (0 to 100)**:
  - Industry relevance (30 pts)
  - Location match (20 pts)
  - Website availability (10 pts)
  - Business email availability & verification (15 pts)
  - Phone availability (10 pts)
  - Completeness of profile (10 pts)
  - Source reliability (5 pts)
  - Full itemized score breakdown for each lead.
- **Real-Time Job Monitoring via Server-Sent Events (SSE)**:
  - Live progress updates, active extraction stage, real-time incoming leads counter.
  - Pause, resume, cancel, and retry job controls.
- **Exporting & Data Management**:
  - Export to **CSV** and **XLSX (Excel)**.
  - Export filtered search results or selected leads.
  - Star/save priority prospects, lead status pipeline management, and prospect notes thread.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, Zustand, Lucide Icons, React Router v7.
- **Backend**: Node.js v22, Express.js, TypeScript, Zod, Prisma ORM.
- **Database**: PostgreSQL (with Prisma ORM) + Embedded local data persistence fallback for instant zero-dependency development.
- **Background Processing**: Redis + BullMQ (with automatic in-process asynchronous queue runner fallback when Redis is offline).
- **AI Integration**: OpenAI API (configurable model, structured JSON outputs, token consumption tracking).
- **Deployment**: Docker, Docker Compose, Nginx Reverse Proxy.

---

## 3. Directory Structure

```
ai-lead-finder/
├── backend/
│   ├── src/
│   │   ├── ai/              # OpenAI structured strategy generator
│   │   ├── config/          # Environment & scoring weights configuration
│   │   ├── controllers/     # REST controllers (auth, search, leads, settings, dashboard)
│   │   ├── database/        # Data access service, Prisma client, and seeders
│   │   ├── discovery/       # Discovery engine coordinating multi-provider searches
│   │   ├── extractors/      # Robots.txt check & website contact extraction
│   │   ├── middleware/      # JWT auth, rate limiting, error handling
│   │   ├── processors/      # Normalizer & deduplication engine
│   │   ├── providers/       # Adapters for Tavily, SerpAPI, Bing, Google Places
│   │   ├── queues/          # BullMQ queue manager & progress event bus
│   │   ├── routes/          # Express route definitions & SSE stream
│   │   ├── scoring/         # Configurable 0-100 lead quality scoring engine
│   │   ├── services/        # CSV and XLSX export service
│   │   ├── types/           # TypeScript definitions
│   │   ├── verification/    # DNS MX lookup & email verification
│   │   └── workers/         # Asynchronous search & extraction pipeline worker
│   ├── prisma/              # PostgreSQL Prisma schema
│   └── tests/               # Vitest automated test suite
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components (table, modals, filters, layout)
│   │   ├── pages/           # 10 Application pages
│   │   ├── services/        # Frontend API client
│   │   ├── stores/          # Zustand state stores (search, auth)
│   │   └── types/           # Frontend TypeScript types
├── docker/                  # Dockerfiles and Nginx reverse proxy configurations
├── docs/                    # Architecture and Deployment manuals
├── docker-compose.yml       # Production Docker stack
└── README.md
```

---

## 4. Quick Start (Local Development)

### 1. Prerequisites
- Node.js v18+ (tested on Node v22)
- npm v9+

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install
npx prisma generate

# Frontend
cd ../frontend
npm install
```

### 3. Run Backend & Frontend Concurrently
In terminal 1 (Backend API on `http://localhost:5000`):
```bash
cd backend
npm run dev
```

In terminal 2 (Frontend on `http://localhost:5173`):
```bash
cd frontend
npm run dev
```

Open your browser to `http://localhost:5173`.
Default administrator account:
- Email: `admin@aileadfinder.io`
- Password: `password123`

---

## 5. Running Automated Tests

Run the Vitest pipeline test suite (validating normalizer, deduplication, scoring, and exports):
```bash
cd backend
npm test
```

Expected output:
```
 ✓ tests/pipeline.test.ts (8 tests)
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

---

## 6. Production Deployment (Docker Compose)

Deploy the complete multi-container stack with PostgreSQL, Redis, Backend, Frontend, and Nginx:

```bash
# 1. Clone & enter repository
cd /opt/ai-lead-finder

# 2. Configure environment variables
cp .env.example .env
nano .env

# 3. Launch Docker Compose stack
docker compose up -d --build
```

The application will be live at `http://your-server-ip:80`. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full VPS and SSL setup guides.

---

## 7. API Settings & Credentials Status

Configure your API keys in the application under **API Settings** (`/settings/api`) or in your `.env` file:
- `OPENAI_API_KEY`: Generates keywords and structured search strategies. (If left blank, an intelligent deterministic NLP parser runs automatically).
- `TAVILY_API_KEY`: Multi-source web search.
- `SERPAPI_API_KEY`: Google Search & Google Maps local results.
- `GOOGLE_PLACES_API_KEY`: Direct Google Places directory.
- `BING_API_KEY`: Microsoft Bing web search.
- `EMAIL_VERIFIER_API_KEY`: Hunter.io or similar email deliverability API. (If left blank, direct DNS MX verification runs automatically).
