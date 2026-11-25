import type { BadgeTone } from "@/lib/badge-tones";
import type { WorkflowRisk } from "@/lib/workflow-types";

/** Maps a workflow's risk level to the shared badge tone palette. */
export const RISK_TONE: Record<WorkflowRisk, BadgeTone> = {
  low: "success",
  medium: "warning",
  high: "danger",
};
