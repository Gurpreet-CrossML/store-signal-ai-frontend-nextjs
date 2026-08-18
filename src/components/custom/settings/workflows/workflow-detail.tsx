"use client";

import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type { Workflow, WorkflowGatePatch } from "@/lib/workflow-types";

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
    // No header of its own and no scroller of its own: the page shell
    // supplies the heading, the padding and the page's scroll, the same
    // way every other settings screen gets them. This used to be a
    // full-height pane with its own h-16 bar, left over from when the
    // three workflows shared one route behind an in-page list — which
    // gave the screen two titles and a column of content marooned in the
    // middle of an empty page.
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Typography variant="muted">{workflow.description}</Typography>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn("uppercase", BADGE_TONE_STYLES[tone])}
          >
            <Icon data-icon="inline-start" />
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

      {workflow.sections.map((section) => (
        <WorkflowSectionCard
          key={section.id}
          section={section}
          onToggleSection={onSectionToggle}
          onGateChange={onGateChange}
        />
      ))}

      {workflow.branches && workflow.branches.length > 0 && (
        <div className="flex flex-col gap-3">
          <Typography variant="small" as="h3">
            Branch by Return Reason
          </Typography>
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
  );
}
