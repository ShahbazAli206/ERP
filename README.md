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

`.env`/`.env.local` and the seeded `apps/api/prisma/dev.db` are committed to this repo (a
deliberate exception to the usual "never commit env files" rule — this is a local-only demo
with no real secrets, see "A note on committed env files/database" below), so a fresh clone
already has working config and data. Setup is just:

```bash
# 1. Install all workspace dependencies (also runs `prisma generate` for apps/api)
npm install

# 2. Apply any pending migrations (dev.db already exists and is seeded — this is a no-op
#    unless the schema has changed since the last commit). Must run from apps/api — Prisma 7
#    reads DATABASE_URL from apps/api/.env via prisma.config.ts, relative to cwd.
(cd apps/api && npx prisma migrate deploy)

# 3. Run both apps (separate terminals)
npm run dev:api   # http://localhost:4000 — Swagger docs at /api/docs
npm run dev:web   # http://localhost:3000
```

Only re-run `npm run seed --workspace=apps/api` if you intentionally want to add another full
batch of demo data on top of what's already there — the seed script is not idempotent against
itself (running it twice roughly doubles products/orders/etc.), so don't run it "just in case"
on a fresh clone.

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

## A note on committed env files/database

This repo commits `apps/api/.env`, `apps/api/.env.test`, `apps/web/.env.local`,
`apps/api/prisma/dev.db` (the seeded SQLite database), and `apps/api/uploads/` (demo attachment
files) — normally these belong in `.gitignore`. That's a deliberate choice for this project: it's
a local-only demo (no real secrets — `JWT_SECRET` is a random string with no connection to any
real service, and every other integration credential in `.env` is blank), and committing them
means cloning this repo on a new machine gives you the exact same working setup and seeded data
immediately, with no manual `.env` copying or re-seeding step. If this were ever adapted for
real use, these would need to move back behind `.gitignore` and `JWT_SECRET` would need to be a
real per-environment secret, not a committed one.

## Known demo limitations

- Auth stores the JWT in a plain (non-httpOnly) cookie for demo simplicity — see
  `apps/web/README.md`'s "Auth / session model" for the full tradeoff.
- `AuditLogs` table exists in the schema but nothing writes to it yet — Settings' "System Logs"
  and Tax's "Audit Logs" screens correctly render an empty state rather than fake data.
- AI Dashboard is explicitly demo-only per the spec — 4 of its 6 sections are randomly generated
  data, clearly labeled as such in the UI (2 sections are real aggregations over seeded data).
- No automated end-to-end/browser test suite — see `IMPLEMENTATION_PLAN.md` Phase 10 for what
  backend test coverage exists.
