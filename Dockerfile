# ── HuggingFace Spaces Dockerfile for the Express API ──
# Build context: repository root (monorepo)
# HuggingFace Spaces runs on port 7860 by default.

FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# ── Install & generate ──
FROM base AS deps
WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

RUN npm ci --workspace=apps/api --workspace=packages/shared --include-workspace-root

# Copy source files needed for build
COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# ── Build ──
FROM deps AS build
WORKDIR /app

# Build shared package first, then the API
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api

# ── Production image ──
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860

# Copy built artifacts and node_modules
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/src/generated ./apps/api/src/generated
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/package.json ./

RUN mkdir -p /app/apps/api/uploads

# HuggingFace Spaces runs containers as user 1000
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 7860

WORKDIR /app/apps/api
CMD ["node", "dist/src/server.js"]
