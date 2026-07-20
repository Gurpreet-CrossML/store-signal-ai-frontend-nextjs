/**
 * Shared, non-visual onboarding data: the Shopify scopes we surface on the
 * "Connect your store" step, and the cross-tab channel the OAuth success page
 * uses to tell the onboarding tab it can advance.
 */

import {
  type Icon,
  IconPackage,
  IconShoppingCart,
  IconUsers,
  IconTag,
  IconBox,
  IconScale,
  IconWorld,
} from "@tabler/icons-react";

// The OAuth install opens Shopify in a new tab; on success the backend 302s
// that tab to /onboarding/connected, which broadcasts here so the original
// onboarding tab can move to the next step. Same-origin, so BroadcastChannel is
// enough (no window.opener juggling across the cross-origin hops).
export const OAUTH_CHANNEL = "storesignal-shopify-oauth";

export type OAuthMessage =
  | { type: "connected"; shop: string; store: string | null }
  | { type: "error"; message: string };

export type CompactScope = { name: string; read: boolean; write: boolean };

/**
 * Collapse read_/write_ scope pairs into one display row: "read_orders" +
 * "write_orders" → { name: "orders", read, write }. The `customer_` /
 * `unauthenticated_` prefixes survive in the name (e.g. "customer_orders"),
 * so each row still identifies the exact API surface being granted.
 */
export function compactScopes(scopes: string[]): CompactScope[] {
  const rows = new Map<string, CompactScope>();
  for (const scope of scopes) {
    const match = scope.match(
      /^(customer_|unauthenticated_)?(read|write)_(.+)$/,
    );
    const name = match ? `${match[1] ?? ""}${match[3]}` : scope;
    const row = rows.get(name) ?? { name, read: false, write: false };
    if (match?.[2] === "write") row.write = true;
    else row.read = true;
    rows.set(name, row);
  }
  return [...rows.values()];
}

// Canonical ordered onboarding step keys — must match the backend's
// tenancy.models.ONBOARDING_STEPS. Step N of the flow is at index N-1.
export const ONBOARDING_STEP_KEYS = [
  "connect",
  "store_url",
  "questions",
  "ai_ready",
  "workflows",
  "go_live",
] as const;

/** True once every step key is present in the completed journey. */
export function isOnboardingComplete(journey: string[]): boolean {
  return ONBOARDING_STEP_KEYS.every((key) => journey.includes(key));
}

/** 1-based step number to resume from = the first step not yet completed
 * (the flow's step count when everything is done). */
export function resumeStep(journey: string[]): number {
  const idx = ONBOARDING_STEP_KEYS.findIndex((key) => !journey.includes(key));
  return idx === -1 ? ONBOARDING_STEP_KEYS.length : idx + 1;
}

export type PermissionGroup = {
  key: string;
  icon: Icon;
  title: string;
  scopes: string[];
};

// The exact OAuth scopes requested at install, grouped for readability. Kept in
// sync with the backend's SHOPIFY_REQUIRED_SCOPES.
export const SHOPIFY_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "fulfillment",
    icon: IconPackage,
    title: "Fulfillment",
    scopes: [
      "read_assigned_fulfillment_orders",
      "write_assigned_fulfillment_orders",
      "read_fulfillments",
      "write_fulfillments",
      "read_merchant_managed_fulfillment_orders",
      "write_merchant_managed_fulfillment_orders",
      "read_third_party_fulfillment_orders",
      "write_third_party_fulfillment_orders",
    ],
  },
  {
    key: "orders",
    icon: IconShoppingCart,
    title: "Orders",
    scopes: [
      "read_orders",
      "write_orders",
      "read_order_edits",
      "write_order_edits",
      "read_draft_orders",
      "write_draft_orders",
      "read_returns",
      "write_returns",
    ],
  },
  {
    key: "customers",
    icon: IconUsers,
    title: "Customers",
    scopes: [
      "read_customers",
      "customer_read_customers",
      "customer_read_orders",
      "customer_write_orders",
      "customer_read_draft_orders",
    ],
  },
  {
    key: "discounts",
    icon: IconTag,
    title: "Discounts & Pricing",
    scopes: [
      "read_discounts",
      "read_discounts_allocator_functions",
      "read_price_rules",
    ],
  },
  {
    key: "products",
    icon: IconBox,
    title: "Products",
    scopes: ["read_products", "read_product_listings", "read_product_feeds"],
  },
  {
    key: "legal",
    icon: IconScale,
    title: "Legal Policies",
    scopes: ["read_legal_policies", "write_legal_policies"],
  },
  {
    key: "unauthenticated",
    icon: IconWorld,
    title: "Unauthenticated (Storefront / Public Access)",
    scopes: [
      "unauthenticated_read_customers",
      "unauthenticated_read_product_inventory",
      "unauthenticated_read_product_listings",
      "unauthenticated_read_product_pickup_locations",
      "unauthenticated_read_product_tags",
    ],
  },
];
