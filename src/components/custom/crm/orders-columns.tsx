"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { IconTruckDelivery } from "@tabler/icons-react";

import { FulfillmentBadge, StatusBadge } from "@/components/ui/status-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { formatDate, formatPrice, formatRelativeTime } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import {
  orderCustomer,
  type OrderListRow,
} from "@/redux/api-slice/order-slice";

/** "#1001" — the platform's own label, or the number it issued. */
export function orderLabel(order: { name: string; order_number: string }) {
  return order.name || `#${order.order_number}`;
}

/**
 * Orders still waiting on the warehouse — where the aging cue belongs.
 * Cancelled orders never age: nobody is going to fulfil them.
 */
function isAwaitingFulfillment(order: OrderListRow) {
  if (order.cancelled_at) return false;
  const status = (order.fulfillment_status ?? "").toLowerCase();
  return (
    status === "" ||
    status.includes("unfulfilled") ||
    status.includes("partial")
  );
}

export function getOrderColumns(): ColumnDef<OrderListRow>[] {
  return [
    {
      accessorKey: "order_number",
      header: "Order",
      cell: ({ row }) => {
        const order = row.original;
        // Cancelled reads the way ledgers write it — the number struck
        // through and dimmed — instead of a badge fighting the number for
        // room. When it happened is one hover away.
        if (order.cancelled_at) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Typography
                  variant="small"
                  as="p"
                  className="truncate text-muted-foreground line-through"
                >
                  {orderLabel(order)}
                </Typography>
              </TooltipTrigger>
              <TooltipContent>
                Cancelled {formatDate(order.cancelled_at)}
              </TooltipContent>
            </Tooltip>
          );
        }
        return (
          <Typography variant="small" as="p" className="truncate">
            {orderLabel(order)}
          </Typography>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => (
        <Typography variant="small" as="p" className="truncate font-normal">
          {formatDate(row.original.created_at)}
        </Typography>
      ),
    },
    {
      accessorKey: "customer_email",
      header: "Customer",
      cell: ({ row }) => {
        const customer = orderCustomer(row.original);
        // The name leads when the platform sent one — it is how an agent
        // recognises a shopper. Contact details drop to the second line.
        const label = customer.name || customer.email || customer.phone;
        if (!label) {
          return <Typography variant="muted">—</Typography>;
        }
        const secondary = customer.name
          ? customer.email || customer.phone
          : customer.email && customer.phone
            ? customer.phone
            : "";

        return (
          <div className="min-w-0">
            {/* The email captured at checkout, which the model notes may
                differ from the account's — so it links to the account
                rather than pretending they are the same address. Plain
                text when the order carries no linked customer. */}
            {customer.id ? (
              <Link
                href={`/crm/customers/${customer.id}`}
                className="block truncate text-sm text-primary hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {label}
              </Link>
            ) : (
              <Typography
                variant="small"
                as="p"
                className="truncate font-normal"
              >
                {label}
              </Typography>
            )}
            {secondary ? (
              <Typography variant="muted" className="truncate">
                {secondary}
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
        const status = (order.financial_status ?? "").toLowerCase();
        const refunded = Number(order.total_refunded ?? 0);
        const paid = Number(order.total_paid ?? 0);
        const partiallyPaid =
          status.includes("partial") && status.includes("paid");

        // The amounts an agent is usually being asked about — what came
        // back, what has actually been paid — one hover away on the badge
        // rather than extra lines that made row heights ragged. (Amount
        // still owed would belong here too, but the list serializer does
        // not send total_outstanding.)
        const moneyNotes = [
          refunded > 0
            ? `${formatPrice(refunded, order.currency)} refunded`
            : null,
          partiallyPaid && paid > 0
            ? `${formatPrice(paid, order.currency)} paid of ${formatPrice(
                order.total_price,
                order.currency,
              )}`
            : null,
        ].filter((note): note is string => note !== null);

        const badge = <StatusBadge status={order.financial_status} />;
        if (moneyNotes.length === 0) return badge;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">{badge}</span>
            </TooltipTrigger>
            <TooltipContent className="tabular-nums">
              {moneyNotes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: "fulfillment_status",
      header: "Fulfillment",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex flex-col items-start gap-1">
            <FulfillmentBadge status={order.fulfillment_status} />
            {/* Shopify's "Fulfill by … days ago" cue, from the data the
                list does send: how long the order has sat unshipped. */}
            {isAwaitingFulfillment(order) ? (
              <Typography
                variant="caption"
                as="p"
                className="text-orange-600 dark:text-orange-400"
              >
                {formatRelativeTime(order.created_at)} waiting
              </Typography>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "tracking",
      header: "Tracking",
      cell: ({ row }) => {
        const order = row.original;
        if (!order.tracking_number) {
          return <Typography variant="muted">—</Typography>;
        }
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <IconTruckDelivery className="size-3.5" />
                <span className="max-w-32 truncate font-mono">
                  {order.tracking_number}
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>{order.tracking_number}</TooltipContent>
          </Tooltip>
        );
      },
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
