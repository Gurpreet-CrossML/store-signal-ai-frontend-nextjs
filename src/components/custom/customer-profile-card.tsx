"use client";

import Link from "next/link";
import { IconAt, IconMapPin, IconPhone, IconUser } from "@tabler/icons-react";

import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { formatPrice } from "@/lib/helpers";
import type { CustomerRecord } from "@/redux/api-slice/customer-slice";
import type { Customer } from "@/redux/api-slice/thread-slice";

function maskPhone(phone: string | null | undefined) {
  if (!phone) return "—";
  const compact = phone.replace(/\s+/g, " ").trim();
  if (compact.length < 5) return "••••";
  return `${compact.slice(0, 3)}••••${compact.slice(-2)}`;
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IconAt;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <Typography variant="muted" className="text-[11px] leading-tight">
          {label}
        </Typography>
        <Typography variant="small" as="p" className="truncate font-normal">
          {value}
        </Typography>
      </div>
    </div>
  );
}

export function CustomerProfileCard({
  customer,
  fallback,
}: {
  customer?: CustomerRecord | null;
  fallback?: Customer | null;
}) {
  const name = customer
    ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || customer.email
    : fallback?.name || fallback?.email || "Guest";
  const email = customer?.email || fallback?.email || "—";
  const address = customer?.addresses?.find((item) => item.default_shipping) ?? customer?.addresses?.[0];
  const city = address?.city || "—";
  const orderCount = customer?.orders_count ?? 0;
  const status = orderCount > 0 ? "Returning customer" : "New customer";
  const lifetimeValue = customer
    ? formatPrice(customer.total_spent, customer.orders?.[0]?.currency ?? "USD")
    : "—";

  return (
    <section className="flex flex-col gap-3 border-b p-4">
      <div className="flex items-center gap-2.5">
        <CustomerAvatar name={name} />
        <div className="min-w-0">
          <CardTitle className="truncate text-sm">{name}</CardTitle>
          <Typography variant="muted">{status}</Typography>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Detail icon={IconAt} label="Email" value={email} />
        <Detail icon={IconPhone} label="Phone" value={maskPhone(customer?.phone)} />
        <Detail icon={IconMapPin} label="City" value={city} />
        <Detail icon={IconUser} label="Orders" value={String(orderCount)} />
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-2.5">
        <div>
          <Typography variant="muted">Lifetime value</Typography>
          <Typography variant="small" as="p" className="font-medium">
            {lifetimeValue}
          </Typography>
        </div>
        {customer?.id ? (
          <Link
            href={`/threads?search=${encodeURIComponent(email)}`}
            className="self-end text-right text-xs text-primary hover:underline"
          >
            View past threads
          </Link>
        ) : null}
      </div>
    </section>
  );
}
