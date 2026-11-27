"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBuildingStore,
  IconChevronLeft,
  IconExternalLink,
  IconLifebuoy,
  IconMessageChatbot,
  IconPhoto,
} from "@tabler/icons-react";

import { CustomerAvatar } from "@/components/custom/customer-avatar";
import {
  Panel,
  PanelSwitch,
  Row,
  TicketStatus,
  TonePill,
  activityTime,
  platformName,
} from "@/components/custom/crm/detail-panels";
import { LoadingState } from "@/components/custom/loading-state";
import {
  CustomerBadgeTag,
  customerDisplayName,
} from "@/components/custom/crm/customers-columns";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FulfillmentBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  customerSince,
  latestShippingAddress,
  primaryAddress,
} from "@/lib/customer-facts";
import { formatDate, formatPrice } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import {
  FetchCustomerDetails,
  FetchCustomerProfile,
  type CustomerActivity,
  type CustomerProfile,
  type CustomerRecord,
  type OrderShipping,
} from "@/redux/api-slice/customer-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/** Where a chat or ticket came from, in words. */
function channelName(channel: string | null) {
  const names: Record<string, string> = {
    native: "Web Chat",
    web: "Web Chat",
    whatsapp: "WhatsApp",
  };
  if (!channel) return "—";
  return names[channel] ?? channel.charAt(0).toUpperCase() + channel.slice(1);
}

/** "<1h", "9h", "1d 6h". */
function formatHours(hours: number) {
  if (hours < 1) return "<1h";
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  if (!days) return `${hours}h`;
  return rest ? `${days}d ${rest}h` : `${days}d`;
}

/** The "Waiting to ship" cell text and colour. */
function shippingText(shipping: OrderShipping) {
  if (shipping.kind === "cancelled") {
    return { text: "Cancelled", className: "text-muted-foreground" };
  }
  if (shipping.kind === "waiting") {
    return {
      text: `Waiting ${formatHours(shipping.hours ?? 0)}`,
      // Over a day without shipping needs a look.
      className:
        (shipping.hours ?? 0) >= 24
          ? "text-amber-600 dark:text-amber-400"
          : "text-foreground",
    };
  }
  return {
    text:
      shipping.hours === null
        ? "Shipped"
        : `Shipped in ${formatHours(shipping.hours)}`,
    className: "text-muted-foreground",
  };
}

/** The four headline numbers. */
function KpiStrip({ profile }: { profile: CustomerProfile }) {
  const { currency } = profile;
  const ltv = Number(profile.lifetime_value);
  const reply = profile.median_reply_minutes;
  const replyText =
    reply === null
      ? null
      : `Median reply ${reply < 60 ? `${reply}m` : formatHours(Math.floor(reply / 60))}`;

  const cards = [
    {
      label: "Lifetime Value",
      value: ltv > 0 ? formatPrice(ltv, currency) : "—",
      detail: ltv > 0 ? "Delivered orders, after tax and shipping" : "",
    },
    {
      label: "Orders",
      value: profile.order_count.toLocaleString(),
      detail: profile.average_order
        ? `Average ${formatPrice(profile.average_order, currency)}`
        : "No orders yet",
    },
    {
      label: "Orders Every",
      value: profile.usual_gap_days
        ? `${profile.usual_gap_days} day${profile.usual_gap_days === 1 ? "" : "s"}`
        : "—",
      detail: "",
    },
    {
      label: "Help Desk",
      value: profile.open_tickets ? `${profile.open_tickets} Open` : "—",
      detail: replyText ?? (profile.open_tickets ? "" : "No open tickets"),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex flex-col gap-1 bg-background px-4 py-3"
        >
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="text-xl font-semibold tabular-nums">{card.value}</p>
          <p className="text-xs text-muted-foreground">{card.detail}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Whether a chat helped place the order, or a dash. An open ticket on it is
 * not flagged here: Activity already lists the ticket.
 */
function OrderSignals({
  order,
}: {
  order: CustomerProfile["recent_orders"][number];
}) {
  if (!order.chat_assisted) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <TonePill tone="topic">
      <IconMessageChatbot />
      Chat-Assisted
    </TonePill>
  );
}

function OrdersPanel({ profile }: { profile: CustomerProfile }) {
  const router = useRouter();
  const orders = profile.recent_orders;
  const openOrder = (id: number) => router.push(`/crm/orders/${id}`);

  return (
    <Panel
      title="Orders"
      action={
        profile.order_count > 0 ? (
          <Link
            href={`/crm/orders?search=${encodeURIComponent(profile.email)}`}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            All Orders
            <IconArrowRight className="size-3.5" />
          </Link>
        ) : null
      }
    >
      {orders.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          No orders yet.
        </p>
      ) : (
        <>
          {/* Tablet and up: the table. Placed and items need a desktop. */}
          <Table className="max-md:hidden">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Order</TableHead>
                <TableHead className="max-xl:hidden">Placed</TableHead>
                <TableHead className="text-right max-xl:hidden">
                  Items
                </TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead>Waiting To Ship</TableHead>
                <TableHead>Signals</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const shipping = shippingText(order.shipping);
                return (
                  <TableRow
                    key={order.id}
                    onClick={() => openOrder(order.id)}
                    className="cursor-pointer hover:bg-accent/50"
                  >
                    <TableCell className="font-medium">{order.label}</TableCell>
                    <TableCell className="text-muted-foreground max-xl:hidden">
                      {activityTime(order.created_at)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums max-xl:hidden">
                      {order.items}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatPrice(order.total_price, profile.currency)}
                    </TableCell>
                    <TableCell>
                      <FulfillmentBadge status={order.fulfillment_status} />
                    </TableCell>
                    <TableCell className={shipping.className}>
                      {shipping.text}
                    </TableCell>
                    <TableCell>
                      <OrderSignals order={order} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Phone: one compact line per order. */}
          <ul className="divide-y md:hidden">
            {orders.map((order) => {
              const shipping = shippingText(order.shipping);
              return (
                <li key={order.id}>
                  <Link
                    href={`/crm/orders/${order.id}`}
                    className="flex flex-col gap-1 px-4 py-3"
                  >
                    <span className="font-medium">{order.label}</span>
                    <span className="text-sm text-muted-foreground">
                      <span className={shipping.className}>
                        {shipping.text}
                      </span>
                      {" · "}
                      {formatPrice(order.total_price, profile.currency)}
                    </span>
                    {order.chat_assisted ? (
                      <OrderSignals order={order} />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Panel>
  );
}

type ActivityTab = "all" | CustomerActivity["kind"];

const ACTIVITY_TABS: { value: ActivityTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "chat", label: "Chats" },
  { value: "ticket", label: "Tickets" },
];

/** How many events the feed shows at once. */
const ACTIVITY_SHOWN = 20;

/** One feed line: what happened, where, and when — linked to the record. */
function ActivityItem({ event }: { event: CustomerActivity }) {
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
      : {
          href: `/helpdesk?ticket=${event.id}`,
          icon: IconLifebuoy,
          iconClass:
            "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
          title: event.title,
          detail: `${channelName(event.channel)} → Ticket #${event.ticket_id} · ${when}`,
          status: <TicketStatus status={event.status} />,
        };
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
      >
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
      </Link>
    </li>
  );
}

function ActivityPanel({ profile }: { profile: CustomerProfile }) {
  const [tab, setTab] = useState<ActivityTab>("all");
  const events = profile.activity
    .filter((event) => tab === "all" || event.kind === tab)
    .slice(0, ACTIVITY_SHOWN);

  return (
    <Panel
      title="Activity"
      action={
        <PanelSwitch options={ACTIVITY_TABS} value={tab} onChange={setTab} />
      }
    >
      {events.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          Nothing here yet.
        </p>
      ) : (
        <ul className="flex flex-col p-2">
          {events.map((event) => (
            <ActivityItem key={`${event.kind}-${event.id}`} event={event} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function TopProductsPanel({
  profile,
  firstName,
}: {
  profile: CustomerProfile;
  firstName: string;
}) {
  if (!profile.top_products.length) return null;
  return (
    <Panel
      title={`What ${firstName} Buys`}
      action={
        <span className="text-xs text-muted-foreground">
          By units, all time
        </span>
      }
    >
      <ul className="divide-y">
        {profile.top_products.map((product) => (
          <li key={product.title} className="flex items-center gap-3 px-4 py-3">
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <IconPhoto className="size-4" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {product.title}
              </span>
              {product.usual_variant ? (
                <span className="block truncate text-xs text-muted-foreground">
                  Usually {product.usual_variant}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 text-sm font-medium tabular-nums">
              {product.units} unit{product.units === 1 ? "" : "s"}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** The address book's default, else where their latest order shipped. */
function AddressPanel({
  customer,
  name,
}: {
  customer: CustomerRecord;
  name: string;
}) {
  const saved = primaryAddress(customer);
  const shipped = latestShippingAddress(customer);
  const lines = saved
    ? [
        `${saved.first_name ?? ""} ${saved.last_name ?? ""}`.trim(),
        saved.company,
        ...(saved.street ?? []),
        [saved.city, saved.region, saved.postcode].filter(Boolean).join(" "),
        saved.country_id,
      ]
    : shipped
      ? [
          shipped.name,
          shipped.address1,
          shipped.address2,
          [shipped.city, shipped.province, shipped.zip]
            .filter(Boolean)
            .join(" "),
          shipped.country,
        ]
      : [];
  // The recipient is left out when it is the customer, whose name heads the page.
  const shown = lines.filter(
    (line): line is string =>
      Boolean(line && String(line).trim()) &&
      String(line).trim().toLowerCase() !== name.toLowerCase(),
  );

  return (
    <Panel
      title="Default Address"
      action={
        !saved && shipped ? (
          <span className="text-xs text-muted-foreground">
            From their latest order
          </span>
        ) : null
      }
    >
      <address className="px-4 py-3 text-sm leading-6 not-italic">
        {shown.length ? (
          shown.map((line, index) => (
            <span key={`${line}-${index}`} className="block">
              {line}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground">No address on file.</span>
        )}
      </address>
    </Panel>
  );
}

/** Only the platform fields the store actually sent are listed. */
function PlatformPanel({
  customer,
  profile,
}: {
  customer: CustomerRecord;
  profile: CustomerProfile | null;
}) {
  const metadata = customer.metadata ?? {};
  const has = (key: string) => key in metadata;
  const text = (key: string) => {
    const value = metadata[key];
    return typeof value === "string" && value.trim() ? value : "—";
  };

  return (
    <Panel
      title={`From ${platformName(profile?.platform ?? "store")}`}
      action={
        <span className="text-xs text-muted-foreground">
          Synced {activityTime(customer.updated_at)}
        </span>
      }
    >
      <div className="flex flex-col gap-2.5 px-4 py-3">
        <Row label="Customer ID">
          <span className="font-mono">{customer.customer_id || "—"}</span>
        </Row>
        {has("tax_exempt") ? (
          <Row label="Tax Exempt">{metadata.tax_exempt ? "Yes" : "No"}</Row>
        ) : null}
        {has("note") ? <Row label="Note">{text("note")}</Row> : null}
      </div>
    </Panel>
  );
}

export default function CustomerDetail({ customerId }: { customerId: number }) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchCustomerDetailsData, FetchCustomerDetailsIsLoading } =
    useAppSelector(
      (state) => state.GetCustomerReducer.FetchCustomerDetailsState,
    );
  const profile = useAppSelector(
    (state) =>
      state.GetCustomerReducer.FetchCustomerProfileState
        .FetchCustomerProfileData,
  );

  useEffect(() => {
    if (!storeCode) return;
    dispatch(FetchCustomerDetails({ storeCode, customerId }));
    dispatch(FetchCustomerProfile({ storeCode, customerId }));
  }, [dispatch, storeCode, customerId]);

  if (FetchCustomerDetailsIsLoading) {
    return <LoadingState label="Loading customer…" />;
  }

  const customer = FetchCustomerDetailsData;
  if (!customer || customer.id !== customerId) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <IconBuildingStore />
          </EmptyMedia>
          <EmptyTitle>Customer Not Found</EmptyTitle>
          <EmptyDescription>
            This customer may belong to another store, or have been removed.
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" asChild>
          <Link href="/crm/customers">
            <IconArrowLeft />
            Back To Customers
          </Link>
        </Button>
      </Empty>
    );
  }

  const name = customerDisplayName(customer);
  const firstName = customer.first_name || name;
  // The profile belongs to this customer only once it has loaded for them.
  const numbers = profile && profile.id === customerId ? profile : null;
  const badge = numbers?.badge ?? null;
  const since = customerSince(customer);
  const facts = [
    customer.email !== name ? customer.email : null,
    customer.phone,
    `Customer since ${formatDate(since.value)}`,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      {/* Back to the list, as on Thread details: an arrow and the page name
          on smaller screens, a "Customers" link on desktop. The customer's
          name is the heading below, so it is not repeated here. */}
      <div className="flex items-center gap-3 lg:hidden">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to Customers"
          asChild
        >
          <Link href="/crm/customers">
            <IconArrowLeft />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Customer</h1>
      </div>
      <nav aria-label="Breadcrumb" className="hidden text-sm lg:flex">
        <Link
          href="/crm/customers"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <IconChevronLeft className="size-4" />
          Customers
        </Link>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CustomerAvatar name={name} size="size-12" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold">{name}</h2>
              {badge ? <CustomerBadgeTag badge={badge} /> : null}
            </div>
            <p className="text-sm break-all text-muted-foreground">
              {facts.join(" · ")}
            </p>
          </div>
        </div>
        {numbers?.admin_url ? (
          <Button size="sm" asChild>
            <a href={numbers.admin_url} target="_blank" rel="noreferrer">
              <IconExternalLink />
              Open In {platformName(numbers.platform)}
            </a>
          </Button>
        ) : null}
      </div>

      {numbers ? (
        <KpiStrip profile={numbers} />
      ) : (
        <LoadingState label="Loading numbers…" />
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          {numbers ? (
            <>
              <OrdersPanel profile={numbers} />
              <ActivityPanel profile={numbers} />
            </>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          {numbers ? (
            <TopProductsPanel profile={numbers} firstName={firstName} />
          ) : null}
          <Panel title="Contact">
            <div className="flex flex-col gap-2.5 px-4 py-3">
              <Row label="Email Verified">
                {customer.is_email_verified ? (
                  <TonePill tone="success">Verified</TonePill>
                ) : (
                  <TonePill tone="neutral">Not Verified</TonePill>
                )}
              </Row>
              <Row label="Preferred Channel">
                {channelName(numbers?.preferred_channel ?? null)}
              </Row>
            </div>
          </Panel>
          <AddressPanel customer={customer} name={name} />
          <PlatformPanel customer={customer} profile={numbers} />
        </div>
      </div>
    </div>
  );
}
