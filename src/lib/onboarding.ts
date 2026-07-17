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

export type ScopeAccess = "read" | "write";

/** A scope grants write access if its name carries the `write` verb. */
export function scopeAccess(scope: string): ScopeAccess {
  return scope.includes("write") ? "write" : "read";
}

// Where we record that a company finished onboarding, so the dashboard overlay
// doesn't reappear. Client-only + per-company; the durable server-side gate is
// a later task.
export function onboardingDoneKey(
  companyCode: string | null | undefined,
): string {
  return `storesignal_onboarding_done_${companyCode ?? "unknown"}`;
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
