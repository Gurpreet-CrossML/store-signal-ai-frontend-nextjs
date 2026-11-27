"use client";

import { type ColumnDef } from "@tanstack/react-table";

import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { CustomerSegmentBadge } from "@/components/custom/customer-segment-badge";
import { Badge } from "@/components/ui/badge";
import { FulfillmentBadge, StatusBadge } from "@/components/ui/status-badge";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { formatDate, formatPrice } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type { OrderTableRow } from "@/redux/api-slice/order-slice";

/** "#1001" — the platform's own label, or the number it issued. */
export function orderLabel(order: { name: string; order_number: string }) {
  return order.name || `#${order.order_number}`;
}

/** Fulfillment as a badge; a cancelled order reads "Cancelled" instead. */
export function OrderFulfillment({
  order,
}: {
  order: Pick<OrderTableRow, "cancelled_at" | "fulfillment_status">;
}) {
  if (order.cancelled_at) {
    return (
      <Badge variant="outline" className={BADGE_TONE_STYLES.danger}>
        Cancelled
      </Badge>
    );
  }
  // Platforms send "" or nothing for an order not started.
  return <FulfillmentBadge status={order.fulfillment_status || null} />;
}

/** The total; struck through when cancelled or refunded in full. */
function OrderTotal({ order }: { order: OrderTableRow }) {
  const total = Number(order.total_price);
  const refunded = Number(order.total_refunded);
  const struck =
    Boolean(order.cancelled_at) || (total > 0 && refunded >= total);
  return (
    <div className="text-right tabular-nums">
      <span
        className={cn(
          "text-sm",
          struck
            ? "text-muted-foreground line-through"
            : "font-medium text-foreground",
        )}
      >
        {formatPrice(order.total_price, order.currency)}
      </span>
      {refunded > 0 && !struck ? (
        <Typography variant="muted" as="p" className="text-xs">
          {formatPrice(refunded, order.currency)} refunded
        </Typography>
      ) : null}
    </div>
  );
}

// The tablet drops placed date, items and payment; the phone keeps only
// the order and its total.
const FROM_TABLET = "max-md:hidden";
const FROM_DESKTOP = "max-xl:hidden";
// Fixed widths keep the gaps between columns even; the customer column takes
// the rest. The badge columns start with extra room after the right-aligned
// total.
const BADGE_COLUMN = "w-40 pl-8";

export function getOrderColumns({
  showPayment,
  showFulfillment,
}: {
  /** Off when every row would say the same payment state. */
  showPayment: boolean;
  /** Off on a fulfillment tab, for the same reason. */
  showFulfillment: boolean;
}): ColumnDef<OrderTableRow>[] {
  const columns: (ColumnDef<OrderTableRow> | false)[] = [
    {
      id: "order",
      header: "Order",
      meta: { headClassName: "md:w-28" },
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="min-w-0">
            <Typography variant="small" as="p" className="truncate">
              {order.label}
            </Typography>
            {/* A phone has no other columns, so the row carries their gist. */}
            <div className="mt-1 flex min-w-0 items-center gap-2 md:hidden">
              {order.customer ? (
                <Typography variant="muted" className="truncate">
                  {order.customer.name}
                </Typography>
              ) : (
                <Typography variant="muted">
                  {formatDate(order.created_at)}
                </Typography>
              )}
              {showFulfillment ? <OrderFulfillment order={order} /> : null}
            </div>
          </div>
        );
      },
    },
    {
      id: "placed",
      header: "Placed",
      meta: {
        headClassName: `w-36 ${FROM_DESKTOP}`,
        cellClassName: FROM_DESKTOP,
      },
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: "customer",
      header: "Customer",
      meta: { headClassName: FROM_TABLET, cellClassName: FROM_TABLET },
      cell: ({ row }) => {
        const customer = row.original.customer;
        if (!customer) return <Typography variant="muted">Guest</Typography>;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <CustomerAvatar name={customer.name} size="size-8" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Typography variant="small" as="p" className="truncate">
                  {customer.name}
                </Typography>
                {customer.vip ? (
                  <CustomerSegmentBadge segment="vip" className="shrink-0" />
                ) : null}
              </div>
              {customer.email !== customer.name ? (
                <Typography variant="muted" className="truncate">
                  {customer.email}
                </Typography>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      id: "items",
      header: "Items",
      meta: {
        headClassName: `w-20 text-right ${FROM_DESKTOP}`,
        cellClassName: FROM_DESKTOP,
      },
      cell: ({ row }) => (
        <div className="text-right tabular-nums">{row.original.items}</div>
      ),
    },
    {
      id: "total",
      header: "Total",
      meta: { headClassName: "text-right md:w-36" },
      cell: ({ row }) => <OrderTotal order={row.original} />,
    },
    showPayment && {
      id: "payment",
      header: "Payment",
      meta: {
        headClassName: `${BADGE_COLUMN} ${FROM_DESKTOP}`,
        cellClassName: `pl-8 ${FROM_DESKTOP}`,
      },
      cell: ({ row }) => <StatusBadge status={row.original.financial_status} />,
    },
    showFulfillment && {
      id: "fulfillment",
      header: "Fulfillment",
      meta: {
        headClassName: `${BADGE_COLUMN} ${FROM_TABLET}`,
        cellClassName: `pl-8 ${FROM_TABLET}`,
      },
      cell: ({ row }) => <OrderFulfillment order={row.original} />,
    },
  ];
  return columns.filter((column): column is ColumnDef<OrderTableRow> =>
    Boolean(column),
  );
}
