# syntax=docker/dockerfile:1.6
#
# Multi-stage Dockerfile for the VedaAI backend.
# Build context: the MONOREPO ROOT (so the shared workspace is available).
# Default CMD runs the API. Override CMD to run the BullMQ worker as a
# separate Railway/Render service.

# ───────────────────────── deps ─────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy lockfile + every workspace manifest so the install layer caches well
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install all workspace deps. Small monorepo so we accept full install.
RUN npm ci

# ───────────────────────── build ────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY shared ./shared
COPY backend ./backend

RUN npm run build --workspace @veda-ai/backend

# ───────────────────────── runner ───────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the runtime tree
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p /app/backend/uploads

EXPOSE 4000

# Default to the API. Override to run the worker on its own service:
#   CMD ["node", "backend/dist/backend/src/worker.js"]
CMD ["node", "backend/dist/backend/src/index.js"]
