import { cn } from "@/lib/utils";
import type { MetricTrend } from "@/redux/api-slice/dashboard-slice";

// "success" and "orange" aren't defined as color tokens anywhere in
// globals.css (no --color-success, no --color-orange) — only Tailwind's
// built-in palette shades (red-*, green-*, orange-*) actually render.
const VARIANT_CLASSES: Record<string, string> = {
  success: "bg-green-100 text-green-600",
  danger: "bg-red-100 text-red-600",
  warning: "bg-orange-100 text-orange-600",
  neutral: "bg-muted text-muted-foreground",
};

/** The per-card change badge: a colored delta pill vs. the previous period. */
export function TrendBadge({ trend }: { trend: MetricTrend | undefined }) {
  // Cards with no period to compare against (e.g. "Active Now", a live
  // gauge) pass no trend at all — render nothing rather than a fake delta.
  if (!trend) return null;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        VARIANT_CLASSES[trend.variant],
      )}
    >
      {trend.label}
    </span>
  );
}
