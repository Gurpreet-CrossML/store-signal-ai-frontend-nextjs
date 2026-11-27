"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconCash,
  IconChevronLeft,
  IconCircleX,
  IconExternalLink,
  IconLifebuoy,
  IconMessageChatbot,
  IconPhoto,
  IconReceiptRefund,
  IconShoppingBag,
  IconTruckDelivery,
} from "@tabler/icons-react";

import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { CustomerSegmentBadge } from "@/components/custom/customer-segment-badge";
import {
  Panel,
  PanelSwitch,
  Row,
  TicketStatus,
  activityTime,
  platformName,
} from "@/components/custom/crm/detail-panels";
import {
  OrderFulfillment,
  orderLabel,
} from "@/components/custom/crm/orders-columns";
import { LoadingState } from "@/components/custom/loading-state";
import {
  formatShippingAddress,
  getPriceBreakdownRows,
} from "@/components/custom/order-details";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatPrice } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import {
  FetchOrderDetails,
  FetchOrderProfile,
  type OrderActivity,
  type OrderProfile,
  type OrderRecord,
} from "@/redux/api-slice/order-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** The lines, with their images, and the money breakdown. */
function ItemsPanel({
  order,
  images,
}: {
  order: OrderRecord;
  images: Record<string, string>;
}) {
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const refunded = Number(order.total_refunded ?? 0);
  const outstanding = Number(order.total_outstanding ?? 0);
  // Money still moving after the total: only shown when there is some.
  const after = [
    refunded > 0
      ? {
          label: "Refunded",
          value: `−${formatPrice(refunded, order.currency)}`,
        }
      : null,
    outstanding > 0
      ? {
          label: "Outstanding",
          value: formatPrice(outstanding, order.currency),
        }
      : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  return (
    <Panel
      title="Items"
      action={
        <span className="text-xs text-muted-foreground">
          {plural(units, "unit")}
        </span>
      }
    >
      <ul className="divide-y">
        {order.items.map((item, index) => {
          // Items carry the variant id in `product_id`; images are keyed by it.
          const image = images[String(item.product_id)];
          const unitPrice = Number(item.price);
          const lineTotal =
            item.total_price ??
            (Number.isNaN(unitPrice) ? item.price : unitPrice * item.quantity);
          return (
            <li
              key={`${item.product_id}-${index}`}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="size-full object-cover" />
                ) : (
                  <IconPhoto className="size-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{item.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {item.sku ? `SKU ${item.sku} · ` : ""}
                  {formatPrice(item.price, order.currency)} × {item.quantity}
                </span>
              </span>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatPrice(lineTotal, order.currency)}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-1.5 border-t px-4 py-3 text-sm">
        {[...getPriceBreakdownRows(order), ...after].map((row) => (
          <div
            key={row.label}
            className={cn(
              "flex items-center justify-between gap-4",
              row.label === "Total" && "font-semibold",
            )}
          >
            <span
              className={row.label === "Total" ? "" : "text-muted-foreground"}
            >
              {row.label}
            </span>
            <span
              className={cn(
                "tabular-nums",
                row.label === "Discount" &&
                  "text-emerald-600 dark:text-emerald-500",
                row.label === "Outstanding" && "text-destructive",
              )}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/** The icon, colour and link of each store event. */
const STORE_EVENTS: Record<
  "payment" | "shipped" | "refunded" | "cancelled",
  { icon: typeof IconCash; iconClass: string }
> = {
  payment: {
    icon: IconCash,
    iconClass:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  },
  shipped: {
    icon: IconTruckDelivery,
    iconClass: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
  },
  refunded: {
    icon: IconReceiptRefund,
    iconClass:
      "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
  },
  cancelled: {
    icon: IconCircleX,
    iconClass: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
  },
};

/** One feed line: what happened and when, linked when it is a record. */
function ActivityItem({ event }: { event: OrderActivity }) {
  const when = activityTime(event.at);
  const item =
    event.kind === "chat"
      ? {
          href: `/threads/${event.id}`,
          icon: IconMessageChatbot,
          iconClass:
            "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
          title:
            event.handler === "ai"
              ? "Chatted With The AI"
              : "Chatted With Your Team",
          detail: `${event.title || "Chat"} · ${when}`,
          status: null,
        }
      : event.kind === "ticket"
        ? {
            href: `/helpdesk?ticket=${event.id}`,
            icon: IconLifebuoy,
            iconClass:
              "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
            title: event.title,
            detail: `Ticket #${event.ticket_id} · ${when}`,
            status: event.status ? (
              <TicketStatus status={event.status} />
            ) : null,
          }
        : {
            href: null,
            ...STORE_EVENTS[event.kind],
            title: event.title,
            detail: [event.detail, when].filter(Boolean).join(" · "),
            status: null,
          };
  const Icon = item.icon;
  const body = (
    <>
      <span
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
          item.iconClass,
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
          <span className="min-w-0 truncate">{item.title}</span>
          {item.status}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {item.detail}
        </span>
      </span>
    </>
  );

  return (
    <li>
      {item.href ? (
        <Link
          href={item.href}
          className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
        >
          {body}
        </Link>
      ) : (
        <div className="flex items-start gap-3 px-2 py-2">{body}</div>
      )}
    </li>
  );
}

type ActivityTab = "all" | OrderActivity["source"];

function ActivityPanel({ profile }: { profile: OrderProfile }) {
  const [tab, setTab] = useState<ActivityTab>("all");
  const events = profile.activity.filter(
    (event) => tab === "all" || event.source === tab,
  );

  return (
    <Panel
      title="Activity"
      action={
        <PanelSwitch
          options={[
            { value: "all", label: "All" },
            { value: "store", label: platformName(profile.platform) },
            { value: "help_desk", label: "Help Desk" },
          ]}
          value={tab}
          onChange={setTab}
        />
      }
    >
      {events.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          Nothing here yet.
        </p>
      ) : (
        <ul className="flex flex-col p-2">
          {events.map((event, index) => (
            <ActivityItem key={`${event.kind}-${index}`} event={event} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** Who placed it, with their numbers; a guest shows the checkout contact. */
function CustomerPanel({
  order,
  profile,
}: {
  order: OrderRecord;
  profile: OrderProfile | null;
}) {
  const customer = profile?.customer ?? null;
  const currency = order.currency;
  const email = customer?.email || order.customer_email;
  const name = customer?.name || email || "Guest";

  return (
    <Panel
      title="Customer"
      action={
        customer ? (
          <Link
            href={`/crm/customers/${customer.id}`}
            className="text-sm text-primary hover:underline"
          >
            View Profile
          </Link>
        ) : null
      }
    >
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <CustomerAvatar name={name} size="size-9" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium">{name}</p>
            {customer?.vip ? (
              <CustomerSegmentBadge segment="vip" className="shrink-0" />
            ) : null}
          </div>
          {[email !== name ? email : null, order.customer_phone]
            .filter(Boolean)
            .map((line) => (
              <p key={line} className="truncate text-xs text-muted-foreground">
                {line}
              </p>
            ))}
        </div>
      </div>
      {customer ? (
        <div className="flex flex-col gap-2.5 px-4 py-3">
          <Row label="Lifetime Value">
            {Number(customer.lifetime_value) > 0
              ? formatPrice(customer.lifetime_value, currency)
              : "—"}
          </Row>
          <Row label="Orders">{customer.order_count}</Row>
          <Row label="Orders Every">
            {customer.usual_gap_days
              ? plural(customer.usual_gap_days, "day")
              : "—"}
          </Row>
          <Row label="Help Desk">
            {customer.open_tickets ? `${customer.open_tickets} Open` : "—"}
          </Row>
        </div>
      ) : (
        <p className="px-4 py-3 text-sm text-muted-foreground">
          Guest checkout.
        </p>
      )}
    </Panel>
  );
}

/** Where it ships, how, and the parcel's tracking. */
function ShippingPanel({
  order,
  customerName,
}: {
  order: OrderRecord;
  customerName: string;
}) {
  const address = order.shipping_address
    ? formatShippingAddress(order.shipping_address)
    : { recipient: null, lines: [] };
  // The recipient is left out when it is the customer, named in their card.
  const recipient =
    address.recipient &&
    address.recipient.toLowerCase() !== customerName.toLowerCase()
      ? address.recipient
      : null;
  const lines = [recipient, ...address.lines].filter(Boolean);

  return (
    <Panel title="Shipping">
      <address className="border-b px-4 py-3 text-sm leading-6 not-italic">
        {lines.length ? (
          lines.map((line, index) => (
            <span key={`${line}-${index}`} className="block">
              {line}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground">
            No shipping address on file.
          </span>
        )}
      </address>
      <div className="flex flex-col gap-2.5 px-4 py-3">
        <Row label="Method">
          <span className="capitalize">
            {order.shipping_method?.replace(/_/g, " ") || "—"}
          </span>
        </Row>
        {order.tracking_company ? (
          <Row label="Carrier">{order.tracking_company}</Row>
        ) : null}
        <Row label="Tracking">
          {order.tracking_number ? (
            order.tracking_url ? (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary hover:underline"
              >
                {order.tracking_number}
              </a>
            ) : (
              <span className="font-mono">{order.tracking_number}</span>
            )
          ) : (
            "—"
          )}
        </Row>
      </div>
    </Panel>
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
  const loadedProfile = useAppSelector(
    (state) =>
      state.GetOrderReducer.FetchOrderProfileState.FetchOrderProfileData,
  );

  useEffect(() => {
    if (!storeCode) return;
    dispatch(FetchOrderDetails({ storeCode, orderId }));
    dispatch(FetchOrderProfile({ storeCode, orderId }));
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
            Back To Orders
          </Link>
        </Button>
      </Empty>
    );
  }

  // The profile belongs to this order only once it has loaded for it.
  const profile = loadedProfile?.id === orderId ? loadedProfile : null;
  const customerName =
    profile?.customer?.name || order.customer_email || "Guest";

  return (
    <div className="flex flex-col gap-4">
      {/* Back to the list, as on Thread details. The order's label is the
          heading below, so it is not repeated here. */}
      <div className="flex items-center gap-3 lg:hidden">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to Orders"
          asChild
        >
          <Link href="/crm/orders">
            <IconArrowLeft />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Order</h1>
      </div>
      <nav aria-label="Breadcrumb" className="hidden text-sm lg:flex">
        <Link
          href="/crm/orders"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <IconChevronLeft className="size-4" />
          Orders
        </Link>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{orderLabel(order)}</h2>
            <StatusBadge status={order.financial_status} />
            <OrderFulfillment order={order} />
          </div>
          <p className="text-sm text-muted-foreground">
            Placed {formatDateTime(order.created_at)}
          </p>
        </div>
        {order.admin_url ? (
          <Button size="sm" asChild>
            <a href={order.admin_url} target="_blank" rel="noreferrer">
              <IconExternalLink />
              Open In {platformName(profile?.platform ?? "store")}
            </a>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <ItemsPanel order={order} images={profile?.item_images ?? {}} />
          {profile ? (
            <ActivityPanel profile={profile} />
          ) : (
            <LoadingState label="Loading activity…" />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <CustomerPanel order={order} profile={profile} />
          <ShippingPanel order={order} customerName={customerName} />
        </div>
      </div>
    </div>
  );
}
