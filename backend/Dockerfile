# syntax=docker/dockerfile:1.6
#
# Multi-stage Dockerfile for the VedaAI backend.
# Build context: the MONOREPO ROOT (so the @veda-ai/shared workspace resolves).
# By default it runs API + Worker together via `concurrently`. Override the
# CMD on a separate service to run just one if you have a paid plan.

# ───────────────────────── deps ─────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy lockfile + every workspace manifest so the install layer caches well.
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

# Copy the runtime tree.
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p /app/backend/uploads

EXPOSE 4000

# Run the API and the BullMQ worker side-by-side in one container.
# This is what lets the project deploy on Render's free Web Service tier
# (Background Workers require a paid plan).
CMD ["npx", "concurrently", "-k", "-n", "API,WRK", "-c", "magenta,yellow", \
     "node backend/dist/backend/src/index.js", \
     "node backend/dist/backend/src/worker.js"]
