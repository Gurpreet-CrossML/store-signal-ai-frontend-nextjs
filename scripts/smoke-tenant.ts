/**
 * Runtime smoke test of the multi-tenant data plane against the LIVE DB.
 *
 * Validates the exact mechanism src/lib/tenant-context.ts relies on — a
 * transaction-scoped `SET LOCAL search_path` over the Neon PgBouncer (pooler)
 * endpoint — and proves company isolation:
 *
 *   1. shared (public) tables are reachable (company + registries);
 *   2. under `SET LOCAL search_path TO "<tenant>", public`, the tenant's
 *      business tables are visible and return rows;
 *   3. WITHOUT activating a tenant, the business tables are NOT in `public`, so
 *      an unscoped query fails loudly (you can't accidentally read tenant data);
 *   4. `SET LOCAL` does not leak past its transaction (pooler-safe).
 *
 * Read-only. Run: `npm run db:smoke`.
 */
import { Pool, type PoolClient } from "pg";

import { scriptPoolConfig } from "./db-connection";
import { resolveRefSchema } from "./ref-schema";

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  ok ? passed++ : failed++;
}

async function count(client: PoolClient, table: string): Promise<number> {
  const { rows } = await client.query<{ n: string }>(
    `SELECT count(*)::int AS n FROM ${table}`,
  );
  return Number(rows[0].n);
}

async function main() {
  // Auto-discover an existing tenant schema (or DRIZZLE_REF_SCHEMA if set).
  const TENANT = await resolveRefSchema();
  const pool = new Pool(scriptPoolConfig());
  try {
    // 1. Shared public tables (always reachable, no tenant active).
    const shared = await pool.connect();
    try {
      const companies = await count(shared, "public.company");
      const memberships = await count(shared, "public.company_membership");
      const registry = await count(shared, "public.store_registry");
      check(
        "public tables reachable",
        companies >= 0,
        `${companies} companies`,
      );
      console.log(
        `   company_membership=${memberships}, store_registry=${registry}`,
      );

      // Identify the tenant's company-admin logins (for the app-level E2E).
      const admins = await shared.query<{ email: string; is_staff: boolean }>(
        `SELECT u.email, u.is_staff
           FROM public.auth_user u
           JOIN public.company_membership m ON m.user_id = u.id
           JOIN public.company c ON c.id = m.company_id
          WHERE c.schema_name = $1 AND u.is_superuser = false
          ORDER BY u.is_staff DESC, u.email`,
        [TENANT],
      );
      check(
        `tenant "${TENANT}" has a company admin`,
        admins.rows.some((r) => r.is_staff),
        admins.rows
          .map((r) => `${r.email}${r.is_staff ? " (admin)" : " (staff)"}`)
          .join(", ") || "none",
      );
    } finally {
      shared.release();
    }

    // 2. Tenant activation: business tables visible under SET LOCAL search_path.
    const t = await pool.connect();
    try {
      await t.query("BEGIN");
      await t.query(`SET LOCAL search_path TO "${TENANT}", public`);
      const stores = await count(t, "store");
      const threads = await count(t, "chat_thread");
      const grants = await count(t, "store_access");
      // A shared table still resolves (public on the path) inside the tenant tx.
      const companies = await count(t, "company");
      await t.query("COMMIT");
      check(
        `tenant "${TENANT}" business tables visible`,
        stores >= 0 && threads >= 0,
        `store=${stores}, chat_thread=${threads}, store_access=${grants}`,
      );
      check("shared table still resolves inside tenant tx", companies >= 0);
    } catch (err) {
      await t.query("ROLLBACK").catch(() => {});
      check("tenant activation", false, String(err));
    } finally {
      t.release();
    }

    // 3. Isolation: without a tenant active, business tables are NOT in public.
    const iso = await pool.connect();
    try {
      await iso.query("BEGIN");
      await iso.query(`SET LOCAL search_path TO public`);
      let leaked = true;
      try {
        await count(iso, "store");
      } catch {
        leaked = false; // relation "store" does not exist in public — correct
      }
      await iso.query("COMMIT");
      check(
        "business tables are NOT in public (unscoped query fails loudly)",
        !leaked,
      );
    } finally {
      iso.release();
    }

    // 4. SET LOCAL does not leak past its transaction (pooler safety).
    const leak = await pool.connect();
    try {
      await leak.query("BEGIN");
      await leak.query(`SET LOCAL search_path TO "${TENANT}", public`);
      await count(leak, "store");
      await leak.query("COMMIT");
      // New transaction on the SAME client: search_path must be back to default.
      await leak.query("BEGIN");
      let stillActive = true;
      try {
        await count(leak, "store");
      } catch {
        stillActive = false; // good — tenant schema no longer on the path
      }
      await leak.query("COMMIT");
      check("SET LOCAL did not leak to the next transaction", !stillActive);
    } finally {
      leak.release();
    }

    console.log(`\n${passed} passed, ${failed} failed`);
    if (failed) process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
