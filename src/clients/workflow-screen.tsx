"use client";

import { useState } from "react";

import { WorkflowDetail } from "@/components/custom/settings/workflows/workflow-detail";
import {
  getStaticWorkflow,
  getStaticWorkflows,
  updateStaticWorkflowGate,
  updateStaticWorkflowSection,
} from "@/lib/workflow-data";
import type { WorkflowGatePatch, WorkflowId } from "@/lib/workflow-types";

/**
 * One workflow's configuration, as its own screen.
 *
 * The three workflows used to share a single route and a list down the
 * left, selected with `?workflow=`. That list was a second nav sitting
 * inside a screen the sub-sidebar was already listing — two ways to reach
 * the same three things, and only one of them a real URL. Each is now a
 * route, so the sub-sidebar drives them and a link names the workflow.
 */
export default function WorkflowScreen({
  workflowId,
}: {
  workflowId: WorkflowId;
}) {
  const [workflow, setWorkflow] = useState(
    () => getStaticWorkflow(workflowId) ?? getStaticWorkflows()[0],
  );

  return (
    <WorkflowDetail
      workflow={workflow}
      onGateChange={(gateId: string, patch: WorkflowGatePatch) =>
        setWorkflow((prev) => updateStaticWorkflowGate(prev, gateId, patch))
      }
      onSectionToggle={(sectionId: string, enabled: boolean) =>
        setWorkflow((prev) =>
          updateStaticWorkflowSection(prev, sectionId, enabled),
        )
      }
    />
  );
}
