"use client";

import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type {
  Workflow,
  WorkflowGatePatch,
} from "@/lib/workflow-types";

import { RISK_TONE } from "./workflow-risk";
import { WorkflowBranchCard } from "./workflow-branch-card";
import { WorkflowCalloutBox } from "./workflow-callout";
import { WorkflowSectionCard } from "./workflow-section-card";

/**
 * The open workflow: a fixed header identifying it, then its description,
 * risk/autonomy summary, numbered rule sections, reason branches (Return &
 * Refund only), and closing callouts — mirrors the fixed-header,
 * scrolling-body shape the post detail pane and DM thread already use.
 */
export function WorkflowDetail({
  workflow,
  onGateChange,
  onSectionToggle,
}: {
  workflow: Workflow;
  onGateChange: (gateId: string, patch: WorkflowGatePatch) => void;
  onSectionToggle: (sectionId: string, enabled: boolean) => void;
}) {
  const Icon = workflow.icon;
  const tone = RISK_TONE[workflow.risk];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background px-6">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            BADGE_TONE_STYLES[tone],
          )}
        >
          <Icon className="size-5" />
        </div>
        <CardTitle className="truncate leading-tight">
          {workflow.title}
        </CardTitle>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 p-6">
          <div className="flex flex-col gap-3">
            <Typography variant="muted">{workflow.description}</Typography>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wide",
                  BADGE_TONE_STYLES[tone],
                )}
              >
                {workflow.risk} risk
              </Badge>
              <Typography variant="caption">{workflow.riskNote}</Typography>
            </div>
            <Typography
              variant="caption"
              className="rounded-md border bg-muted/40 px-3 py-2"
            >
              {workflow.autonomyNote}
            </Typography>
          </div>

          {workflow.sections.map((section, index) => (
            <WorkflowSectionCard
              key={section.id}
              section={section}
              index={index + 1}
              onToggleSection={onSectionToggle}
              onGateChange={onGateChange}
            />
          ))}

          {workflow.branches && workflow.branches.length > 0 && (
            <div className="flex flex-col gap-3">
              <Typography variant="small">Branch by return reason</Typography>
              {workflow.branches.map((branch) => (
                <WorkflowBranchCard
                  key={branch.id}
                  branch={branch}
                  onGateChange={onGateChange}
                />
              ))}
            </div>
          )}

          {workflow.callouts.length > 0 && (
            <div className="flex flex-col gap-2">
              {workflow.callouts.map((callout, index) => (
                <WorkflowCalloutBox key={index} callout={callout} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
