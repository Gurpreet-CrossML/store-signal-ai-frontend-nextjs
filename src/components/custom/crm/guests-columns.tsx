"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { IconUserCheck, IconUserQuestion } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { formatDateTime, formatRelativeDateTime } from "@/lib/helpers";
import type {
  GuestCustomer,
  GuestDevice,
  GuestRecord,
} from "@/redux/api-slice/guest-slice";

/** A guest has no name: the first characters of their browser key stand in. */
export function guestDisplayName(guest: GuestRecord) {
  return `Guest ${guest.visitor_key.slice(0, 6)}`;
}

/** The name of the customer a guest became, or their email. */
export function guestCustomerName(customer: GuestCustomer) {
  const full =
    `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();
  return full || customer.email || "Customer";
}

/** "Mobile · Chrome", or null when the chat recorded neither. */
export function guestDeviceLabel(device: GuestDevice | null) {
  const parts = [device?.device_type, device?.browser].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/** "Became customer" with their name, or a plain "Guest". */
export function GuestStatusBadge({ guest }: { guest: GuestRecord }) {
  if (!guest.customer) {
    return (
      <Badge variant="outline" className={BADGE_TONE_STYLES.neutral}>
        <IconUserQuestion />
        Guest
      </Badge>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={BADGE_TONE_STYLES.success}>
          <IconUserCheck />
          Became customer
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{guestCustomerName(guest.customer)}</TooltipContent>
    </Tooltip>
  );
}

/** A count, quiet when it is zero so the active guests stand out. */
function CountCell({ value }: { value: number }) {
  return (
    <div
      className={
        value > 0
          ? "text-right tabular-nums"
          : "text-right text-muted-foreground tabular-nums"
      }
    >
      {value}
    </div>
  );
}

export function getGuestColumns(): ColumnDef<GuestRecord>[] {
  return [
    {
      accessorKey: "visitor_key",
      header: "Guest",
      cell: ({ row }) => (
        <div className="min-w-0">
          <Typography variant="small" as="p" className="truncate font-mono">
            {guestDisplayName(row.original)}
          </Typography>
          <Typography variant="muted" className="truncate">
            First seen {formatRelativeDateTime(row.original.created_at)}
          </Typography>
        </div>
      ),
    },
    {
      accessorKey: "visit_count",
      header: () => <div className="text-right">Visits</div>,
      cell: ({ row }) => <CountCell value={row.original.visit_count} />,
    },
    {
      accessorKey: "chats_count",
      header: () => <div className="text-right">Chats</div>,
      cell: ({ row }) => <CountCell value={row.original.chats_count} />,
    },
    {
      accessorKey: "viewed_count",
      header: () => (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-right">Viewed</div>
          </TooltipTrigger>
          <TooltipContent>Product pages they opened</TooltipContent>
        </Tooltip>
      ),
      cell: ({ row }) => <CountCell value={row.original.viewed_count} />,
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) =>
        row.original.device?.location ? (
          <Typography variant="small" as="span" className="font-normal">
            {row.original.device.location}
          </Typography>
        ) : (
          <Typography variant="muted">—</Typography>
        ),
    },
    {
      id: "device",
      header: "Device",
      cell: ({ row }) => {
        const label = guestDeviceLabel(row.original.device);
        return label ? (
          <Typography variant="small" as="span" className="font-normal">
            {label}
          </Typography>
        ) : (
          <Typography variant="muted">—</Typography>
        );
      },
    },
    {
      accessorKey: "last_visit_at",
      header: () => <div className="text-right">Last Visit</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="font-normal">
                {formatRelativeDateTime(row.original.last_visit_at)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {formatDateTime(row.original.last_visit_at)}
            </TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];
}
