"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowUpRight,
  IconBrain,
  IconCalendarTime,
  IconCheck,
  IconChevronLeft,
  IconClockHour4,
  IconFlag,
  IconHash,
  IconListCheck,
  IconLoader2,
  IconMessages,
  IconSparkles,
  IconTargetArrow,
  IconThumbUp,
  IconUserCheck,
  IconX,
  type Icon,
} from "@tabler/icons-react";

import { ThreadCard } from "@/components/custom/thread-card";
import { ConversationTranscript } from "@/components/custom/conversation-transcript";
import ConversationMap from "@/components/custom/conversation-map";
import { getInitials } from "@/components/custom/customer-avatar";
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
import { CreditLabel } from "@/components/custom/credit-label";
import { closedByLabel, closeReasonLabel } from "@/lib/thread-options";
import { LinkCustomerDialog } from "@/components/custom/link-customer-dialog";
import {
  CreateTicketDialog,
  type TicketCustomer,
} from "@/components/custom/create-ticket-dialog";
import { LoadingState } from "@/components/custom/loading-state";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { TagBadge } from "@/components/custom/helpdesk/tag-badge";
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
import { getDuration } from "@/lib/helpers";
import { FEEDBACK_RATINGS } from "@/lib/config";
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
  GenerateAIInsight,
  ThreadCustomerLink,
  type ThreadMessage,
  type ThreadTagData,
} from "@/redux/api-slice/thread-slice";
import {
  CreateSupportTicket,
  FetchThreadTicketDraft,
} from "@/redux/api-slice/support-ticket-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useCan } from "@/hooks/use-can";

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
              title="Suggested Follow-Ups"
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

function ResolutionRing({
  value,
  compact = false,
}: {
  value: number;
  compact?: boolean;
}) {
  const rate = Math.max(0, Math.min(100, value || 0));
  return (
    <span
      aria-label={`${rate}% resolution score`}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full text-primary ${
        compact ? "size-11" : "size-14"
      }`}
      style={{
        background: `conic-gradient(#7c22ce ${rate}%, #ede9fe 0)`,
      }}
    >
      <span
        className={`rounded-full bg-background ${compact ? "size-9" : "size-11"}`}
      />
      <span
        className={`absolute font-bold tabular-nums ${
          compact ? "text-[11px]" : "text-[13px]"
        }`}
      >
        {rate}%
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

// Stable reference for "no tags yet". A fresh `[]` inside the selector is a new
// object on every call, which makes react-redux warn and re-render.
const EMPTY_TAGS: (string | ThreadTagData)[] = [];

/** "10:57 AM" */
function formatClock(value: Date) {
  return value
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\s/g, " ");
}

/** "15 Oct 2026, 10:57 AM", for the Thread details card. */
function formatDayFirst(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${date.getDate()} ${month} ${date.getFullYear()}, ${formatClock(date)}`;
}

export default function ThreadDetail({ threadId }: { threadId: string }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const returnToThreads = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    router.back();
  };
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const {
    FetchThreadDetailsData,
    FetchThreadDetailsIsLoading,
    FetchThreadDetailsIsError,
    FetchThreadDetailsIsSuccess,
  } = useAppSelector((state) => state.GetThreadReducer.FetchThreadDetailsState);
  // Whether the thread request was in flight at the last render.
  const wasLoadingRef = useRef(false);
  const { FetchConversationSummaryData } = useAppSelector(
    (state) => state.GetThreadReducer.FetchConversationSummaryState,
  );
  const { FetchAIInsightData, FetchAIInsightIsSuccess } = useAppSelector(
    (state) => state.GetThreadReducer.FetchAIInsightState,
  );
  const { GenerateAIInsightIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.GenerateAIInsightState,
  );
  const { FetchCartData } = useAppSelector(
    (state) => state.GetThreadReducer.FetchCartDataState,
  );
  const { FetchFeedbackSequenceData } = useAppSelector(
    (state) => state.GetThreadReducer.FetchFeedbackSequenceState,
  );
  const { FetchFreshdeskTicketIdData } = useAppSelector(
    (state) => state.GetThreadReducer.FetchFreshdeskTicketIdState,
  );
  const { FetchOrderData } = useAppSelector(
    (state) => state.GetThreadReducer.FetchOrderDataState,
  );
  const threadTags = useAppSelector(
    (state) =>
      (
        state.GetThreadReducer.FetchTagsState as {
          FetchTags?: { tags?: (string | ThreadTagData)[] };
        }
      ).FetchTags?.tags ?? EMPTY_TAGS,
  );
  const threadTagLabels = threadTags.map((tag) =>
    typeof tag === "string" ? tag : tag.name,
  );

  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [isLinkCustomerOpen, setIsLinkCustomerOpen] = useState(false);
  const [isLinkingCustomer, setIsLinkingCustomer] = useState(false);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const canCreateTicket = useCan("conversations", { write: true });

  useEffect(() => {
    if (!storeCode || !threadId) return;

    const loadData = async () => {
      const action = await dispatch(FetchThreadDetails(threadId));

      // Failed, or no thread for this id: the redirect effect below sends the
      // user back to /threads.
      if (FetchThreadDetails.rejected.match(action) || !action.payload?.id) {
        return;
      }

      const result = action.payload;

      // The layout guard below redirects active conversations before paint.
      if (result.is_active) {
        return;
      }

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

  const handleGenerateInsights = async () => {
    if (!threadId) return;
    const result = await dispatch(GenerateAIInsight(threadId));
    if (GenerateAIInsight.fulfilled.match(result)) {
      // The summary comes from the same analysis; tags are set on thread close.
      dispatch(FetchConversationSummary(threadId));
    }
  };

  const handleLinkCustomer = async (customerId: string) => {
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
  // so it shows a loader rather than the last thread's answer.
  // Each section then falls back to its own request's flag.
  const detailsLoading = !isThisThread;

  // The thunk updates Redux before the async loader resumes. Redirect before
  // the browser paints that active response as a (misleading) closed thread.
  useLayoutEffect(() => {
    if (details?.is_active) {
      router.replace(`/support/?chat=${threadId}`);
    }
  }, [details?.is_active, router, threadId]);

  // This page's thread request finished without a thread: it failed (a
  // malformed id answers 500) or came back empty (an unknown or other
  // store's id answers `{}`). Nothing to show, so back to the list.
  // Only after this page's own request: the slice's flags outlive the
  // request that set them, and would otherwise bounce the next thread opened.
  useEffect(() => {
    const requestFinished =
      wasLoadingRef.current &&
      (Boolean(FetchThreadDetailsIsError) || FetchThreadDetailsIsSuccess);
    if (requestFinished && !details) {
      router.replace("/threads");
    }
    wasLoadingRef.current = FetchThreadDetailsIsLoading;
  }, [
    details,
    FetchThreadDetailsIsError,
    FetchThreadDetailsIsLoading,
    FetchThreadDetailsIsSuccess,
    router,
  ]);

  // Breadcrumb title: the thread's own name, else what the customer first asked.
  const threadTitle =
    details?.name ||
    threadMessages.find((message) => message.message_type === "user_message")
      ?.message ||
    "Conversation";
  const customerEmail = details?.customer_email?.trim().toLowerCase();
  const storedCustomerName = details?.customer_name?.trim();
  // Older threads can have the email copied into customer_name. Display that
  // identity as a normalised email, while retaining a genuine customer name.
  const customerName =
    storedCustomerName &&
    storedCustomerName.toLowerCase() !== customerEmail?.toLowerCase()
      ? storedCustomerName
      : customerEmail || storedCustomerName || "Guest";
  // No profile, name or email: an anonymous visitor, so the Customer card has
  // nothing to show and is hidden. Waits for the thread so it never flashes.
  const isGuest =
    !detailsLoading &&
    !details?.customer &&
    !details?.customer_name &&
    !details?.customer_email;

  if (details?.is_active) {
    return <LoadingState label="Opening Live Chat…" className="min-h-64" />;
  }

  // Until this thread's details arrive. If the request is rejected, the
  // redirect effect above sends the user to /threads.
  if (detailsLoading) {
    return <LoadingState className="min-h-64" />;
  }

  const resolutionRate = Math.min(
    100,
    Math.max(
      0,
      parseInt(FetchAIInsightData?.resolution_success_rate || "0") || 0,
    ),
  );
  const cartItems = FetchCartData?.updated_cart_data?.items ?? [];
  const feedback = FetchFeedbackSequenceData?.feedback;
  const feedbackComment = feedback?.feedback_message?.trim();
  const improvements = FetchAIInsightData?.underperforming_cases ?? [];
  const successes = FetchAIInsightData?.overperforming_cases ?? [];
  const actions = FetchAIInsightData?.next_actionable_items ?? [];
  // The endpoint answers `{}` until the insights are generated.
  const hasInsights = Object.keys(FetchAIInsightData ?? {}).length > 0;
  // The customer endpoint can include tickets from other conversations. Only
  // a ticket explicitly linked to this thread replaces its Create action.
  const existingThreadTicket = (FetchFreshdeskTicketIdData ?? []).find(
    (ticket) => ticket.thread_id?.toLowerCase() === threadId.toLowerCase(),
  );
  const started = formatDayFirst(details?.created_at);
  const closeReason = closeReasonLabel(details?.close_reason);
  // "11:28 AM · closed after inactivity". A chat that is still open has no end.
  const endedAtDate = details?.ended_at ? new Date(details.ended_at) : null;
  const endedNote = !details
    ? null
    : details.closed_by_type === "system"
      ? "closed after inactivity"
      : closedByLabel(details.closed_by_type, details.closed_by_name)
        ? `closed by ${closedByLabel(details.closed_by_type, details.closed_by_name)}`
        : closeReasonLabel(details.close_reason)
          ? `closed · ${closeReasonLabel(details.close_reason)}`
          : "closed";
  const ended =
    endedAtDate && !Number.isNaN(endedAtDate.getTime())
      ? `${formatClock(endedAtDate)}${details?.is_active ? "" : ` · ${endedNote}`}`
      : "—";
  // "AI only" until a human agent appears in the handover history.
  const handlerNames = Array.from(
    new Set(
      (details?.handler_events ?? []).flatMap((event) =>
        [event.from_agent_name, event.to_agent_name].filter(
          (name): name is string => Boolean(name),
        ),
      ),
    ),
  );
  const handledBy = !details
    ? "—"
    : handlerNames.length
      ? `AI + ${handlerNames.join(", ")}`
      : "AI Only";

  const transcript = (
    <ConversationTranscript
      messages={threadMessages}
      totalMessages={details?.total_messages}
      loading={detailsLoading}
      handlerEvents={details?.handler_events}
      customerName={customerName}
      closedAt={details?.is_active ? null : details?.ended_at}
      closedCartItemCount={cartItems.length}
    />
  );
  const review = (
    <div className="space-y-4">
      <ThreadCard>
        <div className="flex items-center gap-4 border-b px-5 py-5">
          {hasInsights && <ResolutionRing value={resolutionRate} />}
          <div>
            <h2 className="text-lg font-semibold">AI Review</h2>
            {hasInsights && (
              <p className="text-sm text-muted-foreground">
                {FetchAIInsightData?.reason_for_score ||
                  "Conversation quality and resolution analysis."}
              </p>
            )}
          </div>
        </div>
        <div>
          {/* Generated only when the merchant asks for it. */}
          {FetchAIInsightIsSuccess && !hasInsights ? (
            <Empty className="gap-3 p-5">
              <EmptyHeader className="gap-1">
                <EmptyMedia variant="icon" className="mb-1 size-8">
                  <IconSparkles className="size-4" />
                </EmptyMedia>
                <EmptyTitle className="text-base">
                  No AI Insights Yet
                </EmptyTitle>
                <EmptyDescription className="text-sm">
                  Generate a summary, score and suggestions for this
                  conversation.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  // Same look as "Draft With AI" (create-ticket-dialog).
                  variant="outline"
                  size="sm"
                  className="h-auto gap-2 px-4 py-1"
                  disabled={GenerateAIInsightIsLoading}
                  onClick={handleGenerateInsights}
                >
                  {GenerateAIInsightIsLoading ? (
                    <IconLoader2 className="size-4 animate-spin" />
                  ) : (
                    <IconSparkles className="size-4" />
                  )}
                  {GenerateAIInsightIsLoading ? (
                    "Generating Insights…"
                  ) : (
                    <CreditLabel className="self-center text-xs">
                      Generate AI Insights
                    </CreditLabel>
                  )}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="border-b px-5 py-5">
              <p className="text-sm leading-6 text-muted-foreground">
                {FetchConversationSummaryData?.conversation_summary ||
                  "No summary available for this conversation."}
              </p>
            </div>
          )}
          {successes.length > 0 && (
            <div className="border-b px-5 py-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-emerald-700">
                Went Well
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
                To Improve
              </h3>
              <div className="space-y-3.5">
                {improvements.map((item, index) => (
                  <div
                    className="flex w-full items-start gap-3 text-left text-sm leading-5 text-muted-foreground"
                    key={index}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </div>
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
              <span>Suggested Actions</span>
              <span className="text-sm font-normal text-muted-foreground">
                {actions.length} Actions
              </span>
            </div>
          }
        >
          <div>
            {actions.map((action, index) => (
              <div
                key={index}
                className="border-b p-5 text-sm font-semibold last:border-b-0"
              >
                {action}
              </div>
            ))}
          </div>
        </ThreadCard>
      )}
    </div>
  );
  const customer = (
    <div className="space-y-4">
      {!isGuest && (
        <ThreadCard title="Customer">
          <div className="space-y-4 p-5">
            <div>
              {details?.customer?.id ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/crm/customers/${details.customer.id}`}
                      className="inline-flex items-center gap-1 font-semibold hover:underline hover:underline-offset-2"
                    >
                      {customerName}
                      <IconArrowUpRight className="size-3.5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Open Full Profile</TooltipContent>
                </Tooltip>
              ) : (
                <p className="font-semibold">{customerName}</p>
              )}
              <CustomerContact
                email={customerEmail}
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
                <p className="text-xs text-muted-foreground">Past Chats</p>
                <p className="font-semibold">
                  {details?.customer?.past_threads_count ?? 0}
                </p>
              </div>
            </div>
          </div>
        </ThreadCard>
      )}
      <ThreadCard
        title={
          <div className="flex justify-between">
            <span>Cart</span>
            <span className="text-sm font-normal text-muted-foreground">
              {cartItems.length} {cartItems.length === 1 ? "Item" : "Items"}
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
      <ThreadCard title="Thread Details">
        {/* Values line up on the left of their column, like Help Desk. */}
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 px-5 py-4 text-sm">
          <dt className="text-muted-foreground">Thread ID</dt>
          <dd className="truncate font-mono">{threadId}</dd>
          <dt className="text-muted-foreground">Channel</dt>
          <dd>Web Chat</dd>
          <dt className="text-muted-foreground">Started</dt>
          <dd>{started}</dd>
          <dt className="text-muted-foreground">Ended</dt>
          <dd>{ended}</dd>
          <dt className="text-muted-foreground">Duration</dt>
          <dd>
            {getDuration(
              details?.created_at ?? null,
              details?.ended_at ?? null,
            ) || "—"}
          </dd>
          <dt className="text-muted-foreground">Handled By</dt>
          <dd>{handledBy}</dd>
          {closeReason ? (
            <>
              <dt className="text-muted-foreground">Close Reason</dt>
              <dd>{closeReason}</dd>
            </>
          ) : null}
          {feedback ? (
            <>
              <dt className="text-muted-foreground">User Feedback</dt>
              <dd className="flex items-center gap-1.5">
                <span aria-label={feedback.rating}>
                  {FEEDBACK_RATINGS.find(
                    (rating) => rating.value === feedback.rating,
                  )?.label ?? feedback.rating}
                </span>
                {feedbackComment ? <InfoIcon text={feedbackComment} /> : null}
              </dd>
            </>
          ) : null}
        </dl>
      </ThreadCard>
    </div>
  );

  return (
    <div className="min-h-svh bg-muted/50">
      <header className="border-b bg-background">
        <div className="flex h-16 items-center border-b px-6 lg:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Back to Threads"
            onClick={() => router.back()}
          >
            <IconArrowLeft />
          </Button>
          <h1 className="ml-3 text-xl font-bold">Thread</h1>
        </div>
        <div className="flex w-full items-start gap-3 px-5 py-7 lg:px-6 lg:py-4">
          <div className="min-w-0 flex-1">
            <nav
              aria-label="Breadcrumb"
              className="mb-3 hidden min-w-0 items-center gap-2 text-sm lg:flex"
            >
              <Link
                href="/threads"
                onClick={returnToThreads}
                className="flex shrink-0 items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <IconChevronLeft className="size-4" />
                Threads
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="truncate font-medium">{threadTitle}</span>
            </nav>
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="flex size-[70px] shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-semibold text-primary-foreground lg:size-14 lg:rounded-xl lg:text-lg"
              >
                {getInitials(customerName) ?? "?"}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold">{customerName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(threadTags as ThreadTagData[]).map((tag) => (
                    <TagBadge key={tag.name} tag={tag} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* mt-8 lines the action up with the avatar row, under the breadcrumb. */}
          <div className="mt-8 hidden shrink-0 gap-2 lg:flex">
            {/* <Button variant="outline">Export</Button> */}
            {/* <Button variant="outline">Flag for review</Button> */}
            {existingThreadTicket ? (
              <Button asChild>
                <Link href={`/helpdesk?ticket=${existingThreadTicket.id}`}>
                  Open Ticket #{existingThreadTicket.ticket_id}
                </Link>
              </Button>
            ) : (
              <Button
                disabled={!storeCode || !canCreateTicket}
                onClick={() => setIsCreateTicketOpen(true)}
              >
                Create Ticket
              </Button>
            )}
          </div>
        </div>
        <div className="mx-6 mb-3 grid grid-cols-2 overflow-hidden rounded-xl border lg:hidden">
          <div className="flex flex-col items-start gap-1 border-r px-2 py-2 leading-tight">
            <small className="text-muted-foreground">Resolution</small>
            <span className="self-center">
              <ResolutionRing value={resolutionRate} compact />
            </span>
          </div>
          <div className="flex flex-col items-start gap-1 px-2 py-2 leading-tight">
            <small className="text-muted-foreground">Duration</small>
            <b className="flex min-h-8 items-center whitespace-nowrap text-sm">
              {getDuration(
                details?.created_at ?? null,
                details?.ended_at ?? null,
              ) || "—"}
            </b>
          </div>
        </div>
      </header>
      <main className="w-full px-4 py-5 pb-24 lg:px-6 lg:py-6">
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
              AI Review{" "}
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
        {existingThreadTicket ? (
          <Button className="flex-1" asChild>
            <Link href={`/helpdesk?ticket=${existingThreadTicket.id}`}>
              Open Ticket #{existingThreadTicket.ticket_id}
            </Link>
          </Button>
        ) : (
          <Button
            className="flex-1"
            disabled={!storeCode || !canCreateTicket}
            onClick={() => setIsCreateTicketOpen(true)}
          >
            Create Ticket
          </Button>
        )}
      </div>
      {storeCode && canCreateTicket ? (
        <CreateTicketDialog
          open={isCreateTicketOpen}
          onOpenChange={setIsCreateTicketOpen}
          storeCode={storeCode}
          // The shopper is already known from this conversation, so the agent
          // does not have to search for them again.
          initialCustomer={
            details?.customer?.id && details.customer_email
              ? ({
                  kind: "record",
                  id: details.customer.id,
                  name: customerName,
                  email: details.customer_email,
                } satisfies TicketCustomer)
              : details?.customer_email
                ? ({
                    kind: "email",
                    email: details.customer_email,
                  } satisfies TicketCustomer)
                : null
          }
          onDraft={async () => {
            const result = await dispatch(
              FetchThreadTicketDraft({ storeCode, threadId }),
            );
            return FetchThreadTicketDraft.fulfilled.match(result)
              ? result.payload
              : null;
          }}
          // Addressed by this thread, so the ticket keeps a link back to the
          // conversation that produced it.
          onSubmit={async (payload) => {
            const result = await dispatch(
              CreateSupportTicket({ storeCode, threadId, payload }),
            );
            if (!CreateSupportTicket.fulfilled.match(result)) {
              return { ok: false, payload: result.payload };
            }
            await dispatch(
              FetchFreshdeskTicketId({
                threadId,
                customerId: details?.customer?.id,
                storeCode,
              }),
            );
            return { ok: true };
          }}
        />
      ) : null}
      {storeCode ? (
        <LinkCustomerDialog
          open={isLinkCustomerOpen}
          onOpenChange={setIsLinkCustomerOpen}
          storeCode={storeCode}
          linking={isLinkingCustomer}
          onLink={(linkedCustomer) =>
            handleLinkCustomer(linkedCustomer.customer_id)
          }
        />
      ) : null}
    </div>
  );
}
