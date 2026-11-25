/**
 * Shared pg connection config for the maintenance scripts (db:inspect / db:check).
 *
 * These run outside Next.js, so they don't go through `src/lib/db.ts`. The DB is
 * Neon (publicly-trusted TLS cert), so we connect over SSL but don't pin a CA
 * here — these are read-only introspection tools, not the request data plane.
 */
export function scriptPoolConfig() {
  const url = new URL(process.env.DATABASE_URL!);
  // node-postgres doesn't understand libpq's sslmode/channel_binding query
  // params; strip them and drive SSL through the explicit `ssl` option.
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");
  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
  };
}
