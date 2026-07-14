# Import Business Management System — Demo/MVP

A demo-quality Import Business Management System (ERP) built to `project_description.txt`'s
spec: mock authentication, seeded SQLite database, REST API with real business logic (not just
mocks), a full ERP-style dashboard/navigation, and clean abstractions for future real-API
integrations (FBR e-Invoicing, WhatsApp, SMS, email, currency exchange, AI forecasting, S3,
payment gateway).

**This is a demo, not a production build.** See `IMPLEMENTATION_PLAN.md` for the full phase-by-
phase build log, architectural decisions, and the "Gaps found in the original spec" section for
where this demo intentionally diverges from a real production system (SQLite instead of
Postgres, mock JWT auth, local file storage instead of S3, etc).

## Stack

- **Frontend** (`apps/web`): Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind
  v4, shadcn/ui (Base UI), React Query, React Hook Form + Zod, Recharts.
- **Backend** (`apps/api`): Node.js, Express 5, TypeScript, Prisma 7 (SQLite via
  `better-sqlite3` driver adapter for the demo — see `docker-compose.yml` for a real-Postgres
  swap), JWT auth, Swagger/OpenAPI at `/api/docs`.
- **Shared** (`packages/shared`): shared TypeScript types across both apps.
- Monorepo via npm workspaces.

## Prerequisites

- Node.js ≥ 20, npm ≥ 10.
- **A native (ext4/APFS/NTFS-local) filesystem.** If you're on WSL2, do **not** run this from a
  Windows-mounted path like `/mnt/c/...` — native modules (`better-sqlite3`) and Next.js's
  Turbopack build cache both need real file-locking/native-binary support that Windows 9p/DrvFs
  mounts don't reliably provide (you'll see `EIO`/`EPERM` errors on install or `next dev`).
  Clone/copy the repo onto the Linux filesystem (e.g. `~/projects/erp`) and work from there.
- No Docker/Postgres required for the demo — SQLite is used out of the box. `docker-compose.yml`
  is kept at the root for a future real-Postgres swap (change the Prisma datasource in
  `apps/api/prisma.config.ts`).

## Setup

```bash
# 1. Install all workspace dependencies (also runs `prisma generate` for apps/api)
npm install

# 2. Env files — .env.example already has working demo defaults (SQLite path, a real
#    generated JWT secret should replace the placeholder before any real deployment)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Apply migrations (creates apps/api/prisma/dev.db). Must run from apps/api — Prisma 7
#    reads DATABASE_URL from apps/api/.env via prisma.config.ts, relative to cwd.
(cd apps/api && npx prisma migrate deploy)

# 4. Seed demo data (50 products, 20 suppliers, 15 distributors, 100 POs, 300 sales orders,
#    12 months of financials, 6 users covering all roles)
npm run seed --workspace=apps/api

# 5. Run both apps (separate terminals)
npm run dev:api   # http://localhost:4000 — Swagger docs at /api/docs
npm run dev:web   # http://localhost:3000
```

Open `http://localhost:3000` — you'll be redirected to `/login`.

### Demo logins

All seeded users share the password `Demo@1234`:

| Role | Email |
|---|---|
| Super Admin (all permissions) | `admin@erp.local` |
| Procurement Officer | `procurement@erp.local` |
| Inventory Manager | `inventory@erp.local` |
| Sales Manager | `sales@erp.local` |
| Accountant | `accounts@erp.local` |
| Executive (view-only, everywhere) | `executive@erp.local` |

## Common commands

```bash
npm run build       # builds packages/shared, apps/api, apps/web in order
npm run typecheck   # tsc --noEmit across every workspace
npm run lint         # ESLint across the whole repo
npm run format       # Prettier --write
npm run seed --workspace=apps/api   # re-seed demo data (does not reset the schema)
```

Re-running migrations after a schema change: `(cd apps/api && npx prisma migrate dev)`.
**Never** run `prisma migrate reset` without first confirming with whoever owns the data — it
wipes the database, and Prisma itself blocks this for AI agents unless a consent env var is set.

## Project structure

```
apps/
  api/     Express backend — modular monolith (modules/, shared/, middleware/, database/, docs/)
  web/     Next.js frontend — see apps/web/README.md for frontend-specific conventions
packages/
  shared/  Shared TypeScript types/DTOs used by both apps
docker-compose.yml   Postgres service definition, kept for a future non-demo swap (not used now)
IMPLEMENTATION_PLAN.md   Full build log / phase tracker — read this for "what's done and why"
project_description.txt Original spec this was built against
```

## Deployment

This demo is **local-only by design** (see `IMPLEMENTATION_PLAN.md`'s Gap #11) — there is no
hosted deploy target, Dockerfile, or CI pipeline configured. If a live demo link is needed later,
that requires a deliberate decision on hosting (SQLite's single-file nature means most serverless
platforms won't work without switching to Postgres first via `docker-compose.yml`).

## Known demo limitations

- Auth stores the JWT in a plain (non-httpOnly) cookie for demo simplicity — see
  `apps/web/README.md`'s "Auth / session model" for the full tradeoff.
- `AuditLogs` table exists in the schema but nothing writes to it yet — Settings' "System Logs"
  and Tax's "Audit Logs" screens correctly render an empty state rather than fake data.
- AI Dashboard is explicitly demo-only per the spec — 4 of its 6 sections are randomly generated
  data, clearly labeled as such in the UI (2 sections are real aggregations over seeded data).
- No automated end-to-end/browser test suite — see `IMPLEMENTATION_PLAN.md` Phase 10 for what
  backend test coverage exists.
