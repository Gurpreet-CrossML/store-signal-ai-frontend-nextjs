"use client";

import { Skeleton } from "@/components/ui/skeleton";
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
  orders,
  userMetadata,
  loading = false,
}: {
  customer?: Customer | null;
  orders?: OrderData[] | null;
  userMetadata?: UserMetadata | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <section className="flex flex-col gap-4 border-b p-4">
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
          </div>
        </div>
      </section>
    );
  }

  const orderList = orders ?? [];

  const latestOrderShipping = orderList.find(
    (order) => order.shipping_address?.city || order.shipping_address?.province,
  )?.shipping_address;
  const orderCity = latestOrderShipping
    ? [latestOrderShipping.city, latestOrderShipping.province]
        .filter(Boolean)
        .join(" ")
    : null;
  const geoCity = userMetadata?.geo_location?.split(",")?.[0]?.trim();
  const city = orderCity || geoCity || "—";

  const orderPhone = orderList
    .map(
      (order) =>
        order.shipping_address?.phone ||
        order.shipping_address?.telephone ||
        order.customer_phone,
    )
    .find(Boolean);
  const phone = maskPhone(customer?.phone || orderPhone);

  return (
    <section className="flex flex-col gap-4 border-b p-4">
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
            <span className="text-muted-foreground">City</span>
            <span className="text-right font-normal text-foreground">
              {city}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
