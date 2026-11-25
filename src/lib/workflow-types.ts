import type { Icon } from "@tabler/icons-react";

/**
 * Order-workflow domain types. Kept free of UI concerns (no className, no
 * tone/color) so the same shapes can come from a static module today and an
 * API response later without the components that render them changing.
 */

export type WorkflowId =
  | "order-cancellation"
  | "order-modification"
  | "return-refund";

export const WORKFLOW_IDS: WorkflowId[] = [
  "order-cancellation",
  "order-modification",
  "return-refund",
];

export function isWorkflowId(value: string | null): value is WorkflowId {
  return !!value && (WORKFLOW_IDS as string[]).includes(value);
}

export type WorkflowRisk = "low" | "medium" | "high";

/** The inline control a gate exposes once it's relevant, if any. */
export type WorkflowGateControl =
  | { kind: "select"; label: string; value: string; options: string[] }
  | { kind: "number"; label: string; value: string; suffix?: string }
  | { kind: "text"; label: string; value: string }
  | { kind: "chips"; label: string; values: string[] };

/**
 * One condition the AI checks before acting on its own. `locked` gates are
 * a safety floor the merchant can't disable; the rest are configurable.
 */
export type WorkflowGate = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  locked?: boolean;
  recommended?: boolean;
  control?: WorkflowGateControl;
};

/** Patch applied to one gate. `controlValues` only ever affects a chips control. */
export type WorkflowGatePatch = {
  enabled?: boolean;
  controlValue?: string;
  controlValues?: string[];
};

/** A numbered group of gates, e.g. "Eligibility conditions". */
export type WorkflowSection = {
  id: string;
  title: string;
  subtitle?: string;
  enabled: boolean;
  gates: WorkflowGate[];
};

/** One return reason inside the "branch by return reason" step. */
export type WorkflowBranch = {
  id: string;
  reason: string;
  note?: string;
  gates: WorkflowGate[];
};

export type WorkflowCallout = {
  tone: "info" | "warning" | "danger";
  title: string;
  body: string;
};

export type Workflow = {
  id: WorkflowId;
  title: string;
  description: string;
  risk: WorkflowRisk;
  riskNote: string;
  autonomyNote: string;
  icon: Icon;
  sections: WorkflowSection[];
  /** Return & Refund only — the reason-branch cards. */
  branches?: WorkflowBranch[];
  callouts: WorkflowCallout[];
};
