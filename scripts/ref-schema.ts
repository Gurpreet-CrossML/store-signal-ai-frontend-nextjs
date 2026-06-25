import { Pool } from "pg";

import { scriptPoolConfig } from "./db-connection";

/**
 * Resolve the reference tenant schema to introspect for the Drizzle DDL.
 *
 * All tenant schemas share identical DDL (one Django migration set), so ANY one
 * is sufficient as the template. The exact name is environment-specific — local,
 * dev, and prod each have different company schemas — so we never hard-code one.
 *
 * Resolution order:
 *   1. `DRIZZLE_REF_SCHEMA` if set — an explicit override (verified to exist).
 *   2. otherwise, auto-discover the first existing tenant schema in the DB.
 *
 * Read-only; used only by the build-time db:* tooling, never at runtime.
 */

const SYSTEM_SCHEMAS = [
  "public",
  "information_schema",
  "pg_catalog",
  "pg_toast",
];

export async function resolveRefSchema(): Promise<string> {
  const pool = new Pool(scriptPoolConfig());
  try {
    const { rows } = await pool.query<{ schema_name: string }>(
      `SELECT schema_name FROM information_schema.schemata
        WHERE schema_name <> ALL($1::text[]) AND schema_name NOT LIKE 'pg_%'
        ORDER BY schema_name`,
      [SYSTEM_SCHEMAS],
    );
    const tenantSchemas = rows.map((r) => r.schema_name);

    const explicit = process.env.DRIZZLE_REF_SCHEMA?.trim();
    if (explicit) {
      if (!tenantSchemas.includes(explicit)) {
        throw new Error(
          `DRIZZLE_REF_SCHEMA="${explicit}" does not exist in this database. ` +
            `Existing tenant schemas: ${tenantSchemas.join(", ") || "(none)"}.`,
        );
      }
      return explicit;
    }

    if (tenantSchemas.length === 0) {
      throw new Error(
        "No tenant schema found to introspect. Provision at least one company " +
          "(django-tenants), or set DRIZZLE_REF_SCHEMA to an existing schema.",
      );
    }

    const chosen = tenantSchemas[0];
    // Log to stderr so it never pollutes stdout (some callers capture stdout).
    console.error(
      `[ref-schema] auto-discovered reference tenant schema "${chosen}" ` +
        `(${tenantSchemas.length} tenant schema(s) present).`,
    );
    return chosen;
  } finally {
    await pool.end();
  }
}
