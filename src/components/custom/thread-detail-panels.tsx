"use client";

import { useState } from "react";
import Link from "next/link";
import { LoadingState } from "@/components/custom/loading-state";
import { CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import type {
  CartDataResponse,
  Customer,
  OrderData,
  CartData,
  ThreadTicketData,
} from "@/redux/api-slice/thread-slice";
import { IconShoppingBag, IconTicket } from "@tabler/icons-react";
import { FulfillmentBadge } from "@/components/ui/status-badge";
import { OrderDetails } from "@/components/custom/order-details";
import { IconRefresh } from "@tabler/icons-react";

import { AnimatePresence, motion } from "framer-motion";

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
import { FetchOrderDetails } from "@/redux/api-slice/order-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
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
  currentThreadId,
  pastThreadsCount = 0,
  customerEmail,
}: {
  cartData: CartDataResponse | null;
  loading?: boolean;
  currentThreadId?: string | null;
  /** Threads this customer started before the current one. */
  pastThreadsCount?: number;
  customerEmail?: string | null;
}) {
  const cart = cartData?.updated_cart_data;
  const items = cart?.items ?? [];

  const totalItems = items.reduce(
    (sum, item) => sum + (Number(item.qty) || 1),
    0,
  );

  const totalPrice = cart?.total
    ? formatCartPrice(cart.total)
    : items.length > 0
      ? formatCartPrice(
          String(
            items.reduce((sum, item) => {
              const num =
                Number(String(item.price ?? "").replace(/[^0-9.-]/g, "")) || 0;
              return sum + num * (Number(item.qty) || 1);
            }, 0),
          ),
        )
      : null;

  const cartSummary =
    items.length === 0
      ? "Empty"
      : totalPrice
        ? `${totalItems} ${totalItems === 1 ? "item" : "items"} · ${totalPrice}`
        : `${totalItems} ${totalItems === 1 ? "item" : "items"}`;

  const pastChatsLabel =
    pastThreadsCount > 0
      ? `${pastThreadsCount} ${pastThreadsCount === 1 ? "thread" : "threads"}`
      : "None";

  return (
    <section className="flex flex-col gap-3 border-b p-4">
      <h4 className="text-sm font-semibold text-foreground">Current session</h4>
      {loading ? (
        <CardLoadingState />
      ) : (
        <div className="flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cart</span>
            <span className="font-normal text-foreground">{cartSummary}</span>
          </div>

          {items.length > 0 ? (
            <div className="flex max-h-60 flex-col gap-2 overflow-y-auto rounded-lg border bg-muted/20 p-2.5">
              {items.map((item: CartData, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted">
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
                        <IconShoppingBag className="size-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-normal text-foreground">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Qty: {item.qty}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-normal text-foreground">
                    {formatCartPrice(item.price) ?? "-"}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Past chats</span>
            {customerEmail && currentThreadId && pastThreadsCount > 0 ? (
              <Link
                href={`/threads?search=${encodeURIComponent(customerEmail)}&before_thread_id=${encodeURIComponent(currentThreadId)}`}
                className="text-primary hover:underline"
              >
                {pastChatsLabel}
              </Link>
            ) : (
              <span className="text-foreground">{pastChatsLabel}</span>
            )}
          </div>
        </div>
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
        <Typography variant="muted">
          No other tickets from this customer.
        </Typography>
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

  // Opening a row loads that order from /chat/orders/{id}/.
  //
  // The lists these panels are handed come from thinner sources — the
  // thread's own order-data route reads a fixed column list straight out
  // of Postgres, and the ticket detail embeds CustomerOrderDetailSerializer
  // — and neither carries `admin_url`, which is built from the Store the
  // client never sees. So the row an agent actually opens is fetched from
  // the endpoint that does, which also brings refunds and fulfillments the
  // panels had no way to show.
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchOrderDetailsData, FetchOrderDetailsIsLoading } = useAppSelector(
    (state) => state.GetOrderReducer.FetchOrderDetailsState,
  );

  const toggleOrder = (id: number) => {
    setExpandedId((prev) => {
      if (prev === id) return null;
      if (storeCode) dispatch(FetchOrderDetails({ storeCode, orderId: id }));
      return id;
    });
  };

  return (
    <section className="flex flex-col gap-3 border-b p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-foreground">Recent orders</h4>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Sync orders"
              onClick={handleOrdersSync}
              // Gated on the customer record, not their email address.
              // Syncing now asks the platform for one customer's history
              // by id, so a guest — who may well have left an email but
              // has no record — has nothing to refresh.
              disabled={
                loading || orderSyncLoading || !customerData?.id || isDisabled
              }
              className="size-6 text-muted-foreground hover:text-foreground"
            >
              {orderSyncLoading ? (
                <Spinner className="size-3.5" />
              ) : (
                <IconRefresh className="size-3.5" />
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
      ) : !orderList || orderList.length === 0 ? (
        <Typography variant="muted" className="text-xs">
          {!customerData?.id
            ? "Link a customer to see their order history."
            : "No orders yet."}
        </Typography>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visibleOrders.map((order) => {
            const isExpanded = expandedId === order.id;
            const items = order.items ?? [];
            const firstItemName = items[0]?.name || "Order item";
            const additionalCount = items.length - 1;
            const itemSummary =
              additionalCount > 0
                ? `${firstItemName} +${additionalCount}`
                : firstItemName;
            const metaLine = [
              itemSummary,
              formatPrice(order.total_price, order.currency),
              formatDate(order.created_at),
            ].join(" · ");

            return (
              <div
                key={order.id}
                className={`rounded-xl border p-3 transition ${
                  isExpanded ? "border-primary/40" : "border-border/80"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleOrder(order.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Typography variant="small" as="span">
                      #{order.order_number}
                    </Typography>
                    <FulfillmentBadge status={order.fulfillment_status} />
                  </div>
                  <Typography variant="muted" as="p" className="mt-1 truncate">
                    {metaLine}
                  </Typography>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="mt-3 border-t pt-3 overflow-hidden"
                    >
                      <OrderDetails
                        order={
                          FetchOrderDetailsData?.id === order.id
                            ? FetchOrderDetailsData
                            : order
                        }
                        loading={
                          FetchOrderDetailsIsLoading &&
                          FetchOrderDetailsData?.id !== order.id
                        }
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
