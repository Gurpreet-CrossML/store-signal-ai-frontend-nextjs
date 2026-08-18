"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconCash,
  IconExternalLink,
  IconReceipt,
  IconReceiptRefund,
  IconShoppingBag,
  IconTruckDelivery,
  IconUser,
} from "@tabler/icons-react";

import { LoadingState } from "@/components/custom/loading-state";
import { OrderDetails } from "@/components/custom/order-details";
import { orderLabel } from "@/components/custom/crm/orders-columns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FulfillmentBadge, StatusBadge } from "@/components/ui/status-badge";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { formatDateTime, formatPrice } from "@/lib/helpers";
import {
  FetchOrderDetails,
  orderCustomer,
} from "@/redux/api-slice/order-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/** One headline number in the money strip. */
function MoneyTile({
  icon: Icon,
  label,
  value,
  emphasis,
}: {
  icon: typeof IconCash;
  label: string;
  value: string;
  emphasis?: "owed" | "refunded";
}) {
  return (
    <div className="flex flex-col gap-1 bg-background px-4 py-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-4" />
        <Typography variant="muted" as="span">
          {label}
        </Typography>
      </div>
      <Typography
        variant="h5"
        as="p"
        className={
          emphasis === "owed"
            ? "truncate text-destructive tabular-nums"
            : emphasis === "refunded"
              ? "truncate text-amber-600 tabular-nums dark:text-amber-400"
              : "truncate tabular-nums"
        }
      >
        {value}
      </Typography>
    </div>
  );
}

export default function OrderDetail({ orderId }: { orderId: number }) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchOrderDetailsData, FetchOrderDetailsIsLoading } = useAppSelector(
    (state) => state.GetOrderReducer.FetchOrderDetailsState,
  );

  useEffect(() => {
    if (storeCode) dispatch(FetchOrderDetails({ storeCode, orderId }));
  }, [dispatch, storeCode, orderId]);

  if (FetchOrderDetailsIsLoading) {
    return <LoadingState label="Loading order…" />;
  }

  const order = FetchOrderDetailsData;
  if (!order || order.id !== orderId) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <IconShoppingBag />
          </EmptyMedia>
          <EmptyTitle>Order Not Found</EmptyTitle>
          <EmptyDescription>
            This order may belong to another store, or have been removed.
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" asChild>
          <Link href="/crm/orders">
            <IconArrowLeft />
            Back to Orders
          </Link>
        </Button>
      </Empty>
    );
  }

  const customer = orderCustomer(order);
  const outstanding = Number(order.total_outstanding ?? 0);
  const refunded = Number(order.total_refunded ?? 0);
  const tags = order.tags
    ? order.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="-ml-2 self-start" asChild>
        <Link href="/crm/orders">
          <IconArrowLeft />
          All Orders
        </Link>
      </Button>

      {/* The order's own label is the heading, with the states that decide
          what an agent does next sitting beside it rather than buried in a
          panel further down. */}
      <div className="flex flex-wrap items-center gap-3">
        <Typography variant="h4" as="h2">
          {orderLabel(order)}
        </Typography>
        <StatusBadge status={order.financial_status} />
        <FulfillmentBadge status={order.fulfillment_status} />
        {order.cancelled_at ? (
          <Badge variant="outline" className={BADGE_TONE_STYLES.danger}>
            Cancelled
          </Badge>
        ) : null}
        <Typography variant="muted" className="w-full sm:w-auto">
          Placed {formatDateTime(order.created_at)}
        </Typography>
        {order.order_status_url ? (
          <Button variant="outline" size="sm" className="sm:ml-auto" asChild>
            <a
              href={order.order_status_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconExternalLink className="size-4" />
              Status Page
            </a>
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
        <MoneyTile
          icon={IconReceipt}
          label="Order Total"
          value={formatPrice(order.total_price, order.currency)}
        />
        <MoneyTile
          icon={IconCash}
          label="Paid"
          value={formatPrice(order.total_paid, order.currency)}
        />
        <MoneyTile
          icon={IconCash}
          label="Outstanding"
          value={formatPrice(order.total_outstanding, order.currency)}
          emphasis={outstanding > 0 ? "owed" : undefined}
        />
        <MoneyTile
          icon={IconReceiptRefund}
          label="Refunded"
          value={formatPrice(order.total_refunded, order.currency)}
          emphasis={refunded > 0 ? "refunded" : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShoppingBag className="size-4" />
              Order
            </CardTitle>
            <CardDescription>
              Items, totals, payment and where it ships.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* The same body the thread panels render, so one order looks
                identical wherever it is opened. */}
            <OrderDetails order={order} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUser className="size-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {/* Both links need the account's row id. An order can carry a
                  checkout email with no linked customer, so the contact
                  details show either way and only the links are gated. */}
              {customer.email ? (
                customer.id ? (
                  <Link
                    href={`/crm/customers/${customer.id}`}
                    className="truncate text-sm text-primary hover:underline"
                  >
                    {customer.email}
                  </Link>
                ) : (
                  <Typography
                    variant="small"
                    as="p"
                    className="truncate font-normal"
                  >
                    {customer.email}
                  </Typography>
                )
              ) : (
                <Typography variant="muted">No email on this order.</Typography>
              )}
              {customer.phone ? (
                <Typography variant="muted" className="font-mono">
                  {customer.phone}
                </Typography>
              ) : null}
              {customer.id ? (
                <Button variant="outline" size="sm" className="mt-1" asChild>
                  <Link href={`/crm/orders?customer=${customer.id}`}>
                    Their Other Orders
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {order.tracking_number || order.tracking_company ? (
            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTruckDelivery className="size-4" />
                  Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {order.tracking_company ? (
                  <Typography variant="small" as="p" className="font-normal">
                    {order.tracking_company}
                  </Typography>
                ) : null}
                {order.tracking_number ? (
                  <Typography variant="muted" className="font-mono">
                    {order.tracking_number}
                  </Typography>
                ) : null}
                {order.tracking_url ? (
                  <Button variant="outline" size="sm" className="mt-1" asChild>
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconExternalLink className="size-4" />
                      Track Parcel
                    </a>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {tags.length > 0 || order.note ? (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Merchant Notes</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {order.note ? (
                  <Typography variant="muted" className="wrap-break-word">
                    {order.note}
                  </Typography>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
