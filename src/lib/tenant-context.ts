import { AsyncLocalStorage } from "node:async_hooks";

import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  isValidSchemaName,
  resolveStoreScope as resolveStoreScopeRule,
  type RequestAccess,
} from "@/lib/access-rules";

// Re-export so existing importers (with-tenant-route, etc.) are unaffected.
export type { RequestAccess };
export { requiredLevel } from "@/lib/access-rules";

/**
 * Request-scoped tenant context.
 *
 * Under django-tenants the business tables live in a per-company Postgres
 * schema, but Drizzle's pool targets the default search_path (→ `public`). So
 * every dashboard request must activate its tenant's schema on the connection
 * itself. We do that once, at the route boundary (see with-tenant-route.ts), and
 * stash a tenant-bound Drizzle handle in AsyncLocalStorage. Every `src/db/*`
 * helper then reads it via `getDb()` — no parameter threading, and calling
 * `getDb()` outside a tenant scope throws, so a query can never silently run in
 * the wrong (or no) schema.
 *
 * Pooler-safe by construction: the multi-tenant DB is reached through Neon's
 * PgBouncer (transaction-mode) endpoint, where a session-level `SET search_path`
 * would not reliably persist across statements. We instead wrap each request's
 * work in a single transaction and use `SET LOCAL search_path` (transaction
 * scoped). All of a multi-step helper's queries share that one transaction, so
 * they see the same schema; the search_path is gone the moment the transaction
 * ends, so a recycled backend never carries a stale tenant.
 */

// The Drizzle transaction handle type (what db.transaction's callback receives).
type TenantTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type TenantCtx = { db: TenantTx; companyCode: string; access: RequestAccess };

const als = new AsyncLocalStorage<TenantCtx>();

/**
 * Run `fn` with the given company's schema active. Opens one transaction, sets
 * `search_path = "<companyCode>", public` for its duration, and binds a
 * tenant-scoped Drizzle handle into AsyncLocalStorage for `getDb()`.
 */
export async function runWithTenant<T>(
  companyCode: string,
  access: RequestAccess,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isValidSchemaName(companyCode)) {
    throw new Error(`Invalid tenant schema: ${JSON.stringify(companyCode)}`);
  }
  return db.transaction(async (tx) => {
    // SET LOCAL can't take a bind param; companyCode is identifier-validated
    // above and quoted here. `public` stays on the path for the shared tables
    // (auth_user, company, registries — see publicSchema in drizzle/schema.ts).
    await tx.execute(
      sql.raw(`SET LOCAL search_path TO "${companyCode}", public`),
    );
    return als.run({ db: tx, companyCode, access }, fn);
  });
}

/** The tenant-scoped Drizzle handle for the current request. Throws if called
 *  outside a `runWithTenant` scope (fail loud rather than leak across tenants). */
export function getDb(): TenantTx {
  const ctx = als.getStore();
  if (!ctx) {
    throw new Error(
      "getDb() called outside a tenant scope. Wrap the route in withTenantRoute().",
    );
  }
  return ctx.db;
}

/** The active company code, or null when outside a tenant scope. */
export function currentCompany(): string | null {
  return als.getStore()?.companyCode ?? null;
}

/**
 * Run a batch of tenant queries sequentially on the request's single connection.
 *
 * The tenant transaction holds ONE pg client (required for pooler-safe
 * `SET LOCAL`), and a single client cannot run queries concurrently — firing
 * them with `Promise.all` makes node-postgres queue them and emit a deprecation
 * warning (and it will throw in pg v9). Drizzle query builders are lazy, so this
 * awaits each in turn (same wall-clock as the queued Promise.all, no warning).
 * Tuple result types are preserved, so existing destructuring still works.
 */
export async function runSequentially<T extends readonly unknown[] | []>(
  queries: T,
): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
  const results: unknown[] = [];
  for (const query of queries) {
    results.push(await query);
  }
  return results as { -readonly [P in keyof T]: Awaited<T[P]> };
}

/** The per-store access for the current request. Throws outside a tenant scope. */
export function currentAccess(): RequestAccess {
  const ctx = als.getStore();
  if (!ctx) {
    throw new Error("currentAccess() called outside a tenant scope.");
  }
  return ctx.access;
}

/**
 * Resolve which store codes the current request may touch (validating an
 * optional client-supplied `store_code` against the caller's access). Thin ALS
 * wrapper over the pure rule in access-rules.ts.
 */
export function resolveStoreScope(requested?: string | null): string[] | null {
  return resolveStoreScopeRule(currentAccess(), requested);
}
