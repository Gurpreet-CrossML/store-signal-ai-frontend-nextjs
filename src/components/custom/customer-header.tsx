"use client";

import Link from "next/link";
import {
  IconDeviceLaptop,
  IconExternalLink,
  IconInfoCircle,
  IconLocationPin,
  IconNetwork,
  IconUserPlus,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
 * "View in Catalog" taking a whole row, which is a lot of furniture for a
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
            aria-label="View in Catalog"
            asChild
          >
            <Link href={`/crm/customers/${customerId}`}>
              <IconExternalLink className="size-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>View in Catalog</TooltipContent>
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
          aria-label="Link a Customer"
          onClick={onLinkCustomer}
        >
          <IconUserPlus className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Link a Customer</TooltipContent>
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

  const facts = [
    {
      icon: IconLocationPin,
      label: "Location",
      value: userMetadata.geo_location ?? "",
    },
    {
      icon: IconNetwork,
      label: "IP address",
      value: userMetadata.ip_address ?? "",
    },
    { icon: IconDeviceLaptop, label: "Device", value: device },
  ].filter((fact) => fact.value);

  if (facts.length === 0) return null;

  return (
    <>
      {/* Inline only where the header has the width to spare — below 2xl
          the row was crushing the customer's name to a letter. */}
      <div className="hidden shrink-0 items-center gap-4 2xl:flex">
        {facts.map((fact) => (
          <Fact key={fact.label} {...fact} />
        ))}
      </div>

      {/* Narrow screens keep every fact one hover away behind a single
          icon, instead of hiding them or fighting the name for room. */}
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Session details"
            className="shrink-0 text-muted-foreground 2xl:hidden"
          >
            <IconInfoCircle className="size-4" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent
          align="end"
          className="flex w-auto max-w-xs flex-col gap-2.5"
        >
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <Typography variant="muted">{label}</Typography>
                <Typography variant="small" as="p" className="wrap-break-word">
                  {value}
                </Typography>
              </div>
            </div>
          ))}
        </HoverCardContent>
      </HoverCard>
    </>
  );
}
