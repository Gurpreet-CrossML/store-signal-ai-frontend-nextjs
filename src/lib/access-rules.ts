import type { AccessLevel, AccessibleStore } from "@/lib/tenant-types";

/**
 * Pure tenancy / per-store access rules — the heart of cross-tenant and
 * per-store isolation, with NO dependency on the DB, AsyncLocalStorage, or
 * NextAuth. Kept dependency-free so the rules can be unit-tested directly
 * (see src/lib/__tests__/access-rules.test.ts) and reused by both the request
 * plumbing (with-tenant-route, tenant-context).
 */

/**
 * Per-store access for a request (mirrors backend §5b). `storeCodes` is the set
 * of stores a STAFF user may touch; it is `null` for a company admin
 * (`is_staff`), who is unrestricted within the active tenant. `levels` carries
 * the grant level per code (for write gating).
 *
 * Note: platform superusers (`is_superuser`) cannot sign in to the dashboard —
 * they are rejected at login (see api/auth/[...nextauth]) — so only company
 * admins (`is_staff=true`) and staff (`is_staff=false`) ever reach here.
 */
export type RequestAccess = {
  isStaff: boolean;
  storeCodes: string[] | null;
  levels: Record<string, AccessLevel>;
};

/** The session identity fields these rules read. */
export type SessionIdentity = {
  is_staff?: boolean;
  company_code?: string | null;
  accessible_stores?: AccessibleStore[];
};

// A company code IS a Postgres schema identifier and goes straight into a raw
// `SET LOCAL` (which can't be parameterized). It comes from a signed token, but
// we validate regardless. Mirrors the backend's schema-name rule
// (tenancy.models.build_company_code), allowing `_` defensively.
export const SCHEMA_RE = /^[a-z][a-z0-9_]{0,62}$/;

export function isValidSchemaName(code: string): boolean {
  return SCHEMA_RE.test(code);
}

/** Required access level for an HTTP method: reads → view, writes → manage. */
export function requiredLevel(method?: string): AccessLevel {
  return (method ?? "GET").toUpperCase() === "GET" ? "view" : "manage";
}

/**
 * Build the access context from the session identity. A company admin
 * (`is_staff`) is unrestricted within the active tenant (`storeCodes = null`);
 * staff are limited to their granted stores. The `accessible_stores` list is the
 * backend's authoritative computation.
 */
export function buildAccess(identity: SessionIdentity): RequestAccess {
  const stores = identity.accessible_stores ?? [];
  const unrestricted = Boolean(identity.is_staff);
  return {
    isStaff: Boolean(identity.is_staff),
    storeCodes: unrestricted ? null : stores.map((s) => s.code),
    levels: Object.fromEntries(stores.map((s) => [s.code, s.level])),
  };
}

/**
 * Resolve which store codes a query may touch, given an optional client-supplied
 * `store_code`. Never trust the param alone — it's validated against the
 * caller's accessible set here.
 *
 *  - `null`   → unrestricted (no store filter; company admin, no code)
 *  - `[code]` → scope to that one store (validated as accessible)
 *  - `[...]`  → a staff user's full accessible set (no specific code)
 *  - `[]`     → access denied / nothing accessible → query matches nothing
 */
export function resolveStoreScope(
  access: RequestAccess,
  requested?: string | null,
): string[] | null {
  const codes = access.storeCodes;
  if (codes === null) {
    // Company admin: any store in the active tenant.
    return requested ? [requested] : null;
  }
  // Staff: only their granted stores. A requested code must be in the set.
  if (requested) return codes.includes(requested) ? [requested] : [];
  return codes;
}

/**
 * Resolve the tenant schema a request runs in. A user is ALWAYS bound to their
 * own `company_code` (from the signed token) — there is no client-supplied
 * selector, so a user can never reach another tenant. Returns null when there is
 * no company, which the route turns into a 403.
 */
export function resolveTenant(identity: SessionIdentity): string | null {
  return identity.company_code ?? null;
}
