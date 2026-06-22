import { describe, it, expect, beforeAll, afterAll } from "vitest";

import type { RequestAccess } from "@/lib/access-rules";

/**
 * F5 — cross-tenant + per-store isolation proven at the SQL level against the
 * LIVE multi-tenant DB, using two real tenants. Read-only (no seeding).
 *
 * Needs DATABASE_URL (with ≥2 tenant schemas); self-skips otherwise, so it runs
 * locally / in the deploy pipeline but not in the DB-less PR CI. The DB modules
 * are imported dynamically inside the suite so the file is import-safe when
 * skipped (src/lib/db.ts requires DATABASE_URL at module load).
 */

const HAS_DB = Boolean(process.env.DATABASE_URL);

// All tenant schemas share identical DDL, so a fixed pair is fine here.
const TENANT_A = process.env.DRIZZLE_REF_SCHEMA || "crossml";
const TENANT_B = TENANT_A === "myntra" ? "crossml" : "myntra";

// A company-admin (unrestricted) access context — isolates the TENANT axis.
const UNRESTRICTED: RequestAccess = {
  isStaff: true,
  storeCodes: null,
  levels: {},
};

describe.skipIf(!HAS_DB)("cross-tenant isolation (live DB)", () => {
  let tc: typeof import("@/lib/tenant-context");
  let storeDb: typeof import("@/db/store");
  let threadsDb: typeof import("@/db/threads");
  let db: typeof import("@/lib/db");

  beforeAll(async () => {
    tc = await import("@/lib/tenant-context");
    storeDb = await import("@/db/store");
    threadsDb = await import("@/db/threads");
    db = await import("@/lib/db");
  });

  afterAll(async () => {
    await db?.pool.end().catch(() => {});
  });

  const storesIn = (schema: string) =>
    tc.runWithTenant(schema, UNRESTRICTED, () => storeDb.list_stores());

  it("each tenant sees only its own stores — code sets are disjoint", async () => {
    const a = await storesIn(TENANT_A);
    const b = await storesIn(TENANT_B);
    const aCodes = new Set(a.map((s) => s.code));
    const bCodes = new Set(b.map((s) => s.code));

    // Store codes are globally unique, so a tenant's listing can NEVER contain
    // another tenant's store. (The two listings come from the same code path —
    // only the active search_path differs.)
    for (const code of aCodes) expect(bCodes.has(code)).toBe(false);
    expect(a.length).toBeGreaterThan(0); // both tenants are provisioned
    expect(b.length).toBeGreaterThan(0);
  });

  it("a store_code from tenant B yields no rows inside tenant A", async () => {
    const b = await storesIn(TENANT_B);
    const foreignCode = b[0]?.code;
    expect(foreignCode).toBeTruthy();

    // Forge tenant B's store_code into a query running in tenant A's schema.
    // A's schema has no such store, so the scoped subquery matches nothing.
    const { count } = await tc.runWithTenant(TENANT_A, UNRESTRICTED, () =>
      threadsDb.list_threads({ store_code: foreignCode }, 1, 15),
    );
    expect(count).toBe(0);
  });

  it("staff are restricted to their granted stores within a tenant", async () => {
    const all = await storesIn(TENANT_A);
    const granted = all[0]!.code;
    const staffAccess: RequestAccess = {
      isStaff: false,
      storeCodes: [granted],
      levels: { [granted]: "view" },
    };
    const visible = await tc.runWithTenant(TENANT_A, staffAccess, () =>
      storeDb.list_stores(),
    );
    expect(visible.map((s) => s.code)).toEqual([granted]);
  });
});
