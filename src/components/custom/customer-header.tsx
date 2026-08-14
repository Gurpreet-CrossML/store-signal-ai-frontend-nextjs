"use client";

import Link from "next/link";
import {
  IconDeviceLaptop,
  IconExternalLink,
  IconLocationPin,
  IconNetwork,
  IconUserPlus,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import type { UserMetadata } from "@/redux/api-slice/thread-slice";

/**
 * The one action that belongs beside a customer's name: open their record,
 * or attach one if this is a guest.
 *
 * An icon rather than a full-width button — it sat in the details pane as
 * "View in CRM" taking a whole row, which is a lot of furniture for a
 * link, and put it a long way from the name it refers to.
 */
export function CrmLinkButton({
  customerId,
  onLinkCustomer,
}: {
  customerId?: number | null;
  /** Offered when there is no customer to open. */
  onLinkCustomer?: () => void;
}) {
  if (customerId) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="View in CRM"
            asChild
          >
            <Link href={`/crm/customers/${customerId}`}>
              <IconExternalLink className="size-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>View in CRM</TooltipContent>
      </Tooltip>
    );
  }

  if (!onLinkCustomer) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Link a customer"
          onClick={onLinkCustomer}
        >
          <IconUserPlus className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Link a customer</TooltipContent>
    </Tooltip>
  );
}

/** Icon and value, with the field name in a tooltip. */
function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IconNetwork;
  label: string;
  value: string;
}) {
  if (!value) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <Icon className="size-4 shrink-0" />
          <Typography variant="caption" className="truncate">
            {value}
          </Typography>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Where the visitor is browsing from, on the conversation header rather
 * than down the details pane.
 *
 * It is context for the person you are already looking at, so it belongs
 * next to their name — and moving it up buys the pane back three rows for
 * orders and tickets, which is what an agent actually works from.
 */
export function SessionFacts({
  userMetadata,
}: {
  userMetadata?: UserMetadata | null;
}) {
  if (!userMetadata) return null;

  const device = [
    userMetadata.device_type,
    userMetadata.browser,
    userMetadata.os,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="hidden shrink-0 items-center gap-4 lg:flex">
      <Fact
        icon={IconLocationPin}
        label="Location"
        value={userMetadata.geo_location ?? ""}
      />
      <Fact
        icon={IconNetwork}
        label="IP address"
        value={userMetadata.ip_address ?? ""}
      />
      <Fact icon={IconDeviceLaptop} label="Device" value={device} />
    </div>
  );
}
