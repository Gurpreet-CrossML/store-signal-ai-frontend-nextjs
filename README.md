# Store Signals AI — Frontend

> The multi-tenant dashboard for Store Signals AI: a Next.js app where store
> owners and staff manage their chatbot, knowledge base, support and analytics —
> with a **Drizzle data plane** that reads the same PostgreSQL database directly,
> tenant-scoped per request.

<p align="left">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="Drizzle" src="https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black">
  <img alt="NextAuth" src="https://img.shields.io/badge/NextAuth-JWT-EB5424">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Multi--tenant-4169E1?logo=postgresql&logoColor=white">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-Proprietary-lightgrey">
</p>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Multi-Tenancy](#multi-tenancy)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [Auth & Session](#auth--session)
- [Available Scripts](#available-scripts)
- [Drizzle Schema Sync](#drizzle-schema-sync)
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)

---

## Overview

This is the operator-facing dashboard for **Store Signals AI**. It talks to the
Django backend for authentication, provisioning and the chat runtime, but the
**dashboard data plane lives here in Node**: business reads are served by this
app's own `/api/*` routes using **Drizzle** against the **same PostgreSQL
database** the backend uses, while writes are proxied to Django.

Because the backend is **multi-tenant** (schema-per-company via
`django-tenants`), every Drizzle query must run inside the correct company
schema. The app sets the tenant `search_path` **per request** and enforces
per-store access in Node — see [Multi-Tenancy](#multi-tenancy).

## Key Features

- 🔐 **Tenant-aware auth** — NextAuth (JWT) login against Django; the session carries the company (`company_code`), role (`is_staff`), and the user's accessible stores.
- 🏢 **Schema-per-tenant data plane** — every business query runs with `SET LOCAL search_path` to the caller's company schema, via a transaction-scoped `withTenant()` wrapper.
- 🛡️ **Per-store access enforcement** — reads are filtered to the user's accessible stores; a client-supplied `store_code` is always validated, never trusted.
- ♻️ **Token refresh + identity sync** — the JWT callback refreshes the Django access token and re-pulls the identity bundle so role/company/grants stay current.
- 📊 **Dashboard & analytics** — conversation history, AI insights, conversion / engagement / feedback / operational-efficiency views, served by local Drizzle routes.
- 🛍️ **Provisioning UI** — company profile, staff management, and per-store access grants (Django `/api/tenancy/` endpoints).
- 🧩 **Introspected schema** — Drizzle schema generated from the live DB across `public` + a reference tenant schema, kept in one unified `schema.ts`.

## Architecture

```
                       ┌──────────────────────────────────────────────┐
   Browser (dashboard) │  Next.js 16 (App Router pages + Pages API)     │
                       │  NextAuth session: company_code, is_staff,     │
                       │  accessible_stores                             │
                       └───────────────┬───────────────┬───────────────┘
                                       │               │
                       writes (POST/PUT/PATCH/DELETE)   │ reads (GET)
                                       │               │
                                       ▼               ▼
                            ┌────────────────┐   ┌──────────────────────────┐
                            │ Django backend │   │ Next /api/* (withTenant) │
                            │ auth /         │   │  Drizzle queries         │
                            │ provisioning / │   │  SET LOCAL search_path   │
                            │ chat runtime   │   │  = "<company>", public   │
                            └───────┬────────┘   └────────────┬─────────────┘
                                    │                         │
                                    ▼                         ▼
                            ┌───────────────────────────────────────┐
                            │           PostgreSQL (RDS)             │
                            │  public (auth + tenancy registries)   │
                            │  <company> schemas (per-tenant data)  │
                            └───────────────────────────────────────┘
```

## Multi-Tenancy

The dashboard's reads bypass Django and hit Postgres directly through Drizzle,
so **tenant isolation is enforced in Node**:

- **Session identity.** `src/pages/api/auth/[...nextauth].ts` logs in against
  Django and persists `company_code` (the tenant schema), `is_staff`, and
  `accessible_stores` onto the NextAuth JWT/session. Superusers are rejected at
  login (the dashboard is for company admins/staff only).
- **Per-request schema activation.** `src/lib/tenant-context.ts` exposes
  `runWithTenant()`, which opens **one transaction**, runs
  `SET LOCAL search_path TO "<company_code>", public`, and stashes a
  tenant-scoped Drizzle handle in `AsyncLocalStorage`. `getDb()` reads that
  handle and **throws if called outside a tenant scope**, so a query can never
  silently fall back to `public`. `SET LOCAL` is transaction-scoped, so it is
  pooler-safe.
- **Route boundary.** `src/lib/with-tenant-route.ts` (`withTenantRoute`) wraps
  every `/api/*` data route: it resolves the session, verifies it against
  Django (`/api/auth/token/verify/`, cached), resolves the tenant, and runs the
  handler inside `runWithTenant`.
- **Per-store access.** `src/lib/access-rules.ts` + `src/db/access.ts` filter
  reads to the caller's accessible stores and gate writes on `manage`; a
  client-supplied `store_code` is validated against the grant set.
- **Token refresh + identity sync.** The NextAuth `jwt` callback refreshes the
  Django access token when expired and re-pulls the identity bundle from
  `/api/auth/profile/` (cached, fail-open) so role/company/grant changes take
  effect without a re-login.

> The Drizzle schema spans schemas: `npm run db:sync` introspects `public` plus a
> reference tenant schema and keeps one unified `schema.ts` (the runtime
> `search_path` selects the active tenant). See [Drizzle Schema Sync](#drizzle-schema-sync).

## Tech Stack

| Layer            | Technology                                                       |
|------------------|------------------------------------------------------------------|
| Framework        | Next.js 16 (App Router pages + Pages-router API), React 19        |
| Language         | TypeScript 5                                                     |
| Auth             | NextAuth v4 (JWT strategy), `jsonwebtoken`                        |
| Data plane       | Drizzle ORM over `node-postgres` (`pg`)                          |
| Database         | PostgreSQL (RDS), schema-per-tenant (`django-tenants` upstream)   |
| State / data     | Redux Toolkit, Axios                                             |
| UI               | Tailwind CSS 4, Radix UI / shadcn, Recharts                      |
| Tooling          | drizzle-kit (introspect), ESLint, Vitest, tsx                    |

## Project Structure

```
store-signals-ai-frontend/
├── src/
│   ├── app/                # App Router pages (login, dashboard, threads, knowledge, settings…)
│   ├── pages/api/          # API routes — auth ([...nextauth]) + tenant-scoped data routes
│   ├── db/                 # Drizzle data-access (analytics, threads, store, knowledge, support, access)
│   ├── lib/                # tenant-context, with-tenant-route, access-rules, db, config, session-verify
│   │   └── drizzle/        # Generated schema.ts + relations.ts (introspected, do not hand-edit)
│   ├── redux/              # Store, slices, axios config
│   ├── clients/            # Page-level client components
│   └── components/         # UI (custom + shadcn ui/)
├── scripts/                # db-sync / db-check / inspect-schemas / smoke-tenant (Drizzle tooling)
├── drizzle.config.ts
└── package.json
```

## Getting Started

### Prerequisites

- **Node.js 20+**
- Access to the **same PostgreSQL** database the backend uses (the tenant schemas must already exist — they are provisioned by the backend)
- A running **Django backend** (for auth, provisioning, and writes)

### Installation

```bash
git clone <repository-url>
cd store-signals-ai-frontend
npm install   # postinstall fetches the Amazon RDS CA bundle (global-bundle.pem)
```

### Environment Variables

Create a `.env` (git-ignored) with at least:

```bash
# Direct DB connection for the Drizzle data plane (same DB as the backend)
DATABASE_URL=postgres://user:pass@host:5432/dbname

# NextAuth
NEXTAUTH_SECRET=<random-secret>
NEXTAUTH_URL=http://localhost:3000

# Django backend base URL (auth, provisioning, writes)
NEXT_PUBLIC_BASE_URL=http://localhost:8000

# Optional: base for this app's own /api routes (defaults to relative paths)
NEXT_PUBLIC_FRONTEND_URL=

# Drizzle introspection (set automatically by `npm run db:sync`/`db:check`;
# only needed when invoking drizzle-kit directly)
# DRIZZLE_REF_SCHEMA=<an existing tenant schema name>
# DRIZZLE_OUT=./src/lib/drizzle
```

> SSL to Postgres is auto-configured in `src/lib/db.ts`: Neon hosts use standard
> verification; RDS-behind-proxy verifies against the bundled RDS CA while
> skipping the (proxy-broken) hostname check.

### Running the App

```bash
npm run dev      # development server at http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
```

## Auth & Session

Login is handled by NextAuth's Credentials provider against Django's
`POST /api/auth/login/`. The session is a JWT carrying `access_token`,
`refresh_token`, and the tenant/identity claims (`company_code`, `is_staff`,
`accessible_stores`). Session validity and identity freshness are maintained by:

- `src/lib/session-verify.ts` — `isSessionActive()` (Django `token/verify/`, enforces the company-deactivation cascade) and `refreshIdentity()` (Django `profile/`), both cached ~60s and fail-open.
- The `jwt` callback — refreshes the access token via `token/refresh/` when expired.

## Available Scripts

| Script              | Purpose                                                       |
|---------------------|---------------------------------------------------------------|
| `npm run dev`       | Start the dev server                                          |
| `npm run build`     | Production build                                              |
| `npm run start`     | Serve the production build                                    |
| `npm run lint`      | ESLint                                                        |
| `npm run test`      | Vitest (cross-tenant isolation tests self-skip without `DATABASE_URL`) |
| `npm run db:sync`   | Introspect the live DB and regenerate the Drizzle schema      |
| `npm run db:check`  | Verify the committed schema matches the live DB (drift check) |
| `npm run db:inspect`| Inspect available schemas                                     |
| `npm run db:smoke`  | Smoke-test tenant schema activation                          |

## Drizzle Schema Sync

Django (`django-tenants`) owns the database schema; drizzle-kit is
**introspect-only**. `npm run db:sync` pulls `public` (shared auth + tenancy
registries) plus **one reference tenant schema** (all tenants share identical
DDL), then `scripts/normalize-drizzle.ts` rewrites the tenant tables to plain
`pgTable(...)` so the runtime `search_path` resolves them per tenant. The
reference schema is auto-resolved per environment (never hard-coded) and passed
via `DRIZZLE_REF_SCHEMA`. Run `npm run db:check` in CI to catch drift between the
committed `schema.ts` and the live database.

## Testing

```bash
npm run test
```

Vitest covers the pure access rules and a live **cross-tenant isolation** suite
(`src/db/__tests__/cross-tenant.test.ts`) proving a user of one company cannot
read another's data even by forging a `store_code`. The DB-backed tests
self-skip when `DATABASE_URL` is absent, so DB-less CI still passes.

## Deployment

- Provide `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_BASE_URL` via the environment.
- Run `npm run build` then `npm run start` (or deploy to your Node host / Vercel).
- Ensure the deploy reaches the **same Postgres** as the backend and that the RDS CA bundle (`global-bundle.pem`, fetched on `postinstall`) is present when connecting to RDS.
- Run `npm run db:check` as a release gate to confirm the schema matches the live DB.

## License

Proprietary — © CrossML. All rights reserved. Internal use only unless a
separate license agreement applies.
