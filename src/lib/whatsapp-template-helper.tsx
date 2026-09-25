import {
  IconBuildingStore,
  IconDiscount,
  IconFileText,
  IconLink,
  IconLock,
  IconMessage2,
  IconMessageCircle,
  IconPackage,
  IconPhoneCall,
  IconPhoto,
  IconShoppingBag,
  IconSpeakerphone,
  IconTicket,
  IconTruck,
  IconUser,
  IconVideo,
  type Icon,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { BADGE_TONE_STYLES, type BadgeTone as Tone } from "@/lib/badge-tones";
import type { WhatsAppTemplateComponent } from "@/redux/api-slice/social-ai-slice";

/**
 * The WhatsApp template variable picker's entire vocabulary — mirrors
 * `VARIABLE_MAP` in `social/template_variables.py` on the backend
 * (store-signals-ai-backend) exactly. That module is the single source of
 * truth for which placeholders actually resolve to real data; nothing here
 * may add a token that isn't a key there, and a token removed there should
 * be removed here too. `sample` is only ever used locally (this create
 * screen's live preview, and as the Meta `example` value submitted
 * alongside a NAMED-format template) — Meta and the backend never see it
 * beyond that.
 */
export type WhatsAppTemplateVariable = {
  token: string;
  label: string;
  sample: string;
};

export type WhatsAppVariableCategory = {
  key: string;
  label: string;
  icon: Icon;
  variables: WhatsAppTemplateVariable[];
};

export const WHATSAPP_VARIABLE_CATEGORIES: WhatsAppVariableCategory[] = [
  {
    key: "customer",
    label: "Customer",
    icon: IconUser,
    variables: [
      { token: "customer_name", label: "Full name", sample: "Jhon Wick" },
      {
        token: "customer_email",
        label: "Email address",
        sample: "jhon.wick@example.com",
      },
      {
        token: "customer_phone",
        label: "Phone number",
        sample: "919876543210",
      },
    ],
  },
  {
    key: "order",
    label: "Order",
    icon: IconShoppingBag,
    variables: [
      { token: "order_number", label: "Order number", sample: "#1001" },
      {
        token: "order_status",
        label: "Fulfillment status",
        sample: "fulfilled",
      },
      { token: "order_total", label: "Order total", sample: "₹2,499.00" },
      { token: "order_date", label: "Date placed", sample: "Aug 10, 2026" },
      { token: "payment_status", label: "Payment status", sample: "paid" },
      {
        token: "shipping_method",
        label: "Shipping method",
        sample: "Standard",
      },
      {
        token: "order_status_url",
        label: "Order status page link",
        sample: "https://example.com/orders/1001",
      },
    ],
  },
  {
    key: "shipping",
    label: "Shipping",
    icon: IconTruck,
    variables: [
      {
        token: "tracking_number",
        label: "Tracking number",
        sample: "1Z999AA10123456784",
      },
      { token: "tracking_company", label: "Shipping carrier", sample: "UPS" },
      {
        token: "tracking_url",
        label: "Tracking link",
        sample: "https://example.com/track/1001",
      },
      {
        token: "shipment_status",
        label: "Shipment status",
        sample: "fulfilled",
      },
    ],
  },
  {
    key: "product",
    label: "Product",
    icon: IconPackage,
    variables: [
      {
        token: "product_name",
        label: "First item's name",
        sample: "Travel Backpack",
      },
      {
        token: "product_price",
        label: "First item's price",
        sample: "₹2,499.00",
      },
      {
        token: "product_image",
        label: "Most recently viewed product's image",
        sample: "https://example.com/product.jpg",
      },
      {
        token: "product_url",
        label: "Most recently viewed product's link",
        sample: "https://example.com/products/travel-backpack",
      },
    ],
  },
  {
    key: "discount",
    label: "Discount & Payment",
    icon: IconDiscount,
    variables: [
      {
        token: "discount_code",
        label: "Discount code applied",
        sample: "SAVE20",
      },
      { token: "refund_status", label: "Refund status", sample: "No Refund" },
    ],
  },
  {
    key: "ticket",
    label: "Support Ticket",
    icon: IconTicket,
    variables: [
      { token: "ticket_id", label: "Ticket ID", sample: "482" },
      {
        token: "ticket_subject",
        label: "Ticket subject",
        sample: "Where is my order?",
      },
      { token: "ticket_status", label: "Ticket status", sample: "open" },
      { token: "ticket_priority", label: "Ticket priority", sample: "high" },
      {
        token: "ticket_url",
        label: "Link to the ticket",
        sample: "https://example.com/tickets/482",
      },
    ],
  },
  {
    key: "store",
    label: "Store / Brand",
    icon: IconBuildingStore,
    variables: [
      { token: "store_name", label: "Store name", sample: "Safarnest" },
      {
        token: "store_url",
        label: "Store URL",
        sample: "https://safarnest.example.com",
      },
      {
        token: "business_address",
        label: "Business address",
        sample: "221B Baker Street, London",
      },
    ],
  },
];

/** Every variable, keyed by its bare token (no braces) — for O(1) lookups. */
export const WHATSAPP_VARIABLES_BY_TOKEN: Record<
  string,
  WhatsAppTemplateVariable
> = Object.fromEntries(
  WHATSAPP_VARIABLE_CATEGORIES.flatMap((category) =>
    category.variables.map((variable) => [variable.token, variable]),
  ),
);

/** `{{token}}` in the exact form the picker inserts and the body stores. */
export function variablePlaceholder(token: string) {
  return `{{${token}}}`;
}

const PLACEHOLDER_RE = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

/** Every `{{token}}` in `text` that isn't in WHATSAPP_VARIABLES_BY_TOKEN. */
export function findUnknownVariables(text: string): string[] {
  const unknown = new Set<string>();
  for (const match of text.matchAll(PLACEHOLDER_RE)) {
    const token = match[1];
    if (!WHATSAPP_VARIABLES_BY_TOKEN[token]) unknown.add(token);
  }
  return Array.from(unknown);
}

/** Every recognized token used in `text`, first-seen order, no duplicates. */
export function extractVariableTokens(text: string): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const match of text.matchAll(PLACEHOLDER_RE)) {
    const token = match[1];
    if (WHATSAPP_VARIABLES_BY_TOKEN[token] && !seen.has(token)) {
      seen.add(token);
      ordered.push(token);
    }
  }
  return ordered;
}

/**
 * Replace every recognized `{{token}}` with its sample value, for the live
 * preview only — never what gets submitted (that keeps the raw `{{token}}`
 * text, resolved for real recipients server-side at send time).
 *
 * `overrides` lets a caller substitute a per-template sample (see the
 * create screen's "Variable samples" section) in place of the registry's
 * generic default — falls back to the registry wherever a token has no
 * override, so this stays a drop-in for callers that don't have any.
 */
export function renderPreviewText(
  text: string,
  overrides: Record<string, string> = {},
): string {
  return text.replace(PLACEHOLDER_RE, (match, token) => {
    const override = overrides[token]?.trim();
    if (override) return override;
    const variable = WHATSAPP_VARIABLES_BY_TOKEN[token];
    return variable ? variable.sample : match;
  });
}

/**
 * The languages a template may be created in — the mirror of
 * campaign.constants.TemplateLanguage. The backend enforces exactly this
 * set (`language` is a ChoiceField), so anything not listed here is
 * rejected on save; keep the two in step.
 */
export const WHATSAPP_LANGUAGES: { code: string; label: string }[] = [
  { code: "en_US", label: "English (US)" },
  { code: "en_GB", label: "English (UK)" },
  { code: "es", label: "Spanish" },
  { code: "es_MX", label: "Spanish (Mexico)" },
  { code: "es_ES", label: "Spanish (Spain)" },
  { code: "pt_BR", label: "Portuguese (Brazil)" },
  { code: "pt_PT", label: "Portuguese (Portugal)" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "id", label: "Indonesian" },
  { code: "it", label: "Italian" },
  { code: "zh_CN", label: "Chinese (China)" },
  { code: "zh_TW", label: "Chinese (Taiwan)" },
  { code: "zh_HK", label: "Chinese (Hong Kong)" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "bn", label: "Bengali" },
  { code: "mr", label: "Marathi" },
  { code: "gu", label: "Gujarati" },
];

/**
 * A WhatsApp template's top-level category, as Meta labels it — mirrors
 * campaign.constants.WhatsAppTemplateCategory.
 */
export const CATEGORY_OPTIONS = [
  { value: "MARKETING", label: "Marketing" },
  { value: "UTILITY", label: "Utility" },
  { value: "AUTHENTICATION", label: "Authentication" },
];

/** The header formats the create form offers (Meta's, minus LOCATION). */
export const HEADER_FORMATS = [
  { value: "NONE", label: "None" },
  { value: "TEXT", label: "Text" },
  { value: "IMAGE", label: "Image" },
  { value: "VIDEO", label: "Video" },
  { value: "DOCUMENT", label: "Document" },
] as const;

export type HeaderFormat = (typeof HEADER_FORMATS)[number]["value"];

/**
 * What Meta accepts as a header sample, per media header format — the
 * mirror of campaign.constants.HEADER_MEDIA_TYPES / HEADER_MEDIA_MAX_BYTES.
 * Checked client-side so an oversized file is caught before it is uploaded
 * at all, rather than after a round-trip; the server enforces the same
 * limits regardless, since nothing client-side is a security boundary. Keep
 * the two in step.
 */
export const HEADER_MEDIA_RULES = {
  IMAGE: { accept: "image/jpeg,image/png", maxMB: 5 },
  VIDEO: { accept: "video/mp4,video/3gpp", maxMB: 16 },
  DOCUMENT: { accept: "application/pdf", maxMB: 100 },
} as const;

export type MediaHeaderFormat = keyof typeof HEADER_MEDIA_RULES;

export const isMediaHeaderFormat = (
  format: HeaderFormat,
): format is MediaHeaderFormat => format in HEADER_MEDIA_RULES;

/** The button kinds the create form offers, with their picker icons. */
export const BUTTON_TYPES = [
  { value: "QUICK_REPLY", label: "Quick Reply", icon: IconMessageCircle },
  { value: "URL", label: "Website URL", icon: IconLink },
  { value: "PHONE_NUMBER", label: "Phone Number", icon: IconPhoneCall },
] as const;

export type ButtonType = (typeof BUTTON_TYPES)[number]["value"];

/**
 * Fold a status/category/score string to the snake_case lowercase key the
 * lookup tables below are written in — so "Partially Paid", "PARTIALLY_PAID"
 * and "partially-paid" all resolve the same. Used by the WhatsApp template
 * badges below to normalize their status/category/score before lookup.
 */
function statusKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

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

// ---------------------------------------------------------------------------
// Template component helpers — reading Meta's `components` array and deriving
// a row/preview icon from what a template actually carries.
// ---------------------------------------------------------------------------

export function getComponent(
  components: WhatsAppTemplateComponent[] | undefined,
  type: WhatsAppTemplateComponent["type"],
) {
  return components?.find((component) => component.type === type);
}

/**
 * Substitute a BODY's `{{token}}`/`{{1}}`... placeholders with Meta's
 * on-file example values, so the preview reads like a real message instead
 * of raw template syntax. Checks NAMED params first — every template this
 * app creates uses NAMED format (see VARIABLE_MAP in the backend's
 * template_variables.py), so `text` holds literal `{{customer_name}}`-style
 * tokens, not positional `{{1}}` — falling back to positional keeps this
 * correct for a template created some other way. Falls back to the
 * placeholder itself wherever Meta has no example on file for it.
 */
export function previewBodyText(component?: WhatsAppTemplateComponent) {
  const text = component?.text ?? "";
  const namedParams = component?.example?.body_text_named_params;
  if (namedParams?.length) {
    const byName = Object.fromEntries(
      namedParams.map((param) => [param.param_name, param.example]),
    );
    return text.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, token) => {
      return byName[token] ?? match;
    });
  }
  const positional = component?.example?.body_text?.[0];
  if (!positional) return text;
  return text.replace(/{{\s*(\d+)\s*}}/g, (match, position) => {
    const value = positional[Number(position) - 1];
    return value ?? match;
  });
}

/**
 * A row/preview icon derived from what the template actually carries — the
 * header's media format when it has one, its category otherwise. Not a
 * decorative guess: every branch reads a real field on the template.
 *
 * Typed structurally (not as WhatsAppTemplate) so a catalog item
 * (WhatsAppTemplateLibraryItem) — which carries the same category/
 * components but isn't a real template yet — satisfies it too.
 */
export function resolveTemplateIcon(template: {
  category: string;
  components: WhatsAppTemplateComponent[];
}): Icon {
  if (template.category?.toUpperCase() === "AUTHENTICATION") return IconLock;

  const header = getComponent(template.components, "HEADER");
  switch (header?.format) {
    case "IMAGE":
      return IconPhoto;
    case "VIDEO":
      return IconVideo;
    case "DOCUMENT":
      return IconFileText;
  }

  if (template.category?.toUpperCase() === "MARKETING") return IconSpeakerphone;
  return IconMessage2;
}

/**
 * Same icon resolution as resolveTemplateIcon, already rendered. A plain
 * `const Icon = resolveTemplateIcon(x)` followed by `<Icon />` trips the
 * "components created during render" lint rule when it sits directly in a
 * component's own body (it doesn't when nested inside a non-component
 * function, e.g. getWhatsAppTemplateColumns' `cell`) — rendering here,
 * one lexical scope away from any component body, sidesteps that.
 */
export function renderTemplateIcon(
  template: { category: string; components: WhatsAppTemplateComponent[] },
  className?: string,
) {
  const Icon = resolveTemplateIcon(template);
  return <Icon className={className} />;
}
