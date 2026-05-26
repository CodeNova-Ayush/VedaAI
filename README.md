<div align="center">

<img src="https://img.shields.io/badge/-VedaAI-F4521E?style=for-the-badge&labelColor=1C1C1C" alt="VedaAI" />

# AI Assessment Creator

An AI-powered platform that lets teachers generate structured, difficulty-tagged question papers instantly using natural language input.

[![Build](https://img.shields.io/badge/build-passing-22C55E?style=flat-square)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](#)
[![Next.js](https://img.shields.io/badge/Next.js-14-000?style=flat-square&logo=nextdotjs&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=flat-square&logo=mongodb&logoColor=white)](#)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](#)
[![License](https://img.shields.io/badge/license-MIT-black?style=flat-square)](#license)

</div>

## Overview

VedaAI's AI Assessment Creator turns a short brief into a fully structured exam paper. Teachers describe what they need — subject, class, question types, marks, and any extra context — and the system produces sectioned questions with difficulty tags, an answer key, and a downloadable PDF. The platform is built for K-12 teachers who spend hours hand-crafting question papers each week and want a reliable assistant that respects their format and grading rubric. From a blank form to a finished question paper in under 30 seconds, powered by Claude.

## Live Demo

| Surface | URL |
|---|---|
| Frontend | `https://veda-ai.vercel.app` *(replace after deploy)* |
| Backend API | `https://veda-ai-api.up.railway.app` *(replace after deploy)* |

## Features

- **Assignment creation** with optional file upload (JPEG, PNG, PDF up to 10 MB)
- **AI question paper generation** through Claude with strict JSON output
- **Real-time progress updates** over Socket.io while the worker processes the job
- **Structured sections** (Section A, B, C…) with question type, instruction, and numbered questions
- **Difficulty tagging** on every question (Easy / Moderate / Hard / Challenging) with colour-coded badges
- **Answer key generation** for every question, presented as a separate card
- **PDF download** rendered with `@react-pdf/renderer` (real PDF, not browser print)
- **Regenerate button** that re-queues the job and replays the loading state
- **Mobile responsive layout** with a collapsing sidebar and stacked cards
- **Redis caching** of generated papers with a 1-hour TTL
- **Background job processing** with BullMQ running in a separate worker process
- **Deterministic offline fallback** that runs end-to-end even without an Anthropic API key

## Tech Stack

### Frontend
- **Next.js 14 (App Router)** — file-based routing with server components for fast first paint and dynamic SSR for the output page
- **TypeScript** — strict mode across the codebase, no `any` types
- **Tailwind CSS** — utility-first styling that maps 1:1 to the Figma tokens
- **Zustand** — minimal global state for the sidebar UI without Redux ceremony
- **Socket.io client** — drop-in WebSocket transport with reconnection
- **React Hook Form + Zod** — typed, schema-validated forms with field-level errors
- **lucide-react** — consistent SVG icon set
- **@react-pdf/renderer** — programmatic PDF rendering for export

### Backend
- **Node.js + Express + TypeScript** — small, well-understood HTTP server
- **MongoDB + Mongoose** — flexible storage for assignments and generated papers
- **Redis** — single store for both BullMQ queues and the result cache
- **BullMQ** — battle-tested job queue with retries and exponential backoff
- **Socket.io** — real-time channel per assignment id for progress updates
- **Multer** — multipart file upload handling with MIME and size limits
- **Zod** — server-side request validation and LLM response shape validation

### AI
- **Anthropic Claude (claude-3-5-sonnet)** — strong instruction-following with reliable structured output
- **Custom prompt builder** — deterministic system prompt that pins the JSON schema
- **Strict JSON parsing pipeline** — fence stripping, `JSON.parse`, then Zod validation before persistence

## Architecture

```
                    ┌──────────────────────────────────────────────────┐
                    │                       Browser                     │
                    │   ┌────────────┐  ┌──────────┐  ┌───────────────┐│
                    │   │ Next.js 14 │  │ Zustand  │  │ Socket.io cli ││
                    │   └─────┬──────┘  └──────────┘  └──────┬────────┘│
                    └─────────┼───────────────────────────────┼─────────┘
                              │ HTTP                          │ WebSocket
                              ▼                               ▼
                    ┌──────────────────────────────────────────────────┐
                    │                Express API + Socket.io            │
                    │                                                   │
                    │   POST /api/assignments  ──▶ enqueue job ─────┐  │
                    │   GET  /api/assignments  ◀── Mongo            │  │
                    │   GET  /:id/result       ◀── Redis → Mongo    │  │
                    │                                                │  │
                    │   subscribe(assignment:<id>)                   │  │
                    │     ◀─ pub/sub ─ Redis ◀─ worker events        │  │
                    └────────────────────────┬───────────────────────┼──┘
                                             │ Mongoose              │
                                             ▼                       ▼
                                  ┌─────────────────┐     ┌──────────────────┐
                                  │     MongoDB     │     │   Redis          │
                                  │ Assignment,     │     │ BullMQ queue +   │
                                  │ GeneratedPaper  │     │ Paper cache (1h) │
                                  └─────────────────┘     └────────┬─────────┘
                                                                   │ pulls job
                                                                   ▼
                                                         ┌──────────────────┐
                                                         │  BullMQ Worker   │
                                                         │  (separate proc) │
                                                         └────────┬─────────┘
                                                                  │ JSON only
                                                                  ▼
                                                         ┌──────────────────┐
                                                         │  Claude API      │
                                                         │  claude-3.5-sonnet│
                                                         └──────────────────┘
```

A teacher submits the form, which posts to `POST /api/assignments`. The API persists the assignment, enqueues a job on the `paper-generation` queue and returns the new id immediately. The browser opens a Socket.io connection and joins the room `assignment:<id>`. The BullMQ worker (a separate Node process) picks up the job, builds a deterministic prompt from the form data, calls Claude, strips fences, parses JSON, validates the result against a Zod schema, and persists it. Throughout the run it publishes `progress`, `complete`, and `error` events to a Redis pub/sub channel. The API server's Socket.io layer subscribes to that channel and forwards events into the assignment room. On completion the frontend redirects to `/assignments/[id]/output`, which fetches the paper (Redis cache first, MongoDB otherwise) and renders the structured paper plus answer key, with a one-click PDF download.

## Project Structure

```
veda-ai/
├── package.json                 # workspace root, runs everything via concurrently
├── .env.example                 # env vars for both apps
├── .gitignore                   # root-only gitignore
├── README.md
│
├── shared/                      # @veda-ai/shared — types only, no runtime
│   ├── package.json
│   ├── tsconfig.json
│   └── types/
│       └── index.ts             # Assignment, QuestionType, Question, Section, GeneratedPaper, JobStatus, ApiResponse
│
├── frontend/                    # @veda-ai/frontend — Next.js 14 App Router
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.ts       # brand colour tokens
│   ├── postcss.config.js
│   └── src/
│       ├── app/
│       │   ├── layout.tsx       # sidebar + topbar shell
│       │   ├── page.tsx         # home / quick links
│       │   ├── assignments/
│       │   │   ├── page.tsx     # list + empty state
│       │   │   ├── create/page.tsx     # form
│       │   │   └── [id]/
│       │   │       ├── page.tsx        # loading + WebSocket subscriber
│       │   │       └── output/page.tsx # rendered paper + PDF download
│       │   ├── groups/page.tsx
│       │   ├── library/page.tsx
│       │   ├── toolkit/page.tsx
│       │   └── settings/page.tsx
│       ├── components/
│       │   ├── Sidebar.tsx
│       │   ├── TopBar.tsx
│       │   ├── Logo.tsx
│       │   ├── EmptyAssignmentsArt.tsx
│       │   ├── AssignmentsView.tsx
│       │   ├── DifficultyBadge.tsx
│       │   ├── DownloadPdfButton.tsx
│       │   ├── RegenerateButton.tsx
│       │   ├── PaperPdf.tsx        # @react-pdf/renderer document
│       │   └── ComingSoon.tsx
│       ├── lib/
│       │   ├── api.ts              # typed fetchers
│       │   ├── socket.ts           # Socket.io singleton
│       │   └── schemas.ts          # Zod form schemas
│       ├── store/uiStore.ts        # Zustand store
│       └── types/index.ts          # re-exports from @veda-ai/shared
│
└── backend/                     # @veda-ai/backend — Express + Socket.io + BullMQ
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts             # API + WebSocket entry
        ├── worker.ts            # BullMQ worker entry (separate process)
        ├── config/
        │   ├── db.ts            # Mongoose connection
        │   └── redis.ts         # ioredis singleton
        ├── controllers/
        │   └── assignmentController.ts
        ├── middleware/
        │   ├── upload.ts        # multer config (10 MB, JPEG/PNG/PDF)
        │   └── errorHandler.ts  # Zod-aware error envelope
        ├── models/
        │   ├── Assignment.ts
        │   └── GeneratedPaper.ts
        ├── routes/
        │   └── assignments.ts
        ├── services/
        │   ├── promptBuilder.ts # builds system + user prompts
        │   ├── aiService.ts     # Claude call + offline fallback + Zod validation
        │   ├── queueService.ts  # BullMQ queue
        │   └── cacheService.ts  # Redis paper cache
        ├── socket/
        │   ├── socketServer.ts  # Socket.io rooms per assignment id
        │   └── eventBus.ts      # Redis pub/sub bridge worker → API
        ├── scripts/
        │   └── seedSamplePaper.ts
        └── types/index.ts       # re-exports from @veda-ai/shared
```

## Getting Started

### Prerequisites

- Node.js `>=18.17 <23`
- MongoDB running locally on `27017` or a remote URI
- Redis running locally on `6379` or a remote URL
- (Optional) An Anthropic API key. Without one, the worker uses a deterministic offline generator so the full pipeline still works.

### 1. Clone

```bash
git clone https://github.com/CodeNova-Ayush/VedaAI.git
cd VedaAI
```

### 2. Install

A single install at the root sets up all three workspaces:

```bash
npm install
```

### 3. Configure environment

Create the per-app env files (paths and contents come from `.env.example`):

```bash
# backend
cat > backend/.env <<'EOF'
MONGODB_URI=mongodb://127.0.0.1:27017/vedaai
REDIS_URL=redis://127.0.0.1:6379
ANTHROPIC_API_KEY=
PORT=4000
FRONTEND_URL=http://localhost:3000
EOF

# frontend
cat > frontend/.env.local <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
EOF
```

### 4. Start the stack

```bash
npm run dev
```

This boots three labelled processes in parallel:

```
[WEB]  ▲ Next.js 14.2.5 — http://localhost:3000
[API]  [api] listening on http://localhost:4000
[WRK]  [worker] started, listening on queue paper-generation
```

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| REST + WebSocket | http://localhost:4000 |
| Health check | http://localhost:4000/health |

To run any process on its own:

```bash
npm run dev:web        # frontend only
npm run dev:api        # API only
npm run dev:worker     # BullMQ worker only
```

## Environment Variables

| Variable | App | Purpose |
|---|---|---|
| `MONGODB_URI` | backend | MongoDB connection string |
| `REDIS_URL` | backend | Redis URL for cache and BullMQ |
| `ANTHROPIC_API_KEY` | backend | Claude API key. Optional; falls back to offline generator if missing |
| `PORT` | backend | API + WebSocket port (default `4000`) |
| `FRONTEND_URL` | backend | Allowed CORS origin for the frontend |
| `NEXT_PUBLIC_API_URL` | frontend | Backend base URL |
| `NEXT_PUBLIC_SOCKET_URL` | frontend | Socket.io server URL (usually same as API URL) |

## API Reference

All responses follow:

```ts
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; fields?: Record<string, string> };
```

### `POST /api/assignments`

Creates an assignment and enqueues a generation job.

**Request** (`multipart/form-data`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | File | no | JPEG / PNG / PDF, max 10 MB |
| `dueDate` | string | yes | ISO date, today or later |
| `questionTypes` | JSON string | yes | `[{ "type": string, "count": 1-50, "marks": 1-100 }, ...]` |
| `additionalInstructions` | string | no | Free text |

**Response 201**

```json
{ "success": true, "data": { "assignmentId": "6601…" } }
```

### `GET /api/assignments`

Lists every assignment, sorted by `createdAt` descending.

**Response 200**

```json
{
  "success": true,
  "data": [
    {
      "id": "6601…",
      "title": "Quiz on Electricity",
      "dueDate": "2026-04-12T00:00:00.000Z",
      "questionTypes": [{ "type": "MCQ", "count": 10, "marks": 1 }],
      "status": "complete",
      "createdAt": "2026-03-20T10:14:22.001Z"
    }
  ]
}
```

### `GET /api/assignments/:id`

Returns one assignment with metadata and current job status.

**Response 200**

```json
{
  "success": true,
  "data": {
    "id": "6601…",
    "title": "...",
    "dueDate": "...",
    "questionTypes": [...],
    "additionalInstructions": "...",
    "fileUrl": "/uploads/...",
    "status": "processing",
    "resultId": null,
    "createdAt": "..."
  }
}
```

### `GET /api/assignments/:id/result`

Returns the validated, rendered question paper. Reads from Redis cache first, then MongoDB.

**Response 200 — still working**

```json
{ "success": true, "data": { "status": "processing" } }
```

**Response 200 — complete**

```json
{
  "success": true,
  "data": {
    "status": "complete",
    "paper": {
      "schoolName": "...",
      "subject": "...",
      "className": "...",
      "timeAllowed": 45,
      "totalMarks": 20,
      "sections": [
        {
          "title": "Section A",
          "questionType": "Short Answer Questions",
          "instruction": "Attempt all questions. Each question carries 2 marks.",
          "questions": [
            { "number": 1, "text": "...", "difficulty": "easy", "marks": 2 }
          ]
        }
      ],
      "answerKey": [{ "number": 1, "answer": "..." }]
    }
  }
}
```

### `DELETE /api/assignments/:id`

Removes the assignment, its generated paper, and its cache entry.

**Response 200**

```json
{ "success": true, "data": { "id": "6601…" } }
```

### `POST /api/assignments/:id/regenerate`

Re-queues an assignment, clearing the existing paper and cache.

**Response 200**

```json
{ "success": true, "data": { "assignmentId": "6601…" } }
```

## WebSocket Events

Clients connect to the API URL and emit `subscribe` / `unsubscribe` with an assignment id to join its room. The worker publishes events through Redis pub/sub which the API forwards to the room.

| Event | Emitted by | Payload | When |
|---|---|---|---|
| `job:progress` | Worker → API → client | `{ progress: number, message: string }` | Periodically while the worker runs (10%, 30%, 55%, 85%) |
| `job:complete` | Worker → API → client | `{ paperId: string }` | On successful generation, validation, and persistence |
| `job:error` | Worker → API → client | `{ error: string }` | On unrecoverable failure or final retry exhausted |

Client-emitted events:

| Event | Payload | Effect |
|---|---|---|
| `subscribe` | `assignmentId: string` | Joins room `assignment:<id>` |
| `unsubscribe` | `assignmentId: string` | Leaves the room |

## AI Prompt Strategy

The prompt builder takes the form data and assembles two messages:

1. **System prompt** — pins the role ("expert exam-paper writing assistant"), forbids markdown and prose, and embeds the exact TypeScript shape the response must conform to (`schoolName`, `subject`, `className`, `timeAllowed`, `totalMarks`, `sections`, `answerKey`).
2. **User prompt** — restates the assignment metadata: total questions, total marks, per-section breakdown ("Section A: 10 Multiple Choice Questions × 1 mark each"), the teacher's free-text instructions, and a final reminder that **only** a JSON object is allowed.

The worker then runs a strict parsing pipeline before anything reaches the database:

1. Strip any accidental code fences and isolate text between the first `{` and last `}`.
2. `JSON.parse` the cleaned string.
3. Validate the parsed object against a **Zod** schema that mirrors the `GeneratedPaper` type, including difficulty enum and positive-integer marks.
4. Persist the validated object only. The raw LLM output is never written to MongoDB and never sent to the client.

If parsing or validation fails, the BullMQ job retries up to **3 times** with exponential backoff. After the final retry the job emits `job:error`, the assignment is marked `failed`, and the user sees a Retry button on the loading screen. Missing assignments throw `UnrecoverableError` so the queue does not waste retries on data that no longer exists.

When `ANTHROPIC_API_KEY` is unset, the worker uses a deterministic offline generator that derives subject and class from keywords in the additional instructions. This keeps demos and CI runs fully working without external dependencies, while production with the key uses Claude.

## Deployment

### Frontend → Vercel

1. **Import** the GitHub repo in Vercel.
2. Leave the **Root Directory** as the repo root (do **not** set it to `frontend`). The included `vercel.json` overrides the build to compile only the frontend workspace.
3. **Framework Preset** auto-detects as Next.js. The build/install/output commands come from `vercel.json`.
4. Configure environment variables:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | Your Railway backend URL, e.g. `https://veda-ai-api.up.railway.app` |
   | `NEXT_PUBLIC_SOCKET_URL` | Same as `NEXT_PUBLIC_API_URL` |

   Add them for **all environments** (Production, Preview, Development) before triggering a build, since `NEXT_PUBLIC_*` values are baked in at build time.

5. Trigger a deploy. Once green, the live URL is your `FRONTEND_URL` for the backend.

### Backend → Render (recommended, free, no card required)

The repo ships a Render Blueprint at `render.yaml` that defines both the API and worker services. Both share the same Docker image built from `backend/Dockerfile`.

1. **Create managed data stores** (free tiers):
   - **MongoDB Atlas** → free M0 cluster → user → "Allow access from anywhere" → copy the `mongodb+srv://...` URI.
   - **Upstash Redis** → free Global database → copy the `rediss://...` URL (TLS, works out of the box).

2. **Deploy the Blueprint**:
   - Push the repo to GitHub (already done if you're following along).
   - Go to https://dashboard.render.com → **New +** → **Blueprint** → connect this repo.
   - Render reads `render.yaml` and creates **`veda-ai-api`** (Web Service) and **`veda-ai-worker`** (Background Worker).

3. **Fill in the secrets** when Render prompts:

   | Variable | Value |
   |---|---|
   | `MONGODB_URI` | Your Atlas SRV URI |
   | `REDIS_URL` | Your Upstash URL |
   | `ANTHROPIC_API_KEY` | Your Anthropic key (or leave blank — falls back to offline generator) |
   | `FRONTEND_URL` | `https://<your-vercel-domain>.vercel.app` (only on the API service) |

4. Click **Apply**. Render builds the Docker image (the same one used for both services), then starts the API and the worker. The API exposes a public `https://veda-ai-api.onrender.com` URL.

5. **Smoke test**:
   ```bash
   curl https://veda-ai-api.onrender.com/health
   # → { "success": true, "data": { "ok": true } }
   ```

6. **Update Vercel**: in the frontend project Settings → Environment Variables, set
   - `NEXT_PUBLIC_API_URL = https://veda-ai-api.onrender.com`
   - `NEXT_PUBLIC_SOCKET_URL = https://veda-ai-api.onrender.com`

   Then **redeploy** (Vercel → Deployments → ⋯ → Redeploy, uncheck cache). `NEXT_PUBLIC_*` is baked at build time, so a redeploy is required.

7. Done. Open your Vercel URL and create an assignment.

### Backend → Railway (alternative)

Railway needs to build the **whole monorepo** (so the `@veda-ai/shared` workspace resolves) and run only the backend. The repo ships:

- `backend/Dockerfile` — multi-stage Docker build that installs all workspaces, builds the backend, and produces a slim runtime image.
- `railway.json` — tells Railway to use that Dockerfile from the repo root.

Steps:

1. Create a **new Railway project** and connect this GitHub repo.
2. Add Railway plug-ins (or external) for **MongoDB** and **Redis**, or paste your own `MONGODB_URI` and `REDIS_URL`.
3. Configure the **API service**:
   - Build: Dockerfile (auto-detected from `railway.json`).
   - Start command (already set in `railway.json`): `node backend/dist/backend/src/index.js`.
   - Environment variables:

     | Key | Value |
     |---|---|
     | `MONGODB_URI` | Your Mongo connection string |
     | `REDIS_URL` | Your Redis URL |
     | `ANTHROPIC_API_KEY` | Anthropic key (optional) |
     | `PORT` | `4000` |
     | `FRONTEND_URL` | Your Vercel URL |

4. **Duplicate the service** to create the **Worker service** from the same image. Override the start command to `node backend/dist/backend/src/worker.js`. Both services share the same env vars.

This gives you the same API + Worker split that runs locally under `concurrently`.

### Smoke test

After deploy, hit:

```bash
curl https://<your-railway-host>/health
# → { "success": true, "data": { "ok": true } }
```

Then open your Vercel URL — the assignments list should load (empty state if you've not seeded yet).

## Screenshots

| Screen | Image |
|---|---|
| Assignments — empty state | *(insert screenshot)* |
| Assignments — filled list | *(insert screenshot)* |
| Create Assignment form | *(insert screenshot)* |
| Loading state with progress bar | *(insert screenshot)* |
| Question Paper output + Answer Key | *(insert screenshot)* |

## What I Would Improve With More Time

- **Authentication & multi-tenant schools** — first-class teacher accounts, school-scoped data, and role-based access (teacher / admin / student preview).
- **Streaming AI responses** — switch the worker to streaming Claude tokens so the loading screen reveals questions as they generate, instead of waiting for the full response.
- **Automated grading** — accept student submissions per assignment and grade them against the generated answer key with rubric-aware AI feedback.
- **Question bank & remix** — persist accepted questions in a searchable bank tagged by topic and difficulty, and let teachers compose new papers from saved questions.
- **Observability & tracing** — structured logs, OpenTelemetry traces across API → queue → worker → LLM, and per-stage latency dashboards so the first slow generation is debuggable.

## License

Released under the **MIT License**.
