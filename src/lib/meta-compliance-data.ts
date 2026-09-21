import type { WorkflowGate } from "./workflow-types";

/**
 * The Meta compliance screen is a window, not a control panel: every rail
 * here is enforced by the platform code and none of it is configurable, so
 * there is no API behind this module and nothing ever persists. The gates
 * reuse the WorkflowGate shape purely so WorkflowGateRow renders them with
 * the locked "Always On" treatment.
 */

export const META_COMPLIANCE_NOTE = {
  title: "Enforced by the platform",
  body: "These rails are locked for every connected account and shown here for transparency. Turning them off would put your Meta accounts at risk.",
};

export const META_RAILS_INFO =
  "Every automated comment reply and DM runs inside these rails before any rule you set applies. They are part of the product rather than settings, so there is nothing to save on this screen.";

export const META_COMPLIANCE_RAILS: WorkflowGate[] = [
  {
    id: "graph-api-only",
    title: "Official Meta Graph API Only",
    description:
      "No browser bots or scraping, the fastest path to a ban. Everything goes through approved Meta OAuth permissions.",
    enabled: true,
    locked: true,
  },
  {
    id: "user-initiated-only",
    title: "User-Initiated Triggers Only",
    description:
      "The AI only acts after a comment, reaction, story reply or keyword. It never starts cold outreach.",
    enabled: true,
    locked: true,
  },
  {
    id: "messaging-window",
    title: "24-Hour Messaging Window",
    description:
      "Free-form DMs only within 24 hours of the customer's last message; outside it, only Meta-permitted message types.",
    enabled: true,
    locked: true,
  },
  {
    id: "opt-out",
    title: "In-Conversation Opt-Out",
    description:
      "Every automated DM thread offers a way to stop messages, reachable from inside the chat.",
    enabled: true,
    locked: true,
  },
  {
    id: "honour-deletions",
    title: "Honour Message Deletions",
    description:
      "When a customer deletes a message, the stored copy is deleted within the retention window.",
    enabled: true,
    locked: true,
  },
];

export const META_RETENTION = {
  title: "Data Retention Window",
  description: "How long conversation data is kept before automatic deletion.",
  value: "90 days",
};
