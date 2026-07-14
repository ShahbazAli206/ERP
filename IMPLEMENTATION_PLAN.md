# Import Business Management System — Demo/MVP Implementation Plan

Source spec: `project_description.txt`. This plan breaks that spec into ordered, checkable
phases so work can be resumed across sessions. **Update the checkboxes and "Current Status"
section below as work progresses** — this file is the source of truth for where we are.

## Current Status
- Phase: **3 — In progress.** Suppliers (3.1) through Sales (3.6) done sequentially;
  Finance (3.7), Expenses (3.8), Tax (3.9), Notifications (3.12), AI (3.13), Settings (3.14)
  done via 6 parallel background agents, all reviewed/merged/live-verified by me. Only
  Dashboard (3.10) and Reports (3.11) remain in Phase 3.
- Last updated: 2026-07-14
- Next action: Dashboard (3.10), then Reports (3.11) — sequentially, by me (not parallel
  agents), since both aggregate across every other module and depend on all of them existing.
  After that, Phase 3 is complete and Phase 4 (integration abstraction interfaces) begins.
- **Parallel-agent outcome:** the 6-agent batch worked well — all typechecked/linted clean on
  first merge, and the reused-calculation instruction was followed correctly everywhere it
  applied (Finance/receivables-payables verified to match Suppliers/Distributors exactly).
  Two real bugs still surfaced only during my live verification pass (not caught by
  typecheck/lint): a Notifications RBAC gap (personal-inbox actions gated behind a permission
  most roles don't have) and an Expenses date-range inclusivity issue (fixed to match a
  pattern the Finance agent had already applied). **Lesson for any future parallel batch:**
  static checks (typecheck/lint) are not sufficient signal that agent-written code is
  correct — the live-verification pass remains where real bugs are actually found, so it
  must never be skipped or abbreviated just because a batch came back "clean."
- Reusable pieces now available for remaining modules: `shared/pagination.ts`,
  `shared/services/storage.service.ts` + `localStorage.service.ts`,
  `middleware/upload.middleware.ts` (multer + MIME whitelist), the `StatusHistory` pattern
  for any module needing a timeline (`entityType` + one of `purchaseOrderId`/`shipmentId`/
  `salesOrderId` FK), and `consumeFifo` in `modules/inventory/stock.repository.ts` (exported
  for reuse by Sales order fulfillment).
- Now have real Products/Categories/Warehouses endpoints — future module verification no
  longer needs throwaway Prisma-script fixtures for products, only for suppliers/distributors
  until their own modules exist.
- Dev API server is running in the background on port 4000 (SQLite db seeded with 6 roles/
  61 permissions/6 demo users, password `Demo@1234` for all — currently no suppliers/POs/etc,
  test data created during verification gets cleaned up after each module). Reuse it for
  testing new modules instead of starting a new one.
- **Reminder:** never run `prisma migrate reset` (or other schema-destroying commands)
  without explicit user confirmation — Prisma itself now blocks this for AI agents and
  requires a `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` env var with the user's verbatim
  consent text. For clearing test data made during verification, prefer a targeted delete.
- Decision made: demo is **local-only** (no hosted deploy needed) — Gap #11 resolved.
- Decision made: **SQLite** instead of Postgres for the demo (no Docker/Postgres available,
  keeping this fully autonomous) — Gap #1 resolved. `docker-compose.yml` kept at root for a
  future real-Postgres swap.
- Verified working: root npm workspaces install; `@erp/shared` builds; `apps/api` scaffold
  typechecks, lints clean, and boots via `npm run dev --workspace=apps/api` (confirmed it
  resolves the `@erp/shared` workspace import); `apps/web` (Next.js 16 + TS + Tailwind,
  scaffolded via create-next-app) lints clean and `next build` succeeds. `.env` files created
  locally from `.env.example` (JWT_SECRET is a real generated random value, not the placeholder)
  and confirmed git-ignored. One accepted moderate npm audit finding: transitive `postcss` XSS
  advisory bundled inside `next`'s build-time CSS stringifier — fixing requires downgrading
  Next to v9, so left as-is; not a runtime risk for this app.

---

## Gaps found in the original spec (added here so nothing is missed)

The spec is thorough on features/modules but silent on a few things needed to build it
properly. Added below; flag to the user if any should be scoped out:

1. **Dev environment / Docker** — no mention of how Postgres runs locally. **Resolved
   2026-07-14:** neither Docker nor a native PostgreSQL install is present on this machine,
   and both require manual/interactive setup (GUI installer, admin rights, WSL2+reboot for
   Docker). To keep this fully autonomous and zero-install, using **SQLite** via Prisma for
   the demo instead. Prisma's datasource is a one-line config change, so swapping to real
   Postgres later (once Docker/Postgres is set up) does not require touching schema/queries
   in any meaningful way — only a few Postgres-specific column types (if any get used) would
   need review.
2. **Testing strategy** — no unit/integration test requirement. Plan: add Jest for backend
   service/repository tests and basic API integration tests on critical modules (auth, sales,
   inventory). Not exhaustive coverage — this is a demo.
3. **Monorepo tooling** — frontend + backend need a structure decision (single repo with
   `/apps/web` + `/apps/api`, or two folders at root). Plan: `apps/web` (Next.js) + `apps/api`
   (Express) + `packages/shared` (shared types/DTOs) using npm workspaces.
4. **Env config / secrets handling** — spec says "Environment configuration" but no detail.
   Plan: `.env.example` per app, never commit real `.env`, JWT secret + DB URL + future API
   keys (all placeholder values for the demo).
5. **API conventions** — spec lists endpoints but not standards. Plan: consistent pagination
   (`?page`, `?pageSize`), sorting, filtering query params, standard error envelope
   `{ error: { code, message, details } }`, and consistent success envelope.
6. **Security basics** — helmet, CORS config, rate limiting on auth endpoints, password
   hashing (bcrypt) even though auth is "mock" JWT — should still hash seeded user passwords
   properly rather than storing plaintext.
7. **File upload constraints** — attachments (PO, expenses, shipments) need size/type limits
   even for local storage, so the later swap to S3 doesn't require validation rework.
8. **Multi-currency handling** — Suppliers have "Currency", Settings has "Exchange Rates" —
   need one shared currency-conversion utility so PO/Shipment landed-cost math and
   Sales regional pricing don't diverge.
9. **Audit logging hook** — `AuditLogs` table is listed in DB design but no module writes to
   it explicitly. Plan: a shared `auditLog(action, entity, userId, meta)` helper called from
   write operations across modules (at least create/update/delete on core entities).
10. **CI / lint / format** — no CI mentioned. Plan: ESLint + Prettier configs at minimum;
    GitHub Actions optional/deferred unless the user wants it for the demo repo.
11. **Deployment target for the demo** — not specified (local only vs. a hosted demo link for
    the client). **Needs a decision from the user before Phase 8+** — affects whether we set
    up a Dockerfile/deploy config.

---

## Phase 0 — Project Scaffolding ✅ COMPLETE
- [x] 0.1 Initialize git repo, root `package.json` workspaces (`apps/web`, `apps/api`,
      `packages/shared`)
- [x] 0.2 Root tooling: TypeScript base config, ESLint, Prettier, `.gitignore`, `.editorconfig`
- [x] 0.3 `docker-compose.yml` for PostgreSQL, kept for future use (not run now — see Gap #1)
- [x] 0.4 `.env.example` files for api and web (SQLite file datasource for now)
- [x] (bonus, pulled forward from Phases 2/6) minimal buildable/runnable scaffolds for
      `packages/shared`, `apps/api` (ts-node-dev + Express to be added Phase 2), and
      `apps/web` (create-next-app: Next.js 16, TS, Tailwind v4, ESLint 9 flat config) — done
      now rather than twice, since workspaces needed real package.json files to link anyway

## Phase 1 — Database Design (Prisma) ✅ COMPLETE
- [x] 1.1 Define Prisma schema for all entities: Users, Roles, Permissions, Products,
      Categories, Suppliers, PurchaseOrders, PurchaseItems, Shipments, ShipmentItems,
      Inventory, InventoryTransactions, Distributors, SalesOrders, SalesItems, Invoices,
      Payments, Expenses, Taxes, Notifications, AuditLogs, Settings
      (datasource: SQLite for demo, see Gap #1). 37 models total — also added
      `SupplierContact`, `Attachment` (shared across PO/Expense), `StatusHistory` (shared
      timeline across PO/Shipment/SalesOrder — needed for the spec's "Timeline UI"/"Order
      Timeline" requirements), `InventoryLot` (FIFO lot tracking, separate from the
      transaction ledger), `PricingGroup`, `Account`/`JournalEntry`/`JournalLine` (GL),
      `CompanySetting`/`ExchangeRate`/`SystemSetting`.
- [x] 1.2 Relations + indexes added (SKU/barcode unique, lot number, expiry date indexed on
      InventoryLot, plus FK indexes throughout)
- [x] 1.3 Initial migration `20260713194147_init` applied to SQLite; verified via
      `prisma db pull --print` that all 37 models match the live DB schema exactly
- [x] 1.4 Seed script skeleton at `apps/api/prisma/seed.ts` (empty per-domain functions,
      wired to both `npm run seed` and `npx prisma db seed` via `prisma.config.ts`
      `migrations.seed`); real data generation is Phase 5

**Verified working:** wrote and ran a throwaway smoke-test script that created a Role, User,
Category, Product, Warehouse, and InventoryLot through Prisma Client, queried the Product
back with relations included, then deleted everything — all passed against the real SQLite
file, then the script was deleted (it was a verification tool, not deliverable code).

**Notable Prisma 7 changes encountered** (this version is newer than typical training data,
worth remembering for later phases): the `prisma-client` generator (used here instead of the
old `prisma-client-js`) outputs plain `.ts` source into `src/generated/prisma` rather than
a compiled package in `node_modules/.prisma`; the `datasource` block in `schema.prisma` no
longer takes a `url` — that lives in `prisma.config.ts` (CLI-only); and `PrismaClient` now
**requires** an explicit driver adapter at construction time (no more implicit env-var
connection). Installed `@prisma/adapter-better-sqlite3` + `better-sqlite3` for this. The
generated client folder is gitignored and regenerated via a `postinstall` script (verified:
deleted the folder, ran `npm install --workspace=apps/api`, confirmed it came back).

## Phase 2 — Backend Core ✅ COMPLETE
- [x] 2.1 Express 5 + TypeScript app skeleton, modular monolith folder structure
      (`modules/`, `shared/`, `database/`, `middleware/`, `utils/`, `config/`, `docs/`,
      `types/`) under `apps/api/src`. `services/` was folded into per-module service files
      rather than a separate top-level folder — each module's `*.service.ts` lives with its
      own controller/repository, which matches "each module must contain...Service" better
      than one shared services/ bucket.
- [x] 2.2 Error handling middleware (`ApiError`, `errorHandler` handling `ApiError`/`ZodError`/
      Prisma known errors, `notFoundHandler`) + standard response envelope (`ok`/`created`/
      `noContent` helpers, `{ data, meta }` / `{ error: { code, message, details } }`)
- [x] 2.3 Logging via pino + pino-http request logging (pretty-printed in dev)
- [x] 2.4 Auth module (controller/service/repository/routes/validation/types/dto): JWT
      issue/verify, bcrypt password hashing, `/login`, `/logout` (stateless — nothing to
      invalidate server-side in a JWT demo), `/me`, `/forgot-password` (mock, always returns
      generic success to avoid leaking which emails exist)
- [x] 2.5 RBAC: `requireRole`/`requirePermission` middleware. Permissions are embedded in the
      JWT at login (61 keys = 15 modules × 4 CRUD actions + `procurement:approve`) rather than
      re-queried per request — simpler for a demo; the tradeoff is a role/permission edit
      won't take effect until the affected user's 8h token expires or they re-login.
- [x] 2.6 Swagger/OpenAPI via swagger-jsdoc + swagger-ui-express at `/api/docs`, scanning
      `src/modules/**/*.routes.ts` — auth routes documented as the first example for later
      modules to follow

**Verified working (live server, not just typecheck):** booted `npm run dev`, confirmed
`/health` and `/api/docs` respond; full login flow for the seeded Super Admin returns a JWT +
permissions; wrong password → 401; malformed body → 400 with Zod validation details; missing
token on `/me` → 401; valid token on `/me` → correct profile, `lastLoginAt` updates;
`/forgot-password` returns the same generic message for a real vs. fake email; unknown route →
404. Added a temporary route to exercise `requireRole`/`requirePermission` together (admin
with `finance:view` → 200, Sales Manager missing the role → 403, no token → 401), then deleted
that route once confirmed — Phase 3 modules will provide real protected routes to exercise
these going forward.

**Note for later phases:** the dev API server is being left running in the background
(`npm run dev --workspace=apps/api`, ts-node-dev with `--respawn` hot-reloads on save) so
Phase 3 module work can be curl-tested live as it's built, rather than restarted each time.

## Phase 3 — Backend Modules (each: controller/service/repository/routes/validation/types/DTOs)
- [x] 3.1 Suppliers — list (paginated/search/filter/sort), profile (contacts + distinct
      products purchased + purchase history + computed outstanding balance), create/update,
      soft-delete (deactivate — hard delete would break FK integrity with PO history and
      would be wrong even if it didn't), contacts sub-resource (add/remove). Also added
      `src/shared/pagination.ts` (page/pageSize/skip-take + a `booleanQueryParam` helper
      fixing the `z.coerce.boolean()` gotcha where any non-empty string coerces to `true`) —
      this is the reference pattern the remaining 13 modules will reuse.
      **Verified live:** list/create/profile/update/deactivate/contacts all curl-tested
      against the running server, including RBAC 403 (Sales Manager blocked from
      `suppliers:create`), 404s, and search-filter matching/non-matching. One test supplier
      created during verification was cleaned up afterward with a targeted delete — notably,
      `prisma migrate reset --force` was attempted first out of habit and Prisma's own
      built-in AI-agent safety guard blocked it (it requires explicit user consent via an env
      var before wiping a database), which correctly stopped an unnecessarily destructive
      action in favor of the targeted delete actually needed.
- [x] 3.2 Procurement (Purchase Orders + approval workflow) — full lifecycle DRAFT →
      PENDING_APPROVAL → APPROVED → ORDERED, plus REJECTED and CANCELLED branches, each
      transition guarded by `assertStatus` and recorded in shared `StatusHistory` with the
      acting user. Attachments use a new storage abstraction pulled forward from Phase 4
      (`shared/services/storage.service.ts` interface + `LocalStorageService` impl) — needed
      now, not worth deferring since PO/Expense attachments require it. Multer enforces a
      MIME-type whitelist and `MAX_UPLOAD_SIZE_MB`; downloads are authenticated (no public
      static file mount) and gated by `procurement:view`.
      **Verified live:** created/submitted/approved/marked-ordered a PO end-to-end
      (status history correctly attributed to each acting user); confirmed guards reject
      out-of-order transitions (approve while DRAFT → 400); reject-with-reason and
      cancel-while-DRAFT both tested; delete only succeeds while DRAFT (404 after); file
      upload rejects disallowed MIME types (400), accepts allowed ones, downloads with the
      right content-type, and delete removes the row **and** the file from disk (confirmed
      `uploads/` directory empty after). Test supplier/product/PO fixtures (Products/Inventory
      module doesn't exist yet, so a throwaway script created them directly via Prisma) were
      cleaned up with targeted deletes afterward, not a full reset.
- [x] 3.3 Shipments (containers, tracking, landed cost calc) — status progression BOOKED →
      IN_TRANSIT → ARRIVED_AT_PORT → CUSTOMS_CLEARANCE → DELIVERED with DELAYED as a lateral
      state reachable from anywhere and able to resume into any later stage (a real shipment
      delay isn't a dead end or a fixed rollback point). Landed cost summary allocates
      freight+insurance+duty+customs proportionally across shipment items: weighted by
      `quantity × PO unit price` when linked to a purchase order, falling back to even
      per-quantity weighting when not linked. Edit/delete blocked once DELIVERED/past BOOKED
      respectively.
      **Verified live:** landed-cost math hand-checked against the API response for a
      PO-linked shipment (450 freight + 50 insurance split 500 base cost across two items by
      PO value — got 277.78/222.22 exactly as calculated) and for a standalone shipment with
      no PO (300 freight split 60/40 by quantity — got 180/120, `poUnitCost: null` correctly
      shown); tested the full status walk BOOKED→IN_TRANSIT→DELAYED→DELIVERED with an invalid
      BOOKED→DELIVERED jump correctly rejected (400) first; confirmed edit/delete blocked
      post-delivery; timeline entries correctly attributed. Fixtures cleaned up via targeted
      delete.
- [x] 3.4 Inventory (stock levels, FIFO, goods receipt, low-stock/expiry alerts, valuation) —
      Categories/Warehouses/Products (finally real Product CRUD, with duplicate-SKU rejection
      and computed `stockOnHand`/`isLowStock` from summed lots) plus the stock-operations
      centerpiece: goods receipt (optionally against a PO — validates PO status is
      ORDERED/PARTIALLY_RECEIVED, caps received qty at ordered qty, updates
      `PurchaseOrderItem.receivedQuantity` and auto-transitions PO status to
      PARTIALLY_RECEIVED/RECEIVED with a `StatusHistory` entry), manual stock adjustments
      (increase upserts/tops-up a lot; decrease consumes FIFO oldest-lot-first via a shared
      `consumeFifo` helper written to be reusable by Sales fulfillment later), low-stock
      alerts, expiry alerts (day-count + already-expired flag), and inventory valuation
      (quantity × cost, per product + grand total).
      Added a compound unique constraint `@@unique([productId, warehouseId, lotNumber])` on
      `InventoryLot` mid-module (needed for the adjustment upsert) — applied via `db push
      --accept-data-loss` (safe: table was empty) then back-filled a matching migration file
      and `migrate resolve --applied` so migration history stays consistent for future
      `migrate dev` runs.
      **Verified live, extensively:** category/warehouse/product CRUD incl. 409 on duplicate
      SKU; goods receipt building two lots and confirming FIFO ordering in the product detail
      view; low-stock alert disappearing once stock exceeded reorder level; expiry alert
      correctly showing only the near-term lot with accurate `daysUntilExpiry`; valuation
      total hand-checked (30×9 + 25×11 = 545 ✓); FIFO decrease adjustment of 40 draining a
      30-unit lot fully plus 10 from the next lot, confirmed via resulting per-lot quantities;
      over-decrease correctly rejected with the actual-available count in the message; lot
      top-up via upsert. Then the full cross-module PO lifecycle: create → submit → approve →
      mark-ordered (Procurement) → partial goods receipt (12/20) → confirmed
      PARTIALLY_RECEIVED → over-receipt of remaining correctly rejected → received the exact
      remainder → confirmed RECEIVED with a complete 5-stage timeline spanning both modules.
      All test fixtures cleaned up with targeted deletes.
- [x] 3.5 Distributors (credit limit, balance, pricing group) — PricingGroup CRUD
      (deleting a group orphans its distributors' `pricingGroupId` to null rather than
      blocking, same rationale as Category/Product elsewhere) + Distributor CRUD/profile.
      Dropped the redundant stored `outstandingBalance` column from the schema (was never
      written to) in favor of computing it from unpaid `Invoice` amounts, matching the
      Suppliers module's approach — consistent architecture beats a field that can drift.
      Sales history and outstanding balance are correctly empty/zero right now since the
      Sales module doesn't exist yet; they'll populate once it's built.
      **Verified live:** pricing group + distributor creation, profile view (confirmed
      pricingGroup nested correctly, balance/history empty as expected), RBAC 403 for
      Accountant (no `distributors:create`), region filter matching/non-matching, credit
      limit update, pricing-group deletion correctly orphaning the distributor instead of
      failing on FK constraint, and soft-delete deactivation. Fixtures cleaned up via
      targeted delete.
- [x] 3.6 Sales (orders, invoices, returns, credit notes, discount/regional/volume pricing) —
      the biggest module so far. Sales Order lifecycle DRAFT→CONFIRMED (consumes stock FIFO
      from a chosen warehouse via Inventory's `consumeFifo`, atomically — any item with
      insufficient stock rolls back the whole confirm)→PROCESSING→SHIPPED→DELIVERED, with
      CANCELLED reachable from DRAFT/CONFIRMED/PROCESSING (reverses exactly the stock
      consumption transactions if any were made — precise per-lot reversal, not just an
      approximate restock). Pricing calculator (`shared/pricing.ts` — moved here from the
      sales module partway through once Distributors needed the exact same calculation, see
      below) stacks item discount + distributor pricing-group discount + automatic volume
      discount (≥50 units: +2.5%, ≥100: +5%), summed once and capped at 100%. Invoices
      (one active invoice per order enforced in code, not schema; net-30 default terms;
      payments recorded against them with overpayment rejected and status auto-updating
      PARTIALLY_PAID/PAID). Returns (only from SHIPPED/DELIVERED orders, quantity capped at
      remaining-returnable, optional restock into a chosen lot) and Credit Notes (auto-computed
      amount from the original line's effective per-unit price when derived from a return,
      auto-linked to the order's active invoice so its balance reflects the credit, one
      credit note per return enforced by both a service-level check and the schema's
      `@@unique` on `salesReturnId`).
      **Bug caught and fixed during verification:** the Distributors module (built one phase
      earlier) computed sales-history totals and outstanding balance with its own naive
      logic (item discount only, no pricing-group/volume/order discounts, and no credit-note
      deduction) — comparing its output against the Sales module's own totals for the same
      order caught the mismatch (2850 vs. the real 2425.5). Fixed by moving the pricing
      calculator to `shared/pricing.ts` and having Distributors' repository use the exact
      same function, plus adding credit-note deduction to its outstanding balance query.
      **Verified live, extensively — full order-to-cash cycle:** created an order (60 units,
      5% item discount, 2% order discount, distributor on a 10% pricing-group tier) and hand-
      verified the pricing math exactly (17.5% effective discount → 2475 line total → 2425.5
      order total); confirmed it and watched stock drop by exactly 60; re-confirm blocked;
      walked the full status ladder to DELIVERED; generated an invoice (correct net-30 due
      date, total matching the order); duplicate invoice on the same order correctly
      rejected (409); partial payment → PARTIALLY_PAID with correct balance; overpayment
      rejected with the exact remaining amount in the message; final payment → PAID; return
      of 10 units with restock confirmed stock went back up by exactly 10; credit note from
      that return computed the exact expected amount (412.5) and auto-linked to the invoice,
      correctly flipping its balance negative; duplicate credit note on the same return
      rejected (409); over-return rejected with the correct remaining-returnable count. Then
      a second order: confirmed (stock -30), cancelled while CONFIRMED (stock fully restored
      to its pre-confirm level), re-cancel and cancel-after-DELIVERED both correctly
      rejected. Then oversell protection: an order for far more than available stock was
      correctly rejected on confirm with the whole transaction rolled back (order stayed
      DRAFT, no partial deduction). Finally confirmed the Distributor profile now shows real,
      correct sales history and outstanding balance reflecting all of the above. All test
      fixtures cleaned up via targeted deletes.
**2026-07-14: user asked twice to parallelize; second time ("don't stop") actually dispatched
6 background agents** for the modules below (3.7, 3.8, 3.9, 3.12, 3.13, 3.14) since none share
files with each other. Each was explicitly instructed not to touch `app.ts`/`schema.prisma`/
the live database. I reviewed every module's code, wired all 6 into `app.ts` myself, ran a
full typecheck+lint pass on the merged result (clean), then live-curl-verified each exactly
like every self-written module — agent-written code got the same scrutiny, not less, and it
caught two real issues (below).

- [x] 3.7 Finance (GL, journal entries, P&L, balance sheet, cash flow, receivables/payables) —
      Bank Accounts + Chart of Accounts CRUD; Journal Entries with a double-entry balance
      guard (debits must equal credits within a 0.01 epsilon, minimum 2 lines); Receivables/
      Payables **correctly reuse** `distributorsRepository.outstandingBalance`/
      `suppliersRepository.outstandingBalance` directly (the agent was told to, and did) —
      verified live by creating a supplier with an ordered PO and confirming Suppliers' own
      profile and Finance's `/payables` report the exact same 1000 outstanding balance.
      Balance sheet hand-verified against real data: 500000 cash + 500 inventory valuation +
      0 receivables = 500500 assets, 1000 liabilities, 499500 equity — exact.
- [x] 3.8 Expenses (categories, attachments, reports) — category delete blocked (409) while
      expenses still reference it (categoryId is non-nullable, can't orphan); attachments
      reuse the exact procurement pattern (multer + storage service, authenticated download);
      deleting an expense cascades the DB rows and cleans up the physical files from disk
      (verified: `uploads/` empty after). **Bug fixed post-merge:** the report endpoint's
      `to` date filter used a bare coerced date (excludes same-day records after midnight) —
      fixed by applying the same end-of-day-inclusive transform the Finance agent had
      independently already added to its own date-range schema, for consistency.
- [x] 3.9 Tax & Compliance (GST, sales tax, withholding, e-invoice screen, FBR placeholder,
      audit logs, compliance dashboard) — simple Tax CRUD (hard delete, no dependents in
      schema); compliance dashboard computes a clearly-labeled simplified estimated liability
      (totalInvoiced × active GST rate); e-invoice endpoint returns a static "not integrated"
      response per the spec's explicit instruction; audit-logs endpoint correctly returns
      empty (nothing writes to `AuditLog` yet — known, separately-tracked gap, not a bug here).
- [ ] 3.10 Dashboard (aggregated KPIs + chart data endpoints) — NOT part of the parallel
      batch; depends on every other module's data, must be built last.
- [ ] 3.11 Reports (sales/purchase/inventory/profit/cash flow/supplier/distributor/expense/tax
      + PDF/Excel export, print-friendly) — also deferred to last for the same reason.
- [x] 3.12 Notifications (center + placeholder channels: email/SMS/WhatsApp/push, reminder +
      alert settings) — **RBAC bug fixed post-merge:** the agent (correctly following the
      general per-module permission-gating instruction it was given) gated list/read/
      unread-count behind `notifications:view`/`notifications:edit`, but none of the seeded
      non-admin roles have those permissions — since these operations are already scoped to
      the caller's own inbox via an ownership check in the service layer, only Super Admin
      could ever read their own notifications. Fixed by removing the permission gate from the
      personal-inbox endpoints (ownership check alone is the correct authorization there) and
      keeping `notifications:create` gated (creating a notification *for someone else* is the
      operation that actually needs a permission check). Verified live: Sales Manager can now
      read their own empty inbox with no special permission; marking another user's
      notification as read still correctly 404s (ownership check); Sales Manager still can't
      create notifications for others (403, no `notifications:create`).
- [x] 3.13 AI module (placeholder endpoints returning generated demo data only — no real AI) —
      best-selling-products and slow-moving-inventory are **real** aggregations (verified:
      correctly empty with no data, then correctly populated with a real product name/SKU and
      accurate `stockOnHand`/`lastSaleDate: null` once a product+stock existed); demand
      forecast/seasonal analysis/import recommendation/predictive charts are explicitly fake
      (`Math.random()`-generated) but pull real product names where applicable — verified the
      real product name flowed into a generated 6-month forecast correctly.
- [x] 3.14 Settings (company info, currency, exchange rates, users/roles/permissions, tax
      settings, email settings, notification settings, backup settings, system logs) —
      Company settings is a true singleton (verified: repeated GETs return the same row, no
      duplicates created); exchange rates normalize currency codes to uppercase; generic
      key-value system settings cover the spec's various "...settings" bullets without
      needing dedicated tables; users/roles listings are read-only (no create/edit — that's
      explicitly out of scope per the task given).

## Phase 4 — Integration Abstraction Layers (interfaces only, no real calls)
- [ ] 4.1 Define service interfaces + fake/mock implementations for: FBR e-Invoicing,
      WhatsApp Business API, SMS Gateway, Email Service, Currency Exchange API,
      AI Forecasting Engine, Cloud Storage (S3), Payment Gateway
- [ ] 4.2 Local file storage service behind the same interface as future S3 service

## Phase 5 — Demo Data Generation
- [ ] 5.1 Seed script: 50 products, 20 suppliers, 15 distributors
- [ ] 5.2 Seed script: 100 purchase orders, 300 sales orders, 1000 inventory transactions
- [ ] 5.3 Seed script: 12 months revenue/expenses/shipments/payments/receipts (consistent with
      each other so dashboard KPIs reconcile, not just random noise)
- [ ] 5.4 Seed users covering all 6 roles with hashed passwords

## Phase 6 — Frontend Setup
- [ ] 6.1 Next.js + TypeScript app, TailwindCSS, ShadCN UI installed/configured
- [ ] 6.2 React Query provider, React Hook Form + Zod conventions, Chart.js/Recharts setup
- [ ] 6.3 Auth flow (login, logout, forgot-password UI, profile, protected routes by role)

## Phase 7 — Shared UI / App Shell
- [ ] 7.1 Left sidebar (module nav, role-aware), top nav, breadcrumbs
- [ ] 7.2 Reusable components: cards, data table (filter/search/pagination/sort), charts
      wrapper, form fields, file upload
- [ ] 7.3 Dark mode support across the shell and components

## Phase 8 — Module Frontend Pages (mirrors Phase 3, module by module)
- [ ] 8.1 Executive Dashboard (all KPIs + 8 charts listed in spec)
- [ ] 8.2 Suppliers, Procurement, Shipments, Inventory, Distributors, Sales, Finance,
      Expenses, Tax & Compliance, Reports, Notifications, AI Dashboard (placeholder), Settings
      — one sub-step per module, each with list/detail/create/edit views as applicable

## Phase 9 — Reports Output
- [ ] 9.1 PDF export
- [ ] 9.2 Excel export
- [ ] 9.3 Print-friendly views

## Phase 10 — Polish & Demo Readiness
- [ ] 10.1 Responsive pass (desktop-first, but usable on tablet/laptop widths)
- [ ] 10.2 Cross-module navigation/consistency check
- [ ] 10.3 Basic backend tests (auth, sales, inventory happy paths)
- [ ] 10.4 README with setup instructions (docker up, migrate, seed, run web+api)
- [ ] 10.5 Decide + set up demo deployment target (see Gap #11) if the client needs a live link

---

## How to resume after a context reset
1. Check "Current Status" above for the active phase/step.
2. Check off completed items as they land; update "Next action" before ending a session if
   possible.
3. If this file's state looks stale compared to actual code (e.g. modules exist that aren't
   checked off), trust the code — update this file to match, don't trust the file blindly.
