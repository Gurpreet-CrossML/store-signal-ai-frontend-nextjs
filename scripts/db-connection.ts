/**
 * Shared pg connection config for the maintenance scripts (db:inspect / db:check).
 *
 * These run outside Next.js, so they don't go through `src/lib/db.ts`. Hosted DBs
 * (e.g. Neon, publicly-trusted TLS cert) need SSL but we don't pin a CA here —
 * these are read-only introspection tools, not the request data plane. Local
 * Postgres (`sslmode=disable`) doesn't speak TLS at all, so SSL must stay off
 * there or the server rejects the connection with "does not support SSL".
 */
export function scriptPoolConfig() {
  const url = new URL(process.env.DATABASE_URL!);
  const sslmode = url.searchParams.get("sslmode");
  // node-postgres doesn't understand libpq's sslmode/channel_binding query
  // params; strip them and drive SSL through the explicit `ssl` option.
  const sslDisabled = url.searchParams.get("sslmode") === "disable";
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");
  return {
    connectionString: url.toString(),
    ssl: sslmode === "disable" ? false : { rejectUnauthorized: false },
  };
}
