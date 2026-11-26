import { IconAlertTriangle } from "@tabler/icons-react";

import { Progress } from "@/components/ui/progress";
import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { COVERAGE_GOOD_AT, COVERAGE_MIDDLING_AT } from "@/lib/config";
import { formatPercent } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type { CategoryCoverage } from "@/redux/api-slice/knowledge-test-ai-slice";

/** Green for a good share, amber for a middling one, red for a poor one. */
function toneOf(coverage: number): BadgeTone {
  if (coverage >= COVERAGE_GOOD_AT) return "success";
  if (coverage >= COVERAGE_MIDDLING_AT) return "warning";
  return "danger";
}

const BAR_COLORS: Partial<Record<BadgeTone, string>> = {
  success: "[&>div]:bg-emerald-500",
  warning: "[&>div]:bg-amber-500",
  danger: "[&>div]:bg-red-500",
};

const chipClassName =
  "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold";

/**
 * How well the knowledge answers the customer questions of one category over
 * the period on the page: a coloured percentage with a small bar, "not enough
 * data" while the category has too few questions to say, or a warning when
 * the category has no knowledge in it at all.
 */
export function CategoryCoverageChip({
  entry,
  hasKnowledge = true,
}: {
  /** The category's coverage; missing when no customer asked about it. */
  entry: CategoryCoverage | undefined | null;
  /** False for a category with no knowledge items (never for "No Category"). */
  hasKnowledge?: boolean;
}) {
  if (!hasKnowledge) {
    return (
      <span className={cn(chipClassName, BADGE_TONE_STYLES.warning)}>
        <IconAlertTriangle className="mr-1 size-3" />
        No Knowledge Yet
      </span>
    );
  }

  if (!entry || entry.coverage === null) {
    return (
      <span className={cn(chipClassName, BADGE_TONE_STYLES.neutral)}>
        Coverage: Not Enough Data
      </span>
    );
  }

  const tone = toneOf(entry.coverage);
  const percent = formatPercent(entry.coverage);
  return (
    <span className="flex items-center gap-2">
      <span className={cn(chipClassName, BADGE_TONE_STYLES[tone])}>
        Coverage {percent}%
      </span>
      <Progress
        value={percent}
        aria-label={`Coverage ${percent}%`}
        className={cn("h-1.5 flex-1", BAR_COLORS[tone])}
      />
    </span>
  );
}
