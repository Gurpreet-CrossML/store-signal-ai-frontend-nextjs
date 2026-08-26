import {
  IconBuildingStore,
  IconDiscount,
  IconPackage,
  IconShoppingBag,
  IconTicket,
  IconTruck,
  IconUser,
  type Icon,
} from "@tabler/icons-react";

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
 * A practical subset of the ~70 locale codes Meta's template API accepts —
 * not exhaustive, just the common ones. `language` is a free-text field on
 * the backend (WhatsAppTemplateSubmitSerializer), so typing any other valid
 * Meta code still works even though it isn't listed here.
 */
export const WHATSAPP_LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "en_US", label: "English (US)" },
  { code: "en_GB", label: "English (UK)" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "es_MX", label: "Spanish (Mexico)" },
  { code: "pt_BR", label: "Portuguese (Brazil)" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "ar", label: "Arabic" },
  { code: "id", label: "Indonesian" },
  { code: "zh_CN", label: "Chinese (Simplified)" },
];
