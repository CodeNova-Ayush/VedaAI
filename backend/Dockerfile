# syntax=docker/dockerfile:1.6
#
# Multi-stage Dockerfile for the VedaAI backend.
# Build context: the MONOREPO ROOT (so the @veda-ai/shared workspace resolves).
# Runs the API and BullMQ worker side-by-side via a tiny Node bootstrap so the
# whole thing fits in a single Render free-tier Web Service.

# ───────────────────────── deps ─────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install everything (including devDeps so tsc works in the build stage)
RUN npm ci --no-audit --no-fund

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

# Copy compiled output and a slim production node_modules.
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p /app/backend/uploads

EXPOSE 4000

# Run API + BullMQ worker in one process tree.
CMD ["node", "backend/dist/backend/src/start-all.js"]
