import { IconCrown } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type { CustomerSegment } from "@/redux/api-slice/customer-slice";

/**
 * The segments that get a badge. Only the two VIP tiers are shown for now;
 * every other segment renders nothing.
 */
const SEGMENT_BADGE_LABELS: Partial<Record<CustomerSegment, string>> = {
  top_vip: "Top VIP",
  vip: "VIP",
};

/**
 * A customer's VIP tier, in the shared yellow badge tone: "Top VIP" or
 * "VIP", never both, and nothing for any other segment.
 *
 * On a chat or ticket pass that row's own `customer_segment` (the segment
 * when it was opened), not the customer's current one, so an old VIP ticket
 * still reads as one.
 */
export function CustomerSegmentBadge({
  segment,
  className,
  fallback = null,
}: {
  segment?: CustomerSegment | null;
  className?: string;
  /** Rendered instead when there is no badge, e.g. a table's "—". */
  fallback?: React.ReactNode;
}) {
  const label = segment ? SEGMENT_BADGE_LABELS[segment] : undefined;
  if (!label) return fallback;

  return (
    <Badge
      variant="outline"
      className={cn(BADGE_TONE_STYLES.warning, className)}
    >
      {label}
    </Badge>
  );
}
