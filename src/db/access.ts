import { and, eq, inArray, sql, type SQL, type Column } from "drizzle-orm";

import { getDb, resolveStoreScope } from "@/lib/tenant-context";
import { store, chatThread } from "@/lib/drizzle/schema";

/**
 * Per-store access conditions for the dashboard data plane (F3).
 *
 * Company isolation is already enforced by the tenant `search_path` (F2); these
 * add the finer, intra-company restriction: a STAFF user only sees the stores
 * granted to them, while a company admin / platform superuser is unrestricted.
 *
 * Each helper returns a Drizzle `SQL` condition, or `null` when the caller is
 * unrestricted (so the query adds no store filter). Built with Drizzle's
 * `inArray` (correlated sub-selects), NOT a raw `= ANY(array)` — Drizzle's `sql`
 * template flattens an interpolated JS array into a scalar bind param, which
 * Postgres then rejects as a malformed array literal. An empty accessible set
 * yields a constant-false condition (matches nothing) — the "denied" outcome.
 */

// Matches no rows — used when the caller's accessible store set is empty.
const MATCH_NONE: SQL = sql`false`;

/** Restrict a `store_id` column to the caller's accessible stores. */
export function storeIdScope(
  storeIdColumn: Column,
  requested?: string | null,
): SQL | null {
  const scope = resolveStoreScope(requested);
  if (scope === null) return null;
  if (scope.length === 0) return MATCH_NONE;
  const accessibleStoreIds = getDb()
    .select({ id: store.id })
    .from(store)
    .where(inArray(store.code, scope));
  return inArray(storeIdColumn, accessibleStoreIds);
}

/** Restrict a `thread_id` column to threads whose store the caller may access. */
export function threadIdScope(
  threadIdColumn: Column,
  requested?: string | null,
): SQL | null {
  const scope = resolveStoreScope(requested);
  if (scope === null) return null;
  if (scope.length === 0) return MATCH_NONE;
  const accessibleStoreIds = getDb()
    .select({ id: store.id })
    .from(store)
    .where(inArray(store.code, scope));
  const accessibleThreadIds = getDb()
    .select({ id: chatThread.id })
    .from(chatThread)
    .where(inArray(chatThread.storeId, accessibleStoreIds));
  return inArray(threadIdColumn, accessibleThreadIds);
}

/** Restrict a `store.code` column directly to the caller's accessible stores. */
export function storeCodeScope(storeCodeColumn: Column): SQL | null {
  const scope = resolveStoreScope();
  if (scope === null) return null;
  if (scope.length === 0) return MATCH_NONE;
  return inArray(storeCodeColumn, scope);
}

/**
 * `<column> = <threadId>` for a thread-keyed lookup, additionally restricted to
 * threads whose store the caller may access. For an unrestricted caller this is
 * just the plain equality, so admins/superuser are unaffected. Pass either a
 * `thread_id` column or chat_thread's own `id` column.
 */
export function scopedThreadFilter(
  threadColumn: Column,
  threadId: string,
): SQL {
  const base = eq(threadColumn, threadId);
  const scope = threadIdScope(threadColumn);
  return scope ? and(base, scope)! : base;
}
