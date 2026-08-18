"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  IconMail,
  IconMessage,
  IconRosetteDiscountCheck,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import {
  customerLocation,
  customerOrderCount,
  customerSince,
  customerTotalSpent,
} from "@/lib/customer-facts";
import { formatPrice, formatRelativeDateTime } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type { CustomerRecord } from "@/redux/api-slice/customer-slice";

/** The customer's own name, or their email when the platform sent none. */
export function customerDisplayName(customer: CustomerRecord) {
  const full =
    `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();
  return full || customer.email || "Guest";
}

/**
 * Consent as two marks rather than one "Subscribed" pill: email and SMS are
 * separate permissions, and a store that can email but not text a customer
 * needs to see that at a glance before starting a campaign.
 */
function ConsentMarks({ customer }: { customer: CustomerRecord }) {
  const channels = [
    {
      key: "email",
      icon: IconMail,
      granted: customer.accepts_email_marketing,
      label: "Email marketing",
    },
    {
      key: "sms",
      icon: IconMessage,
      granted: customer.accepts_sms_marketing,
      label: "SMS marketing",
    },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {channels.map((channel) => (
        <Tooltip key={channel.key}>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-md border",
                channel.granted
                  ? BADGE_TONE_STYLES.success
                  : "border-border text-muted-foreground/50",
              )}
            >
              <channel.icon className="size-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {channel.label}: {channel.granted ? "opted in" : "not opted in"}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export function getCustomerColumns(): ColumnDef<CustomerRecord>[] {
  return [
    {
      accessorKey: "first_name",
      header: "Customer",
      cell: ({ row }) => {
        const customer = row.original;
        const name = customerDisplayName(customer);
        // Identity in one column: Shopify drops the raw email into the name
        // slot when a shopper has no name, which reads as a different kind
        // of row. Here the email is always the second line, so the column
        // has one shape whether or not a name exists.
        return (
          <div className="flex items-center gap-2.5">
            <CustomerAvatar name={name} size="size-8" />
            <div className="min-w-0">
              <Typography variant="small" as="p" className="truncate">
                {name}
              </Typography>
              <div className="flex items-center gap-1">
                <Typography variant="muted" className="truncate">
                  {customer.email || "—"}
                </Typography>
                {customer.is_email_verified ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <IconRosetteDiscountCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    </TooltipTrigger>
                    <TooltipContent>Email Verified</TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) =>
        row.original.phone ? (
          <Typography
            variant="small"
            as="span"
            className="font-mono font-normal"
          >
            {row.original.phone}
          </Typography>
        ) : (
          <Typography variant="muted">—</Typography>
        ),
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => {
        const location = customerLocation(row.original);
        return location ? (
          <Typography variant="small" as="span" className="font-normal">
            {location}
          </Typography>
        ) : (
          <Typography variant="muted">—</Typography>
        );
      },
    },
    {
      id: "consent",
      header: "Marketing",
      cell: ({ row }) => <ConsentMarks customer={row.original} />,
    },
    {
      accessorKey: "orders_count",
      header: () => <div className="text-right">Orders</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {customerOrderCount(row.original)}
        </div>
      ),
    },
    {
      accessorKey: "total_spent",
      header: () => <div className="text-right">Total Spent</div>,
      cell: ({ row }) => {
        const { amount: spent, currency } = customerTotalSpent(row.original);
        return (
          <div
            className={cn(
              "text-right tabular-nums",
              // A shopper who has never paid is a different kind of row from
              // one who has; quieting the zeros makes the spenders findable
              // by eye, which a column of identical "$0.00" does not.
              spent > 0
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {formatPrice(spent, currency)}
          </div>
        );
      },
    },
    {
      accessorKey: "registered_at",
      header: () => <div className="text-right">Customer Since</div>,
      cell: ({ row }) => {
        const since = customerSince(row.original);
        if (!since.value) {
          return (
            <div className="text-right">
              <Typography variant="muted">—</Typography>
            </div>
          );
        }

        return (
          <div className="text-right">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="font-normal">
                  {formatRelativeDateTime(since.value)}
                </Badge>
              </TooltipTrigger>
              {/* Which question the date answers. Most synced shoppers have
                  no registration date on the platform, and showing when we
                  first saw them as though it were one would misdate them. */}
              <TooltipContent>
                {since.registered
                  ? "Registered with the store"
                  : "First seen — the store sent no registration date"}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];
}
