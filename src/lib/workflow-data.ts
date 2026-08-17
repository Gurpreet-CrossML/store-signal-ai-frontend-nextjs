import { IconArrowBackUp, IconCircleX, IconEdit } from "@tabler/icons-react";

import {
  WORKFLOW_IDS,
  type Workflow,
  type WorkflowGate,
  type WorkflowGatePatch,
  type WorkflowId,
} from "./workflow-types";

/**
 * Static stand-in for the order-workflow config API. Every read goes through
 * `getStaticWorkflow(s)`, every write through `updateStaticWorkflow*` — so
 * swapping this module for real endpoints later is a matter of making these
 * functions async and fetching, not a UI rewrite:
 *
 *   const workflow = getStaticWorkflow(id)         // now
 *   const workflow = await getWorkflow(id)          // later
 */
const WORKFLOWS: Record<WorkflowId, Workflow> = {
  "order-cancellation": {
    id: "order-cancellation",
    title: "Order Cancellation",
    icon: IconCircleX,
    risk: "medium",
    riskNote: "Reverses a paid order",
    description:
      "The customer wants to cancel before they receive the order. What happens next branches on where the order sits in fulfilment.",
    autonomyNote:
      "Auto-resolves when every gate below passes. If a check fails, the AI confirms with the customer or hands off to a teammate.",
    sections: [
      {
        id: "status-gate",
        title: "Order-status gate",
        subtitle:
          "The master check — cancellation logic forks on where the order is in fulfilment",
        enabled: true,
        gates: [
          {
            id: "oc-status-pre-dispatch",
            title: "Order is placed but not yet dispatched",
            description:
              "The clean case — cancel instantly with a full reversal, no cost and no friction.",
            enabled: true,
            locked: true,
          },
          {
            id: "oc-status-packing",
            title: "Order is being packed",
            description:
              "Still cancellable if it can be pulled from the pick queue before it ships.",
            enabled: true,
            recommended: true,
          },
          {
            id: "oc-status-dispatched",
            title: "Order has been dispatched",
            description:
              "Can't simply cancel — attempt a courier intercept (RTO) or convert to a return after delivery.",
            enabled: true,
            control: {
              kind: "select",
              label: "If dispatched",
              value: "Request RTO, refund on confirmation",
              options: [
                "Request RTO, refund on confirmation",
                "Offer refuse-on-delivery + auto-refund",
                "Convert to post-delivery return",
                "Escalate to a teammate",
              ],
            },
          },
          {
            id: "oc-status-delivered",
            title: "Order has been delivered",
            description:
              "Not a cancellation anymore — redirect the customer into the Return & Refund workflow automatically.",
            enabled: true,
            control: {
              kind: "text",
              label: "Action",
              value: "Hand off to Return & Refund",
            },
          },
        ],
      },
      {
        id: "eligibility",
        title: "Eligibility conditions",
        subtitle: "Additional checks once status allows a cancellation",
        enabled: true,
        gates: [
          {
            id: "oc-window",
            title: "Within the cancellation window",
            description: "Time-boxed from when the order was placed.",
            enabled: true,
            control: {
              kind: "number",
              label: "Allow cancellation up to",
              value: "24",
              suffix: "hours after order, or until dispatch",
            },
          },
          {
            id: "oc-payment-type",
            title: "Payment type is eligible",
            description:
              "Prepaid reverses to the original source; COD simply voids — both handled automatically.",
            enabled: true,
            control: {
              kind: "chips",
              label: "Eligible payment types",
              values: [
                "Prepaid — refund to source",
                "COD — void, no refund needed",
              ],
            },
          },
          {
            id: "oc-restricted-type",
            title: "Not a restricted product type",
            description:
              "Made-to-order, customised, and final-sale items may be non-cancellable once production starts.",
            enabled: true,
            control: {
              kind: "chips",
              label: "Restricted types",
              values: [
                "Made-to-order items",
                "Customised / personalised items",
                "Final-sale items",
              ],
            },
          },
          {
            id: "oc-fraud-check",
            title: "Fraud / abuse check",
            description:
              "Blocks a cancellation if this customer has an abnormal cancellation rate or matches a risk signal.",
            enabled: true,
            recommended: true,
            control: {
              kind: "number",
              label: "Flag if cancellation rate exceeds",
              value: "40",
              suffix: "% of their orders",
            },
          },
        ],
      },
      {
        id: "partial-cancel",
        title: "Partial cancellation",
        subtitle: "Multi-item orders — cancel some lines, keep the rest",
        enabled: true,
        gates: [
          {
            id: "oc-partial-allow",
            title: "Allow cancelling individual items",
            description:
              "Recomputes the order total and refunds only the cancelled lines.",
            enabled: true,
            recommended: true,
          },
          {
            id: "oc-partial-discount",
            title: "Re-evaluate discounts after a partial cancel",
            description:
              "If removing an item drops the order below a spend threshold, decide how to handle the promo.",
            enabled: true,
            control: {
              kind: "select",
              label: "If order falls below offer threshold",
              value: "Keep discount (goodwill)",
              options: [
                "Keep discount (goodwill)",
                "Recalculate & adjust refund",
                "Escalate to a teammate",
              ],
            },
          },
        ],
      },
      {
        id: "refund-handling",
        title: "Refund handling",
        subtitle: "How the money goes back once a cancellation is approved",
        enabled: true,
        gates: [
          {
            id: "oc-refund-method",
            title: "Refund method",
            description: "Where the refund lands by default.",
            enabled: true,
            locked: true,
            control: {
              kind: "select",
              label: "Default",
              value: "Original payment method",
              options: [
                "Original payment method",
                "Store credit (faster, retains revenue)",
                "Let the customer choose",
              ],
            },
          },
          {
            id: "oc-restocking-fee",
            title: "Deduct a cancellation / restocking fee",
            description:
              "Typically nil before dispatch; may apply once an order has been picked, packed, or dispatched.",
            enabled: false,
            control: {
              kind: "number",
              label: "Fee if already dispatched",
              value: "0",
              suffix: "% or flat courier cost",
            },
          },
          {
            id: "oc-refund-messaging",
            title: "Refund timeline messaging",
            description:
              "Always tells the customer exactly when to expect the money — the #1 driver of “where's my refund” follow-ups.",
            enabled: true,
            locked: true,
            control: {
              kind: "text",
              label: "Message",
              value: "Prepaid: 3–5 working days · Store credit: instant",
            },
          },
        ],
      },
    ],
    callouts: [
      {
        tone: "info",
        title: "Autonomy summary",
        body: "If the order is pre-dispatch, within the cancellation window, not a restricted type, and the fraud check passes, the AI cancels and refunds on its own. A dispatched, delivered, restricted, or flagged order is confirmed with the customer or escalated.",
      },
    ],
  },

  "order-modification": {
    id: "order-modification",
    title: "Order Modification",
    icon: IconEdit,
    risk: "medium",
    riskNote: "Re-prices and re-reserves stock",
    description:
      "The customer wants to change an order they're keeping — item, size, quantity, or an add-on. Unlike a cancellation, a modification has to re-check stock and re-price, so it carries a couple of extra gates.",
    autonomyNote:
      "Auto-approved when the order is pre-dispatch, the new item is in stock, and the change is price-neutral. Anything else is confirmed with the customer or escalated.",
    sections: [
      {
        id: "status-gate",
        title: "Order-status gate",
        subtitle:
          "Modification is only ever possible before an order leaves the warehouse",
        enabled: true,
        gates: [
          {
            id: "om-status-pre-dispatch",
            title: "Order not yet dispatched",
            description:
              "The only state where the contents of a shipment can still change.",
            enabled: true,
            locked: true,
          },
          {
            id: "om-status-dispatched",
            title: "If already dispatched",
            description:
              "The shipment is already on its way, so its contents can no longer change.",
            enabled: true,
            control: {
              kind: "select",
              label: "Action",
              value: "Explain it's shipped, offer a return and reorder",
              options: [
                "Explain it's shipped, offer a return and reorder",
                "Offer a post-delivery exchange",
                "Escalate to a teammate",
              ],
            },
          },
        ],
      },
      {
        id: "modifiable",
        title: "What can be modified",
        subtitle:
          "Each change type has different downstream effects — enable per your operations",
        enabled: true,
        gates: [
          {
            id: "om-change-variant",
            title: "Change size / variant",
            description:
              "The most common, lowest-risk change — swap the variant if it's in stock, keep the price.",
            enabled: true,
            recommended: true,
          },
          {
            id: "om-change-quantity",
            title: "Change quantity",
            description:
              "Re-checks stock for an increase, re-prices, and re-evaluates any quantity-break discount.",
            enabled: true,
            control: {
              kind: "number",
              label: "Max quantity increase without approval",
              value: "3",
              suffix: "units",
            },
          },
          {
            id: "om-swap-product",
            title: "Swap to a different product",
            description:
              "Higher complexity — treated as a remove + add, re-priced, with the difference settled.",
            enabled: false,
          },
          {
            id: "om-addon",
            title: "Add / remove an add-on or gift wrap",
            description: "Low risk — adjusts the order total accordingly.",
            enabled: true,
          },
        ],
      },
      {
        id: "stock-recheck",
        title: "Stock & availability re-check",
        subtitle:
          "The check a cancellation never needs, since modification always re-validates inventory",
        enabled: true,
        gates: [
          {
            id: "om-in-stock",
            title: "New item must be in stock",
            description:
              "Blocks the change if the requested variant is unavailable; offers a back-in-stock alert or the nearest alternative.",
            enabled: true,
            locked: true,
          },
          {
            id: "om-stock-hold",
            title: "Honour a reserved-stock hold",
            description:
              "Briefly reserves the new variant while the change confirms, so it isn't sold from under the customer.",
            enabled: true,
            recommended: true,
          },
        ],
      },
      {
        id: "price-difference",
        title: "Price-difference handling",
        subtitle: "Unique to modification — money can move in either direction",
        enabled: true,
        gates: [
          {
            id: "om-price-higher",
            title: "New total is higher",
            description:
              "Collects the difference before confirming the change.",
            enabled: true,
            control: {
              kind: "select",
              label: "Action",
              value: "Send a secure payment link for the difference",
              options: [
                "Send a secure payment link for the difference",
                "Add to the COD amount",
                "Escalate to a teammate",
              ],
            },
          },
          {
            id: "om-price-lower",
            title: "New total is lower",
            description: "Refunds the difference back.",
            enabled: true,
            control: {
              kind: "select",
              label: "Refund difference as",
              value: "Store credit (instant)",
              options: ["Store credit (instant)", "Original payment method"],
            },
          },
          {
            id: "om-price-neutral",
            title: "Price-neutral change",
            description:
              "A same-price swap — no money moves, safe to auto-approve.",
            enabled: true,
            locked: true,
          },
          {
            id: "om-price-ceiling",
            title: "Value-change ceiling for auto-approval",
            description:
              "Above this difference, a teammate always confirms, even pre-dispatch.",
            enabled: true,
            control: {
              kind: "number",
              label: "Auto-handle differences up to",
              value: "2000",
              suffix: "₹, above it → a teammate",
            },
          },
        ],
      },
    ],
    callouts: [
      {
        tone: "warning",
        title: "Why this differs from cancellation",
        body: "A cancellation just reverses. A modification re-checks live stock, re-prices, and settles a difference in either direction — two gates cancellation doesn't need. Only the price-neutral, in-stock, pre-dispatch case is fully autonomous.",
      },
    ],
  },

  "return-refund": {
    id: "return-refund",
    title: "Return & Refund",
    icon: IconArrowBackUp,
    risk: "high",
    riskNote: "Money out, inventory, and fraud exposure",
    description:
      "The customer has received the order and wants to send something back. The most complex workflow — it branches on the return reason, and each reason has its own evidence and resolution path.",
    autonomyNote:
      "Low-value, trusted-customer, clear-cut returns auto-approve. Everything else is verified or escalated.",
    sections: [
      {
        id: "eligibility",
        title: "Basic return eligibility",
        subtitle: "Order-level checks before any reason-specific logic",
        enabled: true,
        gates: [
          {
            id: "rr-window",
            title: "Within the return window",
            description: "Time-boxed from the delivery date.",
            enabled: true,
            control: {
              kind: "number",
              label: "Return window",
              value: "15",
              suffix: "days from delivery",
            },
          },
          {
            id: "rr-delivered",
            title: "Order is actually delivered",
            description:
              "Only delivered orders can be returned — an undelivered one routes to cancellation or tracking instead.",
            enabled: true,
            locked: true,
          },
          {
            id: "rr-returnable-category",
            title: "Item is in a returnable category",
            description: "Some categories can never be returned once received.",
            enabled: true,
            locked: true,
            control: {
              kind: "chips",
              label: "Non-returnable categories",
              values: [
                "Innerwear & intimates",
                "Opened / used cosmetics",
                "Pierced jewellery",
                "Customised or altered pieces",
                "Final-sale items",
              ],
            },
          },
          {
            id: "rr-not-repeat",
            title: "Not previously returned or exchanged",
            description:
              "Blocks a repeat return of the same item; watches for serial returners.",
            enabled: true,
            recommended: true,
          },
          {
            id: "rr-abuse-score",
            title: "Return-abuse score is acceptable",
            description:
              "Checks the customer's lifetime return rate and risk signals before auto-approving.",
            enabled: true,
            recommended: true,
            control: {
              kind: "number",
              label: "Route to a teammate if lifetime return rate exceeds",
              value: "35",
              suffix: "%",
            },
          },
        ],
      },
      {
        id: "refund-calculation",
        title: "Refund calculation & method",
        subtitle: "Once approved, exactly how much goes back and how",
        enabled: true,
        gates: [
          {
            id: "rr-refund-basis",
            title: "Refund amount basis",
            description: "",
            enabled: true,
            locked: true,
            control: {
              kind: "select",
              label: "Refund",
              value: "Item price minus any restocking fee",
              options: [
                "Item price minus any restocking fee",
                "Full item price",
                "Item price + original shipping (store fault)",
              ],
            },
          },
          {
            id: "rr-refund-method",
            title: "Refund method",
            description: "",
            enabled: true,
            control: {
              kind: "chips",
              label: "Offered methods",
              values: [
                "Store credit — instant",
                "Original method — 3–5 days",
                "Exchange — no refund",
              ],
            },
          },
          {
            id: "rr-auto-ceiling",
            title: "Auto-approve value ceiling",
            description:
              "Below this, a trusted customer gets an instant approval; above it, a teammate reviews.",
            enabled: true,
            control: {
              kind: "number",
              label: "Auto-approve refunds up to",
              value: "3000",
              suffix: "₹, above it → human review",
            },
          },
          {
            id: "rr-refund-timing",
            title: "Refund timing",
            description: "",
            enabled: true,
            control: {
              kind: "select",
              label: "Release refund",
              value: "On warehouse QC receipt (safer)",
              options: [
                "On pickup scan (faster, some risk)",
                "On warehouse QC receipt (safer)",
                "Instant for damage or wrong-item",
              ],
            },
          },
        ],
      },
      {
        id: "reverse-logistics",
        title: "Reverse logistics",
        subtitle: "Getting the item back — or deciding not to",
        enabled: true,
        gates: [
          {
            id: "rr-auto-pickup",
            title: "Auto-schedule a return pickup",
            description:
              "Books the reverse-logistics pickup and sends the customer the label or QR code automatically.",
            enabled: true,
            recommended: true,
          },
          {
            id: "rr-skip-low-value",
            title: "Skip the return for low-value items",
            description:
              "Below a threshold, it's cheaper to refund and let the customer keep the item than to pay for reverse shipping.",
            enabled: true,
            control: {
              kind: "number",
              label: "Refund without return if item value is under",
              value: "500",
              suffix: "₹",
            },
          },
        ],
      },
    ],
    branches: [
      {
        id: "damaged",
        reason: "Damaged / defective on arrival",
        note: "Photo evidence required",
        gates: [
          {
            id: "rr-damage-evidence",
            title: "Require photo evidence of the damage",
            description: "",
            enabled: true,
            locked: true,
            control: {
              kind: "text",
              label: "Ask for",
              value: "2 photos — full item plus a close-up of the defect",
            },
          },
          {
            id: "rr-damage-vision",
            title: "AI vision check on the uploaded photo",
            description:
              "Confirms the photo shows the ordered item and visible damage, and flags mismatches or reused images.",
            enabled: true,
            recommended: true,
          },
          {
            id: "rr-damage-resolution",
            title: "Resolution for genuine damage",
            description: "",
            enabled: true,
            control: {
              kind: "select",
              label: "Then",
              value: "Offer a replacement first, refund if unavailable",
              options: [
                "Offer a replacement first, refund if unavailable",
                "Instant refund, no return pickup needed",
                "Refund with no return needed (low value)",
              ],
            },
          },
          {
            id: "rr-damage-window-waiver",
            title: "Waive the return window for damage",
            description:
              "Damaged-on-arrival is honoured even outside the normal window.",
            enabled: true,
            recommended: true,
          },
        ],
      },
      {
        id: "wrong-item",
        reason: "Wrong item received",
        note: "Verified against the order",
        gates: [
          {
            id: "rr-wrong-photo",
            title: "Photo of the item received",
            description:
              "Asks for a photo of what actually arrived, including the label or SKU, so the AI can compare it to the order.",
            enabled: true,
            locked: true,
          },
          {
            id: "rr-wrong-validate",
            title: "Validate the mismatch against the order",
            description:
              "Compares the received SKU to the ordered SKU to confirm a genuine mis-pick, not buyer confusion.",
            enabled: true,
            recommended: true,
          },
          {
            id: "rr-wrong-resolution",
            title: "Resolution",
            description: "",
            enabled: true,
            control: {
              kind: "select",
              label: "Then",
              value: "Ship the correct item + free return of the wrong one",
              options: [
                "Ship the correct item + free return of the wrong one",
                "Refund in full + arrange pickup",
                "Escalate to fulfilment",
              ],
            },
          },
          {
            id: "rr-wrong-free",
            title: "Always free of cost to the customer",
            description:
              "A wrong item is the store's error — never charge return shipping or a restocking fee.",
            enabled: true,
            locked: true,
          },
        ],
      },
      {
        id: "changed-mind",
        reason: "Size, fit, or changed mind",
        gates: [
          {
            id: "rr-cm-condition",
            title: "Item must be unused, tags intact, original packaging",
            description: "The condition standard for a resaleable return.",
            enabled: true,
            locked: true,
          },
          {
            id: "rr-cm-exchange-first",
            title: "Offer an exchange before a refund",
            description:
              "A size or variant swap solves the problem and retains the sale.",
            enabled: true,
            recommended: true,
          },
          {
            id: "rr-cm-restocking-fee",
            title: "Restocking fee for a change of mind",
            description:
              "Optional deduction for a non-fault return, to cover reverse logistics.",
            enabled: false,
            control: {
              kind: "number",
              label: "Deduct",
              value: "0",
              suffix: "% restocking + return shipping",
            },
          },
        ],
      },
    ],
    callouts: [
      {
        tone: "danger",
        title: "Why this is the hardest workflow",
        body: "It branches on reason, gates on category, moves money out, and carries the largest fraud surface. Autonomy is earned narrowly — low-value, trusted-customer, clear-cut cases resolve automatically; everything else gets verification or a human.",
      },
    ],
  },
};

/** Every workflow, in the order they should list in the nav. */
export function getStaticWorkflows(): Workflow[] {
  return WORKFLOW_IDS.map((id) => WORKFLOWS[id]);
}

export function getStaticWorkflow(id: WorkflowId): Workflow | undefined {
  return WORKFLOWS[id];
}

function patchGate(gate: WorkflowGate, patch: WorkflowGatePatch): WorkflowGate {
  // Locked gates are a floor the merchant can't move — mirrors how a real
  // API would reject the write, without needing a round trip to find out.
  if (gate.locked) return gate;

  const next: WorkflowGate = { ...gate };
  if (patch.enabled !== undefined) next.enabled = patch.enabled;

  if (gate.control) {
    if (gate.control.kind === "chips" && patch.controlValues !== undefined) {
      next.control = { ...gate.control, values: patch.controlValues };
    } else if (
      gate.control.kind !== "chips" &&
      patch.controlValue !== undefined
    ) {
      next.control = { ...gate.control, value: patch.controlValue };
    }
  }

  return next;
}

/** Applies a gate patch and returns a new workflow — the object in state is never mutated in place. */
export function updateStaticWorkflowGate(
  workflow: Workflow,
  gateId: string,
  patch: WorkflowGatePatch,
): Workflow {
  return {
    ...workflow,
    sections: workflow.sections.map((section) => ({
      ...section,
      gates: section.gates.map((gate) =>
        gate.id === gateId ? patchGate(gate, patch) : gate,
      ),
    })),
    branches: workflow.branches?.map((branch) => ({
      ...branch,
      gates: branch.gates.map((gate) =>
        gate.id === gateId ? patchGate(gate, patch) : gate,
      ),
    })),
  };
}

export function updateStaticWorkflowSection(
  workflow: Workflow,
  sectionId: string,
  enabled: boolean,
): Workflow {
  return {
    ...workflow,
    sections: workflow.sections.map((section) =>
      section.id === sectionId ? { ...section, enabled } : section,
    ),
  };
}
