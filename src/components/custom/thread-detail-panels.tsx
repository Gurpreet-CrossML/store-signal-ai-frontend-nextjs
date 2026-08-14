import { useState } from "react";
import { LoadingState } from "@/components/custom/loading-state";
import { CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import type {
  CartDataResponse,
  UserMetadata,
  Customer,
  OrderData,
  CartData,
  ThreadTicketData,
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
  IconTicket,
} from "@tabler/icons-react";
import { FulfillmentBadge } from "@/components/ui/status-badge";
import { OrderDetails } from "@/components/custom/order-details";
import { Badge } from "@/components/ui/badge";
import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { formatDate, formatPrice } from "@/lib/helpers";
import { cn } from "@/lib/utils";
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
const TICKET_STATUS_TONES: Record<string, BadgeTone> = {
  open: "danger",
  pending: "warning",
  resolved: "success",
  closed: "neutral",
};

/** Still needing attention — these lead the list. */
const LIVE_TICKET_STATUSES = ["open", "pending"];

/**
 * The customer's support tickets. Live ones (open, pending) come first
 * because they're what an agent has to act on; resolved and closed follow
 * for context.
 */
export function SupportTicketsCard({
  tickets,
  loading,
}: {
  tickets: ThreadTicketData[];
  loading?: boolean;
}) {
  const liveCount = tickets.filter((ticket) =>
    LIVE_TICKET_STATUSES.includes(ticket.status),
  ).length;
  const sortedTickets = [...tickets].sort((a, b) => {
    const aLive = LIVE_TICKET_STATUSES.includes(a.status) ? 0 : 1;
    const bLive = LIVE_TICKET_STATUSES.includes(b.status) ? 0 : 1;
    return aLive - bLive;
  });

  return (
    <section className="flex flex-col gap-3 border-b p-4">
      <CardTitle className="flex items-center gap-2">
        <IconTicket className="size-4" />
        Support Tickets
        {!loading && liveCount ? ` (${liveCount} active)` : ""}
      </CardTitle>
      {loading ? (
        <CardLoadingState />
      ) : !tickets.length ? (
        <Typography variant="muted">No tickets raised yet.</Typography>
      ) : (
        <div className="flex flex-col gap-2">
          {sortedTickets.map((ticket) => {
            const body = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <Typography variant="small" as="p" className="truncate">
                    {ticket.subject || "Untitled ticket"}
                  </Typography>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 capitalize",
                      BADGE_TONE_STYLES[
                        TICKET_STATUS_TONES[ticket.status] ?? "neutral"
                      ],
                    )}
                  >
                    {ticket.status}
                  </Badge>
                </div>
                {ticket.description && (
                  <Typography variant="muted" className="mt-1 line-clamp-2">
                    {ticket.description}
                  </Typography>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <Typography variant="muted" as="span">
                    #{ticket.id} · {formatDate(ticket.created_at)}
                  </Typography>
                  {ticket.priority === "high" ||
                  ticket.priority === "urgent" ? (
                    <Badge
                      variant="outline"
                      className={cn("capitalize", BADGE_TONE_STYLES.warning)}
                    >
                      {ticket.priority}
                    </Badge>
                  ) : null}
                </div>
              </>
            );

            // Only linked when the provider gave us somewhere to go.
            return ticket.ticket_url ? (
              <a
                key={ticket.id}
                href={ticket.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-border/50 p-2.5 transition-colors hover:bg-muted/50"
              >
                {body}
              </a>
            ) : (
              <div
                key={ticket.id}
                className="rounded-xl border border-border/50 p-2.5"
              >
                {body}
              </div>
            );
          })}
        </div>
      )}
    </section>
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
