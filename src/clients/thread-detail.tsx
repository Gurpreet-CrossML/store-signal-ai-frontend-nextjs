"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBrain,
  IconCalendarTime,
  IconCheck,
  IconClockHour4,
  IconHash,
  IconListCheck,
  IconMessage2,
  IconMessages,
  IconSparkles,
  IconTargetArrow,
  IconThumbUp,
  IconX,
  type Icon,
} from "@tabler/icons-react";

import MessagePan from "@/components/custom/message-pan";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { CustomerDetailsPanel } from "@/components/custom/customer-details-panel";
import {
  CrmLinkButton,
  SessionFacts,
} from "@/components/custom/customer-header";
import { TagsCell } from "@/components/custom/threads-columns";
import { InfoIcon } from "@/components/custom/info-icon";
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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
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
                  {rate}%
                </Typography>
                <Progress value={rate} />
              </>
            )}
          </div>
        </div>

        {insightsLoading ? (
          <LoadingState className="py-6" />
        ) : (
          <>
            {reasonForScore && (
              <Typography variant="muted" className="leading-relaxed">
                {reasonForScore}
              </Typography>
            )}

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
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ThreadDetail({ threadId }: { threadId: string }) {
  const dispatch = useAppDispatch();
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
          FetchTags?: { tags?: string[] };
        }
      ).FetchTags?.tags ?? [],
  );
  const tagsLoading = useAppSelector(
    (state) => state.GetThreadReducer.FetchTagsState.FetchTagsIsLoading,
  );

  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [isLinkCustomerOpen, setIsLinkCustomerOpen] = useState(false);
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
  const customerName = details?.customer_name || "Guest";
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

  return (
    // The same shell as Live Support and Help Desk: the thread on one
    // side, who it is with on the other. It used to be one long column, so
    // reading a conversation meant scrolling past the customer and then
    // back down for their cart and tickets.
    <div className="flex h-svh min-h-0 flex-col overflow-hidden border-y">
      {/* Who the agent is talking to comes first — the same header Live
          Support and Help Desk lead with, so a customer reads identically
          whichever screen you reach them from. The thread's own subject
          titles the Conversation card below, where it names the thing it
          is the subject of. */}
      <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          asChild
          aria-label="Back to Threads"
        >
          <Link href="/threads">
            <IconArrowLeft />
          </Link>
        </Button>

        <div className="flex min-w-0 items-center gap-2.5">
          <CustomerAvatar name={customerName} online={details?.is_active} />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              {detailsLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <CardTitle className="truncate leading-tight">
                  {customerName}
                </CardTitle>
              )}
              <CrmLinkButton
                customerId={details?.customer?.id}
                onLinkCustomer={
                  details?.customer?.id
                    ? undefined
                    : () => setIsLinkCustomerOpen(true)
                }
              />
            </div>
            {/* Nothing rather than "no email on file" for a guest — the
                avatar and the link action already say which this is. */}
            {details?.customer_email ? (
              <Typography variant="muted" className="truncate">
                {details.customer_email}
              </Typography>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {details && (
            <>
              <Badge variant={details.is_active ? "default" : "secondary"}>
                {details.is_active ? "Active" : "Closed"}
              </Badge>
              <Badge
                className={cn(
                  "font-normal",
                  isResolved
                    ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                    : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
                )}
              >
                {isResolved ? (
                  <IconCheck data-icon="inline-start" />
                ) : (
                  <IconX data-icon="inline-start" />
                )}
                {isResolved ? "Resolved" : "Unresolved"}
              </Badge>
              {!FetchFeedbackSequenceIsLoading && feedbackLabel && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="font-normal">
                      {feedbackLabel}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {feedback?.feedback_message ||
                        "No feedback message provided."}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              {!tagsLoading && !detailsLoading && threadTags.length > 0 && (
                <TagsCell tags={threadTags} />
              )}
            </>
          )}
        </div>

        <SessionFacts
          userMetadata={
            FetchUserMetadataIsLoading || detailsLoading
              ? null
              : FetchUserMetadataData
          }
        />
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* When and how long, on one muted line. The device and location
              half of this strip now sits in the header beside the name, so
              what is left is the session's own timing. */}
          <div className="flex shrink-0 items-center gap-4 overflow-x-auto border-b px-4 py-2">
            <MetaCell
              icon={<IconHash className="size-3.5" />}
              label="Session ID"
              value={threadId}
              mono
            />
            <MetaCell
              icon={<IconCalendarTime className="size-3.5" />}
              label="Started"
              value={formatDateTime(details?.created_at || null) || "—"}
              loading={detailsLoading}
            />
            <MetaCell
              icon={<IconCalendarTime className="size-3.5" />}
              label="Ended"
              value={
                details?.ended_at
                  ? formatDateTime(details.ended_at)
                  : details?.is_active
                    ? "Ongoing"
                    : "—"
              }
              loading={detailsLoading}
            />
            <MetaCell
              icon={<IconClockHour4 className="size-3.5" />}
              label="Duration"
              value={
                getDuration(
                  details?.created_at ?? null,
                  details?.ended_at ?? null,
                ) || "—"
              }
              loading={detailsLoading}
            />
          </div>

          {/* One column, insights above the transcript. The two used to sit
              side by side in boxes, which split the reading width in half
              and asked an agent to choose where to look first. */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AIInsightsSection
              summary={FetchConversationSummaryData?.conversation_summary || ""}
              summaryLoading={
                detailsLoading || FetchConversationSummaryIsLoading
              }
              nextActionableItems={
                FetchAIInsightData?.next_actionable_items || []
              }
              resolutionSuccessRate={
                FetchAIInsightData?.resolution_success_rate || "0"
              }
              reasonForScore={FetchAIInsightData?.reason_for_score || ""}
              overperformingCases={
                FetchAIInsightData?.overperforming_cases || []
              }
              underperformingCases={
                FetchAIInsightData?.underperforming_cases || []
              }
              insightsLoading={detailsLoading || FetchAIInsightIsLoading}
            />

            <section>
              <SectionHeader
                icon={IconMessages}
                // The thread's subject names the exchange it is the
                // subject of; full text on hover when it truncates.
                title={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>{details?.name || "Conversation"}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {details?.name || "Conversation"}
                    </TooltipContent>
                  </Tooltip>
                }
                info="The full exchange between the customer and the AI assistant for this session."
                action={
                  detailsLoading ? null : (
                    <Badge variant="secondary" className="font-normal">
                      {details?.total_messages ?? threadMessages.length}{" "}
                      Messages
                    </Badge>
                  )
                }
              />

              {detailsLoading ? (
                <LoadingState label="Loading conversation…" />
              ) : threadMessages.length > 0 ? (
                <div className="p-2">
                  <MessagePan messages={threadMessages} />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <IconMessage2 className="size-8 text-muted-foreground/50" />
                  <Typography variant="small" as="p">
                    No messages in this conversation
                  </Typography>
                  <Typography variant="muted">
                    The session was opened but the customer never sent a
                    message.
                  </Typography>
                </div>
              )}
            </section>
          </div>
        </div>

        <CustomerDetailsPanel
          // The detail response carries the customer's id and their name
          // and email as separate fields; the panel wants them together.
          customerData={{
            id: details?.customer?.id ?? null,
            name: customerName,
            email: details?.customer_email ?? "",
          }}
          orders={FetchOrderData}
          ordersLoading={detailsLoading || FetchOrderDataIsLoading}
          onOrdersSync={() => dispatch(FetchOrders(threadId))}
          tickets={{
            data: FetchFreshdeskTicketIdData ?? [],
            loading: detailsLoading || FetchFreshdeskTicketIdIsLoading,
          }}
          cart={{
            data: FetchCartData,
            loading: detailsLoading || FetchCartDataIsLoading,
          }}
        />
      </div>

      {storeCode ? (
        <LinkCustomerDialog
          open={isLinkCustomerOpen}
          onOpenChange={setIsLinkCustomerOpen}
          storeCode={storeCode}
          linking={isLinkingCustomer}
          onLink={(customer) => handleLinkCustomer(customer.id)}
        />
      ) : null}
    </div>
  );
}
