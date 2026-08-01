import { defineConfig } from "drizzle-kit";

// Django (django-tenants) owns the schema; drizzle-kit is introspect-only here.
// `npm run db:sync` pulls `public` (shared) + one reference tenant schema, then
// scripts/normalize-drizzle.ts rewrites the tenant tables to plain pgTable(...).
// The reference schema is auto-resolved by the orchestrators (scripts/ref-schema.ts)
// and passed in via DRIZZLE_REF_SCHEMA — never hard-coded, since it differs per
// environment (local/dev/prod). Run drizzle-kit through `npm run db:sync`/`db:check`.
const REF_SCHEMA = process.env.DRIZZLE_REF_SCHEMA;
if (!REF_SCHEMA) {
  throw new Error(
    "DRIZZLE_REF_SCHEMA not set — run `npm run db:sync` or `npm run db:check`, " +
      "which auto-resolve an existing tenant schema.",
  );
}

// The DB host serves a cert Node's trust store can't chain to a public root, so a
// `sslmode=verify-full` URL makes drizzle-kit die with an empty error and exit 1.
// Relax verification for introspection the same way scripts/db-connection.ts does
// for the other db:* tooling — this is read-only, not the request data plane.
// Local Postgres (`sslmode=disable`, or `localhost`/`127.0.0.1`) typically has no
// SSL support at all, so leave it alone there instead of forcing `no-verify`.
const DB_URL = new URL(process.env.DATABASE_URL!);
const disableSsl =
  DB_URL.searchParams.get("sslmode") === "disable" ||
  DB_URL.hostname === "localhost" ||
  DB_URL.hostname === "127.0.0.1";
if (!disableSsl) {
  DB_URL.searchParams.set("sslmode", "no-verify");
}

export default defineConfig({
  // Overridable so db:check can introspect into a throwaway dir for drift checks.
  out: process.env.DRIZZLE_OUT ?? "./src/lib/drizzle",
  dialect: "postgresql",
  schema: "./src/lib/drizzle/schema.ts",
  dbCredentials: {
    url: DB_URL.toString(),
  },
  // public = shared tables (auth + tenancy registries); the reference tenant =
  // canonical per-tenant DDL replicated across every company schema.
  schemaFilter: ["public", REF_SCHEMA],
  // django_tenants gives every schema its own `django_migrations`, so it exists
  // in both public and the tenant schema — a name collision drizzle-kit can't
  // resolve cleanly. We never query it, so exclude it from introspection.
  tablesFilter: ["!django_migrations"],
});
