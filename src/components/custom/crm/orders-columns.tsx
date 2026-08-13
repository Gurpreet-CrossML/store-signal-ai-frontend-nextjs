"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { IconTruckDelivery, IconX } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { FulfillmentBadge, StatusBadge } from "@/components/ui/status-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { formatDate, formatPrice } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type { OrderRecord } from "@/redux/api-slice/order-slice";

/** "#1001" — the platform's own label, or the number it issued. */
export function orderLabel(order: OrderRecord) {
  return order.name || `#${order.order_number}`;
}

export function getOrderColumns(): ColumnDef<OrderRecord>[] {
  return [
    {
      accessorKey: "order_number",
      header: "Order",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Typography variant="small" as="p" className="truncate">
                {orderLabel(order)}
              </Typography>
              {order.cancelled_at ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={BADGE_TONE_STYLES.danger}
                    >
                      <IconX />
                      Cancelled
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {order.cancel_reason
                      ? `Cancelled — ${order.cancel_reason}`
                      : "Cancelled"}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <Typography variant="muted" className="truncate">
              {formatDate(order.created_at)}
            </Typography>
          </div>
        );
      },
    },
    {
      accessorKey: "customer_email",
      header: "Customer",
      cell: ({ row }) => {
        const order = row.original;
        if (!order.customer_email && !order.customer_phone) {
          return <Typography variant="muted">—</Typography>;
        }
        return (
          <div className="min-w-0">
            {/* The email captured at checkout, which the model notes may
                differ from the account's — so it links to the account
                rather than pretending they are the same address. */}
            <Link
              href={`/crm/customers/${order.customer}`}
              className="block truncate text-sm text-primary hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {order.customer_email || order.customer_phone}
            </Link>
            {order.customer_email && order.customer_phone ? (
              <Typography variant="muted" className="truncate font-mono">
                {order.customer_phone}
              </Typography>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "financial_status",
      header: "Payment",
      cell: ({ row }) => {
        const order = row.original;
        const outstanding = Number(order.total_outstanding ?? 0);
        const refunded = Number(order.total_refunded ?? 0);

        return (
          <div className="flex flex-col items-start gap-1">
            <StatusBadge status={order.financial_status} />
            {/* Money still owed or already returned is the thing an agent
                is actually being asked about; Shopify makes you open the
                order to find either. */}
            {outstanding > 0 ? (
              <Typography variant="muted" className="tabular-nums">
                {formatPrice(outstanding, order.currency)} owed
              </Typography>
            ) : refunded > 0 ? (
              <Typography variant="muted" className="tabular-nums">
                {formatPrice(refunded, order.currency)} refunded
              </Typography>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "fulfillment_status",
      header: "Delivery",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex flex-col items-start gap-1">
            <FulfillmentBadge status={order.fulfillment_status} />
            {order.tracking_number ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <IconTruckDelivery className="size-3.5" />
                    <span className="max-w-32 truncate font-mono">
                      {order.tracking_number}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {order.tracking_company
                    ? `${order.tracking_company} · ${order.tracking_number}`
                    : order.tracking_number}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "items",
      header: () => <div className="text-right">Items</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {row.original.items?.length ?? 0}
        </div>
      ),
    },
    {
      accessorKey: "total_price",
      header: () => <div className="text-right">Total</div>,
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div
            className={cn(
              "text-right tabular-nums",
              order.cancelled_at
                ? "text-muted-foreground line-through"
                : "font-medium text-foreground",
            )}
          >
            {formatPrice(order.total_price, order.currency)}
          </div>
        );
      },
    },
  ];
}
