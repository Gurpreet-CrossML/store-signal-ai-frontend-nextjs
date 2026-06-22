# Multi-Tenancy — Frontend (Next.js + Drizzle) Implementation Plan

**Status:** Backend is **implemented and gate-green**; frontend **not started** — start at F0/F1 (§13) against the contract in §1a.
**Companion doc:** the backend plan in `store-signals-ai-backend/docs/MULTITENANCY_PLAN.md` (esp. §14 — frontend data-plane impact, and §3 — SHARED vs TENANT app split). Read it first; this doc is the frontend half of the same milestone.

> ⚠️ **Next.js version note:** per `AGENTS.md`, this is Next.js 16 with breaking changes from older versions. Before writing any Next-specific code (middleware runtime, route handlers, `getServerSession`, etc.), read the relevant guide under `node_modules/next/dist/docs/`. Code skeletons below are illustrative of intent, not copy-paste-final.

---

## 1. Locked decisions (inherited from the backend plan)

- **Isolation = schema-per-tenant** (`django-tenants`): each company's business tables live in a dedicated Postgres **schema**; a shared **`public`** schema holds users/auth and the tenancy registries.
- **No subdomains.** Tenant is resolved from the authenticated user's identity (JWT `tenant` claim), carried into the Next session.
- **Backend (Django)** owns `auth/`, provisioning (Django admin), and the chat runtime (widget/WebSocket/workflows).
- **Frontend (Next.js + Drizzle)** owns the **dashboard data plane** — all business read/(eventually) write APIs — against the **same Postgres DB**.
- Therefore **tenant scoping and per-store access for dashboard data are enforced here, in Node** — `django-tenants` does **not** route Drizzle's connection.
- **Clean database** at launch (no data migration).
- **Roles:** `is_superuser` = platform operator; `is_staff=True` = company admin (implicit `manage` on all company stores); `is_staff=False` = staff with explicit per-store grants (`StoreAccess`, level `view`/`manage`).

---

## 1a. Backend status & API contract (IMPLEMENTED — integrate against this)

The backend half is **done and passing CI** (`django-tenants` schema-per-tenant, identity routing, provisioning, registries, per-store access model, chat-runtime tenant routing). The frontend integrates against the contract below — nothing here is "to be built" on the backend.

### What exists in the database now

- **`public` (shared) tables** — also what Drizzle introspects as shared (qualify to `pgSchema("public")`, §5.3): `auth_user` + `django_*`, and the new tenancy tables: **`company`**, **`company_domain`**, **`company_membership`**, **`store_registry`** (global `code → company`, `store_pk`), **`thread_registry`** (`thread_id → company`).
- **per-tenant schema tables** (plain `pgTable`, resolved by search_path): `store`, **`store_access`** (NEW — `user`/`store`/`level` `view|manage`/`granted_by`; FK to public `auth_user`), `store_credentials`, `chatbot_widget_customization`(+m2m), `quick_action`, `quick_link`, `store_faqs`, `otp_store`, `chat_customer`, `chat_address`, `chat_thread`, `chatbot_feedback`, `chat_botevent`, `chat_history`, `ai_insights`, `sentiment_analysis`, `session_resolution_verdict`, `user_metadata`, `support_ticket`(+attachment), `_scrapeLinkslinks`, `knowledge_storelibrarydocument`.
- **`store.code` is now globally unique** (allocated via `store_registry`). S3 upload paths are keyed by `store.code` (not `store.id`).

> So when you run `npm run db:sync` (F0), `schema.ts` will include the 4 new public tables + `store_access`. The §4 mapping still holds; just add these.

> **Note (latest `pre-dev` pull):** newer backend migrations also added support-ticket fields to `store_credentials` (`support_ticket_platform`, `support_ticket_api_url`, `support_ticket_api_key`, `support_ticket_username`) and reworked a store field — not contract-affecting, but they change tenant-schema DDL, so just **re-run `npm run db:sync` after `migrate_schemas`** to pick them up. Always introspect against a tenant whose schema is fully migrated.

### Auth (Django) — `/api/auth/` — all responses use the envelope `{ status, message, data }`

- **`POST /api/auth/login/`** — body `{ email, password }`. `data`:
  ```jsonc
  {
    "token": "<access JWT>", "refresh": "<refresh JWT>",
    "email": "...", "username": "...", "name": "...",
    "company_code": "acmeretail" | null,        // schema; null for the platform superuser
    "is_staff": true, "is_superuser": false,
    "accessible_stores": [ { "code": "acmeretail", "level": "manage" }, ... ]
  }
  ```
  The **access JWT carries claims** `tenant` (= `company_code`), `is_staff`, `is_superuser`. The Django tenant middleware routes API requests by the `tenant` claim — but **that only affects Django's own endpoints; it does NOT route Drizzle** (see §14.2, still your job).
- **`POST /api/auth/token/refresh/`** — body `{ refresh }` → `data: { "access": "<new access JWT>" }` (SimpleJWT `TokenRefreshSerializer`; the new access token preserves the `tenant`/role claims). ⚠️ The key is **`access`**, not `token`.
- **`POST /api/auth/token/verify/`** — body `{ token }` _or_ `Authorization: Bearer <token>` → `data` = the same identity bundle as login minus the JWTs (`email`, `name`, `is_staff`, `is_superuser`, `company_code`, `accessible_stores`). Use this in middleware to validate a session and refresh tenant/role (it also catches company deactivation — a deactivated user's token is rejected). 401 on invalid/expired.
- **`POST /api/auth/logout/`** — `IsAuthenticated`; stateless ack (client discards tokens).
- **`GET /api/auth/profile/`** — `IsAuthenticated` → `data` = the identity bundle.

### Company & staff management (Django) — `/api/tenancy/` — `Authorization: Bearer <token>` required

Scoping is enforced server-side: **company-admin** endpoints act only on the caller's own company; the companies list is **superuser-only**.

- **`GET /api/tenancy/company/`** / **`PATCH /api/tenancy/company/`** — company admin views/edits own company profile (`logo`, `email`, `phone`, `street`, `city`, `state`, `country`; `name`/`schema_name`/`is_active` read-only). PATCH supports multipart (logo).
- **`GET /api/tenancy/staff/`** — list the company's users `[{ id, email, first_name, last_name, is_active, is_staff }]`.
- **`POST /api/tenancy/staff/`** — create staff `{ first_name, last_name, email }` → `{ id, email, credentials_emailed }` (password auto-generated + emailed; staff = `is_staff=false`).
- **`PATCH /api/tenancy/staff/<id>/`** — `{ is_active: bool }` to activate/deactivate a staff user in the company.
- **`POST /api/tenancy/staff/<id>/reset-password/`** — regenerate + email a new password. Company admin → their staff; superuser → company admins.
- **`GET /api/tenancy/companies/`** — superuser only; all companies (pipeline/operator use).

### Roles & access

- `is_superuser` → platform operator (Django `/admin/` only; tenant-less token).
- `is_staff=true` → **company admin**: implicit `manage` on **all** stores in the company.
- `is_staff=false` → **staff**: only the stores in `accessible_stores`, at the given `level`.
- The frontend **enforces per-store `view`/`manage` for dashboard data in Node** (F3) using `accessible_stores` (or by reading `store_access` live within the tenant schema). Backend does not enforce dashboard-data access — it only supplies the truth.

### CORS (browser → Django)

Any call made **directly from the browser** to Django (e.g. the `/api/tenancy/*` and `/api/auth/*` endpoints hit from client components / redux thunks) is cross-origin, so Django must allow the dashboard origin. Set in the backend `.env`:

```ini
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001
```

(Match the frontend's actual dev port.) Auth is via **Bearer token**, not cookies, so credentialed-CORS isn't required. Calls made from the **Next.js server** (e.g. NextAuth `authorize()`, or any server action / route handler proxying to Django) are server-to-server and need no CORS — that's why login worked before any CORS was configured.

### Things the frontend does NOT need to touch

- **Chat runtime** (public widget HTTP + WebSocket + `genai_workflow`) is fully tenant-routed in Django (via `store_registry`/`thread_registry`). The Next.js dashboard does not call it.
- **Cross-tenant `X-Company` selector** is for the platform superuser / Lambda pipelines only — not the dashboard.

### Recommended frontend starting point

1. **F0** — `db:sync` tooling; introspect `public` + a reference tenant schema; confirm the 4 new public tables + `store_access` appear, split shared vs tenant in `schema.ts` (§5).
2. **F1** — extend NextAuth to persist `company_code`/`is_staff`/`is_superuser`/`accessible_stores` from the login `data`; wire middleware to `verify-token`.
3. **F2** — `withTenant`/`getDb` schema routing; migrate `src/db/*` to it.
   Then F3 (access enforcement), F4 (staff/company UI calling the `/api/tenancy/` endpoints above), F5 (isolation tests).

---

## 2. Current frontend architecture (as-is)

- **API layer:** Pages-Router routes in `src/pages/api/**` (e.g. `analytics/threads.ts`, `store/list.ts`, `analytics/threads/[thread_id]/*`). Each route parses query params, calls a `src/db/*.ts` function, and wraps the result with `createAPIResponse` / `createPaginatedResponse` (`src/lib/helpers.ts`, `src/lib/config.ts`). Routes are **ports of Django GET views**; writes currently go to Django.
- **Data layer:** `src/db/{store,threads,analytics,support,knowledge}.ts` — Drizzle queries importing table defs from `src/lib/drizzle/schema.ts`.
- **DB client:** `src/lib/db.ts` — a single `drizzle(node-postgres)` pool over `DATABASE_URL` (RDS via nginx TCP passthrough, custom SSL). **No `search_path` is set** → all unqualified tables resolve to `public`.
- **Schema:** `src/lib/drizzle/schema.ts` + `relations.ts` + `0000_*.sql` + `meta/` — produced by `drizzle-kit pull` against the current single-schema DB. **Every table is `pgTable("…")` (unqualified ⇒ `public`).**
- **Auth:** `src/pages/api/auth/[...nextauth].ts` — NextAuth Credentials provider calls Django `/api/auth/login/` and stores Django's `access_token`/`refresh` in the NextAuth JWT. Session exposes `access_token`, `email`, `username`, `name` — **no tenant, role, or store access.**
- **Gate:** `src/middleware.ts` — `getToken()` (NextAuth JWT); `/api/*` requires a token (else 401), pages redirect to `/login`. **No tenant/access logic.**
- **Store scoping today:** routes read a client-supplied `store_code` query param and `src/db` filters `eq(store.code, store_code)` — **untrusted**, no ownership check.

---

## 3. What multi-tenancy changes (the core problem)

Under `django-tenants`, the business tables (`store`, `chat_*`, `analytics_*`, `support_*`, `knowledge_*`) **move out of `public`** into per-tenant schemas. Drizzle's pool still targets the default search*path, and the table defs are unqualified, so **every existing ported query would read `public` and find nothing / error**. `django-tenants` only rewrites \_Django's* connection — it has **zero effect on the `pg` pool in `src/lib/db.ts`**.

So the frontend must gain three capabilities it doesn't have today:

1. **Know the tenant** for each request (from the session).
2. **Activate that tenant's schema** on the Drizzle connection per request (`search_path`).
3. **Enforce per-store access** (`view`/`manage`) for the session user.

---

## 4. Schema landscape — which tables live where

Authoritative source = the backend's `SHARED_APPS` / `TENANT_APPS` split (backend plan §3). Mapping the tables currently in `src/lib/drizzle/schema.ts`:

### `public` schema (shared)

- `django_migrations`, `django_content_type`, `django_admin_log`, `django_session`
- `auth_user`, `auth_group`, `auth_permission`, `auth_user_groups`, `auth_group_permissions`, `auth_user_user_permissions`
- **NEW (tenancy app):** `company`, `company_membership`, `store_registry`, `thread_registry`

### per-tenant schema (one per company)

- `store`, `store_credentials`, `chatbot_widget_customization`, `chatbot_widget_customization_quick_actions`, `quick_action`, `quick_link`, `store_faqs`
- `otp_store`, `chat_customer`, `chat_address`, `chat_thread`, `chatbot_feedback`, `chat_botevent`, `chat_history`
- `ai_insights`, `sentiment_analysis`, `session_resolution_verdict`, `user_metadata`
- `support_ticket`, `support_ticket_attachment`
- `_scrapeLinkslinks` (knowledge scrape links), `knowledge_storelibrarydocument`
- **NEW:** `store_access` (per-store staff grant; FK → tenant `store`, FK → public `auth_user` — a cross-schema FK)

> There are **no table-name collisions** between the two sets, so with `search_path = "<tenant>", public` an unqualified reference resolves to the tenant table when it exists and falls back to `public` otherwise. We still **explicitly qualify the shared tables** (`company`, registries, `auth_user`) to `public` in Drizzle to remove ambiguity (§6).

### How to verify what actually exists in each schema

Drizzle defs are the design intent; to confirm the live DB, query `information_schema` directly:

```sql
-- tables per schema
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema IN ('public', '<tenant_schema>')
ORDER BY table_schema, table_name;

-- columns for one table in a given schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = '<schema>' AND table_name = '<table>'
ORDER BY ordinal_position;

-- list every tenant schema (django-tenants schemas; exclude system + public)
SELECT schema_name FROM information_schema.schemata
WHERE schema_name NOT IN ('public','information_schema','pg_catalog','pg_toast')
ORDER BY 1;
```

A small npm script (`scripts/inspect-schemas.ts`) running these via the existing `pg` client is the recommended way to audit drift between Django migrations and `schema.ts`.

---

## 5. Pulling migrations / Drizzle introspection across schemas

### 5.1 How it works today

`drizzle.config.ts` points `dbCredentials.url` at `DATABASE_URL` and writes to `out: ./src/lib/drizzle`. Running `npx drizzle-kit pull` introspects the DB and regenerates `schema.ts`, `relations.ts`, the SQL snapshot, and `meta/`. Default introspection is the `public` schema only, so today every table is emitted as a plain `pgTable(...)`.

### 5.2 The multi-schema complication

`drizzle-kit pull` with `schemaFilter` can introspect non-`public` schemas, but for any table in a non-public schema it emits **schema-qualified** defs:

```ts
export const tenantX = pgSchema("tenant_x");
export const store = tenantX.table("store", { ... });
```

That hard-codes a specific tenant schema — wrong for us, because the **same** table defs must work for **every** tenant via runtime `search_path`. We want tenant tables as **plain, unqualified** `pgTable(...)`.

### 5.3 Recommended introspection workflow

Maintain `schema.ts` as two clearly-separated groups:

- **Shared tables** → explicitly qualified to `public` via a `pgSchema("public")` instance (so they always resolve to `public` regardless of the active tenant search_path).
- **Tenant tables** → plain `pgTable(...)` (unqualified ⇒ resolved by the per-request `search_path`).

Concrete process to (re)generate after backend migrations:

1. Bring up a reference DB created by the backend with **one** tenant (e.g. schema `reference`) plus `public`.
2. `drizzle-kit pull` twice (or with `schemaFilter`):
   - against `public` → shared tables (emitted as plain `pgTable`, since public is default) and the tenancy tables.
   - against the `reference` tenant schema → tenant tables (emitted as `pgSchema("reference").table(...)`).
3. **Normalize:** a small codemod (`scripts/normalize-drizzle.ts`) rewrites the reference-schema defs: strip the `pgSchema("reference")` wrapper so tenant tables become plain `pgTable(...)`; wrap the shared tables under a single `export const publicSchema = pgSchema("public")` and re-point them (`publicSchema.table(...)`). Output the merged `schema.ts`.
4. Commit the regenerated `schema.ts`/`relations.ts`. Treat **Django migrations as the source of truth**; re-run this whenever backend models change (CI check in §11).

> Alternative (simpler, more manual): keep the current single-schema pull as the base, then hand-edit `schema.ts` once to (a) wrap the four+six shared tables under `pgSchema("public")` and (b) leave business tables as `pgTable`. Thereafter, re-pull into a scratch file and diff to catch column changes. Given the schema is fairly stable, this is acceptable, but the codemod is more robust.

### 5.4 Keeping `relations.ts` valid

Cross-schema relations (e.g. `store_access.user → public.auth_user`) must reference the `publicSchema` table objects. Verify `relations.ts` after normalization; Drizzle relations work across `pgSchema` instances as long as both table objects are imported.

### 5.5 `npm run db:sync` — automated schema sync (dev + deploy)

**Authority model (important):** **Django owns the schema.** It runs `migrate_schemas` (DDL across `public` + every tenant). Drizzle is **read-only w.r.t. DDL** — it never runs `push`/`generate`/`migrate` against this DB. The "sync" is therefore an **introspect → normalize → write `schema.ts`** pipeline, never a DDL mutation. This keeps the two ORMs from fighting over the schema.

Add to `package.json`:

```jsonc
"scripts": {
  // Pull from public + the reference tenant schema, then normalize to
  // publicSchema-qualified shared tables + plain tenant tables, then format.
  "db:sync":  "drizzle-kit pull && tsx scripts/normalize-drizzle.ts && eslint --fix src/lib/drizzle",
  // CI/deploy guard: re-introspect to a temp dir and fail if it differs from the committed schema.
  "db:check": "tsx scripts/db-check.ts",
  // Ad-hoc audit of which tables/columns exist per schema (information_schema).
  "db:inspect": "tsx scripts/inspect-schemas.ts"
}
```

`drizzle.config.ts` gains a `schemaFilter` and a reference-tenant env var:

```ts
export default defineConfig({
  out: "./src/lib/drizzle",
  dialect: "postgresql",
  schema: "./src/lib/drizzle/schema.ts",
  dbCredentials: { url: process.env.DATABASE_URL! },
  // public = shared tables; the reference tenant = canonical tenant DDL.
  schemaFilter: ["public", process.env.DRIZZLE_REF_SCHEMA ?? "reference"],
});
```

- `DRIZZLE_REF_SCHEMA` = a **canonical tenant schema** that always reflects the latest migrations — either a dedicated template company (recommended: provision a `reference` company in every environment) or any known live tenant. All tenant schemas share identical DDL, so one reference is sufficient.
- `scripts/normalize-drizzle.ts` performs the §5.3 transform deterministically (strip `pgSchema("<ref>")` → plain `pgTable`; group shared tables under `publicSchema`).

**Deployment ordering (clean, no friction):**

1. Backend deploy runs `python manage.py migrate_schemas` (DDL authority).
2. Frontend deploy runs **`npm run db:check`** _before_ `next build` — it re-introspects the just-migrated DB and **fails the build on drift**, so a stale `schema.ts` can never ship. (Committed `schema.ts` is the build input; `db:check` proves it matches reality.)
3. If you prefer auto-regeneration over a guard, run `npm run db:sync` in the pre-build step instead of `db:check` — but `db:check` + a committed schema is the more reproducible, reviewable path (schema changes show up in PRs).

This is the command you run locally after any backend migration (`npm run db:sync`, commit the diff) and what CI/deploy enforces (`npm run db:check`).

---

## 6. Tenant switching (the central mechanism)

### 6.1 Tenant identity

The active tenant = `session.company_code` (the Postgres `schema_name`), delivered by the extended login/verify payload (§7). It must be present and validated on every dashboard request; absence ⇒ 401/403.

### 6.2 Production approach: request-scoped tenant context (no `tx` threading)

The frictionless, scalable pattern is a **request-scoped tenant context** held in Node's `AsyncLocalStorage` (ALS). The route layer establishes it once; every `src/db/*.ts` function reads the tenant-bound Drizzle handle from ALS — **no parameter threading, no global mutation, no way to forget the schema** (calling `getDb()` outside a tenant scope throws).

```ts
// src/lib/tenant-context.ts  (illustrative — confirm Next 16 runtime specifics first)
import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { pool } from "@/lib/db"; // export the pg Pool from db.ts

type TenantCtx = { db: ReturnType<typeof drizzle>; companyCode: string };
const als = new AsyncLocalStorage<TenantCtx>();

const SCHEMA_RE = /^[a-z][a-z0-9_]{0,62}$/; // SET cannot be parameterized → validate + quote

export async function runWithTenant<T>(
  companyCode: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!SCHEMA_RE.test(companyCode)) throw new Error("Invalid tenant");
  const client = await pool.connect(); // dedicated client for this request
  try {
    await client.query(`SET search_path TO "${companyCode}", public`);
    const tdb = drizzle(client);
    return await als.run({ db: tdb, companyCode }, fn);
  } finally {
    // reset so a recycled pooled client never carries a stale schema, then release
    await client.query("SET search_path TO public").catch(() => {});
    client.release();
  }
}

export function getDb() {
  const ctx = als.getStore();
  if (!ctx) throw new Error("getDb() called outside a tenant scope");
  return ctx.db;
}
export function currentCompany() {
  return als.getStore()?.companyCode ?? null;
}
```

A thin route wrapper establishes the scope from the session, so individual routes stay clean:

```ts
// src/lib/with-tenant-route.ts  (Pages Router handler factory)
export function withTenantRoute(handler: NextApiHandler): NextApiHandler {
  return async (req, res) => {
    const session = await getSession(req); // tenant + role + accessible_stores (§7)
    const companyCode = resolveTenant(session, req); // session claim, or superuser ?company= selector (§11)
    if (!companyCode)
      return res.status(403).json(createAPIResponse(false, "No tenant", null));
    return runWithTenant(companyCode, () => handler(req, res));
  };
}
```

Then `src/db/*.ts` simply does `const db = getDb();` — multi-step helpers like `list_threads` share the one connection/schema automatically, with no `tx` argument.

### 6.3 Why this lives in the Node route layer, not Edge middleware

Schema activation needs a `pg` connection, which is **unavailable in the Edge runtime**. So `src/middleware.ts` (Edge) only does auth + tenant _extraction_; the actual `runWithTenant` happens in the **Node** API-route layer via `withTenantRoute`. (Confirm Next 16 runtime config in `node_modules/next/dist/docs/` before implementing.)

### 6.4 Safety & pooling

- **Raw `SET` is contained:** `companyCode` is regex-validated and identifier-quoted (it comes from a signed token, but we validate regardless). It's the only raw-SQL spot and it's hardened.
- **Dedicated client per request** + session-level `SET search_path` is safe with `node-postgres` (each request owns its client) and is reset on release so recycled clients never carry a stale schema.
- **Pool sizing:** because a client is held for the request's DB span, size the pool for peak concurrent dashboard requests; keep handlers DB-bound (don't hold the client across long external awaits).
- **If a transaction-mode pooler (PgBouncer) is ever added:** switch `runWithTenant` to wrap the work in an explicit transaction using `SET LOCAL search_path` (transaction-scoped), which is the pooler-safe equivalent. The ALS interface (`getDb()`) stays identical, so `src/db/*` code never changes.

### 6.4 Shared-table access

Reads/writes to `public` tables (`company`, `company_membership`, `store_registry`, `thread_registry`, `auth_user`) use the `publicSchema`-qualified Drizzle objects (§5.3), so they work whether or not a tenant transaction is active. The Node side rarely writes these (provisioning is Django's job) — mostly it reads `company_membership`/`store_access` for access checks.

---

## 7. Auth & session changes

### 7.1 Extend the Django login/verify payload

Backend (companion plan §5c/§14.3a) returns, on login and on **verify-token**:

- `company_code` (= tenant schema) — `null` for the platform superuser
- `is_staff`, `is_superuser`
- `accessible_stores`: `[{ code, level }]` (omitted/ignored for company admins, who get all)

### 7.2 NextAuth callbacks

`src/pages/api/auth/[...nextauth].ts` — extend the `jwt` and `session` callbacks to persist `company_code`, `is_staff`, `is_superuser`, and `accessible_stores` from the Django login response (today they carry only email/username/name/access_token). Update the `next-auth` / `next-auth/jwt` module augmentations accordingly.

### 7.3 Middleware: validate token + carry tenant

`src/middleware.ts` currently trusts the local NextAuth JWT (`getToken`). Per the requirement to use Django's **verify-token**:

- Keep `getToken` for the fast path (signature/expiry of the NextAuth session).
- Optionally call Django `POST /api/auth/verify-token/` to confirm the wrapped Django `access_token` is still valid and to refresh `company_code`/role (covers the company-deactivation cascade — a deactivated user's token must stop working). Cache briefly to avoid a Django round-trip per request.
- **Runtime constraint:** middleware runs on the Edge runtime by default; `pg`/`jsonwebtoken` (Node APIs) are **not** available there. `fetch` to Django is fine. If local JWT verification with `jsonwebtoken` is needed, pin that work to the Node runtime or do it inside the API route, not Edge middleware. **Confirm the Next 16 middleware runtime options in the docs before implementing.**
- The resolved `company_code`/role are read from the session inside each API route (not injected via headers), so the route can call `withTenant`.

---

## 8. Per-store access enforcement (in Node)

A single resolver mirrors backend §5b, but runs here for dashboard data:

```ts
// pseudo
function requiredLevel(method: string): "view" | "manage" {
  return method === "GET" ? "view" : "manage";
}
```

Resolution for `(session, store, level)`:

1. `session.is_superuser` → allow (platform; uses the `?company=` selector to pick a tenant).
2. `session.is_staff` (company admin) → allow `manage` on any store in the active tenant.
3. else look up `store_access` (tenant schema) for `(auth_user.id == session userId, store)`:
   - `manage` satisfies `view`+`manage`; `view` satisfies `view`; none → deny.

Application:

- **Listing endpoints** (`list_stores`, `list_threads`, …) filter to the user's accessible stores. For staff, join/restrict to `store_access` store ids; for admins, no restriction within the tenant.
- **`store_code` query param** is validated against the accessible set; if absent, default to "all accessible". It is never trusted as the sole scoping mechanism.
- **Writes** (when write endpoints move to Node) require `manage`.
- Build a `resolveAccess(session)` helper that returns the accessible store-id set (reading `store_access` via `getDb()` inside the active tenant scope, or short-cached from the session list), used by every `src/db` function.

---

## 9. Request lifecycle (end-to-end)

1. Browser → Next API route (`/api/...`) with NextAuth session cookie.
2. `middleware.ts`: validate session (and optionally Django verify-token) → allow; else 401/redirect.
3. API route handler: read session (`company_code`, role, `accessible_stores`); reject if no tenant (and not a superuser+selector call).
4. `withTenantRoute` → `runWithTenant(company_code, …)`: checks out a client, sets `search_path`, binds a Drizzle handle into the ALS context for the request.
5. Inside: `src/db` helpers call `getDb()`; `resolveAccess(session)` restricts to accessible stores; queries hit the **tenant schema** (+ `public` for shared tables).
6. Wrap result in the existing `createAPIResponse` / `createPaginatedResponse` envelope. Response shape is unchanged from today.

---

## 10. New Django-backed integrations the dashboard UI needs

These are **auth/provisioning** features that live in Django; the frontend just calls them (client → Django, `target: "django"` in `ENDPOINTS`). Add UI + endpoint entries for:

- **Company admin:** company profile edit (logo/address/email/phone); create staff user; reset staff password; activate/deactivate staff user; list staff.
- **Session/auth:** refresh token, verify token, logout, profile.
- Add these to `src/lib/config.ts` `ENDPOINTS` with `createAPIUrl(path, "django")`, and build the corresponding screens/forms (staff management, company settings). No Drizzle involved for these.

---

## 11. Pipelines & cross-tenant (ties to backend §6b / §14.4)

- Lambdas authenticate as the **platform superuser** and call API endpoints. After the split, some endpoints they need are served by **Node** (`/api/analytics/threads/`) and some by **Django** (`/api/chat/follow-up-message/`, `/api/knowledge/scrape-links/`).
- For any **Node** endpoint a pipeline calls, Node must accept the same cross-tenant selection convention as Django: a **platform JWT** plus `X-Company: <code>` / `?company=` (superuser-only), which `withTenant` uses as the schema. Normal sessions ignore the selector and use their own `company_code`.
- **Open item (§13):** confirm the final Node-vs-Django endpoint split so the selector is implemented consistently.

---

## 12. Risks & caveats

- **Isolation now depends on Node** always running inside a tenant scope; a query that bypasses it leaks across tenants. Mitigate with the single enforced entrypoint (`src/db/*` use **only** `getDb()`, never the raw pool/`db`) + a lint rule banning the raw `db`/`pool` import outside `db.ts`/`tenant-context.ts`. `getDb()` throwing outside a scope makes a bypass fail loudly rather than silently cross tenants.
- **Edge runtime** can't run `pg`/`jsonwebtoken`; keep DB + heavy JWT work in API routes (Node runtime), not middleware.
- **`SET LOCAL` requires a transaction** and identifier-validated schema names; never interpolate unvalidated input.
- **Drizzle multi-schema introspection** emits `pgSchema`-qualified defs for non-public schemas; the normalization step (§5.3) is required and must be re-run on backend schema changes.
- **DDL drift:** all tenant schemas must share identical DDL (they do, coming from the same Django migrations). A schema that lags migrations breaks queries — gate with the `inspect-schemas` audit.
- **`relations.ts` cross-schema FKs** (`store_access → public.auth_user`) must reference the `publicSchema` objects.

---

## 13. Phased delivery (lockstep with backend Phase 1–3)

- **F0 — Prep & tooling:** `drizzle.config.ts` `schemaFilter` + `DRIZZLE_REF_SCHEMA`; `scripts/normalize-drizzle.ts` (codemod), `scripts/db-check.ts` (drift guard), `scripts/inspect-schemas.ts` (audit); wire `db:sync` / `db:check` / `db:inspect` npm scripts (§5.5).
- **F1 — Identity in session:** consume the extended Django login/verify payload; extend NextAuth `jwt`/`session` (+ module augmentation) to carry `company_code`, `is_staff`, `is_superuser`, `accessible_stores`; update `middleware.ts` (verify-token + tenant), respecting Edge-runtime limits.
- **F2 — Schema routing:** export the `pg` `pool` from `src/lib/db.ts`; add `src/lib/tenant-context.ts` (`runWithTenant`/`getDb`, ALS) and `src/lib/with-tenant-route.ts`; convert `schema.ts` to `publicSchema`-qualified shared tables + plain tenant tables (§5.3); refactor every `src/db/*.ts` function to use `getDb()` (drop the global `db` import) and wrap every API route in `withTenantRoute`.
- **F3 — Access enforcement:** `resolveAccess` + `requiredLevel`; filter listings to accessible stores; constrain `store_code`; gate writes (as write endpoints land) on `manage`.
- **F4 — Provisioning UI:** company settings + staff management screens calling the new Django endpoints (§10); `ENDPOINTS` additions.
- **F5 — Hardening:** cross-tenant isolation tests (a company-A user cannot read company-B data by forging `store_code`/params/selector); superuser selector tests; CI audit that `schema.ts` matches the live reference DB.

---

## 14. Open items

1. **Node-vs-Django endpoint split** for pipeline-facing and write endpoints (§11) — confirm the final list.
2. **Middleware verify strategy** — every request vs short-cached vs only on session refresh (latency vs freshness for the deactivation cascade); confirm under Next 16 runtime constraints.
3. **Introspection approach** — automated codemod (§5.3 recommended) vs one-time manual edit + diff workflow.
4. **`accessible_stores` source at request time** — live `store_access` read inside the tenant tx (always fresh) vs session-embedded list (fewer queries, staler). Default: live read, with a short per-request memo.
