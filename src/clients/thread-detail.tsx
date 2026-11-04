"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBrain,
  IconCalendarTime,
  IconCheck,
  IconClockHour4,
  IconDotsVertical,
  IconFlag,
  IconHash,
  IconListCheck,
  IconMessage2,
  IconMessages,
  IconSparkles,
  IconTargetArrow,
  IconThumbUp,
  IconUserCheck,
  IconX,
  type Icon,
} from "@tabler/icons-react";

import MessagePan from "@/components/custom/message-pan";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import {
  CustomerDetailsButton,
  CustomerDetailsPanel,
} from "@/components/custom/customer-details-panel";
import {
  CrmLinkButton,
  CustomerContact,
} from "@/components/custom/customer-header";
import { TagsCell } from "@/components/custom/threads-columns";
import { InfoIcon } from "@/components/custom/info-icon";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import {
  closedByLabel,
  closeReasonLabel,
  closeReasonTone,
} from "@/lib/thread-options";
import { LinkCustomerDialog } from "@/components/custom/link-customer-dialog";
import { LoadingState } from "@/components/custom/loading-state";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { FEEDBACK_RATINGS } from "@/lib/config";
import { formatDateTime, getDuration } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import {
  FetchAIInsight,
  FetchCart,
  FetchConversationSummary,
  FetchFeedbackSequence,
  FetchFreshdeskTicketId,
  FetchOrders,
  FetchTags,
  FetchThreadDetails,
  FetchUserMetadata,
  ThreadCustomerLink,
  type ThreadMessage,
  type ThreadTagData,
} from "@/redux/api-slice/thread-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

/**
 * One fact in the session strip. Labels are exposed through tooltips.
 *
 * Muted and on a single line on purpose: when was it, how long, how many
 * messages is reference data an agent checks occasionally. It used to be a
 * full card at the top of the page, which put the least-needed thing in the
 * most valuable place and pushed the conversation below the fold.
 */
function MetaCell({
  icon,
  label,
  value,
  mono = false,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  loading?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex min-w-0 shrink-0 items-center gap-1.5 text-muted-foreground"
          aria-label={label}
        >
          <span className="shrink-0">{icon}</span>
          {loading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <Typography
              variant="caption"
              className={cn("truncate", mono && "font-mono")}
            >
              {value}
            </Typography>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

/**
 * The heading of one section of the thread pane.
 *
 * Sections rather than cards: the pane was three stacked boxes inside a
 * bordered pane inside the page, and every nested edge cost width and made
 * the screen read as furniture rather than content. A tinted icon and a
 * rule carry the same separation without the frame.
 */
function SectionHeader({
  icon: Icon,
  title,
  info,
  action,
}: {
  icon: Icon;
  title: React.ReactNode;
  info: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b bg-muted px-4 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 items-center gap-2">
        <Typography variant="h6" as="h3" className="truncate">
          {title}
        </Typography>
        <InfoIcon text={info} />
      </div>
      {action ? <div className="ml-auto shrink-0">{action}</div> : null}
    </div>
  );
}

/** Colored-dot list item for insight cases. */
function InsightItem({
  tone,
  children,
}: {
  tone: "positive" | "negative" | "action";
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2 text-sm text-muted-foreground">
      <span
        className={cn(
          "mt-1.5 size-1.5 shrink-0 rounded-full",
          tone === "positive" && "bg-emerald-500",
          tone === "negative" && "bg-red-500",
          tone === "action" && "bg-primary",
        )}
      />
      {children}
    </li>
  );
}

/** A titled list of insight cases, or nothing when the AI found none. */
function InsightGroup({
  icon: Icon,
  title,
  tone,
  items,
}: {
  icon: Icon;
  title: string;
  tone: "positive" | "negative" | "action";
  items: string[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "size-4",
            tone === "positive" && "text-emerald-600 dark:text-emerald-500",
            tone === "negative" && "text-red-600 dark:text-red-500",
            tone === "action" && "text-primary",
          )}
        />
        <Typography variant="small" as="h4">
          {title}
        </Typography>
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, index) => (
          <InsightItem key={index} tone={tone}>
            {item}
          </InsightItem>
        ))}
      </ul>
    </div>
  );
}

/**
 * The AI's read on the conversation, above the transcript.
 *
 * First on the page because it answers in a paragraph what the transcript
 * answers in fifty messages — an agent picking up a thread wants the recap
 * and the score before deciding whether to read the whole exchange.
 */
function AIInsightsSection({
  summary,
  summaryLoading,
  nextActionableItems,
  resolutionSuccessRate,
  reasonForScore,
  overperformingCases,
  underperformingCases,
  insightsLoading,
}: {
  summary: string;
  summaryLoading: boolean;
  nextActionableItems: string[];
  resolutionSuccessRate: string;
  reasonForScore: string;
  overperformingCases: string[];
  underperformingCases: string[];
  insightsLoading: boolean;
}) {
  const rate = Math.min(100, Math.max(0, parseInt(resolutionSuccessRate) || 0));

  return (
    <section className="shrink-0">
      <SectionHeader
        icon={IconBrain}
        title="AI Insights"
        info="The AI's read on this conversation — a recap of what happened, how well it resolved the request, and where it struggled."
      />

      <div className="flex flex-col gap-4 p-4">
        {/* Recap and score side by side: the two things read first, and
            the only two tinted, so the eye lands on them before the
            plainer lists below. */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-primary">
              <IconSparkles className="size-4" />
              <Typography variant="small" as="h4">
                Summary
              </Typography>
            </div>
            {summaryLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <Typography variant="muted" className="leading-relaxed">
                {summary || "No summary available for this conversation."}
              </Typography>
            )}
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-primary">
              <IconTargetArrow className="size-4" />
              <Typography variant="small" as="h4">
                Resolution Score
              </Typography>
            </div>
            {insightsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <Typography
                  variant="h3"
                  as="span"
                  className="text-primary tabular-nums"
                >
                  {rate && rate > 0 ? `${rate}%` : "N/A"}
                </Typography>
                <Progress value={rate} />
                {reasonForScore && (
                  <Typography variant="muted" className="leading-relaxed">
                    {reasonForScore}
                  </Typography>
                )}
              </>
            )}
          </div>
        </div>

        {insightsLoading ? (
          <LoadingState className="py-6" />
        ) : (
          <>
            <InsightGroup
              icon={IconListCheck}
              title="Suggested Follow-ups"
              tone="action"
              items={nextActionableItems}
            />

            {/* What worked and what did not, side by side — they are two
                answers to one question and read as a pair. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <InsightGroup
                icon={IconThumbUp}
                title="What Went Well"
                tone="positive"
                items={overperformingCases}
              />
              <InsightGroup
                icon={IconAlertTriangle}
                title="What To Improve"
                tone="negative"
                items={underperformingCases}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Thread-detail presentation                                          */
/* ------------------------------------------------------------------ */

function ThreadCard({
  title,
  children,
  className,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-background",
        className,
      )}
    >
      {title ? (
        <div className="border-b px-5 py-4 text-lg font-semibold">{title}</div>
      ) : null}
      {children}
    </section>
  );
}

function ResolutionRing({ value }: { value: number }) {
  const rate = Math.max(0, Math.min(100, value || 0));
  return (
    <span
      aria-label={`${rate}% resolution score`}
      className="relative inline-flex size-14 shrink-0 items-center justify-center rounded-full text-primary"
      style={{
        background: `conic-gradient(#7c22ce ${rate}%, #ede9fe 0)`,
      }}
    >
      <span className="size-11 rounded-full bg-background" />
      <span className="absolute text-[13px] font-bold tabular-nums">
        {rate}%
      </span>
    </span>
  );
}

function ConversationMap({
  messages,
  rate,
  startedAt,
  endedAt,
  cartCount,
  issueCount,
}: {
  messages: ThreadMessage[];
  rate: number;
  startedAt?: string | null;
  endedAt?: string | null;
  cartCount: number;
  issueCount: number;
}) {
  const validDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const messageDates = messages
    .map((message) => validDate(message.created_at))
    .filter((date): date is Date => date !== null);
  // Some historical sessions contain a stale `ended_at` that predates the
  // messages. Build the range from every valid event instead of trusting that
  // one field, so a short chat cannot render as a long timeline.
  const rangeDates = [
    validDate(startedAt),
    validDate(endedAt),
    ...messageDates,
  ].filter((date): date is Date => date !== null);
  const first = rangeDates.length
    ? new Date(Math.min(...rangeDates.map((date) => date.getTime())))
    : null;
  const last = rangeDates.length
    ? new Date(Math.max(...rangeDates.map((date) => date.getTime())))
    : first;
  const minutes =
    first && last
      ? Math.max(1, Math.ceil((last.getTime() - first.getTime()) / 60000))
      : 1;
  const volume = Array.from(
    { length: minutes },
    (_, minute) =>
      messages.filter(
        (message) =>
          first &&
          Math.floor(
            (new Date(message.created_at).getTime() - first.getTime()) / 60000,
          ) === minute,
      ).length,
  );
  const max = Math.max(...volume, 1);
  const markers = messages.flatMap((message) => {
    if (!first) return [];
    const minute = Math.floor(
      (new Date(message.created_at).getTime() - first.getTime()) / 60000,
    );
    if (minute < 0 || minute >= minutes) return [];
    if (
      message.json_content?.products?.length ||
      message.json_content?.related_products?.length
    ) {
      return [{ minute, tone: "bg-primary", label: "Products shown" }];
    }
    if (
      message.json_content?.cart_action ||
      message.json_content?.cart_details ||
      (message.message_type === "ai_action" &&
        /(?:view(?:ed)?|show(?:ed)?)\s+(?:the )?cart/i.test(message.message))
    ) {
      const action =
        `${message.json_content?.cart_action ?? ""} ${message.message}`.toLowerCase();
      const isRemoval = action.includes("remove") || action.includes("clear");
      const isCartView =
        action.includes("view") ||
        action.includes("show cart") ||
        action.includes("cart viewed");
      const isCheckout = action.includes("checkout");
      return [
        {
          minute,
          tone: isRemoval
            ? "bg-amber-500"
            : isCartView
              ? "bg-sky-500"
              : isCheckout
                ? "bg-primary"
                : "bg-emerald-500",
          label: isRemoval
            ? "Removed from cart"
            : isCartView
              ? "Cart viewed"
              : isCheckout
                ? "Checkout started"
                : "Added to cart",
        },
      ];
    }
    return [];
  });
  // Overlapping markers hide each other at minute-level resolution, so retain
  // the first meaningful event in each minute.
  const visibleMarkers = markers.filter(
    (marker, index) =>
      markers.findIndex((item) => item.minute === marker.minute) === index,
  );
  const removedCount = markers.filter(
    (marker) => marker.label === "Removed from cart",
  ).length;
  const timeTicks = [0, 0.25, 0.5, 0.75, 1].map((position) => {
    const timestamp =
      first && last
        ? first.getTime() + (last.getTime() - first.getTime()) * position
        : null;
    return {
      position,
      label: timestamp
        ? new Date(timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "—",
    };
  });

  return (
    <ThreadCard className="hidden rounded-xl lg:block">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
        <h2 className="text-sm font-semibold">Conversation map</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            <i className="mr-2 inline-block size-2 rounded-full bg-primary" />
            Products shown
          </span>
          <span>
            <i className="mr-2 inline-block size-2 rounded-full bg-emerald-500" />
            Added to cart
          </span>
          <span>
            <i className="mr-2 inline-block size-2 rounded-full bg-amber-500" />
            Removed from cart
          </span>
          <span>
            <i className="mr-2 inline-block size-2 rounded-full bg-sky-500" />
            Cart viewed
          </span>
          <span>
            <i className="mr-2 inline-block size-2 rotate-45 rounded-[2px] bg-red-600" />
            AI issue
          </span>
        </div>
      </div>
      <div className="mx-5 mt-4 grid grid-cols-5 overflow-hidden rounded-lg border">
        {[
          ["Resolution score", `${rate || "—"}%`, "text-primary"],
          ["Messages", String(messages.length), ""],
          ["Cart at close", `${cartCount} items`, ""],
          ["Removed by AI", `${removedCount} items`, ""],
          ["AI issues", String(issueCount), "text-red-600"],
        ].map(([label, value, color]) => (
          <div key={label} className="border-r px-3 py-2.5 last:border-r-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn("text-lg font-bold leading-tight", color)}>
              {value}
            </p>
          </div>
        ))}
      </div>
      <div className="relative mx-5 mt-5 h-32 border-b border-primary/20 pb-5">
        {last ? (
          <div className="absolute inset-y-0 right-2 z-10 w-px">
            <span className="absolute right-0 top-5 whitespace-nowrap text-[10px] font-medium text-foreground">
              Closed
            </span>
            <span className="absolute bottom-1 left-0 top-9 w-px bg-border" />
            <span className="absolute bottom-0 left-1/2 size-3 -translate-x-1/2 rounded-full border-2 border-background bg-muted-foreground shadow-sm" />
          </div>
        ) : null}
        {visibleMarkers.map((marker, index) => {
          const position = ((marker.minute + 0.5) / minutes) * 100;
          const labelTop = [0, 22, 44][index % 3];
          const labelClass =
            position > 84
              ? "right-0"
              : position < 16
                ? "left-0"
                : "left-1/2 -translate-x-1/2";

          return (
            <div
              key={`${marker.minute}-${marker.label}`}
              className="absolute inset-y-0 z-10 w-px -translate-x-1/2"
              style={{ left: `${position}%` }}
            >
              <span
                className={cn(
                  "absolute whitespace-nowrap text-[10px] font-medium text-foreground",
                  labelClass,
                )}
                style={{ top: `${labelTop}px` }}
              >
                {marker.label}
              </span>
              <span
                className="absolute bottom-1 w-px bg-border"
                style={{ top: `${labelTop + 17}px` }}
              />
              <span
                title={marker.label}
                aria-label={marker.label}
                className={cn(
                  "absolute bottom-0 left-1/2 size-3 -translate-x-1/2 rounded-full border-2 border-background shadow-sm",
                  marker.tone,
                )}
              />
            </div>
          );
        })}
        <div className="flex h-full items-end gap-1">
          {volume.map((count, index) => (
            <span
              key={index}
              className="min-w-0 flex-1 rounded-t-sm bg-primary/20"
              style={{ height: `${Math.max(5, (count / max) * 65)}%` }}
            />
          ))}
        </div>
        {timeTicks.map((tick) => (
          <span
            key={tick.position}
            className="absolute bottom-[-1.65rem] whitespace-nowrap text-xs text-muted-foreground"
            style={{
              left: `${tick.position * 100}%`,
              transform:
                tick.position === 0
                  ? "none"
                  : tick.position === 1
                    ? "translateX(-100%)"
                    : "translateX(-50%)",
            }}
          >
            {tick.label}
          </span>
        ))}
      </div>
      <p className="px-5 pb-4 pt-7 text-[10px] text-muted-foreground">
        Each bar shows messages sent in that minute. Markers identify
        significant events during the conversation.
      </p>
    </ThreadCard>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ThreadDetail({ threadId }: { threadId: string }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const { FetchThreadDetailsData, FetchThreadDetailsIsError } = useAppSelector(
    (state) => state.GetThreadReducer.FetchThreadDetailsState,
  );
  const { FetchConversationSummaryData, FetchConversationSummaryIsLoading } =
    useAppSelector(
      (state) => state.GetThreadReducer.FetchConversationSummaryState,
    );
  const { FetchAIInsightData, FetchAIInsightIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchAIInsightState,
  );
  const { FetchCartData, FetchCartDataIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchCartDataState,
  );
  const { FetchUserMetadataData, FetchUserMetadataIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchUserMetadataState,
  );
  const { FetchFeedbackSequenceData, FetchFeedbackSequenceIsLoading } =
    useAppSelector(
      (state) => state.GetThreadReducer.FetchFeedbackSequenceState,
    );
  const { FetchFreshdeskTicketIdData, FetchFreshdeskTicketIdIsLoading } =
    useAppSelector(
      (state) => state.GetThreadReducer.FetchFreshdeskTicketIdState,
    );
  const { FetchOrderData, FetchOrderDataIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchOrderDataState,
  );
  const threadTags = useAppSelector(
    (state) =>
      (
        state.GetThreadReducer.FetchTagsState as {
          FetchTags?: { tags?: (string | ThreadTagData)[] };
        }
      ).FetchTags?.tags ?? [],
  );
  const tagsLoading = useAppSelector(
    (state) => state.GetThreadReducer.FetchTagsState.FetchTagsIsLoading,
  );
  const threadTagLabels = threadTags.map((tag) =>
    typeof tag === "string" ? tag : tag.name,
  );

  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [isLinkCustomerOpen, setIsLinkCustomerOpen] = useState(false);
  // Below `xl` the customer details open as a sheet from the header.
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLinkingCustomer, setIsLinkingCustomer] = useState(false);

  useEffect(() => {
    if (!storeCode || !threadId) return;

    const loadData = async () => {
      const result = await dispatch(FetchThreadDetails(threadId)).unwrap();
      setThreadMessages(result.messages ?? []);

      dispatch(FetchConversationSummary(threadId));
      dispatch(FetchAIInsight(threadId));
      dispatch(FetchCart(threadId));
      dispatch(FetchUserMetadata(threadId));
      dispatch(FetchFeedbackSequence(threadId));
      dispatch(FetchOrders(threadId));
      dispatch(
        FetchFreshdeskTicketId({
          threadId,
          customerId: result.customer?.id,
          storeCode,
        }),
      );
      dispatch(FetchTags(threadId));
    };

    loadData();
  }, [dispatch, storeCode, threadId]);

  const handleLinkCustomer = async (customerId: number) => {
    if (!storeCode || !threadId) return;
    setIsLinkingCustomer(true);
    try {
      const result = await dispatch(
        ThreadCustomerLink({ storeCode, threadId, customerId }),
      );
      if (ThreadCustomerLink.fulfilled.match(result)) {
        setIsLinkCustomerOpen(false);
        // Identity, order history and tickets all change with the link, so
        // refetch rather than patching a guess into three places.
        const detail = await dispatch(FetchThreadDetails(threadId)).unwrap();
        setThreadMessages(detail.messages ?? []);
        dispatch(FetchOrders(threadId));
        dispatch(
          FetchFreshdeskTicketId({
            threadId,
            customerId: detail.customer?.id,
            storeCode,
          }),
        );
      }
    } finally {
      setIsLinkingCustomer(false);
    }
  };

  // Only this thread's data counts as loaded. The store keeps the previous
  // response while a new one is in flight — right for a refetch, wrong on
  // navigation, where it left the last thread's customer, summary and score
  // on screen under the new thread's URL as though they were its own.
  const isThisThread =
    FetchThreadDetailsData?.id?.toLowerCase() === threadId.toLowerCase();
  const details = isThisThread ? FetchThreadDetailsData : null;
  // The thread's own request is still out — or what is in the store belongs
  // to the thread we came from. Either way this screen has no basics yet,
  // so every section shows its own loader rather than the last thread's
  // answer. Each section then falls back to its own request's flag.
  const detailsLoading = !isThisThread;
  const isResolved = details?.verdict?.verdict === "resolved";
  // A close reason on an active chat is only an agent's pending request, so
  // the closure badges wait for the chat to close. The verdict badge only adds
  // something when it is not a second "Resolved" beside the close reason: show it when no reason was recorded or when the
  // verdict is unresolved. No verdict yet (open, empty or unanalysed thread)
  // means nothing to show, rather than a misleading "Unresolved".
  const showVerdict =
    !!details?.verdict &&
    (details.is_active || !details.close_reason || !isResolved);
  const customerName =
    details?.customer_name || details?.customer_email || "Guest";
  const feedback = FetchFeedbackSequenceData?.feedback;
  const feedbackLabel = feedback
    ? (FEEDBACK_RATINGS.find((rating) => rating.value === feedback.rating)
        ?.label ?? null)
    : null;

  // Only a genuine failure replaces the screen. Everything else renders
  // the shell and fills in section by section.
  if (!details && FetchThreadDetailsIsError) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <IconMessage2 />
          </EmptyMedia>
          <EmptyTitle>Thread Not Found</EmptyTitle>
          <EmptyDescription>
            This conversation may belong to another store, or have been removed.
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" asChild>
          <Link href="/threads">Back to Threads</Link>
        </Button>
      </Empty>
    );
  }

  const resolutionRate = Math.min(
    100,
    Math.max(
      0,
      parseInt(FetchAIInsightData?.resolution_success_rate || "0") || 0,
    ),
  );
  const cartItems = FetchCartData?.updated_cart_data?.items ?? [];
  const improvements = FetchAIInsightData?.underperforming_cases ?? [];
  const successes = FetchAIInsightData?.overperforming_cases ?? [];
  const actions = FetchAIInsightData?.next_actionable_items ?? [];
  const started = formatDateTime(details?.created_at || null) || "—";
  const ended = details?.ended_at ? formatDateTime(details.ended_at) : "—";
  const duration =
    getDuration(details?.created_at ?? null, details?.ended_at ?? null) || "—";

  const transcript = (
    <ThreadCard
      title={
        <div className="flex items-center justify-between gap-3">
          <span>Conversation</span>
          <span className="text-sm font-normal text-muted-foreground">
            {details?.total_messages ?? threadMessages.length} messages · full
            transcript
          </span>
        </div>
      }
    >
      {detailsLoading ? (
        <LoadingState label="Loading conversation…" />
      ) : threadMessages.length ? (
        <div className="p-3">
          <MessagePan
            messages={threadMessages}
            handlerEvents={details?.handler_events}
            customerName={customerName}
            closedAt={details?.is_active ? null : details?.ended_at}
            closedCartItemCount={cartItems.length}
          />
        </div>
      ) : (
        <div className="p-10 text-center text-sm text-muted-foreground">
          No messages in this conversation
        </div>
      )}
    </ThreadCard>
  );
  const review = (
    <div className="space-y-4">
      <ThreadCard>
        <div className="flex items-center gap-4 border-b px-5 py-5">
          <ResolutionRing value={resolutionRate} />
          <div>
            <h2 className="text-lg font-semibold">AI review</h2>
            <p className="text-sm text-muted-foreground">
              {FetchAIInsightData?.reason_for_score ||
                "Conversation quality and resolution analysis."}
            </p>
          </div>
        </div>
        <div>
          <div className="border-b px-5 py-5">
            <p className="text-sm leading-6 text-muted-foreground">
              {FetchConversationSummaryData?.conversation_summary ||
                "No summary available for this conversation."}
            </p>
          </div>
          {successes.length > 0 && (
            <div className="border-b px-5 py-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-emerald-700">
                Went well
              </h3>
              <ul className="space-y-3.5">
                {successes.map((item, index) => (
                  <li
                    className="flex gap-3 text-sm leading-5 text-muted-foreground"
                    key={index}
                  >
                    <IconCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {improvements.length > 0 && (
            <div className="px-5 py-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-red-700">
                To improve
              </h3>
              <div className="space-y-3.5">
                {improvements.map((item, index) => (
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 text-left text-sm leading-5 text-muted-foreground hover:text-foreground"
                    key={index}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span>
                      {item}{" "}
                      <span className="font-medium text-primary">Jump</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ThreadCard>
      {actions.length > 0 && (
        <ThreadCard
          title={
            <div className="flex items-center justify-between">
              <span>Suggested actions</span>
              <span className="text-sm font-normal text-muted-foreground">
                {actions.length} actions
              </span>
            </div>
          }
        >
          <div>
            {actions.map((action, index) => (
              <button
                type="button"
                key={index}
                className="flex w-full items-start justify-between border-b p-5 text-left last:border-b-0 hover:bg-muted/30"
              >
                <span>
                  <strong className="block">{action}</strong>
                  <small className="mt-1 block leading-5 text-muted-foreground">
                    Open suggested action
                  </small>
                </span>
                <span className="text-muted-foreground">›</span>
              </button>
            ))}
          </div>
        </ThreadCard>
      )}
    </div>
  );
  const customer = (
    <div className="space-y-4">
      <ThreadCard title="Customer">
        <div className="space-y-4 p-5">
          <div>
            <p className="font-semibold">{customerName}</p>
            <CustomerContact
              email={details?.customer_email}
              phone={details?.customer?.phone}
              orders={FetchOrderData}
            />
          </div>
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border sm:grid-cols-3">
            <div className="border-r p-3">
              <p className="text-xs text-muted-foreground">Orders</p>
              <p className="font-semibold">{FetchOrderData?.length ?? 0}</p>
            </div>
            <div className="p-3">
              <p className="text-xs text-muted-foreground">Past chats</p>
              <p className="font-semibold">
                {details?.customer?.past_threads_count ?? 0}
              </p>
            </div>
          </div>
          {details?.customer?.id && (
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/crm/customers/${details.customer.id}`}>
                Open full profile
              </Link>
            </Button>
          )}
        </div>
      </ThreadCard>
      <ThreadCard
        title={
          <div className="flex justify-between">
            <span>Cart when the chat closed</span>
            <span className="text-sm font-normal text-muted-foreground">
              {cartItems.length} items
            </span>
          </div>
        }
      >
        <div className="space-y-3 p-5">
          {cartItems.length ? (
            cartItems.map((item, index) => (
              <div
                className="flex items-center gap-3"
                key={`${item.product_id}-${index}`}
              >
                <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt=""
                      className="size-full object-contain"
                    />
                  ) : null}
                </div>
                <p className="min-w-0 flex-1 truncate text-sm">{item.name}</p>
                <p className="text-sm font-semibold">{item.price}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing in the cart.
            </p>
          )}
        </div>
      </ThreadCard>
      <ThreadCard title="Thread details">
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 p-5 text-sm">
          <dt className="text-muted-foreground">Thread ID</dt>
          <dd className="truncate text-right font-mono">{threadId}</dd>
          <dt className="text-muted-foreground">Channel</dt>
          <dd className="text-right">Web chat</dd>
          <dt className="text-muted-foreground">Started</dt>
          <dd className="text-right">{started}</dd>
          <dt className="text-muted-foreground">Ended</dt>
          <dd className="text-right">{ended}</dd>
          <dt className="text-muted-foreground">Duration</dt>
          <dd className="text-right">
            {getDuration(
              details?.created_at ?? null,
              details?.ended_at ?? null,
            ) || "—"}
          </dd>
        </dl>
      </ThreadCard>
    </div>
  );

  return (
    <div className="min-h-svh bg-muted/50">
      <header className="border-b bg-background">
        <div className="flex h-14 items-center border-b px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Back to Threads"
            onClick={() => router.back()}
          >
            <IconArrowLeft />
          </Button>
          <h1 className="ml-3 text-2xl font-bold">Thread</h1>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            aria-label="More thread options"
          >
            <IconDotsVertical />
          </Button>
        </div>
        <div className="flex w-full items-start gap-3 px-4 py-8 lg:px-10 lg:py-4">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Back to Threads"
            onClick={() => router.back()}
            className="mt-1.5 hidden lg:inline-flex"
          >
            <IconArrowLeft />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-3">
              <CustomerAvatar
                name={customerName}
                size="h-14 w-14"
                online={details?.is_active}
              />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold">{customerName}</h1>
                <p className="flex flex-wrap gap-x-5 gap-y-0 text-sm text-muted-foreground">
                  <span>Web chat</span>
                  <span>
                    {started}
                    {details?.ended_at ? `–${ended.split(", ").at(-1)}` : ""}
                  </span>
                  <span className="hidden lg:inline">{duration}</span>
                  <span className="hidden lg:inline">
                    {details?.total_messages ?? threadMessages.length} messages
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                {isResolved ? "Resolved by AI" : "AI review"}
              </Badge>
              <Badge variant="secondary">
                {details?.is_active ? "Active" : "Closed"}
              </Badge>
              {threadTagLabels.slice(0, 1).map((tag) => (
                <Badge
                  key={tag}
                  className="bg-primary/10 text-primary hover:bg-primary/10"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          {/* Desktop thread actions are intentionally retained for future use.
              Keep the mobile Create ticket control below unchanged. */}
          {/*
          <div className="hidden shrink-0 gap-2 lg:flex">
            <Button variant="outline">Export</Button>
            <Button variant="outline">Flag for review</Button>
            <Button>Create ticket</Button>
          </div>
          */}
        </div>
        <div className="grid w-full grid-cols-3 border-t lg:hidden">
          <div className="flex items-center gap-2 border-r p-3 max-[374px]:flex-col max-[374px]:gap-0">
            <ResolutionRing value={resolutionRate} />
            <span>
              <small className="text-muted-foreground">Resolution</small>
            </span>
          </div>
          <div className="border-r p-3">
            <b className="block text-xl">
              {details?.total_messages ?? threadMessages.length}
            </b>
            <small className="text-muted-foreground">Messages</small>
          </div>
          <div className="p-3">
            <b className="block text-xl">
              {getDuration(
                details?.created_at ?? null,
                details?.ended_at ?? null,
              ) || "—"}
            </b>
            <small className="text-muted-foreground">Duration</small>
          </div>
        </div>
      </header>
      <main className="w-full px-4 py-5 pb-24 lg:px-10 lg:py-6">
        <ConversationMap
          messages={threadMessages}
          rate={resolutionRate}
          startedAt={details?.created_at}
          endedAt={details?.ended_at}
          cartCount={cartItems.length}
          issueCount={improvements.length}
        />
        <div className="mt-5 hidden gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          {transcript}
          <aside className="space-y-4">
            {review}
            {customer}
          </aside>
        </div>
        <Tabs defaultValue="chat" className="lg:hidden">
          <TabsList
            variant="line"
            className="sticky top-0 z-10 -mx-4 mb-4 flex h-12 w-[calc(100%+2rem)] justify-around border-y bg-background px-2"
          >
            <TabsTrigger
              value="chat"
              className="text-base data-active:after:bg-primary"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="review"
              className="text-base data-active:after:bg-primary"
            >
              AI review{" "}
              {improvements.length ? (
                <span className="rounded-full bg-red-100 px-1.5 text-xs text-red-700">
                  {improvements.length}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger
              value="customer"
              className="text-base data-active:after:bg-primary"
            >
              Customer
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat">{transcript}</TabsContent>
          <TabsContent value="review">{review}</TabsContent>
          <TabsContent value="customer">{customer}</TabsContent>
        </Tabs>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t bg-background p-3 lg:hidden">
        <Button variant="outline" size="icon" aria-label="Flag for review">
          <IconFlag />
        </Button>
        {/* Retained for future mobile ticket flow. */}
        {/* <Button className="flex-1">Create ticket</Button> */}
      </div>
      {storeCode ? (
        <LinkCustomerDialog
          open={isLinkCustomerOpen}
          onOpenChange={setIsLinkCustomerOpen}
          storeCode={storeCode}
          linking={isLinkingCustomer}
          onLink={(linkedCustomer) => handleLinkCustomer(linkedCustomer.id)}
        />
      ) : null}
    </div>
  );
}
