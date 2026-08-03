import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/helpers";
import type {
  CartDataResponse,
  ThreadTicketData,
  UserMetadata,
  Customer,
  OrderData,
  OrderShippingAddress,
} from "@/redux/api-slice/thread-slice";
import {
  IconBrain,
  IconBrowser,
  IconDeviceDesktop,
  IconDeviceLaptop,
  IconLocationPin,
  IconNetwork,
  IconShoppingBag,
  IconTicket,
  IconUser,
  IconPackage,
  IconChevronRight,
  IconMail,
} from "@tabler/icons-react";
import { FulfillmentBadge, StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";

function CardLoadingState() {
  return (
    <div className="flex items-center justify-center py-6 text-muted-foreground">
      <Spinner className="size-5" />
    </div>
  );
}

export function ThreadSummaryCard({
  summary,
  loading,
}: {
  summary: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent>
        <CardTitle>AI Summary</CardTitle>
        {loading ? (
          <CardLoadingState />
        ) : (
          <CardDescription>
            {summary || "No summary available."}
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
}

export function ThreadAIInsightCard({
  nextActionableItems,
  resolutionSuccessRate,
  reasonForScore,
  overperformingCases,
  underperformingCases,
  loading,
}: {
  nextActionableItems: string[];
  resolutionSuccessRate: string;
  reasonForScore: string;
  overperformingCases: string[];
  underperformingCases: string[];
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <CardTitle className="flex items-center gap-2">
          <IconBrain className="size-4" />
          AI Insights
        </CardTitle>
        {loading ? (
          <CardLoadingState />
        ) : (
          <div className="flex flex-col gap-4">
            {nextActionableItems?.length > 0 && (
              <div className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 p-4">
                <span>Next Actionable Items</span>
                <ul className="mt-1 flex flex-col gap-2">
                  {nextActionableItems?.map((item, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="bg-amber-700 dark:bg-amber-950 p-1" />
                      {item}
                    </li>
                  )) || (
                    <p className="text-sm text-muted-foreground italic">
                      No data available.
                    </p>
                  )}
                </ul>
              </div>
            )}
            <Field className="w-full">
              <FieldLabel htmlFor="progress-upload">
                <span>Resolution Success Rate</span>
                <span className="ml-auto">{resolutionSuccessRate || 0}%</span>
              </FieldLabel>
              <Progress
                value={parseInt(resolutionSuccessRate || "0")}
                id="progress-upload"
              />
            </Field>

            <div>
              <span>Score Rationale</span>
              <p className="text-sm text-muted-foreground mt-1 italic">
                {reasonForScore || "No insights available."}
              </p>
            </div>

            <div>
              <span>Performing Matrix</span>
              {overperformingCases &&
              underperformingCases &&
              overperformingCases?.length === 0 &&
              underperformingCases?.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No Matrix available.
                </p>
              ) : (
                <ul className="mt-1 flex flex-col gap-2">
                  {overperformingCases?.map((item, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="bg-green-700 dark:bg-green-950 p-1" />
                      {item}
                    </li>
                  ))}
                  {underperformingCases?.map((item, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="bg-red-700 dark:bg-red-950 p-1" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CartDetailsCard({
  cartData,
  loading,
}: {
  cartData: CartDataResponse | null;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <CardTitle className="flex items-center gap-2">
          <IconShoppingBag className="size-4" />
          Cart Details
        </CardTitle>
        {loading ? (
          <CardLoadingState />
        ) : !Object.values(cartData?.updated_cart_data || {}).length ? (
          <p className="text-sm text-muted-foreground italic">
            No cart data available.
          </p>
        ) : (
          cartData?.updated_cart_data?.map(
            (
              item: CartDataResponse["updated_cart_data"][number],
              index: number,
            ) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Avatar>
                    {item.product_image ? (
                      <AvatarImage
                        src={item.product_image}
                        alt={item.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        N/A
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="flex flex-col items-start gap-2">
                    <span>{item.name}</span>
                    <span className="text-muted-foreground text-xs">
                      Qty: {item.qty}
                    </span>
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.price || "N/A"}
                </span>
              </div>
            ),
          )
        )}
      </CardContent>
    </Card>
  );
}

export function UserMetadataCard({
  userMetadata,
  custometData,
  loading,
}: {
  userMetadata: UserMetadata | null;
  custometData?: Customer | null;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <CardTitle className="flex items-center gap-2">
          <IconUser className="size-4" />
          User Metadata
        </CardTitle>
        {loading ? (
          <CardLoadingState />
        ) : (
          <div className="flex flex-col gap-3">
            {custometData && custometData?.name && (
              <div className="flex min-w-0 flex-wrap items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-sm text-muted-foreground">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="bg-primary/20 p-1">
                    <IconUser className="size-5 inline text-primary" />
                  </span>
                  <span className="shrink-0">Name</span>
                </div>
                <span className="ml-auto min-w-0 break-words text-right">
                  {custometData?.name}
                </span>
              </div>
            )}
            {custometData && custometData?.email && (
              <div className="flex min-w-0 flex-wrap items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-sm text-muted-foreground">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="bg-primary/20 p-1">
                    <IconMail className="size-5 inline text-primary" />
                  </span>
                  <span className="shrink-0">Email</span>
                </div>
                <span className="ml-auto min-w-0 break-words text-right">
                  {custometData?.email}
                </span>
              </div>
            )}

            <div className="flex min-w-0 flex-wrap items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-sm text-muted-foreground">
              <div className="flex min-w-0 items-center gap-2">
                <span className="bg-primary/20 p-1">
                  <IconLocationPin className="size-5 inline text-primary" />
                </span>
                <span className="shrink-0">Location</span>
              </div>
              <span className="ml-auto min-w-0 break-words text-right">
                {userMetadata?.geo_location || "Unknown Location"}
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-sm text-muted-foreground">
              <div className="flex min-w-0 items-center gap-2">
                <span className="bg-primary/20 p-1">
                  <IconNetwork className="size-5 inline text-primary" />
                </span>
                <span className="shrink-0">IP Address</span>
              </div>
              <span className="ml-auto min-w-0 break-all text-right">
                {userMetadata?.ip_address || "Unknown IP Address"}
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-sm text-muted-foreground">
              <div className="flex min-w-0 items-center gap-2">
                <span className="bg-primary/20 p-1">
                  <IconDeviceLaptop className="size-5 inline text-primary" />
                </span>
                <span className="shrink-0">Device</span>
              </div>
              <span className="ml-auto min-w-0 break-words text-right">
                {userMetadata?.device_type || "Unknown Device"}
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-sm text-muted-foreground">
              <div className="flex min-w-0 items-center gap-2">
                <span className="bg-primary/20 p-1">
                  <IconBrowser className="size-5 inline text-primary" />
                </span>
                <span className="shrink-0">Browser</span>
              </div>
              <span className="ml-auto min-w-0 break-words text-right">
                {userMetadata?.browser || "Unknown Browser"}
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-sm text-muted-foreground">
              <div className="flex min-w-0 items-center gap-2">
                <span className="bg-primary/20 p-1">
                  <IconDeviceDesktop className="size-5 inline text-primary" />
                </span>
                <span className="shrink-0">OS</span>
              </div>
              <span className="ml-auto min-w-0 break-words text-right">
                {userMetadata?.os || "Unknown OS"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SupportTicketCard({
  ticketData,
  loading,
}: {
  ticketData: ThreadTicketData[] | null;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconTicket className="size-4" />
          Support Ticket
        </CardTitle>
      </CardHeader>
      {loading ? (
        <CardLoadingState />
      ) : ticketData?.length == 0 ? (
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            No Ticket data available.
          </p>
        </CardContent>
      ) : (
        <CardContent className="space-y-2">
          {ticketData?.map((ticket: ThreadTicketData, index: number) => (
            <Card key={index}>
              <CardContent className="space-y-2">
                <CardTitle>Ticket TCK-{ticket.ticket_id}</CardTitle>
                <CardTitle className="flex items-start justify-between gap-2 pb-2 border-b">
                  {ticket.subject}
                  <Badge>Open</Badge>
                </CardTitle>
                <CardDescription className="space-y-1 border-b pb-2">
                  {ticket.description || "No description available."}
                </CardDescription>
                <CardDescription className="text-xs">
                  Created:{" "}
                  {formatDateTime(ticket.created_at) || "Unknown creation date"}
                </CardDescription>
              </CardContent>
            </Card>
          )) || (
            <p className="text-sm text-muted-foreground italic">
              No Support ticket data available.
            </p>
          )}
        </CardContent>
      )}
    </Card>
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
  // Date.parse doesn't reliably handle a space between date and time the
  // way it does the "T" separator, so normalize it first.
  const date = new Date(value.replace(" ", "T"));
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
  custometData,
}: {
  orders?: OrderData[] | null;
  loading?: boolean;
  handleOrdersSync: () => void;
  orderSyncLoading?: boolean;
  custometData?: Customer | null;
}) {
  const orderList = orders;
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleOrder = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <CardHeader className="flex items-center justify-between p-0">
          <CardTitle className="flex items-center gap-2">
            <IconPackage className="h-4 w-4" />
            Orders{orderList?.length ? ` (${orderList.length})` : ""}
          </CardTitle>
          <Button
            type="button"
            size="xs"
            onClick={handleOrdersSync}
            disabled={loading || orderSyncLoading || !custometData?.email}
          >
            {orderSyncLoading ? "Syncing..." : "Sync"}
          </Button>
        </CardHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground italic">
            Loading orders…
          </p>
        ) : !orderList || orderList?.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {!custometData?.email
              ? "Customer not registered."
              : "No orders found."}
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
                        <FulfillmentBadge status={order.fulfillment_status} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatDate(order.created_at)} · {order.items.length}{" "}
                        item
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
      </CardContent>
    </Card>
  );
}
