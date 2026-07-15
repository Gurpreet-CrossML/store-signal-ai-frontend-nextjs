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

const FINANCIAL_STATUS_STYLES: Record<FinancialStatus, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  partially_paid:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  authorized: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  partially_refunded:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  refunded: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  voided: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  unpaid: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  expired:
    "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
};

const FINANCIAL_STATUS_LABELS: Record<FinancialStatus, string> = {
  paid: "Paid",
  partially_paid: "Partially paid",
  pending: "Pending",
  authorized: "Authorized",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
  voided: "Voided",
  unpaid: "Unpaid",
  expired: "Expired",
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

  const isKnown = status in FINANCIAL_STATUS_STYLES;
  const style = isKnown
    ? FINANCIAL_STATUS_STYLES[status as FinancialStatus]
    : "bg-muted text-muted-foreground";
  const label = isKnown
    ? FINANCIAL_STATUS_LABELS[status as FinancialStatus]
    : status.replace(/_/g, " ");

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${style}`}
    >
      {label}
    </span>
  );
}

const FULFILLMENT_STATUS_STYLES: Record<
  Exclude<FulfillmentStatus, null>,
  string
> = {
  fulfilled:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  partial:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  restocked:
    "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
};

/**
 * Badge for `order.fulfillment_status`. `null` means "not fulfilled yet"
 * in Shopify's model (there's no explicit "unfulfilled" string), so this
 * renders an explicit "Unfulfilled" badge for null rather than hiding it —
 * that's a meaningful state for a customer-support view, not an absence
 * of data.
 */
export function FulfillmentBadge({ status }: { status: string | null }) {
  const isKnown = status !== null && status in FULFILLMENT_STATUS_STYLES;

  const style = isKnown
    ? FULFILLMENT_STATUS_STYLES[status as Exclude<FulfillmentStatus, null>]
    : "bg-muted text-muted-foreground";
  const label = isKnown ? (status as string).replace(/_/g, " ") : "Unfulfilled";

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${style}`}
    >
      {label}
    </span>
  );
}
