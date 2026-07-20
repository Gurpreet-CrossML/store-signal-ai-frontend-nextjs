"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { IconInfoCircle, IconArrowRight } from "@tabler/icons-react";
import { OnboardingHeader } from "./onboarding-header";

// Static for now — mirrors the workflows shipped in the backend `workflows/`
// directory. Per-store enablement will be persisted server-side later.
const WORKFLOWS = [
  { key: "welcome", label: "Welcome & greetings" },
  { key: "order_status", label: "Order tracking / WISMO" },
  { key: "order_modification", label: "Order modification" },
  { key: "order_cancellation", label: "Order cancellation" },
  { key: "return_request", label: "Return request" },
  { key: "refund_request", label: "Refund request" },
  { key: "refund_status", label: "Refund status" },
  { key: "exchange_items", label: "Exchange items" },
  { key: "missing_item", label: "Missing item" },
  { key: "wrong_item_receive", label: "Wrong item received" },
  { key: "damage_and_defect", label: "Damage & defect" },
  { key: "billing_dispute", label: "Billing dispute" },
  { key: "payment_method_queries", label: "Payment method queries" },
  { key: "shipping_cost_and_delivery_time", label: "Shipping & delivery" },
  { key: "discounts_and_offers", label: "Discounts & offers" },
  { key: "cart_actions", label: "Cart actions" },
  { key: "product_info", label: "Product info" },
  { key: "product_recommendation", label: "Product recommendation" },
  { key: "product_comparison", label: "Product comparison" },
  { key: "catalog_browsing", label: "Catalogue browsing" },
  { key: "faq", label: "FAQ answers" },
  { key: "fraud_detection", label: "Fraud detection" },
  { key: "chat_feedback", label: "Chat feedback" },
];

export function StepWorkflows({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  // Every workflow starts enabled; toggling is local only for now.
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(WORKFLOWS.map((w) => [w.key, true])),
  );

  const toggle = (key: string) =>
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));

  const enabledCount = Object.values(enabled).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      <OnboardingHeader
        label="Step 5 of 6"
        title="Choose what it handles"
        time="2 min"
        description="These are the workflows your AI can run. They're all on by default — flip anything off you don't want it to handle."
      />

      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
        <IconInfoCircle className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          <span className="font-medium text-foreground">
            {WORKFLOWS.length} workflows available
          </span>{" "}
          — the full set that ships with Store Signal AI. Per-store control over
          each one is coming soon.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {WORKFLOWS.map((w) => (
          <div
            key={w.key}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-colors",
              enabled[w.key] && "border-primary/40 bg-primary/5",
            )}
          >
            <span className="font-medium">{w.label}</span>
            <Switch
              checked={enabled[w.key]}
              onCheckedChange={() => toggle(w.key)}
              aria-label={`Toggle ${w.label}`}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext}>
            Continue <IconArrowRight />
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          {enabledCount} workflows enabled
        </span>
      </div>
    </div>
  );
}
