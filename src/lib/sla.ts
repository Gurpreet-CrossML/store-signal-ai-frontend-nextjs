/**
 * Helpers for SLA policies (the numbers their form shows) and for showing the
 * SLA a ticket follows.
 */
import type { BadgeTone } from "@/lib/badge-tones";
import type {
  SlaTarget,
  SlaTargetStatus,
  SupportTicketSla,
} from "@/redux/api-slice/support-ticket-slice";

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

/** Longest target a tag's SLA may set: 30 days, in minutes. */
export const SLA_MAX_TARGET_MINUTES = MINUTES_PER_DAY * 30;

/** Highest `priority_order` the server accepts. */
export const SLA_MAX_PRIORITY_ORDER = 100;

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
// The server sends each target's due time, when it was met or found breached,
// and its status at the moment of the request. A ticket stays open on screen
// for a long time, so the status is worked out again here against the clock,
// by the same rule as the server's `support.sla.target_status`: a countdown
// never shows a target as on track after its time has run out.

/** A target in its last quarter is "due soon" (the server's rule). */
const DUE_SOON_FRACTION = 0.25;

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

export const SLA_STATUS_TONE: Record<SlaTargetStatus, BadgeTone> = {
  not_applicable: "neutral",
  on_track: "info",
  due_soon: "warning",
  met: "success",
  breached: "danger",
};

/**
 * Where a target stands now.
 *
 * @param target - The target as the server sent it.
 * @param now - The time to judge by, in epoch milliseconds.
 */
export function slaTargetStatus(
  target: SlaTarget,
  now: number,
): SlaTargetStatus {
  if (!target.due_at) return "not_applicable";
  const due = new Date(target.due_at).getTime();

  if (target.completed_at) {
    return new Date(target.completed_at).getTime() <= due ? "met" : "breached";
  }
  if (target.breached_at || now > due) return "breached";

  const left = due - now;
  const minutes = target.target_minutes;
  if (minutes && left <= minutes * DUE_SOON_FRACTION * 60_000) {
    return "due_soon";
  }
  return "on_track";
}

/**
 * A countdown, exact enough to trust: seconds under a minute ("45s"), minutes
 * and seconds under ten ("1m 30s"), then whole minutes ("12m", "1h 5m").
 *
 * Rounding a countdown up to whole minutes made a one-minute target read "2m"
 * for its first half minute, so it is not rounded here.
 *
 * @param ms - The length of time, in milliseconds.
 * @param round - How to round a long countdown to minutes: "up" for time left
 *   (never promise more than there is), "down" for time overdue.
 */
export function formatCountdown(ms: number, round: "up" | "down"): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 600) {
    const rest = seconds % 60;
    const minutes = Math.floor(seconds / 60);
    return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
  }
  const minutes =
    round === "up" ? Math.ceil(seconds / 60) : Math.floor(seconds / 60);
  return formatMinutes(minutes);
}

/** The short text beside a target: "Due in 12m", "Overdue 5m", "Met". */
export function slaTargetLabel(target: SlaTarget, now: number): string {
  const status = slaTargetStatus(target, now);
  if (status === "not_applicable" || !target.due_at) return "—";

  const due = new Date(target.due_at).getTime();
  if (target.completed_at) {
    const late = new Date(target.completed_at).getTime() - due;
    return status === "met"
      ? "Met"
      : `Missed by ${formatMinutes(Math.ceil(late / 60_000))}`;
  }

  return status === "breached"
    ? `Overdue ${formatCountdown(now - due, "down")}`
    : `Due in ${formatCountdown(due - now, "up")}`;
}

/**
 * What a ticket's SLA asks of an agent right now: "breached" when a target is
 * past its deadline, "due_soon" when one is close, otherwise null.
 *
 * Only targets still open count, so a ticket that missed a reply long ago and
 * has since been answered does not stay flagged.
 *
 * @param sla - The ticket's SLA block, if it has one.
 * @param now - The time to judge by, in epoch milliseconds.
 */
export function slaAttention(
  sla: SupportTicketSla | null | undefined,
  now: number,
): "breached" | "due_soon" | null {
  if (!sla) return null;

  let attention: "breached" | "due_soon" | null = null;
  for (const key of SLA_TARGET_KEYS) {
    const target = sla[key];
    if (target.completed_at) continue;
    const status = slaTargetStatus(target, now);
    if (status === "breached") return "breached";
    if (status === "due_soon") attention = "due_soon";
  }
  return attention;
}
