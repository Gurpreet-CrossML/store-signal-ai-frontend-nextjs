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
  IconDeviceLaptop,
  IconLocationPin,
  IconNetwork,
  IconShoppingBag,
  IconPackage,
  IconChevronRight,
  IconTicket,
} from "@tabler/icons-react";
import { FulfillmentBadge } from "@/components/ui/status-badge";
import { OrderDetails } from "@/components/custom/order-details";
import Link from "next/link";
import { IconExternalLink, IconRefresh } from "@tabler/icons-react";

import { AnimatePresence, motion } from "framer-motion";

import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { LinkCustomerButton } from "@/components/custom/link-customer-dialog";
import {
  LIVE_TICKET_STATUSES,
  SupportTicketCard,
} from "@/components/custom/support-ticket-card";
import {
  ShowMoreToggle,
  useCollapsibleList,
} from "@/components/custom/collapsible-list";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate, formatPrice } from "@/lib/helpers";
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

/** One figure in the summary card's strip. */
function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-background px-3 py-2">
      <Typography variant="muted">{label}</Typography>
      <Typography variant="small" as="p" className="truncate tabular-nums">
        {value}
      </Typography>
    </div>
  );
}

/**
 * Who the agent is talking to, and what they are worth — the two things
 * worth knowing before reading a word of the conversation.
 *
 * It leads the panel because it used to trail it: identity sat under the
 * cart and the order history, so the answer to "who is this" was three
 * scrolls below the question. Spend and order count are derived from the
 * orders already loaded for the panel rather than fetched again.
 */
export function CustomerSummaryCard({
  customerData,
  orders,
  userMetadata,
  loading,
  metadataLoading,
  onLinkCustomer,
}: {
  customerData?: Customer | null;
  orders?: OrderData[] | null;
  /**
   * Omit entirely where the concept does not apply. Help Desk tickets
   * arrive by email, phone or social as well as from the widget, so there
   * is no browsing session behind them to report — `null` means "loading
   * or unknown", absent means "not a thing here".
   */
  userMetadata?: UserMetadata | null;
  loading?: boolean;
  metadataLoading?: boolean;
  /**
   * Offered when no customer is attached. Omit on screens where linking
   * one is not possible.
   */
  onLinkCustomer?: () => void;
}) {
  const showSession = userMetadata !== undefined;
  const name = customerData?.name?.trim() || "Guest";
  const orderList = orders ?? [];
  const totalSpent = orderList.reduce(
    (sum, order) => sum + Number(order.total_price ?? 0),
    0,
  );
  const currency = orderList[0]?.currency ?? "USD";

  return (
    <section className="flex flex-col gap-3 border-b p-4">
      <div className="flex items-center gap-3">
        <CustomerAvatar name={customerData?.name} size="size-10" />
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate">{name}</CardTitle>
          {customerData?.email ? (
            <Typography variant="muted" className="truncate">
              {customerData.email}
            </Typography>
          ) : null}
        </div>
      </div>

      {/* One loader for the whole body. The stats and the session rows
          arrive on separate requests, and letting each show its own
          spinner put two of them in one card, one still turning while the
          other had already resolved. */}
      {loading || (showSession && metadataLoading) ? (
        <CardLoadingState />
      ) : (
        <>
          {/* A 1px gap over a border-coloured ground: even separators
              however the pair wraps. */}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
            <SummaryStat
              label="Total spent"
              value={formatPrice(totalSpent, currency)}
            />
            <SummaryStat label="Orders" value={String(orderList.length)} />
          </div>

          {/* A known customer has a record to open; a guest has one to
              attach. Either way the slot holds the next useful action. */}
          {customerData?.id ? (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href={`/crm/customers/${customerData.id}`}>
                <IconExternalLink className="size-4" />
                View in CRM
              </Link>
            </Button>
          ) : onLinkCustomer ? (
            <LinkCustomerButton onClick={onLinkCustomer} />
          ) : null}

          {/* Where they are browsing from, in the same card rather than a
              section of its own at the far end of the panel — it is part
              of who you are talking to, not a separate subject. Device,
              browser and OS share a line; each is a word, and three rows
              of one word is three rows of nothing. */}
          {showSession ? (
            <div className="flex flex-col gap-2.5 border-t border-border pt-3">
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
                value={[
                  userMetadata?.device_type,
                  userMetadata?.browser,
                  userMetadata?.os,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

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
  // Collapsed after the sort, so the preview is the tickets still needing
  // attention rather than whichever happened to come back first.
  const {
    visible: visibleTickets,
    hiddenCount: hiddenTicketCount,
    expanded: ticketsExpanded,
    toggle: toggleTickets,
  } = useCollapsibleList(sortedTickets);

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
          {visibleTickets.map((ticket, index) => (
            <SupportTicketCard key={ticket.id} ticket={ticket} index={index} />
          ))}
          <ShowMoreToggle
            hiddenCount={hiddenTicketCount}
            expanded={ticketsExpanded}
            onToggle={toggleTickets}
            noun="ticket"
          />
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
  const orderList = orders ?? [];
  const {
    visible: visibleOrders,
    hiddenCount: hiddenOrderCount,
    expanded: ordersExpanded,
    toggle: toggleOrders,
  } = useCollapsibleList(orderList);
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Sync orders"
              onClick={handleOrdersSync}
              disabled={
                loading ||
                orderSyncLoading ||
                !customerData?.email ||
                isDisabled
              }
            >
              {orderSyncLoading ? (
                <Spinner className="size-4" />
              ) : (
                <IconRefresh className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {orderSyncLoading ? "Syncing…" : "Sync orders"}
          </TooltipContent>
        </Tooltip>
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
          {visibleOrders.map((order, index) => {
            const isExpanded = expandedId === order.id;

            return (
              // One box per order: the details continue inside this same
              // container rather than opening a second box beneath it.
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.18,
                  // Capped so a long history still settles quickly.
                  delay: Math.min(index, 5) * 0.04,
                }}
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

                {/* Height animates from 0 so the orders below slide down
                    rather than jumping, and so collapsing reads as the
                    same motion in reverse. */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <OrderDetails order={order} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          <ShowMoreToggle
            hiddenCount={hiddenOrderCount}
            expanded={ordersExpanded}
            onToggle={toggleOrders}
            noun="order"
          />
        </div>
      )}
    </section>
  );
}
