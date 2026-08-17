import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type { WorkflowCallout } from "@/lib/workflow-types";

const CALLOUT_TONE = {
  info: BADGE_TONE_STYLES.info,
  warning: BADGE_TONE_STYLES.warning,
  danger: BADGE_TONE_STYLES.danger,
} as const;

/** A tone-colored summary banner — the "what this all adds up to" note at the bottom of a workflow. */
export function WorkflowCalloutBox({ callout }: { callout: WorkflowCallout }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-xs leading-relaxed",
        CALLOUT_TONE[callout.tone],
      )}
    >
      <span className="font-semibold">{callout.title}: </span>
      {callout.body}
    </div>
  );
}
