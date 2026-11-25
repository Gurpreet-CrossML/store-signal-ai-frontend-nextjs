/**
 * Ad-hoc audit of which tables/columns exist per schema (information_schema).
 *
 * Run: `npm run db:inspect`  (loads .env via tsx --env-file).
 *
 * Django (django-tenants) owns the schema. This script never mutates anything;
 * it only reads `information_schema` so we can see drift between the live DB and
 * the committed Drizzle `schema.ts`, and pick a reference tenant schema for
 * introspection (see DRIZZLE_REF_SCHEMA / scripts/normalize-drizzle.ts).
 */
import { Pool } from "pg";

import { scriptPoolConfig } from "./db-connection";

const SYSTEM_SCHEMAS = ["information_schema", "pg_catalog", "pg_toast"];

async function main() {
  const pool = new Pool(scriptPoolConfig());
  try {
    const { rows: schemas } = await pool.query<{ schema_name: string }>(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name <> ALL($1::text[])
         AND schema_name NOT LIKE 'pg_%'
       ORDER BY schema_name`,
      [SYSTEM_SCHEMAS],
    );

    const { rows: tables } = await pool.query<{
      table_schema: string;
      table_name: string;
    }>(
      `SELECT table_schema, table_name FROM information_schema.tables
       WHERE table_type = 'BASE TABLE'
         AND table_schema <> ALL($1::text[])
         AND table_schema NOT LIKE 'pg_%'
       ORDER BY table_schema, table_name`,
      [SYSTEM_SCHEMAS],
    );

    const bySchema = new Map<string, string[]>();
    for (const s of schemas) bySchema.set(s.schema_name, []);
    for (const t of tables) {
      if (!bySchema.has(t.table_schema)) bySchema.set(t.table_schema, []);
      bySchema.get(t.table_schema)!.push(t.table_name);
    }

    for (const [schema, names] of bySchema) {
      const tag = schema === "public" ? " (shared)" : " (tenant)";
      console.log(`\n=== ${schema}${tag} — ${names.length} tables ===`);
      console.log(names.join(", ") || "(none)");
    }

    const tenantSchemas = [...bySchema.keys()].filter((s) => s !== "public");
    console.log(
      `\nTenant schemas (${tenantSchemas.length}): ${tenantSchemas.join(", ") || "(none)"}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
