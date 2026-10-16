import type { StaffRole } from "@/lib/tenant-types";

/** Display name of every role, the company admin's included. */
export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Admin",
  supervisor: "Supervisor",
  agent: "Agent",
  content_manager: "Content manager",
  viewer: "Viewer",
};

/**
 * The roles a company admin can give a staff user, with what each allows.
 * There is one admin per company, so `admin` is not offered.
 */
export const ASSIGNABLE_ROLES: {
  value: Exclude<StaffRole, "admin">;
  description: string;
}[] = [
  {
    value: "supervisor",
    description:
      "Team metrics, live chats, help desk, ticket assignment and knowledge base.",
  },
  {
    value: "agent",
    description: "Live chats, threads, help desk and copilot.",
  },
  {
    value: "content_manager",
    description: "Knowledge base content only.",
  },
  {
    value: "viewer",
    description: "Read-only access to what the other roles can see.",
  },
];
