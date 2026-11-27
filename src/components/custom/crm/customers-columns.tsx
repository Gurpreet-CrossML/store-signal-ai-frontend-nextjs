"use client";

import { type ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { CustomerSegmentBadge } from "@/components/custom/customer-segment-badge";
import type { CustomerTab } from "@/components/custom/crm/customer-tabs";
import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { formatPrice } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type {
  CustomerBadge,
  CustomerListRow,
  CustomerRecord,
} from "@/redux/api-slice/customer-slice";

/** The customer's own name, or their email when the platform sent none. */
export function customerDisplayName(
  customer: Pick<CustomerRecord, "first_name" | "last_name" | "email">,
) {
  const full =
    `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();
  return full || customer.email || "Guest";
}

/** The other badges' label and colour; VIP uses the app's own VIP badge. */
const CUSTOMER_BADGES: Record<
  Exclude<CustomerBadge, "vip">,
  { label: string; tone: BadgeTone }
> = {
  at_risk: { label: "At Risk", tone: "danger" },
};

/**
 * A customer's group badge. VIP is the same yellow badge Live Support and
 * Help Desk show, so a VIP looks the same everywhere.
 */
export function CustomerBadgeTag({
  badge,
  className,
}: {
  badge: CustomerBadge;
  className?: string;
}) {
  if (badge === "vip") {
    return <CustomerSegmentBadge segment="vip" className={className} />;
  }
  const { label, tone } = CUSTOMER_BADGES[badge];
  return (
    <Badge variant="outline" className={cn(BADGE_TONE_STYLES[tone], className)}>
      {label}
    </Badge>
  );
}

/** "Today", "1 day ago", "58 days ago". */
export function daysAgo(days: number) {
  if (days <= 0) return "Today";
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

/** Whole days from an ISO date to now. */
function daysSince(value: string) {
  return Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
}

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function Muted({ children }: { children: React.ReactNode }) {
  return <Typography variant="muted">{children}</Typography>;
}

// Columns past the customer and lifetime value hide on smaller screens: the
// tablet keeps last order, the phone keeps just the two.
const FROM_TABLET = "max-md:hidden";
const FROM_DESKTOP = "max-xl:hidden";
// The number columns share one width and alignment, so the gaps between
// them are even; the customer column takes the rest.
const NUMBER_COLUMN = "w-36 text-right";

export function getCustomerColumns({
  currency,
  tab,
}: {
  currency: string;
  /** The open tab; its own badge is not repeated on every row. */
  tab: CustomerTab;
}): ColumnDef<CustomerListRow>[] {
  return [
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const customer = row.original;
        const name = customerDisplayName(customer);
        // The open tab's own badge is not repeated on every row.
        const badge =
          customer.badge && customer.badge !== tab ? customer.badge : null;
        return (
          <div className="flex items-center gap-3">
            <CustomerAvatar name={name} size="size-8" />
            {/* Capped on a phone so a long name truncates instead of pushing
                the lifetime value off the screen. */}
            <div className="min-w-0 max-md:max-w-44">
              <div className="flex items-center gap-1.5">
                <Typography variant="small" as="p" className="truncate">
                  {name}
                </Typography>
                {badge ? (
                  <CustomerBadgeTag badge={badge} className="shrink-0" />
                ) : null}
              </div>
              {/* A phone has no room for the other columns, so the second
                  line carries their gist instead of the email. */}
              <Typography variant="muted" className="truncate md:hidden">
                {plural(customer.order_count, "order")}
                {customer.last_order_at
                  ? ` · last ${daysAgo(daysSince(customer.last_order_at)).toLowerCase()}`
                  : ""}
              </Typography>
              <Typography variant="muted" className="truncate max-md:hidden">
                {customer.email || "—"}
              </Typography>
            </div>
          </div>
        );
      },
    },
    {
      id: "lifetime_value",
      header: "Lifetime Value",
      meta: { headClassName: NUMBER_COLUMN },
      cell: ({ row }) => {
        const value = Number(row.original.lifetime_value);
        return (
          <div className="text-right text-sm font-semibold tabular-nums">
            {value > 0 ? formatPrice(value, currency) : "—"}
          </div>
        );
      },
    },
    {
      id: "orders",
      header: "Orders",
      meta: {
        headClassName: `${NUMBER_COLUMN} ${FROM_DESKTOP}`,
        cellClassName: FROM_DESKTOP,
      },
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {row.original.order_count}
        </div>
      ),
    },
    {
      id: "average_order",
      header: "Avg Order",
      meta: {
        headClassName: `${NUMBER_COLUMN} ${FROM_DESKTOP}`,
        cellClassName: FROM_DESKTOP,
      },
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {row.original.average_order
            ? formatPrice(row.original.average_order, currency)
            : "—"}
        </div>
      ),
    },
    {
      id: "last_order",
      header: "Last Order",
      meta: {
        headClassName: `${NUMBER_COLUMN} ${FROM_TABLET}`,
        cellClassName: `text-right ${FROM_TABLET}`,
      },
      cell: ({ row }) =>
        row.original.last_order_at ? (
          daysAgo(daysSince(row.original.last_order_at))
        ) : (
          <Muted>—</Muted>
        ),
    },
  ];
}
