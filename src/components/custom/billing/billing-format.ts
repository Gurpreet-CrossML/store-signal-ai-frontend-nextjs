import { format, parseISO } from "date-fns";

import type { BadgeTone } from "@/lib/badge-tones";
import type {
  BillingPayment,
  PlanAction,
} from "@/redux/api-slice/billing-slice";

export type Cycle = "monthly" | "yearly";

/** "26 Dec 2026". */
export const formatDate = (value: string) =>
  format(parseISO(value), "d MMM yyyy");

/** "₹2,500" style amount in the payment's own currency. */
export const formatMoney = (amount: string | number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number(amount));

/** What a payment was for, in words. */
export function paymentLabel(payment: BillingPayment) {
  if (payment.purpose === "top_up") {
    return `${(payment.credits ?? 0).toLocaleString()} AI credits`;
  }
  const cycle = payment.purpose === "yearly_plan" ? "yearly" : "monthly";
  return `${payment.plan_name ?? "Plan"} plan, ${cycle}`;
}

export const PAYMENT_STATUS: Record<
  BillingPayment["status"],
  { label: string; tone: BadgeTone }
> = {
  created: { label: "Not paid", tone: "neutral" },
  paid: { label: "Paid", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  needs_review: { label: "Under review", tone: "warning" },
};

/**
 * The plan card's button text for each backend action. `changesCycle` is
 * true when the shown cycle differs from the one the store pays on now.
 */
export function actionLabel(
  action: PlanAction,
  cycle: Cycle,
  changesCycle: boolean,
) {
  switch (action) {
    case "current":
      return "Current plan";
    case "subscribe":
      return "Choose plan";
    case "upgrade":
      return "Upgrade";
    case "downgrade":
      return "Downgrade";
    case "switch":
      if (!changesCycle) return "Switch plan";
      return cycle === "yearly" ? "Switch to yearly" : "Switch to monthly";
    case "renew":
      return "Renew";
    default:
      return "Not available now";
  }
}
