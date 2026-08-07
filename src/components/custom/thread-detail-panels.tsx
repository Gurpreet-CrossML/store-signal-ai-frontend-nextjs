import { useState } from "react";
import { LoadingState } from "@/components/custom/loading-state";
import { CardTitle } from "@/components/ui/card";
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
        <p className="text-sm text-muted-foreground">Cart is empty.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item: CartData, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 text-sm"
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
                  <p className="truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.qty}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-xs font-medium text-foreground">
                {formatCartPrice(item.price) ?? "-"}
              </span>
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
    <div className="flex items-center gap-2.5 text-sm" title={label}>
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className="min-w-0 wrap-break-word">{value || "-"}</span>
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
    return (
      <p className="text-xs text-muted-foreground">
        No shipping address on file
      </p>
    );
  }

  const { recipient, lines } = formatShippingAddress(address);

  if (!recipient && lines.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No shipping address on file
      </p>
    );
  }

  return (
    <div className="text-xs font-medium text-foreground">
      {recipient && <p>{recipient}</p>}
      {lines.map((line, idx) => (
        <p key={idx} className="text-muted-foreground">
          {line}
        </p>
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

function OrderDetails({ order }: { order: OrderData }) {
  const breakdownRows = getPriceBreakdownRows(order);

  return (
    <div className="mt-1.5 space-y-3 rounded-xl border border-border/50 bg-muted/20 p-3">
      <div>
        <p className="text-[11px] font-medium text-muted-foreground">Items</p>
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
              <div key={idx} className="text-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-foreground">{item.name}</span>
                  <span className="shrink-0 font-medium text-foreground">
                    {formatPrice(lineTotal, order.currency)}
                  </span>
                </div>
                {/* Wraps onto its own line on narrow screens instead of
                    overflowing the card. */}
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
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
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {breakdownRows.length > 0 && (
        <div className="space-y-1 border-t border-border/50 pt-2.5">
          {breakdownRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between text-[11px]"
            >
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-2.5">
        <div>
          <p className="text-[11px] text-muted-foreground">Payment</p>
          <p className="text-xs font-medium text-foreground capitalize">
            {order.gateway}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Payment Status</p>
          <div className="mt-0.5">
            <StatusBadge status={order.financial_status} />
          </div>
        </div>
        {order.shipping_method && (
          <div className="col-span-2">
            <p className="text-[11px] text-muted-foreground">Shipping Method</p>
            <p className="mt-0.5 text-xs font-medium text-foreground break-words [overflow-wrap:anywhere]">
              {order.shipping_method.replace(/_/g, " ")}
            </p>
          </div>
        )}
        <div className="col-span-2">
          <p className="text-[11px] text-muted-foreground">Shipping Address</p>
          <div className="mt-0.5">
            <ShippingAddress address={order.shipping_address} />
          </div>
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
  isDisabled,
}: {
  orders?: OrderData[] | null;
  loading?: boolean;
  handleOrdersSync: () => void;
  orderSyncLoading?: boolean;
  customerData?: Customer | null;
  isDisabled?: boolean;
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
          disabled={
            loading || orderSyncLoading || !customerData?.email || isDisabled
          }
        >
          {orderSyncLoading ? "Syncing..." : "Sync"}
        </Button>
      </div>
      {loading ? (
        <CardLoadingState />
      ) : !orderList || orderList?.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {!customerData?.email
            ? "No customer email to match orders."
            : "No orders yet."}
        </p>
      ) : (
        <div className="space-y-1.5">
          {orderList?.map((order) => {
            const isExpanded = expandedId === order.id;

            return (
              <div key={order.id}>
                <button
                  type="button"
                  onClick={() => toggleOrder(order.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                    isExpanded
                      ? "border-primary/40 bg-primary/[0.04]"
                      : "border-border/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <IconPackage className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-semibold text-foreground">
                        #{order.order_number}
                      </p>
                      <FulfillmentBadge
                        status={
                          order?.fulfillment_status?.toLocaleLowerCase() || null
                        }
                      />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatDate(order.created_at)} · {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-xs font-semibold text-primary">
                      {formatPrice(order.total_price, order.currency)}
                    </span>
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
