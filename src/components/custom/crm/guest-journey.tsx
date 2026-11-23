"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconCalendarStats,
  IconChevronDown,
  IconChevronUp,
  IconCreditCard,
  IconEye,
  IconMessage,
  IconPackage,
  IconShoppingBag,
  IconShoppingCart,
  IconShoppingCartPlus,
  IconSparkles,
  IconTarget,
  IconTimeline,
} from "@tabler/icons-react";

import { ProductRow } from "@/components/custom/thread-detail-panels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import {
  formatDateTime,
  formatPrice,
  formatRelativeDateTime,
} from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type {
  GuestInterest,
  GuestJourney,
  GuestProduct,
  GuestProductView,
  GuestStage,
  GuestTimelineEvent,
  GuestTimelineVisit,
} from "@/redux/api-slice/guest-slice";

/** Days the rhythm strip covers, today included. */
const RHYTHM_DAYS = 30;
/** Visits the timeline shows before "Show older visits". */
const VISITS_SHOWN = 5;
/** Products the viewed list shows before "Show more". */
const VIEWED_SHOWN = 5;
const DAY_MS = 86_400_000;

const STAGE_LABELS: Record<GuestStage, { label: string; tone: string }> = {
  ordered: { label: "Ordered", tone: BADGE_TONE_STYLES.success },
  checkout: { label: "Got A Checkout Link", tone: BADGE_TONE_STYLES.warning },
  cart: { label: "In Cart", tone: BADGE_TONE_STYLES.info },
  browsing: { label: "Browsing", tone: BADGE_TONE_STYLES.neutral },
};

type TimelineFilter = "all" | "products" | "chats" | "cart";

/** Which event types each timeline tab keeps ("all" keeps everything). */
const FILTER_TYPES: Record<
  Exclude<TimelineFilter, "all">,
  GuestTimelineEvent["type"][]
> = {
  products: ["product_view", "view_product"],
  chats: ["chat"],
  cart: ["add_to_cart", "checkout_link", "view_cart", "view_order", "order"],
};

/** "1st", "2nd", "3rd", "4th" … */
function ordinal(value: number): string {
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  return `${value}${["th", "st", "nd", "rd"][value % 10] ?? "th"}`;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDay(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** A span of time in words: "45 minutes", "3 hours", "2 days". */
function formatSpan(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

function productPrice(product: GuestProduct): string {
  return formatPrice(product.price, product.currency || undefined);
}

/** The reasons behind an interest score, as short Title Case chips. */
function interestReasons(interest: GuestInterest): string[] {
  const reasons: string[] = [];
  if (interest.views > 0) {
    reasons.push(
      interest.views === 1 ? "Viewed Once" : `Viewed ${interest.views} Times`,
    );
  }
  if (interest.days > 1) reasons.push(`On ${interest.days} Days`);
  if (interest.in_cart) reasons.push("In Cart");
  if (interest.shown_in_chat) reasons.push("Shown In Chat");
  return reasons;
}

/** One label / value pair in a card's footer line. */
function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Typography variant="muted" as="span">
        {label}
      </Typography>
      <Typography variant="small" as="span" className="font-medium">
        {children}
      </Typography>
    </div>
  );
}

/**
 * The products the guest most likely wants, scored by the backend from their
 * views, cart and chats (no AI), with the reasons shown so the score can be
 * trusted. Also their buying stage, top category and price range.
 */
export function InterestCard({ journey }: { journey: GuestJourney }) {
  const stage = STAGE_LABELS[journey.stage] ?? STAGE_LABELS.browsing;
  const range = journey.price_range;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconTarget className="size-4" />
          Likely Interested In
        </CardTitle>
        <CardDescription>
          Scored from their product views, cart and chats. Newer activity counts
          more.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {journey.interests.length === 0 ? (
          <Typography variant="muted">
            Not enough browsing yet to tell.
          </Typography>
        ) : (
          journey.interests.map((interest, index) => (
            <div
              key={interest.product.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5"
            >
              <span className="hidden w-4 shrink-0 text-sm font-semibold text-muted-foreground tabular-nums sm:block">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <ProductRow
                  image={interest.product.image ?? undefined}
                  name={interest.product.name}
                  detail={
                    interest.last_at
                      ? `Last seen ${formatRelativeDateTime(interest.last_at)} ago`
                      : undefined
                  }
                  price={productPrice(interest.product)}
                  href={interest.product.url ?? undefined}
                />
              </div>
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-60">
                <div className="flex items-center gap-2">
                  <Progress
                    value={interest.score}
                    className="h-1.5"
                    aria-label={`Interest score ${interest.score} of 100`}
                  />
                  <span className="w-8 text-right text-sm font-semibold tabular-nums">
                    {interest.score}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {interestReasons(interest).map((reason) => (
                    <Badge
                      key={reason}
                      variant="outline"
                      className={BADGE_TONE_STYLES.neutral}
                    >
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-3">
          <Fact label="Stage">
            <Badge variant="outline" className={stage.tone}>
              {stage.label}
            </Badge>
          </Fact>
          <Fact label="Top Category">{journey.top_category || "—"}</Fact>
          <Fact label="Price Range">
            {range
              ? range.min === range.max
                ? formatPrice(range.min, range.currency || undefined)
                : `${formatPrice(range.min, range.currency || undefined)} – ${formatPrice(range.max, range.currency || undefined)}`
              : "—"}
          </Fact>
        </div>
      </CardContent>
    </Card>
  );
}

type RhythmDay = { date: Date; visits: number; views: number };

/**
 * The last RHYTHM_DAYS days, how often they came back, and the time of day
 * they usually browse. Display only: times are shown in the viewer's own
 * time zone.
 */
function buildRhythm(journey: GuestJourney) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const first = today.getTime() - (RHYTHM_DAYS - 1) * DAY_MS;
  const days: RhythmDay[] = Array.from({ length: RHYTHM_DAYS }, (_, index) => ({
    date: new Date(first + index * DAY_MS),
    visits: 0,
    views: 0,
  }));
  const dayOf = (value: string) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return days[Math.round((date.getTime() - first) / DAY_MS)];
  };

  const visitTimes = journey.visits.map((visit) => visit.started_at);
  const viewTimes = journey.product_views.flatMap((view) => view.viewed_at);
  for (const value of visitTimes) {
    const day = dayOf(value);
    if (day) day.visits += 1;
  }
  for (const value of viewTimes) {
    const day = dayOf(value);
    if (day) day.views += 1;
  }

  // Average gap between visits, oldest to newest.
  const starts = visitTimes.map((value) => new Date(value).getTime()).sort();
  const gaps = starts.slice(1).map((start, index) => start - starts[index]);
  const averageGap = gaps.length
    ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
    : null;

  // The part of the day most of their visits and views happen in.
  const parts: Record<string, number> = {};
  for (const value of [...visitTimes, ...viewTimes]) {
    const hour = new Date(value).getHours();
    const part =
      hour >= 5 && hour < 12
        ? "morning"
        : hour >= 12 && hour < 17
          ? "afternoon"
          : hour >= 17 && hour < 21
            ? "evening"
            : "night";
    parts[part] = (parts[part] ?? 0) + 1;
  }
  const usualPart =
    Object.entries(parts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    days,
    recentVisits: days.reduce((sum, day) => sum + day.visits, 0),
    averageGap,
    usualPart,
  };
}

/** How strong a day's cell is drawn, by how much happened that day. */
function dayTone(day: RhythmDay): string {
  const activity = day.visits + day.views;
  if (activity === 0) return "bg-muted";
  if (activity <= 2) return "bg-primary/30";
  if (activity <= 5) return "bg-primary/60";
  return "bg-primary";
}

/** One cell per day for the last month, like a contribution graph. */
export function RhythmCard({ journey }: { journey: GuestJourney }) {
  const rhythm = useMemo(() => buildRhythm(journey), [journey]);
  const hasData = journey.visits.length > 0 || journey.product_views.length > 0;

  const summary = [
    `${rhythm.recentVisits} visit${rhythm.recentVisits === 1 ? "" : "s"} in the last ${RHYTHM_DAYS} days`,
    rhythm.averageGap !== null
      ? rhythm.averageGap < DAY_MS
        ? "comes back more than once a day"
        : `comes back about every ${formatSpan(rhythm.averageGap)}`
      : null,
    rhythm.usualPart ? `mostly in the ${rhythm.usualPart}` : null,
  ].filter(Boolean);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconCalendarStats className="size-4" />
          Visit Rhythm
        </CardTitle>
        <CardDescription>
          {hasData
            ? summary.join(" · ")
            : "No visits recorded yet. Visits and product views are counted from their next visit."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${RHYTHM_DAYS}, minmax(0, 1fr))`,
          }}
        >
          {rhythm.days.map((day) => (
            <Tooltip key={day.date.toISOString()}>
              <TooltipTrigger asChild>
                <div
                  className={cn("h-7 rounded-sm", dayTone(day))}
                  aria-label={`${day.date.toDateString()}: ${day.visits} visits, ${day.views} product views`}
                />
              </TooltipTrigger>
              <TooltipContent>
                {formatDay(day.date.toISOString())} · {day.visits} visit
                {day.visits === 1 ? "" : "s"}, {day.views} product view
                {day.views === 1 ? "" : "s"}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="flex justify-between">
          <Typography variant="muted" as="span">
            {formatDay(rhythm.days[0].date.toISOString())}
          </Typography>
          <Typography variant="muted" as="span">
            Today
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}

/** The icon and words for one timeline event. */
function EventLine({ event }: { event: GuestTimelineEvent }) {
  const product = "product" in event ? event.product : null;
  const productLink = product ? (
    product.url ? (
      <a
        href={product.url}
        target="_blank"
        rel="noreferrer"
        className="font-medium hover:underline"
      >
        {product.name}
      </a>
    ) : (
      <span className="font-medium">{product.name}</span>
    )
  ) : null;

  switch (event.type) {
    case "product_view":
      return (
        <>
          Viewed {productLink}
          <span className="text-muted-foreground">
            {" "}
            · {ordinal(event.view_number)} view
          </span>
        </>
      );
    case "view_product":
      return <>AI showed {productLink ?? "a product"}</>;
    case "add_to_cart":
      return <>Added {productLink ?? "a product"} to cart</>;
    case "checkout_link":
      return <>Got a checkout link</>;
    case "view_cart":
      return <>Viewed their cart</>;
    case "view_order":
      return <>Looked up an order</>;
    case "chat":
      return (
        <>
          Started a chat{" "}
          <Link
            href={`/threads/${event.chat.id}`}
            className="font-medium hover:underline"
          >
            {event.chat.name || "Untitled chat"}
          </Link>
          <span className="text-muted-foreground">
            {" "}
            · {event.chat.messages_count} messages
          </span>
        </>
      );
    case "order":
      return (
        <>
          Placed order{" "}
          <Link
            href={`/crm/orders/${event.order.id}`}
            className="font-medium hover:underline"
          >
            {event.order.name}
          </Link>
          <span className="text-muted-foreground">
            {" "}
            · {formatPrice(event.order.total_price, event.order.currency)}
          </span>
        </>
      );
    default:
      return null;
  }
}

const EVENT_ICONS: Record<GuestTimelineEvent["type"], typeof IconEye> = {
  product_view: IconEye,
  view_product: IconSparkles,
  add_to_cart: IconShoppingCartPlus,
  checkout_link: IconCreditCard,
  view_cart: IconShoppingCart,
  view_order: IconPackage,
  chat: IconMessage,
  order: IconShoppingBag,
};

/** One visit: when it started, how long it lasted, then its events. */
function VisitBlock({ visit }: { visit: GuestTimelineVisit }) {
  const lasted =
    visit.number !== null && visit.started_at && visit.ended_at
      ? new Date(visit.ended_at).getTime() -
        new Date(visit.started_at).getTime()
      : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={cn(
            "size-3.5 shrink-0 rounded-full ring-4 ring-background",
            visit.number !== null ? "bg-primary" : "bg-muted-foreground/40",
          )}
        />
        <Typography variant="small" as="span" className="font-semibold">
          {visit.number !== null ? `Visit ${visit.number}` : "Earlier Activity"}
        </Typography>
        {visit.started_at ? (
          <Typography variant="muted" as="span">
            {formatDay(visit.started_at)} · {formatTime(visit.started_at)}
          </Typography>
        ) : null}
        {lasted >= 60_000 ? (
          <Badge variant="outline" className={BADGE_TONE_STYLES.neutral}>
            {formatSpan(lasted)}
          </Badge>
        ) : null}
      </div>
      {visit.events.length === 0 ? (
        <Typography variant="muted" className="ml-[7px] border-l pl-5">
          Browsed the store; no product pages or chats.
        </Typography>
      ) : (
        <ol className="ml-[7px] flex flex-col gap-3 border-l border-border pl-5">
          {visit.events.map((event, index) => {
            const Icon = EVENT_ICONS[event.type] ?? IconEye;
            const product = "product" in event ? event.product : null;
            return (
              <li
                key={`${event.type}-${event.at}-${index}`}
                className="flex items-start gap-3"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon className="size-3.5" />
                </span>
                {event.type === "product_view" && product?.image ? (
                  // Store CDN images; next/image's allowlist can't cover them.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt=""
                    className="size-7 shrink-0 rounded-md border border-border/60 bg-muted object-contain"
                  />
                ) : null}
                <Typography
                  variant="small"
                  as="p"
                  className="min-w-0 flex-1 pt-1 font-normal leading-snug"
                >
                  <EventLine event={event} />
                </Typography>
                <Typography variant="muted" as="span" className="shrink-0 pt-1">
                  {formatTime(event.at)}
                </Typography>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/** "Came back after 2 days", between a visit and the one before it. */
function GapLabel({
  newer,
  older,
}: {
  newer: GuestTimelineVisit;
  older: GuestTimelineVisit;
}) {
  const end = older.ended_at ?? older.started_at;
  if (!newer.started_at || !end) return null;
  const gap = new Date(newer.started_at).getTime() - new Date(end).getTime();
  if (gap <= 0) return null;
  return (
    <div className="my-3 ml-[7px] flex items-center gap-3 border-l border-dashed border-border py-1 pl-5">
      <Typography variant="muted" as="span" className="italic">
        Came back after {formatSpan(gap)}
      </Typography>
    </div>
  );
}

/**
 * Every visit and what happened in it, newest first: product pages opened
 * (with which view of that product it was), chats, what the AI showed, cart
 * and orders. Built by the backend; tabs only narrow what is shown.
 */
export function VisitTimeline({
  timeline,
}: {
  timeline: GuestTimelineVisit[];
}) {
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [showAll, setShowAll] = useState(false);

  const visits = timeline
    .map((visit) =>
      filter === "all"
        ? visit
        : {
            ...visit,
            events: visit.events.filter((event) =>
              FILTER_TYPES[filter].includes(event.type),
            ),
          },
    )
    .filter(
      (visit) =>
        visit.events.length > 0 || (filter === "all" && visit.number !== null),
    );
  const shown = showAll ? visits : visits.slice(0, VISITS_SHOWN);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconTimeline className="size-4" />
          Timeline
        </CardTitle>
        <CardDescription>
          Each visit and what they did, newest first.
        </CardDescription>
        <CardAction>
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as TimelineFilter)}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="chats">Chats</TabsTrigger>
              <TabsTrigger value="cart">Cart & Orders</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {shown.length === 0 ? (
          <Typography variant="muted">Nothing here yet.</Typography>
        ) : (
          <ol className="flex flex-col">
            {shown.map((visit, index) => (
              <li key={visit.number ?? "earlier"}>
                <VisitBlock visit={visit} />
                {index < shown.length - 1 ? (
                  <GapLabel newer={visit} older={shown[index + 1]} />
                ) : null}
              </li>
            ))}
          </ol>
        )}
        {visits.length > VISITS_SHOWN ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 self-start text-primary hover:text-primary"
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll
              ? "Show Fewer Visits"
              : `Show ${visits.length - VISITS_SHOWN} Older Visits`}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** One viewed product: how often, when last, and every kept view time. */
function ProductViewItem({ view }: { view: GuestProductView }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <ProductRow
        image={view.product.image ?? undefined}
        name={view.product.name}
        detail={`${view.view_count === 1 ? "1 view" : `${view.view_count} views`} · last ${formatRelativeDateTime(view.last_viewed_at)} ago`}
        price={productPrice(view.product)}
        href={view.product.url ?? undefined}
      />
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 self-start text-xs font-medium text-primary hover:underline"
        aria-expanded={open}
      >
        {open ? (
          <IconChevronUp className="size-3.5" />
        ) : (
          <IconChevronDown className="size-3.5" />
        )}
        {open ? "Hide View Times" : "Show View Times"}
      </button>
      {open ? (
        <ul className="flex flex-col gap-1 rounded-lg bg-muted/50 px-3 py-2">
          {view.viewed_at.map((value, index) => (
            <li
              key={value}
              className="flex justify-between gap-3 text-xs tabular-nums"
            >
              <span className="text-muted-foreground">
                {ordinal(view.view_count - index)} view
              </span>
              <span>{formatDateTime(value)}</span>
            </li>
          ))}
          {view.view_count > view.viewed_at.length ? (
            <li className="text-xs text-muted-foreground">
              + {view.view_count - view.viewed_at.length} older views
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

/** The product pages the guest opened, most recent first, with counts and times. */
export function ProductViewsCard({
  productViews,
}: {
  productViews: GuestProductView[];
}) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? productViews : productViews.slice(0, VIEWED_SHOWN);
  const total = productViews.reduce((sum, view) => sum + view.view_count, 0);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconEye className="size-4" />
          Viewed Products
        </CardTitle>
        <CardDescription>
          {productViews.length}{" "}
          {productViews.length === 1 ? "product" : "products"}, {total}{" "}
          {total === 1 ? "view" : "views"}. A reload within a minute counts
          once.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {shown.map((view) => (
          <ProductViewItem key={view.product.id} view={view} />
        ))}
        {productViews.length > VIEWED_SHOWN ? (
          <Button
            variant="ghost"
            size="sm"
            className="self-start text-primary hover:text-primary"
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll
              ? "Show Less"
              : `Show ${productViews.length - VIEWED_SHOWN} More`}
            <IconArrowRight
              className={cn(
                "size-4 transition-transform",
                showAll && "-rotate-90",
              )}
            />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
