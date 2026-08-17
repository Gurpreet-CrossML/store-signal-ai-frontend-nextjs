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
 *
 * `parentDisabled` is set when the section (or branch) this gate belongs to
 * is switched off — the gate's own enabled/locked state stops mattering, it
 * reads and renders as off until the parent is switched back on. Nothing is
 * mutated: the gate's stored `enabled` value survives underneath so it comes
 * back once the parent does.
 */
export function WorkflowGateRow({
  gate,
  parentDisabled = false,
  onChange,
}: {
  gate: WorkflowGate;
  parentDisabled?: boolean;
  onChange: (patch: WorkflowGatePatch) => void;
}) {
  const isOn = gate.enabled && !parentDisabled;

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        parentDisabled && "opacity-50",
      )}
    >
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
        {gate.control && isOn && (
          <div className="mt-1">
            <WorkflowGateControlView
              control={gate.control}
              disabled={gate.locked || parentDisabled}
              onChange={onChange}
            />
          </div>
        )}
      </div>
      <Switch
        checked={isOn}
        disabled={gate.locked || parentDisabled}
        onCheckedChange={(value) => onChange({ enabled: value })}
        aria-label={gate.title}
      />
    </div>
  );
}
