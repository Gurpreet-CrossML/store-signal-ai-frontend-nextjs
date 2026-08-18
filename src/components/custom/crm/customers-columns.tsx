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
import { formatPrice, formatRelativeDateTime } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type {
  CustomerAddress,
  CustomerRecord,
} from "@/redux/api-slice/customer-slice";

/** The customer's own name, or their email when the platform sent none. */
export function customerDisplayName(customer: CustomerRecord) {
  const full =
    `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();
  return full || customer.email || "Guest";
}

/** Default shipping address, then billing, then whatever exists. */
export function primaryAddress(
  customer: CustomerRecord,
): CustomerAddress | undefined {
  const addresses = customer.addresses ?? [];
  return (
    addresses.find((address) => address.default_shipping) ??
    addresses.find((address) => address.default_billing) ??
    addresses[0]
  );
}

/** "Everson WA, United States" — the parts that exist, in reading order. */
export function formatLocation(address?: CustomerAddress) {
  if (!address) return null;
  const locality = [address.city, address.region].filter(Boolean).join(" ");
  return [locality, address.country_id].filter(Boolean).join(", ") || null;
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
        const location = formatLocation(primaryAddress(row.original));
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
          {row.original.orders_count}
        </div>
      ),
    },
    {
      accessorKey: "total_spent",
      header: () => <div className="text-right">Total Spent</div>,
      cell: ({ row }) => {
        const spent = Number(row.original.total_spent ?? 0);
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
            {formatPrice(row.original.total_spent)}
          </div>
        );
      },
    },
    {
      accessorKey: "registered_at",
      header: () => <div className="text-right">Customer Since</div>,
      cell: ({ row }) =>
        row.original.registered_at ? (
          <div className="text-right">
            <Badge variant="outline" className="font-normal">
              {formatRelativeDateTime(row.original.registered_at)}
            </Badge>
          </div>
        ) : (
          <div className="text-right">
            <Typography variant="muted">—</Typography>
          </div>
        ),
    },
  ];
}
