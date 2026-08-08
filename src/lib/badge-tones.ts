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
