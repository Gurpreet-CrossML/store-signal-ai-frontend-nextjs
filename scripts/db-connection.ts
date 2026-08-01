/**
 * Shared pg connection config for the maintenance scripts (db:inspect / db:check /
 * db:sync).
 *
 * These run outside Next.js, so they don't go through `src/lib/db.ts`. Against
 * the hosted DB (Neon, publicly-trusted TLS cert) we connect over SSL but don't
 * pin a CA here — these are read-only introspection tools, not the request data
 * plane. Against a local Postgres (`sslmode=disable`, or `localhost`/`127.0.0.1`)
 * we skip SSL entirely, since local Postgres installs typically don't have it
 * enabled and will reject the handshake.
 */
export function scriptPoolConfig() {
  const url = new URL(process.env.DATABASE_URL!);
  const disableSsl =
    url.searchParams.get("sslmode") === "disable" ||
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1";
  // node-postgres doesn't understand libpq's sslmode/channel_binding query
  // params; strip them and drive SSL through the explicit `ssl` option.
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");
  return {
    connectionString: url.toString(),
    ssl: disableSsl ? false : { rejectUnauthorized: false },
  };
}
