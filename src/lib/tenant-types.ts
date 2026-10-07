/**
 * Shared tenancy/identity types mirroring the Django login/verify payload
 * (account/serializers.py, tenancy/services.user_context). Kept in one place so
 * the NextAuth session, the route wrapper, and the access resolver agree.
 */

/** A store in the user's company. A role applies to every store. */
export type AccessibleStore = { code: string };

/** Staff roles (Django `CompanyMembership.Role`); a company admin is `admin`. */
export type StaffRole =
  | "admin"
  | "supervisor"
  | "agent"
  | "content_manager"
  | "viewer";

/** Permission keys (Django `tenancy.roles.ROLE_PERMISSIONS`). */
export type Permission =
  | "conversations"
  | "copilot"
  | "knowledge"
  | "team_metrics"
  | "ticket_tags"
  | "reassignment"
  | "open";

/**
 * What the user may do, as Django computed it from their role. A permission
 * the role cannot even read is absent.
 */
export type PermissionMap = Partial<Record<Permission, "read" | "write">>;

/** The identity bundle the dashboard carries for tenant routing + access. */
export type Identity = {
  /** Tenant schema (= company code); null for the platform superuser. */
  company_code: string | null;
  /** Company admin → may do everything. */
  is_staff: boolean;
  /** The user's role; null when they have no active membership. */
  role: StaffRole | null;
  /** What the role allows (see `can` in access-rules). */
  permissions: PermissionMap;
  /** Every store in the company. */
  accessible_stores: AccessibleStore[];
  /** Present when the profile endpoint reports onboarding (login always does). */
  onboarding_pending?: boolean;
  onboarding_step?: string | null;
};
