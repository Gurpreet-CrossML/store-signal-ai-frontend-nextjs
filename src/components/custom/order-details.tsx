"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { Typography } from "@/components/ui/typography";
import { formatPrice } from "@/lib/helpers";
import type {
  OrderData,
  OrderShippingAddress,
} from "@/redux/api-slice/thread-slice";

/**
 * The body of one order — line items, price breakdown, payment and the
 * shipping address.
 *
 * Lifted out of the thread detail panels when CRM gained its own order
 * screen: an order looks the same wherever it is read, and the price
 * breakdown in particular encodes rules (skip a row the platform never
 * captured, show Magento-only per-item tax) that are not worth getting
 * subtly different in a second copy.
 */
function formatShippingAddress(address: OrderShippingAddress): {
  recipient: string | null;
  lines: string[];
} {
  const recipient =
    address.name ??
    [
      address.first_name || address.firstname,
      address.last_name || address.lastname,
    ]
      .filter(Boolean)
      .join(" ") ??
    null;

  const streetLine =
    [address.address1, address.address2].filter(Boolean).join(", ") ||
    (address?.street ?? []).filter(Boolean).join(", ");

  const cityLine = [
    address.city,
    address.province_code ?? address.province,
    address.zip || address.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  const lines = [
    streetLine,
    cityLine,
    address.country || address.country_id,
    address.telephone,
  ].filter((line): line is string => Boolean(line));

  return { recipient: recipient || null, lines };
}

function ShippingAddress({
  address,
}: {
  address: OrderShippingAddress | null;
}) {
  if (!address) {
    return <Typography variant="muted">No shipping address on file</Typography>;
  }

  const { recipient, lines } = formatShippingAddress(address);

  if (!recipient && lines.length === 0) {
    return <Typography variant="muted">No shipping address on file</Typography>;
  }

  return (
    <div>
      {recipient && (
        <Typography variant="small" as="p" className="leading-normal">
          {recipient}
        </Typography>
      )}
      {lines.map((line, idx) => (
        <Typography
          key={idx}
          variant="small"
          as="p"
          className="leading-normal font-normal"
        >
          {line}
        </Typography>
      ))}
    </div>
  );
}

/** Format a "YYYY-MM-DD HH:mm:ss+TZ" timestamp into a short readable date. */

/**
 * Build the optional price-breakdown rows (subtotal, discount, shipping,
 * tax) for the order summary — each only appears when the platform
 * actually captured that value, since not every synced order has one.
 */
function getPriceBreakdownRows(
  order: OrderData,
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];

  if (order.subtotal_price) {
    rows.push({
      label: "Subtotal",
      value: formatPrice(order.subtotal_price, order.currency),
    });
  }

  if (order.total_discounts && Number(order.total_discounts) > 0) {
    rows.push({
      label: "Discount",
      value: `−${formatPrice(order.total_discounts, order.currency)}`,
    });
  }

  if (order.total_shipping) {
    rows.push({
      label: "Shipping",
      value: formatPrice(order.total_shipping, order.currency),
    });
  }

  if (order.total_tax) {
    rows.push({
      label: "Tax",
      value: formatPrice(order.total_tax, order.currency),
    });
  }

  if (order.total_price) {
    rows.push({
      label: "Total",
      value: formatPrice(order.total_price, order.currency),
    });
  }

  return rows;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Typography variant="muted" className="shrink-0">
        {label}
      </Typography>
      <div className="flex min-w-0 justify-end wrap-anywhere">{children}</div>
    </div>
  );
}

export function OrderDetails({ order }: { order: OrderData }) {
  const breakdownRows = getPriceBreakdownRows(order);

  return (
    <div className="space-y-3 border-t border-border/50 p-3">
      <div>
        <Typography variant="muted" className="font-medium">
          Items
        </Typography>
        <div className="mt-1.5 space-y-2">
          {order.items.map((item, idx) => {
            const unitPrice =
              typeof item.price === "number" ? item.price : Number(item.price);
            const lineTotal =
              item.total_price ??
              (Number.isNaN(unitPrice)
                ? item.price
                : unitPrice * item.quantity);

            return (
              <div key={idx}>
                <div className="flex items-start justify-between gap-2">
                  <Typography
                    variant="small"
                    as="span"
                    className="leading-normal font-normal"
                  >
                    {item.name}
                  </Typography>
                  <Typography variant="small" as="span" className="shrink-0">
                    {formatPrice(lineTotal, order.currency)}
                  </Typography>
                </div>
                {/* Wraps onto its own line on narrow screens instead of
                    overflowing the card. */}
                <Typography
                  variant="muted"
                  as="div"
                  className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5"
                >
                  <span>
                    {formatPrice(item.price, order.currency)} × {item.quantity}
                  </span>
                  {/* Tax is Magento-only — Shopify items don't include a
                      per-item tax breakdown, so this is skipped rather
                      than shown as $0.00 when the field is absent. */}
                  {item.total_tax_price != null && (
                    <span>
                      · Tax {formatPrice(item.total_tax_price, order.currency)}
                    </span>
                  )}
                </Typography>
              </div>
            );
          })}
        </div>
      </div>

      {breakdownRows.length > 0 && (
        <div className="space-y-1.5 border-t border-border/50 pt-2.5">
          {breakdownRows.map((row) => {
            const isTotal = row.label === "Total";
            const isDiscount = row.label === "Discount";

            return (
              <div
                key={row.label}
                className={
                  isTotal
                    ? "mt-1 flex items-center justify-between border-t border-border/50 pt-2"
                    : "flex items-center justify-between"
                }
              >
                <Typography variant={isTotal ? "large" : "muted"} as="span">
                  {row.label}
                </Typography>
                <Typography
                  variant={isTotal ? "large" : "small"}
                  as="span"
                  className={
                    isTotal
                      ? "text-primary"
                      : isDiscount
                        ? "text-emerald-600 dark:text-emerald-500"
                        : undefined
                  }
                >
                  {row.value}
                </Typography>
              </div>
            );
          })}
        </div>
      )}

      {/* Same label-left / value-right rhythm as the price rows above, so
          the status badge lands in the value column instead of floating
          under its label. */}
      <div className="space-y-2 border-t border-border/50 pt-2.5">
        <DetailRow label="Payment">
          <Typography variant="small" as="span" className="capitalize">
            {order.gateway}
          </Typography>
        </DetailRow>
        <DetailRow label="Payment Status">
          <StatusBadge status={order.financial_status} />
        </DetailRow>
        {order.shipping_method && (
          <DetailRow label="Shipping Method">
            <Typography
              variant="small"
              as="span"
              className="text-right capitalize"
            >
              {order.shipping_method.replace(/_/g, " ")}
            </Typography>
          </DetailRow>
        )}
      </div>

      <div className="border-t border-border/50 pt-2.5">
        <Typography variant="muted" className="font-medium">
          Shipping Address
        </Typography>
        <div className="mt-1">
          <ShippingAddress address={order.shipping_address} />
        </div>
      </div>
    </div>
  );
}
