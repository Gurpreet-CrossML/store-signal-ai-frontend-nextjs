"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type { WorkflowGate, WorkflowGatePatch } from "@/lib/workflow-types";

import { WorkflowGateControlView } from "./workflow-gate-control";

/**
 * One condition row: title + description on the left, an on/off switch on
 * the right, and its inline control (if any) underneath once it's enabled.
 * Modeled on the never-say-rules ToggleRow, extended with the locked /
 * recommended states a workflow gate can carry.
 */
export function WorkflowGateRow({
  gate,
  onChange,
}: {
  gate: WorkflowGate;
  onChange: (patch: WorkflowGatePatch) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {gate.title}
          {gate.locked && (
            <Badge
              variant="secondary"
              className="text-[10px] font-semibold uppercase tracking-wide"
            >
              Always on
            </Badge>
          )}
          {gate.recommended && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                BADGE_TONE_STYLES.success,
              )}
            >
              Recommended
            </Badge>
          )}
        </span>
        {gate.description && (
          <Typography variant="muted" className="text-xs leading-relaxed">
            {gate.description}
          </Typography>
        )}
        {gate.control && gate.enabled && (
          <div className="mt-1">
            <WorkflowGateControlView
              control={gate.control}
              disabled={gate.locked}
              onChange={onChange}
            />
          </div>
        )}
      </div>
      <Switch
        checked={gate.enabled}
        disabled={gate.locked}
        onCheckedChange={(value) => onChange({ enabled: value })}
        aria-label={gate.title}
      />
    </div>
  );
}
