/**
 * Shared tenancy/identity types mirroring the Django login/verify payload
 * (account/serializers.py, tenancy/services.user_context). Kept in one place so
 * the NextAuth session, the route wrapper, and the access resolver agree.
 */

/** Per-store grant level. `manage` ⊇ `view`. */
export type AccessLevel = "view" | "manage";

/** A store the session user may operate on, with the granted level. */
export type AccessibleStore = { code: string; level: AccessLevel };

/** The identity bundle the dashboard carries for tenant routing + access. */
export type Identity = {
  /** Tenant schema (= company code); null for the platform superuser. */
  company_code: string | null;
  /** Company admin → implicit manage on all company stores. */
  is_staff: boolean;
  /** Stores + levels (empty/ignored for company admins, who get all). */
  accessible_stores: AccessibleStore[];
};
