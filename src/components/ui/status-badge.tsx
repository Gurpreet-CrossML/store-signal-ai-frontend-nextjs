import { Badge } from "@/components/ui/badge";

// Shopify's financial_status values. Not every store will hit every one of
// these, but they're all valid values the API can return.
type FinancialStatus =
  | "pending"
  | "authorized"
  | "partially_paid"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "voided"
  | "unpaid"
  | "expired";

// Shopify's fulfillment_status values. Note this is `null` (not a string
// like "unfulfilled") when nothing has shipped yet — see order #1046 and
// #1003 in the sample response.
type FulfillmentStatus = "fulfilled" | "partial" | "restocked" | null;

/**
 * Shared tone palette so a given meaning always looks the same, whichever
 * badge renders it: settled money and shipped goods read green, anything
 * awaiting action reads amber, money lost reads red.
 */
type Tone = "success" | "warning" | "info" | "danger" | "neutral";

/**
 * Statuses don't arrive in a consistent shape — Shopify sends "paid" and
 * "partially_paid", other platforms send "Paid" or "Partially Paid". Fold
 * them all to the snake_case lowercase key the tables below are written in,
 * otherwise a recognized status silently renders as an unknown one.
 */
function statusKey(status: string): string {
  return status
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

const TONE_STYLES: Record<Tone, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  danger:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
  neutral: "border-border bg-muted text-muted-foreground",
};

const FINANCIAL_STATUS: Record<FinancialStatus, { tone: Tone; label: string }> =
  {
    paid: { tone: "success", label: "Paid" },
    partially_paid: { tone: "warning", label: "Partially paid" },
    pending: { tone: "warning", label: "Pending" },
    authorized: { tone: "info", label: "Authorized" },
    partially_refunded: { tone: "warning", label: "Partially refunded" },
    refunded: { tone: "danger", label: "Refunded" },
    voided: { tone: "danger", label: "Voided" },
    unpaid: { tone: "danger", label: "Unpaid" },
    expired: { tone: "neutral", label: "Expired" },
  };

/**
 * Badge for `order.financial_status` (e.g. "paid", "partially_paid").
 *
 * Accepts `string` rather than the strict FinancialStatus union so an
 * unrecognized value from the API doesn't crash the component — it just
 * falls back to a neutral style with the raw value, underscore-formatted.
 */
export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;

  const known = FINANCIAL_STATUS[statusKey(status) as FinancialStatus];
  const tone = known?.tone ?? "neutral";
  const label = known?.label ?? status.replace(/_/g, " ");

  return (
    <Badge variant="outline" className={`capitalize ${TONE_STYLES[tone]}`}>
      {label}
    </Badge>
  );
}

const FULFILLMENT_STATUS: Record<
  Exclude<FulfillmentStatus, null>,
  { tone: Tone; label: string }
> = {
  fulfilled: { tone: "success", label: "Fulfilled" },
  partial: { tone: "warning", label: "Partially fulfilled" },
  restocked: { tone: "neutral", label: "Restocked" },
};

/**
 * Badge for `order.fulfillment_status`. `null` means "not fulfilled yet"
 * in Shopify's model (there's no explicit "unfulfilled" string), so this
 * renders an explicit "Unfulfilled" badge for null rather than hiding it —
 * that's a meaningful state for a customer-support view, not an absence
 * of data. It stays neutral so shipped orders are the ones that stand out.
 */
export function FulfillmentBadge({ status }: { status: string | null }) {
  const known =
    status === null
      ? undefined
      : FULFILLMENT_STATUS[
          statusKey(status) as Exclude<FulfillmentStatus, null>
        ];
  const tone = known?.tone ?? "neutral";
  const label = known?.label ?? (status ?? "Unfulfilled").replace(/_/g, " ");

  return (
    <Badge variant="outline" className={`capitalize ${TONE_STYLES[tone]}`}>
      {label}
    </Badge>
  );
}
