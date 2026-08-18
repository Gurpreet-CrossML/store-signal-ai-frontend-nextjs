import type {
  CustomerAddress,
  CustomerRecord,
} from "@/redux/api-slice/customer-slice";

/**
 * The facts a shopper's own record keeps getting wrong.
 *
 * Shopify leaves `orders_count` at 0, `total_spent` at "0.0000", `addresses`
 * empty and `registered_at` null on customers it syncs — while sending every
 * one of that shopper's orders inline, each carrying a total and the address
 * it shipped to. Reading the aggregates alone showed a customer with eight
 * orders as having never bought anything and living nowhere.
 *
 * So each of these prefers the platform's own figure and falls back to the
 * orders when it is missing. Shared because the listing and the detail
 * screen must not disagree about the same shopper.
 */

/** The address book entry a shopper would consider theirs. */
export function primaryAddress(
  customer: CustomerRecord,
): CustomerAddress | undefined {
  const addresses = customer.addresses ?? [];
  return (
    addresses.find((address) => address.default_shipping) ??
    addresses.find((address) => address.default_billing) ??
    addresses[0]
  );
}

/** "Chandigarh New York, US" — locality then country, whichever parts exist. */
export function formatLocation(address?: CustomerAddress) {
  if (!address) return null;
  const locality = [address.city, address.region].filter(Boolean).join(" ");
  return [locality, address.country_id].filter(Boolean).join(", ") || null;
}

/**
 * The address on their most recent order that has one.
 *
 * Exported because the detail screen shows the whole address, labelled as
 * coming from an order, when the address book is empty.
 */
export function latestShippingAddress(customer: CustomerRecord) {
  return (customer.orders ?? []).find(
    (order) => order.shipping_address?.city || order.shipping_address?.address1,
  )?.shipping_address;
}

/**
 * Where the shopper is, from their address book or the last place they had
 * something shipped.
 *
 * Orders arrive newest first, so the first one with an address is the most
 * recent — the one most likely to still be where they are.
 */
export function customerLocation(customer: CustomerRecord): string | null {
  const fromAddressBook = formatLocation(primaryAddress(customer));
  if (fromAddressBook) return fromAddressBook;

  const shipping = latestShippingAddress(customer);
  if (!shipping) return null;

  const locality = [shipping.city, shipping.province].filter(Boolean).join(" ");
  return [locality, shipping.country].filter(Boolean).join(", ") || null;
}

/** How many orders they have placed. */
export function customerOrderCount(customer: CustomerRecord): number {
  return customer.orders_count || (customer.orders?.length ?? 0);
}

/** What they have spent, in the currency their orders were placed in. */
export function customerTotalSpent(customer: CustomerRecord): {
  amount: number;
  currency: string;
} {
  const orders = customer.orders ?? [];
  const reported = Number(customer.total_spent ?? 0);
  const amount =
    reported ||
    orders.reduce((sum, order) => sum + Number(order.total_price ?? 0), 0);

  return { amount, currency: orders[0]?.currency ?? "USD" };
}

/**
 * When they became a customer.
 *
 * `registered` says which question the date answers: the platform's own
 * registration date, or merely the first time this system saw them. Passing
 * the second off as the first would misdate every synced shopper.
 */
export function customerSince(customer: CustomerRecord): {
  value: string;
  registered: boolean;
} {
  return customer.registered_at
    ? { value: customer.registered_at, registered: true }
    : { value: customer.created_at, registered: false };
}
