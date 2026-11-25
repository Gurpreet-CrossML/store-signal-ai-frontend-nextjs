/**
 * Tiny in-memory TTL cache for the dashboard analytics payload.
 *
 * Dashboard analytics tolerate a few minutes of staleness, so caching the
 * combined result per (tenant, store, date-range) avoids re-running ~30 DB
 * queries on every load / re-render / navigation — the main DB-cost driver.
 *
 * Tenant-safe: the key is always prefixed with the company schema, so one
 * company can never read another's cached data. Callers must also have already
 * passed the per-store access check before caching (denied requests are not
 * cached — see get_dashboard_summary), so an accessible user only ever reads a
 * store's canonical data.
 *
 * Per Node instance (resets on restart/redeploy); good enough for a short TTL.
 */

type Entry = { data: unknown; expires: number };

// A few minutes stale is acceptable for analytics (confirmed with product).
const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 1000;

const cache = new Map<string, Entry>();

export function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expires <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

export function setCached(key: string, data: unknown): void {
  // Coarse bound: clear wholesale once too large (entries are short-lived).
  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(key, { data, expires: Date.now() + TTL_MS });
}
