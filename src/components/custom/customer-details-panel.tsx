"use client";

import { useState } from "react";
import { IconId, IconSparkles } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketCopilotPanel } from "@/components/custom/ticket-copilot-panel";
import {
  CartDetailsCard,
  OrdersCard,
  OrdersSummary,
  SessionDataCard,
  SupportTicketsCard,
  ViewedProductsCard,
} from "@/components/custom/thread-detail-panels";
import { useCan } from "@/hooks/use-can";
import { cn } from "@/lib/utils";
import type {
  CartDataResponse,
  Customer,
  OrderData,
  ThreadTicketData,
  UserMetadata,
} from "@/redux/api-slice/thread-slice";

function formatCustomerSince(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

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
  open,
  onOpenChange,
  copilot,
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
   * Below `xl` the pane is not docked; it opens as a sheet instead, driven
   * by these. Omit them where a screen has no way to open it.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Adds a Copilot tab next to Details. Only Help Desk passes it: Copilot
   * works on one ticket, so Live Support has nothing to offer it.
   */
  copilot?: {
    storeCode: string;
    ticketId: number;
    /** Changes whenever the ticket does, so Copilot re-checks its buttons. */
    refreshKey: string;
    onInsertDraft: (text: string) => void;
  };
}) {
  const [tab, setTab] = useState<"details" | "copilot">("details");
  const canUseCopilot = useCan("copilot");
  const showCopilot = Boolean(copilot) && canUseCopilot;
  const customerSince = formatCustomerSince(customerData?.registered_at);

  const details = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-14 shrink-0 items-center justify-between border-b bg-background px-4 py-3 sm:px-5">
        <h2 className="min-w-0 truncate text-base font-semibold tracking-tight sm:text-lg">
          Customer overview
        </h2>
        <span className="ml-3 shrink-0 text-xs text-muted-foreground sm:text-sm">
          Since {customerSince}
        </span>
      </div>
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
          <SupportTicketsCard tickets={tickets.data} loading={tickets.loading} />
        ) : null}
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
    </div>
  );

  // The docked pane and the sheet are the same content in two places; the
  // pane is only hidden below `xl`, not unmounted. Copilot loads and runs
  // model calls, so it is mounted in just one of them at a time.
  const sheetOpen = Boolean(open);

  const withTabs = (copilotMounted: boolean) =>
    showCopilot && copilot ? (
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as "details" | "copilot")}
        className="min-h-0 flex-1 gap-0"
      >
        <TabsList variant="line" className="w-full shrink-0 border-b px-2">
          <TabsTrigger value="details">
            <IconId />
            Details
          </TabsTrigger>
          <TabsTrigger value="copilot">
            <IconSparkles />
            Copilot
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="flex min-h-0 flex-col">
          {details}
        </TabsContent>
        <TabsContent value="copilot" className="flex min-h-0 flex-col">
          {copilotMounted ? (
            <TicketCopilotPanel
              key={copilot.ticketId}
              storeCode={copilot.storeCode}
              ticketId={copilot.ticketId}
              refreshKey={copilot.refreshKey}
              onInsertDraft={copilot.onInsertDraft}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    ) : (
      details
    );

  return (
    <>
      <aside className="hidden min-h-0 w-72 shrink-0 flex-col border-l xl:flex 2xl:w-95">
        {withTabs(!sheetOpen)}
      </aside>
      {onOpenChange ? (
        <Sheet open={Boolean(open)} onOpenChange={onOpenChange}>
          <SheetContent
            side="right"
            className="h-dvh max-h-dvh w-full gap-0 overflow-hidden p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md xl:hidden"
          >
            <SheetHeader className="border-b">
              <SheetTitle>
                {showCopilot ? "Details and Copilot" : "Customer details"}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Orders, tickets and session data for this customer.
              </SheetDescription>
            </SheetHeader>
            {withTabs(sheetOpen)}
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
