"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconBuildingStore,
  IconCalendarPlus,
  IconHome,
  IconMail,
  IconMessage,
  IconPhone,
  IconRosetteDiscountCheck,
  IconShoppingBag,
  IconTruck,
  IconWallet,
} from "@tabler/icons-react";

import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { LoadingState } from "@/components/custom/loading-state";
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
import {
  customerDisplayName,
  formatLocation,
} from "@/components/custom/crm/customers-columns";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { formatDateTime, formatPrice } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import {
  FetchCustomerDetails,
  type CustomerAddress,
} from "@/redux/api-slice/customer-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/**
 * One headline number. Shopify stacks these as four bordered boxes with the
 * label above the value; here the value leads and the label sits under it,
 * so a row of them scans as a sentence about the shopper rather than four
 * separate widgets.
 */
function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  href,
}: {
  icon: typeof IconWallet;
  label: string;
  value: string;
  hint?: string;
  /** Makes the whole tile a link — used to drill into this shopper's orders. */
  href?: string;
}) {
  const className = cn(
    "flex flex-col gap-1 bg-background px-4 py-3",
    href && "transition-colors hover:bg-muted/60",
  );

  const body = (
    <>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-4" />
        <Typography variant="muted" as="span">
          {label}
        </Typography>
      </div>
      <Typography variant="h5" as="p" className="truncate tabular-nums">
        {value}
      </Typography>
      {/* Reserved whether or not there's a hint, so tiles in a row stay the
          same height and their values sit on one baseline. */}
      <Typography variant="muted" className="min-h-5">
        {hint ?? ""}
      </Typography>
    </>
  );

  // Branching on the element rather than on a computed component: Link's
  // `href` is required, so a `Wrapper = href ? Link : "div"` union can't be
  // typed without lying about it.
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function AddressCard({ address }: { address: CustomerAddress }) {
  const recipient =
    `${address.first_name ?? ""} ${address.last_name ?? ""}`.trim();
  const lines = [
    recipient,
    address.company,
    ...(address.street ?? []),
    [address.city, address.region, address.postcode].filter(Boolean).join(" "),
    address.country_id,
  ].filter((line): line is string => Boolean(line && line.trim()));

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      {address.default_shipping || address.default_billing ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {address.default_shipping ? (
            <Badge variant="outline" className={BADGE_TONE_STYLES.accent}>
              <IconTruck />
              Default shipping
            </Badge>
          ) : null}
          {address.default_billing ? (
            <Badge variant="outline" className={BADGE_TONE_STYLES.accent}>
              <IconWallet />
              Default billing
            </Badge>
          ) : null}
        </div>
      ) : null}

      <address className="text-sm leading-6 text-foreground not-italic">
        {lines.map((line, index) => (
          <span key={`${line}-${index}`} className="block">
            {line}
          </span>
        ))}
      </address>

      {address.telephone ? (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <IconPhone className="size-3.5" />
          <Typography variant="muted" as="span" className="font-mono">
            {address.telephone}
          </Typography>
        </div>
      ) : null}
    </div>
  );
}

/** Whether a channel may be contacted, said plainly rather than as a pill. */
function ConsentRow({
  icon: Icon,
  channel,
  granted,
}: {
  icon: typeof IconMail;
  channel: string;
  granted: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <Typography variant="small" as="span" className="font-normal">
          {channel}
        </Typography>
      </div>
      <Badge
        variant="outline"
        className={
          granted ? BADGE_TONE_STYLES.success : BADGE_TONE_STYLES.neutral
        }
      >
        {granted ? "Opted in" : "Not opted in"}
      </Badge>
    </div>
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

  useEffect(() => {
    if (storeCode) dispatch(FetchCustomerDetails({ storeCode, customerId }));
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
          <EmptyTitle>Customer not found</EmptyTitle>
          <EmptyDescription>
            This customer may belong to another store, or have been removed.
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" asChild>
          <Link href="/crm/customers">
            <IconArrowLeft />
            Back to customers
          </Link>
        </Button>
      </Empty>
    );
  }

  const name = customerDisplayName(customer);
  const addresses = customer.addresses ?? [];
  const orders = customer.orders_count ?? 0;
  const spent = Number(customer.total_spent ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="-ml-2 self-start" asChild>
        <Link href="/crm/customers">
          <IconArrowLeft />
          All customers
        </Link>
      </Button>

      {/* Identity leads, and is the page's only heading — the shell used to
          print a generic "Customer" title directly above this name.
          Shopify splits the two, putting the name in a breadcrumb and the
          contact details in a right-hand box, so the two things you came
          for sit at opposite corners of the screen. */}
      <div className="flex flex-wrap items-center gap-4">
        <CustomerAvatar name={name} size="size-14" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Typography variant="h4" as="h2" className="truncate">
              {name}
            </Typography>
            {customer.is_email_verified ? (
              <Badge variant="outline" className={BADGE_TONE_STYLES.success}>
                <IconRosetteDiscountCheck />
                Verified
              </Badge>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            {customer.email ? (
              <a
                href={`mailto:${customer.email}`}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <IconMail className="size-4" />
                {customer.email}
              </a>
            ) : null}
            {customer.phone ? (
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center gap-1.5 font-mono text-sm text-primary hover:underline"
              >
                <IconPhone className="size-4" />
                {customer.phone}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* One bordered strip, not four boxes — the numbers belong together. */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
        <StatTile
          icon={IconWallet}
          label="Total spent"
          value={formatPrice(customer.total_spent)}
          hint={
            orders > 0 ? `${formatPrice(spent / orders)} per order` : undefined
          }
        />
        <StatTile
          icon={IconShoppingBag}
          label="Orders"
          value={String(orders)}
          hint={orders === 0 ? "Never ordered" : undefined}
          href={orders > 0 ? `/crm/orders?customer=${customer.id}` : undefined}
        />
        <StatTile
          icon={IconCalendarPlus}
          label="Customer since"
          value={
            customer.registered_at
              ? formatDateTime(customer.registered_at)
              : "—"
          }
        />
        <StatTile
          icon={IconHome}
          label="Location"
          value={
            formatLocation(
              addresses.find((address) => address.default_shipping) ??
                addresses[0],
            ) ?? "—"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconHome className="size-4" />
              Addresses
            </CardTitle>
            <CardDescription>
              Where this customer bills and ships, as their store sent it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {addresses.length === 0 ? (
              <Typography variant="muted">
                No addresses on file for this customer.
              </Typography>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map((address) => (
                  <AddressCard key={address.id} address={address} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMessage className="size-4" />
                Marketing permissions
              </CardTitle>
              <CardDescription>
                What this customer has agreed to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ConsentRow
                icon={IconMail}
                channel="Email"
                granted={customer.accepts_email_marketing}
              />
              <ConsentRow
                icon={IconMessage}
                channel="SMS and WhatsApp"
                granted={customer.accepts_sms_marketing}
              />
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBuildingStore className="size-4" />
                Store record
              </CardTitle>
              <CardDescription>
                How this customer is identified on your platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {[
                {
                  label: "Customer ID",
                  value: customer.customer_id || "—",
                  mono: true,
                },
                {
                  label: "Registered",
                  value: customer.registered_at
                    ? formatDateTime(customer.registered_at)
                    : "—",
                },
                {
                  label: "Last changed",
                  value: customer.modified_at
                    ? formatDateTime(customer.modified_at)
                    : "—",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4"
                >
                  <Typography variant="muted" as="span" className="shrink-0">
                    {row.label}
                  </Typography>
                  <Typography
                    variant="small"
                    as="span"
                    className={cn(
                      "min-w-0 truncate text-right font-normal",
                      row.mono && "font-mono",
                    )}
                  >
                    {row.value}
                  </Typography>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
