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
