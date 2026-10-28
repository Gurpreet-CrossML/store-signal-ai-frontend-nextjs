"use client";

import { IconId } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketAuditTrailCard } from "@/components/custom/ticket-activity-popover";
import {
  CartDetailsCard,
  CustomerProfileCard,
  OrdersCard,
  SessionDataCard,
  SupportTicketsCard,
  ViewedProductsCard,
} from "@/components/custom/thread-detail-panels";
import { cn } from "@/lib/utils";
import type {
  CartDataResponse,
  Customer,
  OrderData,
  ThreadTicketData,
  UserMetadata,
} from "@/redux/api-slice/thread-slice";

/**
 * Opens the details as a sheet. Shown only below `xl`, where the docked
 * pane has no room and is hidden — without it the customer's orders,
 * tickets, cart and session data are unreachable on a tablet.
 */
export function CustomerDetailsButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label="Show customer details"
      className={cn("xl:hidden", className)}
      onClick={onClick}
    >
      <IconId className="size-4" />
      <span className="hidden sm:inline">Details</span>
    </Button>
  );
}

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
  userMetadata,
  orders,
  ordersLoading,
  onOrdersSync,
  orderSyncLoading,
  ordersDisabled,
  tickets,
  cart,
  currentThreadId,
  userMetadataLoading,
  ticket,
  open,
  onOpenChange,
}: {
  customerData?: Customer | null;
  userMetadata?: UserMetadata | null;
  orders?: OrderData[] | null;
  ordersLoading?: boolean;
  onOrdersSync: () => void;
  orderSyncLoading?: boolean;
  ordersDisabled?: boolean;
  /** Omit entirely on screens with no ticket history to show. */
  tickets?: { data: ThreadTicketData[]; loading?: boolean };
  /** Omit entirely on screens with no live cart. */
  cart?: { data: CartDataResponse | null; loading?: boolean };
  currentThreadId?: string | null;
  /** True while `userMetadata` may still be the previous thread's. */
  userMetadataLoading?: boolean;
  /**
   * Pass on a ticket screen to split the pane in two tabs: "Ticket details"
   * (the customer's tickets and this ticket's audit trail) and "Customer
   * details" (who they are, and their orders). Omit it and the pane is the
   * single scrolling list the other screens use.
   */
  ticket?: {
    storeCode: string;
    ticketId: number;
    /** Changes whenever the ticket does, to refresh the audit trail. */
    version?: string;
  };
  /**
   * Below `xl` the pane is not docked; it opens as a sheet instead, driven
   * by these. Omit them where a screen has no way to open it.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const ordersCard = (
    <OrdersCard
      orders={orders}
      loading={ordersLoading}
      handleOrdersSync={onOrdersSync}
      orderSyncLoading={orderSyncLoading}
      customerData={customerData}
      isDisabled={ordersDisabled}
    />
  );
  const ticketsCard = tickets ? (
    <SupportTicketsCard tickets={tickets.data} loading={tickets.loading} />
  ) : null;

  const tabbedContent = ticket ? (
    <Tabs defaultValue="ticket" className="min-h-0 flex-1 gap-0">
      <TabsList variant="line" className="w-full shrink-0 border-b px-2">
        <TabsTrigger value="ticket">Ticket Details</TabsTrigger>
        <TabsTrigger value="customer">Customer Details</TabsTrigger>
      </TabsList>
      <TabsContent value="ticket" className="min-h-0 overflow-y-auto">
        {ticketsCard}
        <TicketAuditTrailCard
          storeCode={ticket.storeCode}
          ticketId={ticket.ticketId}
          version={ticket.version}
        />
      </TabsContent>
      <TabsContent value="customer" className="min-h-0 overflow-y-auto">
        <CustomerProfileCard customer={customerData} />
        {ordersCard}
      </TabsContent>
    </Tabs>
  ) : null;

  const content = tabbedContent ?? (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {ordersCard}
      {ticketsCard}
      {cart ? (
        <>
          <CartDetailsCard cartData={cart.data} loading={cart.loading} />
          <ViewedProductsCard
            viewedProducts={userMetadata?.viewed_products}
            loading={userMetadataLoading}
          />
          <SessionDataCard
            userMetadata={userMetadata}
            customer={customerData}
            currentThreadId={currentThreadId}
            loading={userMetadataLoading}
          />
        </>
      ) : null}
    </div>
  );

  return (
    <>
      <aside className="hidden min-h-0 w-72 shrink-0 flex-col border-l xl:flex 2xl:w-95">
        {content}
      </aside>
      {onOpenChange ? (
        <Sheet open={Boolean(open)} onOpenChange={onOpenChange}>
          <SheetContent
            side="right"
            className="w-full gap-0 p-0 data-[side=right]:sm:max-w-md xl:hidden"
          >
            <SheetHeader className="border-b">
              <SheetTitle>Customer details</SheetTitle>
              <SheetDescription className="sr-only">
                Orders, tickets and session data for this customer.
              </SheetDescription>
            </SheetHeader>
            {content}
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
