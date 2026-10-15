"use client";

import { Typography } from "@/components/ui/typography";
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
}: {
  customer?: Customer | null;
  orders?: OrderData[] | null;
  userMetadata?: UserMetadata | null;
}) {
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Typography variant="muted">Phone</Typography>
        <Typography variant="small" as="span" className="text-right">
          {phone}
        </Typography>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Typography variant="muted">City</Typography>
        <Typography variant="small" as="span" className="text-right">
          {city}
        </Typography>
      </div>
    </div>
  );
}
