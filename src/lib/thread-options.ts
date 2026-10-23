import type { BadgeTone } from "@/lib/badge-tones";

/**
 * Why a support agent closes a live chat. Mirrors the backend's
 * `Thread.CloseReason` (chat/models.py), which validates the reason: add a
 * reason there first, then here.
 */
export const THREAD_CLOSE_REASONS = [
  {
    value: "resolved",
    tone: "success",
    label: "Resolved",
    description: "The customer's question was answered.",
  },
  {
    value: "no_reply",
    tone: "warning",
    label: "No reply",
    description: "The customer stopped responding.",
  },
  {
    value: "spam",
    tone: "danger",
    label: "Spam",
    description: "Unwanted or irrelevant messages.",
  },
  {
    value: "ticket_created",
    tone: "info",
    label: "Ticket created",
    description: "Continuing in a support ticket.",
  },
] as const satisfies readonly {
  value: string;
  label: string;
  tone: BadgeTone;
  description: string;
}[];

export type ThreadCloseReason = (typeof THREAD_CLOSE_REASONS)[number]["value"];

/** Who closed a thread. Mirrors the backend's `Thread.ClosedByType`. */
export const THREAD_CLOSED_BY_TYPES = {
  ai: "AI",
  agent: "Agent",
  system: "System",
} as const;

export type ThreadClosedByType = keyof typeof THREAD_CLOSED_BY_TYPES;

/** Label for a close reason, or null when the thread has none. */
export function closeReasonLabel(
  reason: ThreadCloseReason | null | undefined,
): string | null {
  return THREAD_CLOSE_REASONS.find((r) => r.value === reason)?.label ?? null;
}

/** Badge tone for a close reason, or null when the thread has none. */
export function closeReasonTone(
  reason: ThreadCloseReason | null | undefined,
): BadgeTone | null {
  return THREAD_CLOSE_REASONS.find((r) => r.value === reason)?.tone ?? null;
}

/**
 * Who closed a thread — "Agent · Priya", "AI" or "System" — or null when
 * that is not recorded. The name is only there when an agent closed it.
 */
export function closedByLabel(
  type: ThreadClosedByType | null | undefined,
  name?: string | null,
): string | null {
  if (!type || !(type in THREAD_CLOSED_BY_TYPES)) return null;
  const label = THREAD_CLOSED_BY_TYPES[type];
  return name ? `${label} · ${name}` : label;
}
