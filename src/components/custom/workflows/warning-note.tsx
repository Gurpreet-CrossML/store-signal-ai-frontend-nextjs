import { IconAlertTriangle } from "@tabler/icons-react";

import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";

/** A short warning in the shared warning tone (same palette as the badges). */
export function WarningNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2 border px-3 py-2 text-xs leading-relaxed",
        BADGE_TONE_STYLES.warning,
        className,
      )}
    >
      <IconAlertTriangle className="mt-px size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
