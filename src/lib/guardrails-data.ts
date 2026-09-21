/**
 * Static stand-in for the guardrails settings API, shaped the way
 * workflow-data.ts is: reads through `getStaticGuardrails`, writes through
 * `updateStaticGuardrails`, so swapping in real endpoints later is a
 * data-layer change, not a UI rewrite. Limits are per connected account,
 * like comment rules.
 *
 * ponytail: module-level state, nothing persists. A refresh restores
 * these defaults. upgrade: fetch/PUT per account when the backend lands.
 */

/**
 * "HH:MM" pair in the store's timezone. An end before the start runs
 * overnight (22:00 to 06:00). Null on the setting means 24/7.
 */
export type ActiveHoursWindow = { start: string; end: string };

/** What the custom window opens with — ordinary business hours. */
export const ACTIVE_HOURS_SEED: ActiveHoursWindow = {
  start: "09:00",
  end: "18:00",
};

/**
 * Language handling is locked to matching the customer for now, so it is
 * display copy rather than a stored setting.
 */
export const LANGUAGE_HANDLING_LABEL = "Match Customer Language";

export type GuardrailSettings = {
  /** Hard ceiling on public replies, per account. */
  maxRepliesPerHour: number;
  /** Kept well under Meta's pacing threshold (about 200 an hour). */
  maxDmsPerHour: number;
  /** One answer per thread, no public back-and-forth. */
  oneReplyPerThread: boolean;
  /** Stop and alert past this many replies to one person in a short window. */
  loopBreakerReplies: number;
  /** Null means around the clock. */
  activeHours: ActiveHoursWindow | null;
};

export const GUARDRAIL_DEFAULTS: GuardrailSettings = {
  maxRepliesPerHour: 30,
  maxDmsPerHour: 60,
  oneReplyPerThread: true,
  loopBreakerReplies: 3,
  activeHours: null,
};

const settingsByAccount: Record<string, GuardrailSettings> = {};

export function getStaticGuardrails(accountId: string): GuardrailSettings {
  return settingsByAccount[accountId] ?? GUARDRAIL_DEFAULTS;
}

export function updateStaticGuardrails(
  accountId: string,
  next: GuardrailSettings,
): GuardrailSettings {
  settingsByAccount[accountId] = next;
  return next;
}
