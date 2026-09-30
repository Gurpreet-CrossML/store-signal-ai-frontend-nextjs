# Store Signals AI — Frontend

> The multi-tenant dashboard for Store Signals AI: a Next.js app where store
> owners and staff manage their chatbot, knowledge base, support and analytics.
> Every API it calls is served by the Django backend.

<p align="left">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
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
- [Auth & Tenancy](#auth--tenancy)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [Auth & Session](#auth--session)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)

---

## Overview

This is the operator-facing dashboard for **Store Signals AI**. Every API it
calls — authentication, provisioning, analytics, chat, support and the chat
runtime — is served by the Django backend. This app holds no data layer of its
own: the only route under `/api` is NextAuth's, and it exists to turn a Django
login into a browser session.

Because the backend is **multi-tenant** (schema-per-company via
`django-tenants`), the tenant a request belongs to travels in the JWT the
session carries; Django resolves the company schema and the caller's per-store
access on every call.

## Key Features

- 🔐 **Tenant-aware auth** — NextAuth (JWT) login against Django; the session carries the company (`company_code`), role (`is_staff`), and the user's accessible stores.
- ♻️ **Token refresh + identity sync** — the JWT callback refreshes the Django access token and re-pulls the identity bundle so role/company/grants stay current.
- 📊 **Dashboard & analytics** — conversation history, AI insights, conversion / engagement / feedback / operational-efficiency views.
- 🛍️ **Provisioning UI** — company profile, staff management, and per-store access grants (Django `/api/tenancy/` endpoints).
- 🧩 **One API surface** — every call goes to Django through a single axios instance, so auth, tenancy and validation live in one place.

## Architecture

```
                       ┌──────────────────────────────────────────────┐
   Browser (dashboard) │  Next.js 16 (App Router pages)               │
                       │  NextAuth session: company_code, is_staff,   │
                       │  accessible_stores                           │
                       └───────────────────────┬──────────────────────┘
                                               │
                                    every API call, with the
                                    session's Bearer token
                                               │
                                               ▼
                               ┌───────────────────────────────┐
                               │        Django backend         │
                               │  auth / provisioning /        │
                               │  analytics / chat runtime     │
                               └───────────────┬───────────────┘
                                               │
                                               ▼
                            ┌───────────────────────────────────────┐
                            │           PostgreSQL (RDS)            │
                            │  public (auth + tenancy registries)   │
                            │  <company> schemas (per-tenant data)  │
                            └───────────────────────────────────────┘
```

## Auth & Tenancy

- **Session identity.** `src/pages/api/auth/[...nextauth].ts` logs in against
  Django and persists `company_code` (the tenant schema), `is_staff`, and
  `accessible_stores` onto the NextAuth JWT/session. Superusers are rejected at
  login (the dashboard is for company admins/staff only).
- **One backend.** `src/redux/axios-config.tsx` points every request at Django
  and attaches the session's access token; `createAPIUrl` in `src/lib/config.ts`
  builds the URL. There is no second data path to keep in step.
- **Tenant + per-store access.** Django reads the tenant from the token's
  `tenant` claim and scopes each endpoint to the caller's stores, so a
  client-supplied `store_code` is validated server-side, never trusted.
- **Optimistic page gate.** `src/proxy.ts` only checks that a session exists
  before rendering a page; it never fetches.
- **Token refresh + identity sync.** The NextAuth `jwt` callback refreshes the
  Django access token when expired and re-pulls the identity bundle from
  `/api/auth/profile/` (cached, fail-open) so role/company/grant changes take
  effect without a re-login.

## Tech Stack

| Layer        | Technology                                    |
| ------------ | --------------------------------------------- |
| Framework    | Next.js 16 (App Router pages), React 19       |
| Language     | TypeScript 5                                  |
| Auth         | NextAuth v4 (JWT strategy), `jsonwebtoken`    |
| API          | Django REST Framework backend (single origin) |
| State / data | Redux Toolkit, Axios                          |
| UI           | Tailwind CSS 4, Radix UI / shadcn, Recharts   |
| Tooling      | ESLint, Prettier, Vitest                      |

## Project Structure

```
store-signals-ai-frontend/
├── src/
│   ├── app/                # App Router pages (login, dashboard, threads, knowledge, settings…)
│   ├── pages/api/auth/     # NextAuth route — the only API route in this app
│   ├── lib/                # config (endpoints), session-verify, helpers
│   ├── redux/              # Store, slices, axios config
│   ├── clients/            # Page-level client components
│   └── components/         # UI (custom + shadcn ui/)
└── package.json
```

## Getting Started

### Prerequisites

- **Node.js 20+**
- A running **Django backend** (for auth, provisioning, and writes)

### Installation

```bash
git clone <repository-url>
cd store-signals-ai-frontend
npm install
```

### Environment Variables

Create a `.env` (git-ignored) with at least:

```bash
# NextAuth
NEXTAUTH_SECRET=<random-secret>
NEXTAUTH_URL=http://localhost:3000

# Django backend base URL — every API call goes here
NEXT_PUBLIC_BASE_URL=http://localhost:8000

# Chatbot widget embed script, shown after onboarding
NEXT_PUBLIC_WIDGET_SCRIPT_URL=http://localhost:3000/widget/chatbot-widget.js
```

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

- `src/lib/session-verify.ts` — `refreshIdentity()` (Django `profile/`), cached ~60s and fail-open.
- The `jwt` callback — refreshes the access token via `token/refresh/` when expired.

## Available Scripts

| Script          | Purpose                    |
| --------------- | -------------------------- |
| `npm run dev`   | Start the dev server       |
| `npm run build` | Production build           |
| `npm run start` | Serve the production build |
| `npm run lint`  | ESLint                     |
| `npm run test`  | Vitest                     |

## Testing

```bash
npm run test
```

Vitest is wired up and passes with no test files; add specs as `src/**/*.test.ts`.

## Deployment

- Provide `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_BASE_URL` via the environment.
- Run `npm run build` then `npm run start` (or deploy to your Node host / Vercel).
- Point `NEXT_PUBLIC_BASE_URL` at the Django backend for the environment; nothing else needs backend access.

## License

Proprietary — © CrossML. All rights reserved. Internal use only unless a
separate license agreement applies.
