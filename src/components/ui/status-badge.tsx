import { Badge } from "@/components/ui/badge";
import { BADGE_TONE_STYLES, type BadgeTone as Tone } from "@/lib/badge-tones";

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
    <Badge
      variant="outline"
      className={`capitalize ${BADGE_TONE_STYLES[tone]}`}
    >
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

// Meta's WhatsApp template review states. Not exhaustive — Meta documents a
// few more (IN_APPEAL, PENDING_DELETION, LIMIT_EXCEEDED, DELETED...) than a
// store is likely to hit, so an unrecognized one still renders (neutral,
// underscore-formatted) instead of disappearing.
const WHATSAPP_TEMPLATE_STATUS: Record<string, { tone: Tone; label: string }> =
  {
    // Ours, not Meta's — a template saved locally that's never been
    // submitted for review yet (see WhatsAppTemplate.status on the backend).
    draft: { tone: "neutral", label: "Draft" },
    approved: { tone: "success", label: "Approved" },
    pending: { tone: "warning", label: "Pending" },
    in_appeal: { tone: "warning", label: "In appeal" },
    rejected: { tone: "danger", label: "Rejected" },
    paused: { tone: "warning", label: "Paused" },
    disabled: { tone: "danger", label: "Disabled" },
    pending_deletion: { tone: "danger", label: "Pending deletion" },
    limit_exceeded: { tone: "danger", label: "Limit exceeded" },
  };

/** Badge for a WhatsApp message template's Meta review `status`. */
export function WhatsAppTemplateStatusBadge({ status }: { status: string }) {
  const known = WHATSAPP_TEMPLATE_STATUS[statusKey(status)];
  const tone = known?.tone ?? "neutral";
  const label = known?.label ?? status.replace(/_/g, " ");

  return (
    <Badge
      variant="outline"
      className={`capitalize ${BADGE_TONE_STYLES[tone]}`}
    >
      {label}
    </Badge>
  );
}

const WHATSAPP_TEMPLATE_CATEGORY: Record<
  string,
  { tone: Tone; label: string }
> = {
  marketing: { tone: "misc", label: "Marketing" },
  utility: { tone: "info", label: "Utility" },
  authentication: { tone: "warning", label: "Authentication" },
};

/** Badge for a WhatsApp message template's top-level `category`. */
export function WhatsAppTemplateCategoryBadge({
  category,
}: {
  category: string;
}) {
  const known = WHATSAPP_TEMPLATE_CATEGORY[statusKey(category)];
  const tone = known?.tone ?? "neutral";
  const label = known?.label ?? category.replace(/_/g, " ");

  return (
    <Badge
      variant="outline"
      className={`capitalize ${BADGE_TONE_STYLES[tone]}`}
    >
      {label}
    </Badge>
  );
}

const WHATSAPP_QUALITY_SCORE: Record<string, { tone: Tone; label: string }> = {
  green: { tone: "success", label: "Good" },
  yellow: { tone: "warning", label: "Medium" },
  red: { tone: "danger", label: "Poor" },
  unknown: { tone: "neutral", label: "Unrated" },
};

/**
 * Badge for a template's Meta `quality_score.score`. Meta only starts
 * scoring a template once it has been sent enough times — most templates
 * sit at "UNKNOWN" (rendered "Unrated") until then, which is expected, not
 * an error state.
 */
export function WhatsAppTemplateQualityBadge({
  score,
}: {
  score: string | null | undefined;
}) {
  if (!score) return null;
  const known = WHATSAPP_QUALITY_SCORE[statusKey(score)];
  const tone = known?.tone ?? "neutral";
  const label = known?.label ?? score.replace(/_/g, " ");

  return (
    <Badge
      variant="outline"
      className={`capitalize ${BADGE_TONE_STYLES[tone]}`}
    >
      {label}
    </Badge>
  );
}

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
    <Badge
      variant="outline"
      className={`capitalize ${BADGE_TONE_STYLES[tone]}`}
    >
      {label}
    </Badge>
  );
}
