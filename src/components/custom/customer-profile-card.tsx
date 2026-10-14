"use client";

import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  customerLocation,
  customerOrderCount,
  customerTotalSpent,
} from "@/lib/customer-facts";
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

export function CustomerProfileCard({
  customer,
  fallback,
  orders,
  userMetadata,
  loading = false,
}: {
  customer?: CustomerRecord | null;
  fallback?: Customer | null;
  orders?: OrderData[] | null;
  userMetadata?: UserMetadata | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <section className="flex flex-col gap-4 border-b p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full shrink-0" />
          <div className="min-w-0 space-y-1.5 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-4 w-16" />
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const realFallbackName =
    fallback?.name && fallback.name !== "Guest" ? fallback.name : null;
  const name = customer
    ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() ||
      customer.email
    : realFallbackName ||
      userMetadata?.customer_name ||
      fallback?.email ||
      "Guest";

  const effectiveCustomer: CustomerRecord | null = customer
    ? {
        ...customer,
        orders: orders ?? customer.orders,
      }
    : null;

  const orderList = orders ?? customer?.orders ?? [];
  const orderCount = effectiveCustomer
    ? customerOrderCount(effectiveCustomer)
    : orderList.length;

  const hasAccount = Boolean(customer?.id || fallback?.id);
  const status =
    !hasAccount && orderCount === 0
      ? "Guest"
      : orderCount > 0
        ? "Returning customer"
        : "New customer";

  const loc = effectiveCustomer ? customerLocation(effectiveCustomer) : null;
  const latestOrderShipping = orderList.find(
    (order) => order.shipping_address?.city || order.shipping_address?.province,
  )?.shipping_address;
  const orderCity = latestOrderShipping
    ? [latestOrderShipping.city, latestOrderShipping.province]
        .filter(Boolean)
        .join(" ")
    : null;
  const geoCity = userMetadata?.geo_location?.split(",")?.[0]?.trim();
  const city = loc || orderCity || geoCity || null;

  const subtitle = [status, city].filter(Boolean).join(" · ");

  const orderPhone = orderList.find(
    (order) =>
      order.shipping_address?.phone || order.shipping_address?.telephone,
  )?.shipping_address;
  const rawPhone =
    customer?.phone ||
    fallback?.phone ||
    orderPhone?.phone ||
    orderPhone?.telephone;
  const phone = maskPhone(rawPhone);

  // Lifetime value formatting: e.g. "₹14,870 · 6 orders"
  let formattedSpent = "—";
  if (effectiveCustomer) {
    const { amount, currency } = customerTotalSpent(effectiveCustomer);
    if (amount > 0) {
      formattedSpent = formatPrice(amount, currency);
    }
  } else if (orderList.length > 0) {
    const currency = orderList[0]?.currency ?? "USD";
    const totalSpent = orderList.reduce(
      (sum, order) => sum + Number(order.total_price ?? 0),
      0,
    );
    if (totalSpent > 0) {
      formattedSpent = formatPrice(totalSpent, currency);
    }
  }

  const ordersPart = `${orderCount} ${orderCount === 1 ? "order" : "orders"}`;
  const lifetimeValueText =
    formattedSpent !== "—"
      ? `${formattedSpent} · ${ordersPart}`
      : orderCount > 0
        ? ordersPart
        : "—";

  // Device formatting: e.g. "iPhone · Safari"
  const device = userMetadata?.device_type || userMetadata?.os;
  const browser = userMetadata?.browser;
  const deviceText = [device, browser].filter(Boolean).join(" · ") || "—";

  return (
    <section className="flex flex-col gap-4 border-b p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CustomerAvatar name={name} size="size-10" />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-foreground">{name}</h3>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Customer details */}
      <div className="flex flex-col gap-2.5">
        <h4 className="text-sm font-semibold text-foreground">Customer</h4>

        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Phone</span>
            <span className="text-right font-normal text-foreground">
              {phone}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Lifetime value</span>
            <span className="text-right font-normal text-foreground">
              {lifetimeValueText}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Device</span>
            <span className="text-right font-normal text-foreground">
              {deviceText}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
