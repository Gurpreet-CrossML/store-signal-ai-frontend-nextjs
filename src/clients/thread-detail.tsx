"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconBrain,
  IconCalendarTime,
  IconCheck,
  IconClockHour4,
  IconHash,
  IconMessage2,
  IconMessages,
  IconShoppingBag,
  IconTicket,
  IconUser,
  IconX,
} from "@tabler/icons-react";

import MessagePan from "@/components/custom/message-pan";
import { TagsCell } from "@/components/custom/threads-columns";
import { InfoIcon } from "@/components/custom/info-icon";
import { LoadingState } from "@/components/custom/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  FetchTags,
  FetchThreadDetails,
  FetchUserMetadata,
  type CartData,
  type CartDataResponse,
  type ThreadMessage,
  type ThreadTicketData,
  type UserMetadata,
} from "@/redux/api-slice/thread-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

/** Bare heading for a full-width group band. */
function SectionHeading({
  icon,
  title,
  info,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  info: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Typography variant="h6" as="h3" className="flex items-center gap-2">
        {icon}
        {title}
        <InfoIcon text={info} />
      </Typography>
      {action}
    </div>
  );
}

/** One cell of the thread strip: muted label over a small value. */
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
  loading: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <Typography
        variant="muted"
        as="span"
        className="flex items-center gap-1.5 text-xs"
      >
        {icon}
        {label}
      </Typography>
      {loading ? (
        <Skeleton className="h-5 w-24" />
      ) : (
        <Typography
          variant="small"
          as="span"
          className={cn(
            mono ? "truncate font-mono text-xs" : "whitespace-nowrap",
          )}
        >
          {value}
        </Typography>
      )}
    </div>
  );
}

/** Label → value row used inside the profile card. */
function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <Typography variant="muted" as="span" className="shrink-0 text-xs">
        {label}
      </Typography>
      <Typography
        variant="small"
        as="span"
        className={cn(
          "min-w-0 wrap-break-word text-right font-normal",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </Typography>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Customer group                                                      */
/* ------------------------------------------------------------------ */

/** Who the customer is and the environment they chatted from. */
function ProfileCard({
  name,
  email,
  metadata,
  loading,
}: {
  name: string;
  email: string | null;
  metadata: UserMetadata | null;
  loading: boolean;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconUser className="size-4" />
          Profile
          <InfoIcon text="The customer's identity and the environment this session came from — useful for spotting location or device-specific issues." />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {loading ? (
          <LoadingState className="py-6" />
        ) : (
          <>
            <div className="flex flex-col gap-0.5">
              <Typography variant="small" as="span" className="text-base">
                {name}
              </Typography>
              {email && (
                <Typography variant="muted" as="span" className="text-xs">
                  {email}
                </Typography>
              )}
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <DetailRow
                label="Location"
                value={metadata?.geo_location || "Unknown"}
              />
              <DetailRow
                label="IP Address"
                value={metadata?.ip_address || "Unknown"}
                mono
              />
              <DetailRow
                label="Device"
                value={metadata?.device_type || "Unknown"}
              />
              <DetailRow
                label="Browser"
                value={metadata?.browser || "Unknown"}
              />
              <DetailRow label="OS" value={metadata?.os || "Unknown"} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** Items the customer had in their cart during this session. */
function CartCard({
  cartData,
  loading,
}: {
  cartData: CartDataResponse | null;
  loading: boolean;
}) {
  const items = cartData?.updated_cart_data?.items ?? [];

  // Prices arrive as display strings (e.g. "$6,419.00"). Total is only shown
  // when every line parses cleanly.
  const currencyPrefix = (String(items[0]?.price ?? "").match(/^[^0-9-]+/) ?? [
    "",
  ])[0].trim();
  const total = items.reduce((sum, item) => {
    const unit = Number(String(item.price ?? "").replace(/[^0-9.-]/g, ""));
    const qty = Number(item.qty) || 1;
    return sum + (Number.isFinite(unit) ? unit * qty : NaN);
  }, 0);
  const totalLabel = Number.isFinite(total)
    ? `${currencyPrefix}${total.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : null;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconShoppingBag className="size-4" />
          Cart
          <InfoIcon text="What the customer had in their cart during this session, as last seen by the assistant." />
        </CardTitle>
        {items.length > 0 && (
          <CardAction>
            <Badge variant="secondary">
              {items.length} {items.length === 1 ? "item" : "items"}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
        {loading ? (
          <LoadingState className="py-6" />
        ) : items.length === 0 ? (
          <Typography variant="muted">
            No cart activity was captured for this session.
          </Typography>
        ) : (
          <>
            <div className="flex max-h-72 flex-col overflow-y-auto pr-1">
              {items.map((item: CartData, index: number) => (
                <div key={index}>
                  {index > 0 && <Separator className="my-3" />}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted">
                        {item.product_image ? (
                          // Product images come from arbitrary store CDNs, so
                          // next/image's domain allowlist can't cover them.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.product_image}
                            alt={item.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <IconShoppingBag className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <Typography
                          variant="small"
                          as="span"
                          className="truncate"
                        >
                          {item.name}
                        </Typography>
                        <Typography
                          variant="muted"
                          as="span"
                          className="text-xs"
                        >
                          Qty: {item.qty}
                        </Typography>
                      </div>
                    </div>
                    <Typography
                      variant="small"
                      as="span"
                      className="shrink-0 font-normal tabular-nums"
                    >
                      {item.price || "—"}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
            {totalLabel && (
              <div className="mt-auto flex flex-col gap-3">
                <Separator />
                <div className="flex items-center justify-between">
                  <Typography variant="small" as="span">
                    Cart Total
                  </Typography>
                  <Typography
                    variant="small"
                    as="span"
                    className="tabular-nums"
                  >
                    {totalLabel}
                  </Typography>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** Support tickets raised from this session, as a scannable table. */
function TicketsBlock({
  tickets,
  loading,
}: {
  tickets: ThreadTicketData[];
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Typography
          variant="small"
          as="h4"
          className="flex items-center gap-1.5"
        >
          <IconTicket className="size-4" />
          Support Tickets
          <InfoIcon text="Tickets raised from this conversation — created when the AI escalated or the customer asked for human help." />
        </Typography>
        <Badge variant="secondary">{tickets.length}</Badge>
      </div>
      {loading ? (
        <LoadingState className="py-6" />
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
          No tickets were raised from this conversation.
        </div>
      ) : (
        <div className="max-h-80 overflow-x-auto overflow-y-auto rounded-xl border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket, index) => (
                <TableRow key={ticket.ticket_id ?? index}>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      TCK-{ticket.ticket_id}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-56">
                    <Typography
                      variant="small"
                      as="span"
                      className="block truncate"
                      title={ticket.subject}
                    >
                      {ticket.subject}
                    </Typography>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <Typography
                      variant="muted"
                      as="span"
                      className="block truncate text-xs"
                      title={ticket.description ?? undefined}
                    >
                      {ticket.description || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="muted"
                      as="span"
                      className="whitespace-nowrap text-xs"
                    >
                      {formatDateTime(ticket.created_at) || "—"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AI Analysis group                                                   */
/* ------------------------------------------------------------------ */

/** Colored-dot list item for insight cases. */
function InsightItem({
  tone,
  children,
}: {
  tone: "positive" | "negative";
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2 text-sm text-muted-foreground">
      <span
        className={cn(
          "mt-1.5 size-1.5 shrink-0 rounded-full",
          tone === "positive" ? "bg-emerald-500" : "bg-red-500",
        )}
      />
      {children}
    </li>
  );
}

/** The AI's recap and self-review of the conversation, as one card. */
function AIAnalysisCard({
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
    <Card size="sm" className="h-[65vh] min-h-96">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconBrain className="size-4" />
          AI Analysis
          <InfoIcon text="The AI's read on this conversation — a recap of what happened, how well it resolved the request, and where it struggled." />
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Typography variant="small" as="h4">
              Summary
            </Typography>
            {summaryLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <Typography variant="muted" className="leading-relaxed">
                {summary || "No summary available for this conversation."}
              </Typography>
            )}
          </div>

          {insightsLoading ? (
            <LoadingState className="py-6" />
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Typography variant="small" as="h4">
                    Resolution Score
                  </Typography>
                  <Typography
                    variant="small"
                    as="span"
                    className="tabular-nums"
                  >
                    {rate}%
                  </Typography>
                </div>
                <Progress value={rate} />
                {reasonForScore && (
                  <Typography variant="muted" className="text-xs">
                    {reasonForScore}
                  </Typography>
                )}
              </div>

              {nextActionableItems.length > 0 && (
                <div className="flex flex-col gap-2 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/40">
                  <Typography
                    variant="small"
                    as="h4"
                    className="text-xs text-amber-800 dark:text-amber-300"
                  >
                    Suggested follow-ups
                  </Typography>
                  <ul className="flex flex-col gap-1.5">
                    {nextActionableItems.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200"
                      >
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {overperformingCases.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <Typography variant="small" as="h4" className="text-xs">
                    What went well
                  </Typography>
                  <ul className="flex flex-col gap-1.5">
                    {overperformingCases.map((item, index) => (
                      <InsightItem key={index} tone="positive">
                        {item}
                      </InsightItem>
                    ))}
                  </ul>
                </div>
              )}

              {underperformingCases.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <Typography variant="small" as="h4" className="text-xs">
                    What to improve
                  </Typography>
                  <ul className="flex flex-col gap-1.5">
                    {underperformingCases.map((item, index) => (
                      <InsightItem key={index} tone="negative">
                        {item}
                      </InsightItem>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
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

  const { FetchThreadDetailsData, FetchThreadDetailsIsLoading } =
    useAppSelector((state) => state.GetThreadReducer.FetchThreadDetailsState);
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
  const { FetchFreshdeskTicketIdData } = useAppSelector(
    (state) => state.GetThreadReducer.FetchFreshdeskTicketIdState,
  );
  const threadTags = useAppSelector(
    (state) =>
      (
        state.GetThreadReducer.FetchTagsState as {
          FetchTags?: { tags?: string[] };
        }
      ).FetchTags?.tags ?? [],
  );

  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);

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
      dispatch(FetchFreshdeskTicketId(threadId));
      dispatch(FetchTags(threadId));
    };

    loadData();
  }, [dispatch, storeCode, threadId]);

  const details = FetchThreadDetailsData;
  const detailsLoading = FetchThreadDetailsIsLoading;
  const isResolved = details?.verdict?.verdict === "resolved";
  const customerName = details?.customer_name || "Guest";
  const feedback = FetchFeedbackSequenceData?.feedback;
  const feedbackLabel = feedback
    ? (FEEDBACK_RATINGS.find((rating) => rating.value === feedback.rating)
        ?.label ?? null)
    : null;

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* ── Group 1: Thread — status, tags, and session facts ─────────── */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          asChild
          aria-label="Back to threads"
        >
          <Link href="/threads">
            <IconArrowLeft />
          </Link>
        </Button>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Typography variant="h4" as="h2">
            {detailsLoading ? (
              <Skeleton className="h-7 w-48" />
            ) : (
              (details?.name ?? customerName)
            )}
          </Typography>
          {!detailsLoading && details && (
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
              {threadTags.length > 0 && <TagsCell tags={threadTags} />}
            </>
          )}
        </div>
      </div>

      <Card size="sm">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <MetaCell
            icon={<IconHash className="size-3.5" />}
            label="Session ID"
            value={<span title={threadId}>{threadId}</span>}
            mono
            loading={false}
          />
          <Separator
            orientation="vertical"
            className="hidden h-auto self-stretch sm:block"
          />
          <MetaCell
            icon={<IconCalendarTime className="size-3.5" />}
            label="Started"
            value={formatDateTime(details?.created_at || null) || "—"}
            loading={detailsLoading}
          />
          <Separator
            orientation="vertical"
            className="hidden h-auto self-stretch sm:block"
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
          <Separator
            orientation="vertical"
            className="hidden h-auto self-stretch sm:block"
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
          <Separator
            orientation="vertical"
            className="hidden h-auto self-stretch sm:block"
          />
          <MetaCell
            icon={<IconMessages className="size-3.5" />}
            label="Messages"
            value={details?.total_messages ?? threadMessages.length}
            loading={detailsLoading}
          />
        </CardContent>
      </Card>

      {/* ── Group 2 & 3: Conversation | AI Analysis — equal fixed height ─ */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card size="sm" className="h-[65vh] min-h-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconMessages className="size-4" />
              Conversation
              <InfoIcon text="The full exchange between the customer and the AI assistant for this session." />
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 p-0">
            {detailsLoading ? (
              <LoadingState label="Loading Conversation…" />
            ) : threadMessages.length > 0 ? (
              <div className="h-full overflow-y-auto">
                <MessagePan messages={threadMessages} />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <IconMessage2 className="size-8 text-muted-foreground/50" />
                <Typography variant="small" as="p">
                  No messages in this conversation
                </Typography>
                <Typography variant="muted" className="max-w-xs text-xs">
                  The session was opened but the customer never sent a message.
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>

        <AIAnalysisCard
          summary={FetchConversationSummaryData?.conversation_summary || ""}
          summaryLoading={FetchConversationSummaryIsLoading}
          nextActionableItems={FetchAIInsightData?.next_actionable_items || []}
          resolutionSuccessRate={
            FetchAIInsightData?.resolution_success_rate || "0"
          }
          reasonForScore={FetchAIInsightData?.reason_for_score || ""}
          overperformingCases={FetchAIInsightData?.overperforming_cases || []}
          underperformingCases={FetchAIInsightData?.underperforming_cases || []}
          insightsLoading={FetchAIInsightIsLoading}
        />
      </div>

      {/* ── Group 4: Customer — profile, cart, and tickets ────────────── */}
      <section className="flex flex-col gap-4">
        <SectionHeading
          icon={<IconUser className="size-4" />}
          title="Customer"
          info="Everything about the person behind this session — who they are, what was in their cart, and the support tickets they raised."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ProfileCard
            name={customerName}
            email={details?.customer_email ?? null}
            metadata={FetchUserMetadataData}
            loading={detailsLoading || FetchUserMetadataIsLoading}
          />
          <CartCard cartData={FetchCartData} loading={FetchCartDataIsLoading} />
        </div>
        <TicketsBlock
          tickets={FetchFreshdeskTicketIdData || []}
          loading={detailsLoading}
        />
      </section>
    </div>
  );
}
