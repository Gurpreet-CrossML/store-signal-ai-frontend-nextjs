"use client";

import {
  CartDetailsCard,
  OrdersCard,
  SupportTicketsCard,
} from "@/components/custom/thread-detail-panels";
import type {
  CartDataResponse,
  Customer,
  OrderData,
  ThreadTicketData,
} from "@/redux/api-slice/thread-slice";

/**
 * The right-hand pane on any screen where an agent is talking to a
 * customer: who they are, what they have bought, what else they have
 * raised.
 *
 * Live Support and Help Desk had grown separate panes showing overlapping
 * subsets of the same thing, so the same customer read differently
 * depending on which inbox you found them in.
 *
 * Sections whose data a screen does not have are simply left out — Help
 * Desk has no cart or browsing session to report, and passing empty props
 * would render cards that say "nothing here" about something that was
 * never going to be there.
 */
export function CustomerDetailsPanel({
  customerData,
  orders,
  ordersLoading,
  onOrdersSync,
  orderSyncLoading,
  ordersDisabled,
  tickets,
  cart,
}: {
  customerData?: Customer | null;
  orders?: OrderData[] | null;
  ordersLoading?: boolean;
  onOrdersSync: () => void;
  orderSyncLoading?: boolean;
  ordersDisabled?: boolean;
  /** Omit entirely on screens with no ticket history to show. */
  tickets?: { data: ThreadTicketData[]; loading?: boolean };
  /** Omit entirely on screens with no live cart. */
  cart?: { data: CartDataResponse | null; loading?: boolean };
}) {
  return (
    <aside className="hidden min-h-0 w-80 shrink-0 flex-col border-l xl:flex 2xl:w-95">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <OrdersCard
          orders={orders}
          loading={ordersLoading}
          handleOrdersSync={onOrdersSync}
          orderSyncLoading={orderSyncLoading}
          customerData={customerData}
          isDisabled={ordersDisabled}
        />
        {tickets ? (
          <SupportTicketsCard
            tickets={tickets.data}
            loading={tickets.loading}
          />
        ) : null}
        {cart ? (
          <CartDetailsCard cartData={cart.data} loading={cart.loading} />
        ) : null}
      </div>
    </aside>
  );
}
