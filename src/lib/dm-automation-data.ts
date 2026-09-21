import type { WorkflowGate } from "./workflow-types";

/**
 * Static stand-in for the DM-automation settings API, shaped the way
 * workflow-data.ts is: reads go through `getStaticDmAutomation`, writes
 * through `updateStaticDmAutomation`, so swapping in real endpoints later
 * is a data-layer change, not a UI rewrite. The toggle rows reuse the
 * WorkflowGate shape so they render with the existing WorkflowGateRow.
 *
 * ponytail: module-level state, nothing persists — a refresh restores
 * these defaults. upgrade: fetch/PUT per connected account when the
 * backend lands (DM rules will be per-account like comment rules).
 */

/* -------------------------------------------------------------------- */
/* Inbound — when a customer messages you directly                       */
/* -------------------------------------------------------------------- */

export type DmResponseMode = "off" | "draft" | "auto";

/** Least to most autonomous — the same vocabulary as comment handling. */
export const DM_RESPONSE_MODES: { value: DmResponseMode; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "draft", label: "Draft Automatically" },
  { value: "auto", label: "Auto" },
];

/** What each mode means for a new DM, shown under the picker. */
export const DM_MODE_NOTES: Record<DmResponseMode, string> = {
  off: "The AI stays out of DMs — every conversation waits for a teammate in the inbox.",
  draft:
    "Replies are prepared as drafts in the inbox — nothing is sent until someone approves it.",
  auto: "Replies inside the scoped intents below send on their own; everything else is drafted for review instead.",
};

/**
 * The DM intents the AI may close out on its own — safe, high-volume
 * subjects. Anything outside the selection drafts or hands off.
 */
export const DM_RESOLVABLE_INTENTS: { value: string; label: string }[] = [
  { value: "order_tracking", label: "Order Tracking / WISMO" },
  { value: "product_questions", label: "Product Questions" },
  { value: "size_availability", label: "Size & Availability" },
  { value: "store_info", label: "Store Info & Hours" },
  { value: "returns_start", label: "Returns Start" },
  { value: "discount_codes", label: "Discount Codes" },
];

/* -------------------------------------------------------------------- */
/* The settings object                                                   */
/* -------------------------------------------------------------------- */

export type DmAutomationSettings = {
  /** How far the AI goes on an incoming DM. */
  responseMode: DmResponseMode;
  /** DM_RESOLVABLE_INTENTS values the AI may resolve without review. */
  resolvableIntents: string[];
  inboundGates: WorkflowGate[];
  /** Master switch for comment/keyword-triggered outbound DMs. */
  outboundEnabled: boolean;
  outboundGates: WorkflowGate[];
};

export const OUTBOUND_COMPLIANCE_NOTE = {
  tone: "warning" as const,
  title: "Meta compliance",
  body: "An outbound DM can only follow a user-initiated action — a comment or a keyword — and must land inside Meta's messaging window. The platform enforces this on every send; cold DMs cannot be configured.",
};

let settings: DmAutomationSettings = {
  responseMode: "draft",
  resolvableIntents: [
    "order_tracking",
    "product_questions",
    "size_availability",
    "store_info",
  ],
  inboundGates: [
    {
      id: "pull-context",
      title: "Pull Order & Customer Context into DMs",
      description:
        "Recognise the customer, fetch their order, and answer specifically instead of generically.",
      enabled: true,
    },
    {
      id: "human-handoff",
      title: "Hand Off to a Human on Request",
      description:
        "When the customer asks for a person or sounds frustrated, the AI stops and leaves the thread to your team.",
      enabled: true,
    },
  ],
  outboundEnabled: true,
  outboundGates: [
    {
      id: "engaged-first",
      title: "Only DM People Who Engaged First",
      description:
        "A comment, reaction or keyword — never an unsolicited message. Locked on for compliance.",
      enabled: true,
      locked: true,
    },
    {
      id: "opt-in-step",
      title: "Require an Explicit Opt-In Step",
      description:
        "The public reply invites them to DM; the AI only continues once they message first.",
      enabled: true,
    },
  ],
};

export function getStaticDmAutomation(): DmAutomationSettings {
  return settings;
}

export function updateStaticDmAutomation(
  patch: Partial<DmAutomationSettings>,
): DmAutomationSettings {
  settings = { ...settings, ...patch };
  return settings;
}
