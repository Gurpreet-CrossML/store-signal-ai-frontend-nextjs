"use client";

import Link from "next/link";
import { IconAt, IconMapPin, IconPhone, IconUser } from "@tabler/icons-react";

import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { formatPrice } from "@/lib/helpers";
import type { CustomerRecord } from "@/redux/api-slice/customer-slice";
import type {
  Customer,
  OrderData,
  UserMetadata,
} from "@/redux/api-slice/thread-slice";

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
  orders,
  userMetadata,
}: {
  customer?: CustomerRecord | null;
  fallback?: Customer | null;
  orders?: OrderData[] | null;
  userMetadata?: UserMetadata | null;
}) {
  const name = customer
    ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() ||
      customer.email
    : fallback?.name ||
      fallback?.email ||
      userMetadata?.customer_name ||
      "Guest";
  const email = customer?.email || fallback?.email || "—";

  const orderList = orders ?? customer?.orders ?? [];
  const orderCount = customer?.orders_count || orderList.length;
  const isGuest = !customer?.id && !fallback?.id && (!email || email === "—");
  const status = isGuest
    ? "Guest"
    : orderCount > 0
      ? "Returning customer"
      : "New customer";

  const customerAddress =
    customer?.addresses?.find((item) => item.default_shipping) ??
    customer?.addresses?.find((item) => item.default_billing) ??
    customer?.addresses?.[0];

  const latestOrderWithAddress = orderList.find(
    (order) =>
      order.shipping_address?.city ||
      order.shipping_address?.province ||
      order.shipping_address?.address1 ||
      order.shipping_address?.phone ||
      order.shipping_address?.telephone,
  );

  const orderCity =
    latestOrderWithAddress?.shipping_address?.city ||
    latestOrderWithAddress?.shipping_address?.province;
  const geoCity = userMetadata?.geo_location?.split(",")?.[0]?.trim();
  const city =
    customerAddress?.city ||
    customerAddress?.region ||
    orderCity ||
    geoCity ||
    "—";

  const rawPhone =
    customer?.phone ||
    fallback?.phone ||
    latestOrderWithAddress?.shipping_address?.phone ||
    latestOrderWithAddress?.shipping_address?.telephone;
  const phone = maskPhone(rawPhone);

  const reportedSpent = Number(customer?.total_spent ?? 0);
  const currency =
    orderList[0]?.currency ?? customer?.orders?.[0]?.currency ?? "USD";
  let lifetimeValue = "—";
  if (reportedSpent > 0) {
    lifetimeValue = formatPrice(reportedSpent, currency);
  } else if (orderList.length > 0) {
    const totalSpent = orderList.reduce(
      (sum, order) => sum + Number(order.total_price ?? 0),
      0,
    );
    lifetimeValue = formatPrice(totalSpent, currency);
  }

  const threadsCount = customer?.threads_count ?? fallback?.threads_count ?? 0;

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
        <Detail icon={IconPhone} label="Phone" value={phone} />
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
        {threadsCount > 1 && email !== "—" ? (
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
