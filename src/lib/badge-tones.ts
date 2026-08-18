/**
 * Shared badge palette, so a given meaning looks the same wherever it is
 * shown: money settled and shipped goods, an angry customer, something
 * awaiting action. Used by order status badges and AI comment tags alike.
 */
export type BadgeTone =
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "accent"
  | "neutral";

export const BADGE_TONE_STYLES: Record<BadgeTone, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  danger:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
  accent: "border-primary/20 bg-primary/10 text-primary",
  neutral: "border-border bg-muted text-muted-foreground",
};

/**
 * The same tones as a solid bar, for the priority stripe down the side of
 * a ticket. A bar carries no text, so it needs the saturated hue rather
 * than the badge's pale ground — at 4px wide the 50-weight fills read as
 * grey.
 */
export const BAR_TONE_STYLES: Record<BadgeTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
  danger: "bg-rose-500",
  accent: "bg-primary",
  neutral: "bg-border",
};

/**
 * The same tones as an *action* rather than a label: a colored mark and
 * hover ground on an otherwise plain button. A filled badge would shout
 * next to its neighbours, but the meaning still has to carry — resolving,
 * closing and snoozing a ticket are not interchangeable.
 *
 * `danger` and `accent` use theme tokens; the rest have no token, so they
 * borrow the hues above to stay in step with the badges.
 */
export const ACTION_TONE_STYLES: Record<BadgeTone, string> = {
  success:
    "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950 dark:hover:text-emerald-300",
  warning:
    "text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950 dark:hover:text-amber-300",
  info: "text-sky-600 hover:bg-sky-50 hover:text-sky-700 dark:text-sky-400 dark:hover:bg-sky-950 dark:hover:text-sky-300",
  danger:
    "text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20",
  accent: "text-primary hover:bg-primary/10 hover:text-primary",
  neutral: "text-muted-foreground hover:text-foreground",
};
