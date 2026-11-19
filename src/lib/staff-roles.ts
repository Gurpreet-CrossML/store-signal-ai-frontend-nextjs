import type { StaffRole } from "@/lib/tenant-types";

/** Display name of every role, the store owner's included. */
export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Store owner",
  manager: "Store manager",
  agent: "Support agent",
  content_manager: "Content manager",
};

/**
 * The roles a staff user can be given, with what each allows. There is one
 * owner per company, so `admin` is not offered. Who may give which comes
 * from Django (`managed_roles` on the session, see useManagedRoles).
 */
export const ASSIGNABLE_ROLES: {
  value: Exclude<StaffRole, "admin">;
  description: string;
}[] = [
  {
    value: "manager",
    description:
      "Everything except billing, AI usage and the company profile; manages agents and content managers.",
  },
  {
    value: "agent",
    description:
      "Live chats and help desk tickets assigned to them or not assigned yet, plus copilot.",
  },
  {
    value: "content_manager",
    description: "Knowledge base content only.",
  },
];
