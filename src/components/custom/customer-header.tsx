"use client";

import Link from "next/link";
import { IconExternalLink, IconUserPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import type { OrderData } from "@/redux/api-slice/thread-slice";

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

function maskPhone(phone: string) {
  const compact = phone.replace(/\s+/g, " ").trim();
  if (compact.length < 5) return "••••";
  return `${compact.slice(0, 3)}••••${compact.slice(-2)}`;
}

/**
 * Who you are talking to, under their name: email and masked phone on one
 * muted line. The phone falls back to the newest order that carries one
 * when the customer record has none. Renders nothing when there is neither
 * — a line reading "no email" is worse than no line.
 */
export function CustomerContact({
  email,
  phone,
  orders,
}: {
  email?: string | null;
  phone?: string | null;
  orders?: OrderData[] | null;
}) {
  const orderPhone = (orders ?? [])
    .map(
      (order) =>
        order.shipping_address?.phone ||
        order.shipping_address?.telephone ||
        order.customer_phone,
    )
    .find(Boolean);
  const rawPhone = phone || orderPhone;
  const contact = [email, rawPhone ? maskPhone(rawPhone) : null]
    .filter(Boolean)
    .join(" · ");

  if (!contact) return null;

  return (
    <Typography variant="muted" className="truncate">
      {contact}
    </Typography>
  );
}
