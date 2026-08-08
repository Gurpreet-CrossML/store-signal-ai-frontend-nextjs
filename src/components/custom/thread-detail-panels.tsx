import { useState } from "react";
import { LoadingState } from "@/components/custom/loading-state";
import { CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import type {
  CartDataResponse,
  UserMetadata,
  Customer,
  OrderData,
  OrderShippingAddress,
  CartData,
} from "@/redux/api-slice/thread-slice";
import {
  IconBrowser,
  IconDeviceDesktop,
  IconDeviceLaptop,
  IconLocationPin,
  IconNetwork,
  IconShoppingBag,
  IconUser,
  IconPackage,
  IconChevronRight,
  IconMail,
} from "@tabler/icons-react";
import { FulfillmentBadge, StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";

function CardLoadingState() {
  return <LoadingState className="py-6" />;
}

/**
 * Cart prices arrive as display strings (e.g. "$9999.0") — reformat the
 * numeric part to two decimals, keeping the store's currency prefix.
 */
function formatCartPrice(price: string | null | undefined): string | null {
  const raw = String(price ?? "").trim();
  if (!raw) return null;

  const prefix = (raw.match(/^[^0-9-]+/) ?? [""])[0].trim();
  const amount = Number(raw.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(amount)) return raw;

  return `${prefix}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function CartDetailsCard({
  cartData,
  loading,
}: {
  cartData: CartDataResponse | null;
  loading?: boolean;
}) {
  const cart = cartData?.updated_cart_data;
  const items = cart?.items ?? [];

  return (
    <section className="flex flex-col gap-3 border-b p-4">
      <CardTitle className="flex items-center gap-2">
        <IconShoppingBag className="size-4" />
        Cart
      </CardTitle>
      {loading ? (
        <CardLoadingState />
      ) : items.length === 0 ? (
        <Typography variant="muted">Cart is empty.</Typography>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item: CartData, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted">
                  {item.product_image ? (
                    // Product images come from arbitrary store CDNs, so
                    // next/image's domain allowlist can't cover them.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.product_image}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <IconShoppingBag className="size-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <Typography variant="small" as="p" className="truncate">
                    {item.name}
                  </Typography>
                  <Typography variant="muted" className="mt-0.5">
                    Qty: {item.qty}
                  </Typography>
                </div>
              </div>
              <Typography variant="small" as="span" className="shrink-0">
                {formatCartPrice(item.price) ?? "-"}
              </Typography>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  // Icon-only rows: the label survives as a hover tooltip, and missing
  // values render as "-" so every row keeps its slot.
  return (
    <div className="flex items-center gap-2.5" title={label}>
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <Typography
        variant="small"
        as="span"
        className="min-w-0 leading-normal font-normal wrap-break-word"
      >
        {value || "-"}
      </Typography>
    </div>
  );
}

export function UserMetadataCard({
  userMetadata,
  customerData,
  loading,
}: {
  userMetadata: UserMetadata | null;
  customerData?: Customer | null;
  loading?: boolean;
}) {
  return (
    <section className="flex flex-col gap-3 border-b p-4 last:border-b-0">
      <CardTitle className="flex items-center gap-2">
        <IconUser className="size-4" />
        Customer
      </CardTitle>
      {loading ? (
        <CardLoadingState />
      ) : (
        <div className="flex flex-col gap-2.5">
          <MetaRow
            icon={<IconUser className="size-4" />}
            label="Name"
            value={customerData?.name}
          />
          <MetaRow
            icon={<IconMail className="size-4" />}
            label="Email"
            value={customerData?.email}
          />
          <MetaRow
            icon={<IconLocationPin className="size-4" />}
            label="Location"
            value={userMetadata?.geo_location}
          />
          <MetaRow
            icon={<IconNetwork className="size-4" />}
            label="IP Address"
            value={userMetadata?.ip_address}
          />
          <MetaRow
            icon={<IconDeviceLaptop className="size-4" />}
            label="Device"
            value={userMetadata?.device_type}
          />
          <MetaRow
            icon={<IconBrowser className="size-4" />}
            label="Browser"
            value={userMetadata?.browser}
          />
          <MetaRow
            icon={<IconDeviceDesktop className="size-4" />}
            label="OS"
            value={userMetadata?.os}
          />
        </div>
      )}
    </section>
  );
}

/**
 * Build a readable multi-line shipping address, skipping any parts that
 * are missing rather than rendering "null" or empty lines.
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
function formatDate(value: string): string {
  // Normalize before parsing: Date.parse needs the "T" separator instead of
  // a space, and rejects bare-hour offsets like "+00" unless minutes are
  // appended ("+00:00").
  const date = new Date(
    value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"),
  );
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format a price string with the order's currency, e.g. "3850.00" → "$3,850.00". */
function formatPrice(value: string | number, currency: string): string {
  const amount = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(amount)) return String(value);

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      // Without this, some locales render USD as "US$" instead of "$" to
      // disambiguate from their own local currency — narrowSymbol forces
      // the plain symbol regardless of locale.
      currencyDisplay: "narrowSymbol",
    }).format(amount);
  } catch {
    // Unrecognized currency code — fall back to plain formatting.
    return `${value} ${currency}`;
  }
}

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

function OrderDetails({ order }: { order: OrderData }) {
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

export function OrdersCard({
  orders,
  loading,
  handleOrdersSync,
  orderSyncLoading,
  customerData,
}: {
  orders?: OrderData[] | null;
  loading?: boolean;
  handleOrdersSync: () => void;
  orderSyncLoading?: boolean;
  customerData?: Customer | null;
}) {
  const orderList = orders;
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleOrder = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="flex flex-col gap-3 border-b p-4">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <IconPackage className="h-4 w-4" />
          Orders{!loading && orderList?.length ? ` (${orderList.length})` : ""}
        </CardTitle>
        <Button
          type="button"
          size="xs"
          onClick={handleOrdersSync}
          disabled={loading || orderSyncLoading || !customerData?.email}
        >
          {orderSyncLoading ? "Syncing..." : "Sync"}
        </Button>
      </div>
      {loading ? (
        <CardLoadingState />
      ) : !orderList || orderList?.length === 0 ? (
        <Typography variant="muted">
          {!customerData?.email
            ? "No customer email to match orders."
            : "No orders yet."}
        </Typography>
      ) : (
        <div className="flex flex-col gap-2">
          {orderList?.map((order) => {
            const isExpanded = expandedId === order.id;

            return (
              // One box per order: the details continue inside this same
              // container rather than opening a second box beneath it.
              <div
                key={order.id}
                className={`overflow-hidden rounded-xl border transition ${
                  isExpanded ? "border-primary/40" : "border-border/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleOrder(order.id)}
                  className={`flex w-full items-center gap-3 p-2.5 text-left transition ${
                    isExpanded ? "bg-primary/4" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <IconPackage className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Typography
                        variant="small"
                        as="p"
                        className="truncate leading-normal"
                      >
                        #{order.order_number}
                      </Typography>
                      <FulfillmentBadge status={order.fulfillment_status} />
                    </div>
                    <Typography variant="muted" className="mt-0.5">
                      {formatDate(order.created_at)} · {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </Typography>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Typography
                      variant="small"
                      as="span"
                      className="text-primary"
                    >
                      {formatPrice(order.total_price, order.currency)}
                    </Typography>
                    <IconChevronRight
                      className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </button>

                {isExpanded && <OrderDetails order={order} />}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
