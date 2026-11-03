/**
 * Helpers for SLA policies (the numbers their form shows) and for showing the
 * SLA a ticket follows.
 */
import type {
  SlaTarget,
  SupportTicketSla,
} from "@/redux/api-slice/support-ticket-slice";

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

/** Longest target a tag's SLA may set: 30 days, in minutes. */
export const SLA_MAX_TARGET_MINUTES = MINUTES_PER_DAY * 30;

export type SlaUnit = "minutes" | "hours";

/** The most a target may be in the given unit (30 days' worth). */
export function maxForUnit(unit: SlaUnit): number {
  return unit === "hours"
    ? Math.floor(SLA_MAX_TARGET_MINUTES / MINUTES_PER_HOUR)
    : SLA_MAX_TARGET_MINUTES;
}

/**
 * Whatever was typed or pasted into a whole-number box, made into a valid
 * entry: digits only (so no minus sign, decimal point or "e"), no leading
 * zeros (so never zero), and no more than `max`. Empty stays empty.
 */
export function sanitizeWholeNumber(raw: string, max: number): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  return Number(digits) > max ? String(max) : digits;
}

/**
 * A length of time, as "45m", "2h", "1h 30m" or "3d 4h".
 *
 * @param minutes - Whole minutes; anything under one shows as "0m".
 */
export function formatMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const days = Math.floor(total / MINUTES_PER_DAY);
  const hours = Math.floor((total % MINUTES_PER_DAY) / MINUTES_PER_HOUR);
  const mins = total % MINUTES_PER_HOUR;

  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (mins || parts.length === 0) parts.push(`${mins}m`);
  // Two units are plenty: "3d 4h 5m" reads as noise in a table cell.
  return parts.slice(0, 2).join(" ");
}

/**
 * A target split into the number and unit a form shows it in: whole hours
 * when it divides evenly, minutes otherwise.
 */
export function splitMinutes(minutes: number | null | undefined): {
  value: string;
  unit: SlaUnit;
} {
  if (!minutes) return { value: "", unit: "minutes" };
  if (minutes % MINUTES_PER_HOUR === 0) {
    return { value: String(minutes / MINUTES_PER_HOUR), unit: "hours" };
  }
  return { value: String(minutes), unit: "minutes" };
}

/**
 * The minutes a form's number and unit stand for; null when the box is empty.
 * Not a whole number of at least one is NaN, which the form rejects.
 */
export function toMinutes(value: string, unit: SlaUnit): number | null {
  const text = value.trim();
  if (!text) return null;
  const amount = Number(text);
  if (!Number.isInteger(amount) || amount < 1) return Number.NaN;
  return unit === "hours" ? amount * MINUTES_PER_HOUR : amount;
}

// --- Showing a ticket's SLA ---------------------------------------------
//
// A ticket shows its SLA only when it has been missed: one overdue target, the
// one that went overdue first. A ticket that is on track, due soon or already
// met shows nothing.

export type SlaTargetKey = "first_reply" | "every_reply" | "resolution";

export const SLA_TARGET_KEYS: SlaTargetKey[] = [
  "first_reply",
  "every_reply",
  "resolution",
];

export const SLA_TARGET_LABELS: Record<SlaTargetKey, string> = {
  first_reply: "First reply",
  every_reply: "Every reply",
  resolution: "Resolution",
};

/**
 * A countdown, exact enough to trust: seconds under a minute ("45s"), minutes
 * and seconds under ten ("1m 30s"), then whole minutes ("12m", "1h 5m").
 *
 * @param ms - The length of time, in milliseconds.
 */
export function formatCountdown(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 600) {
    const rest = seconds % 60;
    const minutes = Math.floor(seconds / 60);
    return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
  }
  return formatMinutes(Math.floor(seconds / 60));
}

/** A target that is overdue: still open, and past its deadline. */
export type SlaBreach = {
  key: SlaTargetKey;
  target: SlaTarget;
  /** How long past its deadline it is, in milliseconds. */
  overdueMs: number;
};

/**
 * The target of a ticket that has been overdue the longest, or null when none
 * is overdue.
 *
 * Only open targets count: one that was missed and has since been answered is
 * done, so a ticket does not stay flagged for it.
 *
 * @param sla - The ticket's SLA block, if it has one.
 * @param now - The time to judge by, in epoch milliseconds.
 */
export function slaNearestBreach(
  sla: SupportTicketSla | null | undefined,
  now: number,
): SlaBreach | null {
  if (!sla) return null;

  let worst: SlaBreach | null = null;
  for (const key of SLA_TARGET_KEYS) {
    const target = sla[key];
    if (!target.due_at || target.completed_at) continue;

    const overdueMs = now - new Date(target.due_at).getTime();
    if (overdueMs < 0 && !target.breached_at) continue;
    if (!worst || overdueMs > worst.overdueMs) {
      worst = { key, target, overdueMs: Math.max(0, overdueMs) };
    }
  }
  return worst;
}

/** "Overdue 5m": the one thing a ticket says about its SLA. */
export function slaBreachLabel(breach: SlaBreach): string {
  return `Overdue ${formatCountdown(breach.overdueMs)}`;
}
