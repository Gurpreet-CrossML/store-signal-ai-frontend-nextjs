"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendarPlus,
  IconClock,
  IconCreditCard,
  IconDeviceDesktop,
  IconEye,
  IconMessage,
  IconPackage,
  IconRepeat,
  IconShoppingBag,
  IconShoppingCart,
  IconShoppingCartPlus,
  IconUserQuestion,
} from "@tabler/icons-react";

import { StatTile } from "@/clients/customer-detail";
import {
  GuestStatusBadge,
  guestCustomerName,
  guestDisplayName,
} from "@/components/custom/crm/guests-columns";
import { LoadingState } from "@/components/custom/loading-state";
import { ViewedProductsCard } from "@/components/custom/thread-detail-panels";
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
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import {
  formatDateTime,
  formatPrice,
  formatRelativeDateTime,
} from "@/lib/helpers";
import {
  FetchGuestDetails,
  type GuestEventType,
} from "@/redux/api-slice/guest-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/** How each bot event reads on the guest's activity list. */
const EVENT_LABELS: Record<
  GuestEventType,
  { label: string; icon: typeof IconEye }
> = {
  view_product: { label: "Shown a product", icon: IconEye },
  add_to_cart: { label: "Added to cart", icon: IconShoppingCartPlus },
  checkout_link: { label: "Got a checkout link", icon: IconCreditCard },
  view_cart: { label: "Viewed their cart", icon: IconShoppingCart },
  view_order: { label: "Looked up an order", icon: IconPackage },
};

/** One label / value line in a side card. */
function FactRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <Typography variant="muted" as="span" className="shrink-0">
        {label}
      </Typography>
      <Typography
        variant="small"
        as="span"
        className="min-w-0 truncate text-right font-normal"
      >
        {value || "—"}
      </Typography>
    </div>
  );
}

export default function GuestDetail({ guestId }: { guestId: number }) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchGuestDetailsData, FetchGuestDetailsIsLoading } = useAppSelector(
    (state) => state.GetGuestReducer.FetchGuestDetailsState,
  );

  useEffect(() => {
    if (storeCode) dispatch(FetchGuestDetails({ storeCode, guestId }));
  }, [dispatch, storeCode, guestId]);

  if (FetchGuestDetailsIsLoading) {
    return <LoadingState label="Loading guest…" />;
  }

  const guest = FetchGuestDetailsData;
  if (!guest || guest.id !== guestId) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <IconUserQuestion />
          </EmptyMedia>
          <EmptyTitle>Guest Not Found</EmptyTitle>
          <EmptyDescription>
            This guest may belong to another store.
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" asChild>
          <Link href="/crm/guests">
            <IconArrowLeft />
            Back to Guests
          </Link>
        </Button>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="-ml-2 self-start" asChild>
        <Link href="/crm/guests">
          <IconArrowLeft />
          All Guests
        </Link>
      </Button>

      {/* Identity: a guest has no name, so the browser key stands in. */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <IconUserQuestion className="size-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Typography variant="h4" as="h2" className="truncate font-mono">
              {guestDisplayName(guest)}
            </Typography>
            {guest.visit_count > 1 ? (
              <Badge variant="outline" className={BADGE_TONE_STYLES.info}>
                <IconRepeat />
                Returning
              </Badge>
            ) : null}
            <GuestStatusBadge guest={guest} />
          </div>
          <Typography variant="muted" className="mt-1 truncate font-mono">
            {guest.visitor_key}
          </Typography>
        </div>
        {guest.customer ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/crm/customers/${guest.customer.id}`}>
              {guestCustomerName(guest.customer)}
              <IconArrowRight />
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
        <StatTile
          icon={IconRepeat}
          label="Visits"
          value={String(guest.visit_count)}
          hint={guest.visit_count > 1 ? "Came back" : "First visit"}
        />
        <StatTile
          icon={IconMessage}
          label="Chats"
          value={String(guest.chats_count)}
        />
        <StatTile
          icon={IconCalendarPlus}
          label="First Seen"
          value={formatDateTime(guest.created_at)}
        />
        <StatTile
          icon={IconClock}
          label="Last Visit"
          value={formatDateTime(guest.last_visit_at)}
          hint={formatRelativeDateTime(guest.last_visit_at)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMessage className="size-4" />
                Chats
              </CardTitle>
              <CardDescription>
                Every chat this guest opened, newest first.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {guest.chats.length === 0 ? (
                <Typography variant="muted">No chats yet.</Typography>
              ) : (
                guest.chats.map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/threads/${chat.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0 flex-1">
                      <Typography variant="small" as="p" className="truncate">
                        {chat.name || "Untitled chat"}
                      </Typography>
                      <Typography variant="muted">
                        {formatDateTime(chat.created_at)} ·{" "}
                        {chat.messages_count} messages
                      </Typography>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        chat.is_active
                          ? BADGE_TONE_STYLES.success
                          : BADGE_TONE_STYLES.neutral
                      }
                    >
                      {chat.is_active ? "Open" : "Closed"}
                    </Badge>
                    <IconArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconEye className="size-4" />
                Activity
              </CardTitle>
              <CardDescription>
                What the AI showed them and what they did, newest first.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {guest.activity.length === 0 ? (
                <Typography variant="muted">No activity yet.</Typography>
              ) : (
                guest.activity.map((event) => {
                  const { label, icon: Icon } = EVENT_LABELS[
                    event.event_type
                  ] ?? { label: event.event_type, icon: IconEye };
                  return (
                    <div key={event.id} className="flex items-start gap-3">
                      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <Typography variant="small" as="p" className="truncate">
                          {label}
                          {event.product_name ? `: ${event.product_name}` : ""}
                        </Typography>
                      </div>
                      <Typography
                        variant="muted"
                        as="span"
                        className="shrink-0"
                      >
                        {formatRelativeDateTime(event.created_at)}
                      </Typography>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          {/* The thread page's own card, so a product reads the same in both
              places; its bottom rule is for the thread side panel. */}
          <div className="overflow-hidden rounded-xl border border-border [&>section]:border-b-0">
            <ViewedProductsCard viewedProducts={guest.viewed_products} />
          </div>

          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconDeviceDesktop className="size-4" />
                Device & Location
              </CardTitle>
              <CardDescription>From their newest chat.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <FactRow
                label="Location"
                value={guest.device?.location ?? null}
              />
              <FactRow
                label="Device"
                value={guest.device?.device_type ?? null}
              />
              <FactRow label="Browser" value={guest.device?.browser ?? null} />
              <FactRow label="System" value={guest.device?.os ?? null} />
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconShoppingBag className="size-4" />
                Orders From Their Chats
              </CardTitle>
              <CardDescription>
                Orders linked to one of this guest&apos;s chats.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {guest.orders.length === 0 ? (
                <Typography variant="muted">No orders yet.</Typography>
              ) : (
                guest.orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/crm/orders/${order.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0 flex-1">
                      <Typography variant="small" as="p" className="truncate">
                        {order.name || `#${order.order_number}`}
                      </Typography>
                      <Typography variant="muted">
                        {formatDateTime(order.created_at)}
                      </Typography>
                    </div>
                    <div className="text-right">
                      <Typography
                        variant="small"
                        as="p"
                        className="tabular-nums"
                      >
                        {formatPrice(order.total_price, order.currency)}
                      </Typography>
                      <Typography variant="muted" className="capitalize">
                        {order.financial_status || "—"}
                      </Typography>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
