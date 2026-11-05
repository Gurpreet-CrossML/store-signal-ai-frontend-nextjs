import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CartItem,
  ClarifyingQuestion,
  HandlerEvent,
  ThreadMessage,
} from "@/redux/api-slice/thread-slice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import { formatDateTime } from "@/lib/helpers";
import { CreditLabel } from "@/components/custom/credit-label";
import { MessageAppear } from "@/components/custom/message-appear";
import OrderBillCard from "@/components/custom/order-bill-card";
import TicketCard from "@/components/custom/ticket-card";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  IconCheck,
  IconLock,
  IconShoppingBag,
  IconSparkles,
  IconThumbDown,
  IconThumbUp,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import HoverZoomImage from "@/components/custom/hover-zoom-image";
import { ProductCarousel } from "@/components/custom/product-carousel";
import { getInitials } from "@/components/custom/customer-avatar";
import { Spinner } from "../ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

/** "You" when `email` is the signed-in user, otherwise their name. */
function whoIs(
  name: string | null,
  email: string | null | undefined,
  me: string | null | undefined,
  fallback: string,
  { start = false } = {},
): string {
  if (email && me && email.toLowerCase() === me.toLowerCase()) {
    return start ? "You" : "you";
  }
  return name ?? fallback;
}

/** One line for a handover, e.g. "Priya took over from AI at 1:32 pm · AI paused". */
function describeHandlerEvent(
  event: HandlerEvent,
  me: string | null | undefined,
): string {
  const from = event.from_agent_name;
  const to = event.to_agent_name;
  const fromName = (opts?: { start?: boolean }) =>
    whoIs(from, event.from_agent_email, me, "An agent", opts);
  const toName = (opts?: { start?: boolean }) =>
    whoIs(to, event.to_agent_email, me, "An agent", opts);
  const byName = (opts?: { start?: boolean }) =>
    whoIs(
      event.assigned_by_name,
      event.assigned_by_email,
      me,
      "A supervisor",
      opts,
    );
  const when = formatDateTime(event.created_at);
  switch (event.action) {
    case "takeover":
      return `${toName({ start: true })} took over from ${
        from ? fromName() : "AI"
      } at ${when}${from ? "" : " · AI paused"}`;
    case "reassign":
      return `${byName({ start: true })} assigned this chat to ${toName()}${
        from ? ` (from ${fromName()})` : ""
      } at ${when}`;
    case "release":
      return `${fromName({ start: true })} handed the chat back to AI at ${when}`;
    case "closed":
      return `${fromName({ start: true })} left · chat closed at ${when}`;
  }
  // Events added live before the server's summary arrives.
  if (to && from) {
    return `${fromName({ start: true })} left · ${toName()} joined at ${when}`;
  }
  if (to) return `${toName({ start: true })} joined at ${when}`;
  if (from) {
    return `${fromName({ start: true })} left · handed back to AI at ${when}`;
  }
  return `Chat handed back to AI at ${when}`;
}

function HandlerEventRow({
  event,
  me,
}: {
  event: HandlerEvent;
  me: string | null | undefined;
}) {
  return (
    <div className="flex justify-center py-1">
      <span className="max-w-full wrap-anywhere rounded-full border border-dashed border-border bg-background px-3 py-1 text-center text-xs text-muted-foreground">
        {describeHandlerEvent(event, me)}
      </span>
    </div>
  );
}

function HandlerEventGroupRow({
  events,
  me,
}: {
  events: HandlerEvent[];
  me: string | null | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const start = new Date(events[0].created_at);
  const end = new Date(events[events.length - 1].created_at);
  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div className="flex flex-col items-center gap-1 py-1">
      <span className="max-w-full wrap-anywhere rounded-full border border-dashed border-border bg-background px-3 py-1 text-center text-xs text-muted-foreground">
        ↔ {events.length} handoffs, {formatTime(start)}–{formatTime(end)}{" "}
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Hide" : "Show"}
        </button>
      </span>
      {expanded
        ? events.map((event) => (
            <HandlerEventRow
              key={`expanded-handler-event-${event.id}`}
              event={event}
              me={me}
            />
          ))
        : null}
    </div>
  );
}

export function MessagePan({
  messages,
  handlerEvents,
  customerName,
  closedAt,
  closedCartItemCount,
  onReplyWithAI,
  replyWithAILoadingId,
}: {
  messages: ThreadMessage[];
  handlerEvents?: HandlerEvent[];
  customerName?: string | null;
  /** The recorded close time, shown as the final system event when present. */
  closedAt?: string | null;
  closedCartItemCount?: number;
  onReplyWithAI?: (message_id: number | string) => void;
  replyWithAILoadingId?: string | number | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const me = session?.user?.email;
  const [showAllMessages, setShowAllMessages] = useState(false);
  const previewHeadCount = 5;
  const previewTailCount = 5;
  const canCollapseMessages =
    messages.length > previewHeadCount + previewTailCount + 1;
  const hiddenMessageCount = canCollapseMessages
    ? messages.length - previewHeadCount - previewTailCount
    : 0;

  // Slot each handover after the message it followed; events with no (or an
  // unknown) anchor go after the last message sent at or before their time.
  const eventsBefore: HandlerEvent[] = [];
  const eventsAfter = new Map<number, HandlerEvent[]>();
  for (const event of handlerEvents ?? []) {
    let at = event.after_message_id
      ? messages.findIndex(
          (m) => String(m.id) === String(event.after_message_id),
        )
      : -1;
    if (at === -1) {
      const time = new Date(event.created_at).getTime();
      for (let i = messages.length - 1; i >= 0; i--) {
        if (new Date(messages[i].created_at).getTime() <= time) {
          at = i;
          break;
        }
      }
    }
    if (at === -1) {
      eventsBefore.push(event);
    } else {
      eventsAfter.set(at, [...(eventsAfter.get(at) ?? []), event]);
    }
  }
  const eventRow = (event: HandlerEvent) => (
    <motion.div
      key={`handler-event-${event.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <HandlerEventRow event={event} me={me} />
    </motion.div>
  );
  const eventRows = (events: HandlerEvent[], keyPrefix: string) =>
    events.length > 1
      ? [
          <HandlerEventGroupRow
            key={`${keyPrefix}-handler-event-group`}
            events={events}
            me={me}
          />,
        ]
      : events.map(eventRow);

  useEffect(() => {
    const scrollToBottom = () => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    };

    // Scroll immediately
    scrollToBottom();

    // Also scroll after a brief delay to ensure DOM is fully updated
    const timer = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timer);
  }, [messages]);

  return (
    <div
      className="h-full space-y-3 overflow-y-auto p-2 md:px-4 md:py-3"
      ref={containerRef}
    >
      {/* Animates on mount as well as on append. The panel is only
          rendered once a thread has messages, so the very first message of
          a conversation arrives as a mount, not an append — suppressing
          mount meant the one message an agent most wants to see land was
          the only one that appeared without motion.

          Keyed by message id, so AnimatePresence can tell a new message
          from a re-render of an existing one. */}
      <AnimatePresence>
        {eventRows(eventsBefore, "before")}
        {messages?.flatMap((message: ThreadMessage, index: number) => {
          if (
            canCollapseMessages &&
            !showAllMessages &&
            index === previewHeadCount
          ) {
            return (
              <div
                key="show-hidden-messages"
                className="flex items-center gap-3 py-3"
              >
                <span className="h-px flex-1 bg-border" />
                <button
                  type="button"
                  onClick={() => setShowAllMessages(true)}
                  className="rounded-full border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Show {hiddenMessageCount} more messages
                </button>
                <span className="h-px flex-1 bg-border" />
              </div>
            );
          }
          if (
            canCollapseMessages &&
            !showAllMessages &&
            index > previewHeadCount &&
            index < messages.length - previewTailCount
          ) {
            return [];
          }
          const isLastMessage = index === messages.length - 1;
          // New responses carry message_type.  Treat a system row from an
          // older/cached history payload as an internal note too, so a reload
          // can never turn a staff-only note into a normal AI chat bubble.
          const isSystemMessage = message.role === "system";
          const isAiAction =
            message.message_type === "ai_action" ||
            (isSystemMessage &&
              (/^AI (looked up|performed)\b/.test(message.message) ||
                Boolean(message.json_content?.cart_action)));
          const isInternalNote =
            message.message_type === "internal" ||
            (isSystemMessage && !isAiAction);
          const isSystemEvent = isInternalNote || isAiAction;
          const isAgentMessage = Boolean(
            message.agent_name || message.messaged_by,
          );
          const senderLabel =
            message.role === "assistant" && !message.agent_name
              ? "AI Assistant"
              : message.messaged_by_email &&
                  me &&
                  message.messaged_by_email.toLowerCase() === me.toLowerCase()
                ? "You"
                : message.messaged_by || message.role;
          // Bot responses normally carry the display name "StoreSignal AI".
          // That is not a human assignment, and should still receive the
          // distinct AI avatar, confidence, and source treatment.
          const isStoreSignalAI =
            message.role === "assistant" && !message.agent_name;
          const showReplyWithAI =
            isLastMessage && message.role === "user" && !!onReplyWithAI;
          const isCustomer = message.role === "user";
          const isOutgoing = isCustomer;
          const feedbackRating = message.feedback_rating;
          const hasPositiveFeedback = ["good", "excellent"].includes(
            feedbackRating ?? "",
          );
          const feedbackLabel = feedbackRating
            ? feedbackRating.replaceAll("_", " ")
            : null;
          const feedbackMessage = message.feedback_message?.trim();
          const avatarLabel = isCustomer
            ? getInitials(customerName || message.messaged_by) || "C"
            : isStoreSignalAI
              ? "AI"
              : isAgentMessage
                ? getInitials(message.agent_name || message.messaged_by) || "A"
                : "AI";
          const cartDetails = message.json_content?.cart_details;
          const hasCartDetails = Boolean(
            message.role === "assistant" && cartDetails?.items?.length,
          );
          // AI cart events are rendered as compact timeline rows instead of
          // ordinary system pills. Keep the action detection local to the
          // current message so the transcript order and payload stay intact.
          const actionText =
            `${message.message} ${message.json_content?.cart_action ?? ""}`.toLowerCase();
          const isCartRemovalAction =
            isAiAction && /clear|remove|deleted?/.test(actionText);
          const isCartAdditionAction =
            isAiAction && /add(?:ed)?\b/.test(actionText);
          if (isSystemEvent) {
            return [
              <MessageAppear
                key={message.id ?? index}
                outgoing={false}
                index={index}
                total={messages.length}
                className="py-1"
              >
                <div
                  className={
                    isInternalNote
                      ? "flex justify-center"
                      : "flex justify-start"
                  }
                >
                  <div
                    className={
                      isInternalNote
                        ? "flex max-w-[82%] items-start gap-2 rounded-lg border border-dashed border-amber-300/80 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-700/70 dark:bg-amber-950/30 dark:text-amber-100"
                        : "flex items-center gap-2 text-sm font-semibold text-muted-foreground"
                    }
                  >
                    {isInternalNote ? (
                      <IconLock className="mt-0.5 size-3.5 shrink-0" />
                    ) : isCartRemovalAction || isCartAdditionAction ? (
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                          isCartRemovalAction
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {isCartRemovalAction ? "−" : "+"}
                      </span>
                    ) : (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <IconSparkles className="size-3.5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      {isInternalNote ? (
                        <>
                          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                            <span className="wrap-anywhere font-medium">
                              Internal note ·{" "}
                              {message.agent_name ||
                                message.messaged_by ||
                                "Agent"}
                            </span>
                            <span className="shrink-0 opacity-60">
                              {formatDateTime(message.created_at)}
                            </span>
                          </div>
                          <p className="mt-0.5 whitespace-pre-wrap wrap-break-word">
                            {message.message}
                          </p>
                        </>
                      ) : (
                        <span>{message.message}</span>
                      )}
                    </div>
                  </div>
                </div>
              </MessageAppear>,
              ...eventRows(eventsAfter.get(index) ?? [], `after-${index}`),
            ];
          }

          return [
            <MessageAppear
              key={message.id ?? index}
              outgoing={isOutgoing}
              index={index}
              total={messages.length}
              className="space-y-2 pb-2 md:pb-1"
            >
              <div className="flex justify-start">
                <div
                  className={`flex min-w-0 flex-row gap-2.5 md:max-w-none md:w-full ${
                    message.json_content?.products?.length ||
                    message.json_content?.related_products?.length ||
                    hasCartDetails
                      ? "w-full max-w-full"
                      : "max-w-[82%]"
                  }`}
                >
                  <Avatar className="mt-1 h-7 w-7 shrink-0 md:h-6 md:w-6">
                    <AvatarFallback
                      className={
                        isCustomer
                          ? "bg-primary text-xs text-primary-foreground"
                          : "bg-foreground text-xs text-background"
                      }
                    >
                      {avatarLabel}
                    </AvatarFallback>
                  </Avatar>
                  {/* min-w-0: a flex child will not shrink below its content
                      (a product carousel, a long URL) unless told it may,
                      which pushed the whole pane into sideways scrolling. */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="mb-1 flex flex-wrap items-center gap-x-2 justify-start">
                      <span className="text-xs font-medium text-foreground capitalize">
                        {senderLabel}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(message.created_at)}
                      </span>
                      {!isCustomer &&
                      isStoreSignalAI &&
                      message.confidence != null ? (
                        <span className="text-xs text-primary">
                          {Math.round(message.confidence * 100)}%
                        </span>
                      ) : null}
                    </div>
                    {!message.message.trim() ? (
                      <></>
                    ) : (
                      <div
                        id="markdown-message-bubble"
                        style={{ borderRadius: "0.7rem" }}
                        className={`min-w-0 max-w-full wrap-anywhere p-3 text-sm ${isCustomer ? "rounded-tr-none bg-primary text-primary-foreground md:rounded-none md:bg-transparent md:p-0 md:text-foreground" : "rounded-tl-none border border-border bg-secondary md:rounded-none md:border-0 md:bg-transparent md:p-0"}`}
                      >
                        {message.role === "assistant" ? (
                          (() => {
                            if (
                              message?.json_content?.order_details &&
                              message.json_content.order_details?.items
                                ?.length > 0
                            ) {
                              return (
                                <>
                                  <ReactMarkdown>
                                    {message.message}
                                  </ReactMarkdown>
                                  <div className="mt-3">
                                    <OrderBillCard
                                      order={message.json_content.order_details}
                                    />
                                  </div>
                                </>
                              );
                            }

                            // Strategy 2: plain markdown fallback
                            return (
                              <ReactMarkdown>{message.message}</ReactMarkdown>
                            );
                          })()
                        ) : (
                          <span className="whitespace-pre-wrap">
                            {message.message}
                          </span>
                        )}
                      </div>
                    )}

                    {message.role === "assistant" &&
                    isStoreSignalAI &&
                    message.source_used ? (
                      <div className="mt-1 text-xs font-medium text-primary">
                        <span>Source: {message.source_used}</span>
                      </div>
                    ) : null}

                    {/* "Reply with AI" — only for user messages, only when a
                    handler is supplied by the parent. Shown on row hover
                    so it doesn't clutter the transcript by default. */}
                    {showReplyWithAI && (
                      <div className="mt-1 flex justify-end md:justify-start transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-primary"
                          onClick={() => onReplyWithAI(message.id)}
                          disabled={
                            replyWithAILoadingId !== null &&
                            replyWithAILoadingId !== undefined
                          }
                        >
                          {replyWithAILoadingId === message.id ? (
                            <>
                              <Spinner className="size-3" />
                              Generating…
                            </>
                          ) : (
                            <>
                              <IconSparkles className="h-3 w-3" />
                              <CreditLabel>Reply with AI</CreditLabel>
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {message.role === "assistant" &&
                      message?.json_content?.products &&
                      message.json_content.products.length > 0 && (
                        <ProductCarousel
                          products={message.json_content.products}
                          comparisonBlock={
                            message.json_content.comparison_block
                          }
                        />
                      )}

                    {message.role === "assistant" &&
                      message?.json_content?.related_products &&
                      message.json_content.related_products.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-xs font-semibold text-muted-foreground">
                            Related Products
                          </h4>
                          <ProductCarousel
                            products={message.json_content.related_products}
                          />
                        </div>
                      )}

                    {message.role === "assistant" &&
                      hasCartDetails &&
                      cartDetails && (
                        <Card className="mt-2 w-full px-0">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <IconShoppingBag className="size-4" />
                              Cart Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-3 md:max-h-none md:overflow-visible">
                            {cartDetails.items.map(
                              (item: CartItem, idx: number) => {
                                return (
                                  <div
                                    key={idx}
                                    className="flex min-w-0 items-start justify-between gap-2 text-sm"
                                  >
                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                      <Avatar>
                                        {item.image ? (
                                          <AvatarImage
                                            src={item.image}
                                            alt={item.name}
                                            className="h-full w-full object-contain"
                                          />
                                        ) : (
                                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                            N/A
                                          </AvatarFallback>
                                        )}
                                      </Avatar>
                                      <span className="flex min-w-0 flex-col items-start">
                                        <span className="break-words">
                                          {item.name}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                          Qty: {item.quantity}
                                        </span>
                                      </span>
                                    </div>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                      {item.price}
                                    </span>
                                  </div>
                                );
                              },
                            )}
                          </CardContent>
                          <CardFooter>
                            <div className="flex justify-between w-full">
                              Grand Total:{" "}
                              <span className="text-sm font-semibold text-primary">
                                {cartDetails.sub_total}
                              </span>
                            </div>
                          </CardFooter>
                        </Card>
                      )}

                    {message.role === "assistant" &&
                      message.json_content?.ticket_details && (
                        <TicketCard
                          ticket={message.json_content.ticket_details}
                        />
                      )}

                    {/* The question card the shopper saw, drawn like the widget's,
                    so agents can read their compiled answer ("Show "Watches"")
                    in context. */}
                    {message.role === "assistant" &&
                      message.json_content?.questions &&
                      message.json_content.questions.length > 0 && (
                        <div className="mt-2 flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-background p-3">
                          {message.json_content.questions.map(
                            (
                              question: ClarifyingQuestion,
                              idx: number,
                              all: ClarifyingQuestion[],
                            ) => (
                              <div key={idx}>
                                <span className="text-xs text-muted-foreground">
                                  {idx + 1} of {all.length}
                                </span>
                                <p className="mb-2.5 mt-1 text-sm font-semibold text-foreground">
                                  {question.question}
                                </p>
                                <div className="flex flex-col gap-1.5">
                                  {question.options.map((option) => (
                                    <div
                                      key={option}
                                      className="flex items-center gap-2.5 rounded-[10px] border border-border bg-secondary px-3 py-2 text-[13px] text-foreground"
                                    >
                                      <span
                                        aria-hidden="true"
                                        className={`size-4 shrink-0 border-[1.5px] border-muted-foreground ${question.multi_select ? "rounded" : "rounded-full"}`}
                                      />
                                      <span>{option}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}

                    {message.role === "assistant" &&
                      message.json_content?.suggestions &&
                      message.json_content.suggestions.length > 0 && (
                        <div className="mt-2 flex justify-start">
                          <div className="flex flex-wrap gap-2">
                            {message.json_content.suggestions.map(
                              (s: string, idx: number) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  className="text-xs hover:bg-primary/25 hover:text-primary hover:border-primary rounded-full"
                                >
                                  {s}
                                </Button>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {message.image_url && (
                      <div className="mt-2 flex flex-wrap justify-end gap-2 md:justify-start">
                        {Array.isArray(message.image_url) ? (
                          <div className="flex flex-wrap gap-2">
                            {message.image_url.map((url, idx) => (
                              <HoverZoomImage
                                key={idx}
                                src={url}
                                alt={`User uploaded ${idx + 1}`}
                                className="h-14 w-14 object-contain shrink-0 bg-muted"
                              />
                            ))}
                          </div>
                        ) : (
                          <HoverZoomImage
                            src={message.image_url}
                            alt="User uploaded"
                            className="h-14 w-14 object-contain shrink-0 bg-muted"
                          />
                        )}
                      </div>
                    )}

                    {message.role === "assistant" && feedbackLabel ? (
                      <Tooltip
                        open={
                          hasPositiveFeedback || !feedbackMessage
                            ? false
                            : undefined
                        }
                      >
                        <TooltipTrigger asChild>
                          <div className="mt-2 flex w-fit cursor-help items-center gap-1 text-xs font-medium text-primary">
                            {hasPositiveFeedback ? (
                              <IconThumbUp
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            ) : (
                              <IconThumbDown
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            )}
                            <span className="capitalize">{feedbackLabel}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-80">
                          {feedbackMessage}
                        </TooltipContent>
                      </Tooltip>
                    ) : null}
                  </div>
                </div>
              </div>
            </MessageAppear>,
            ...eventRows(eventsAfter.get(index) ?? [], `after-${index}`),
          ];
        })}
        {closedAt ? (
          <div className="flex items-start gap-2.5 pt-3 md:pt-4">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground md:size-6">
              <IconCheck className="size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                Chat closed after inactivity{" "}
                <span className="font-normal text-muted-foreground">
                  · {formatDateTime(closedAt)}
                </span>
              </p>
              {closedCartItemCount !== undefined ? (
                <span className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {closedCartItemCount} item
                  {closedCartItemCount === 1 ? "" : "s"} left in cart
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function LiveMessagePan({
  messages,
  handlerEvents,
  customerName,
  onReplyWithAI,
  replyWithAILoadingId,
}: {
  messages: ThreadMessage[];
  handlerEvents?: HandlerEvent[];
  customerName?: string | null;
  onReplyWithAI?: (message_id: number | string) => void;
  replyWithAILoadingId?: string | number | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const me = session?.user?.email;

  // Slot each handover after the message it followed; events with no (or an
  // unknown) anchor go after the last message sent at or before their time.
  const eventsBefore: HandlerEvent[] = [];
  const eventsAfter = new Map<number, HandlerEvent[]>();
  for (const event of handlerEvents ?? []) {
    let at = event.after_message_id
      ? messages.findIndex(
          (m) => String(m.id) === String(event.after_message_id),
        )
      : -1;
    if (at === -1) {
      const time = new Date(event.created_at).getTime();
      for (let i = messages.length - 1; i >= 0; i--) {
        if (new Date(messages[i].created_at).getTime() <= time) {
          at = i;
          break;
        }
      }
    }
    if (at === -1) {
      eventsBefore.push(event);
    } else {
      eventsAfter.set(at, [...(eventsAfter.get(at) ?? []), event]);
    }
  }
  const eventRow = (event: HandlerEvent) => (
    <motion.div
      key={`handler-event-${event.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <HandlerEventRow event={event} me={me} />
    </motion.div>
  );

  const eventRows = (events: HandlerEvent[], keyPrefix: string) =>
    events.length > 1
      ? [
          <HandlerEventGroupRow
            key={`${keyPrefix}-handler-event-group`}
            events={events}
            me={me}
          />,
        ]
      : events.map(eventRow);

  useEffect(() => {
    const scrollToBottom = () => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    };

    // Scroll immediately
    scrollToBottom();

    // Also scroll after a brief delay to ensure DOM is fully updated
    const timer = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timer);
  }, [messages]);

  return (
    <div className="h-full space-y-4 p-2 overflow-y-auto" ref={containerRef}>
      {/* Animates on mount as well as on append. The panel is only
          rendered once a thread has messages, so the very first message of
          a conversation arrives as a mount, not an append — suppressing
          mount meant the one message an agent most wants to see land was
          the only one that appeared without motion.

          Keyed by message id, so AnimatePresence can tell a new message
          from a re-render of an existing one. */}
      <AnimatePresence>
        {eventRows(eventsBefore, "before")}
        {messages?.flatMap((message: ThreadMessage, index: number) => {
          const isLastMessage = index === messages.length - 1;
          // New responses carry message_type.  Treat a system row from an
          // older/cached history payload as an internal note too, so a reload
          // can never turn a staff-only note into a normal AI chat bubble.
          const isSystemMessage = message.role === "system";
          const isAiAction =
            message.message_type === "ai_action" ||
            (isSystemMessage &&
              /^AI (looked up|performed)\b/.test(message.message));
          const isInternalNote =
            message.message_type === "internal" ||
            (isSystemMessage && !isAiAction);
          const isSystemEvent = isInternalNote || isAiAction;
          const isAgentMessage = Boolean(
            message.agent_name || message.messaged_by,
          );
          const senderLabel =
            message.role === "assistant" && !message.agent_name
              ? "AI Assistant"
              : message.messaged_by_email &&
                  me &&
                  message.messaged_by_email.toLowerCase() === me.toLowerCase()
                ? "You"
                : message.messaged_by || message.role;
          const showReplyWithAI =
            isLastMessage && message.role === "user" && !!onReplyWithAI;
          const isCustomer = message.role === "user";
          const isOutgoing = isCustomer;
          const avatarLabel = isCustomer
            ? getInitials(customerName || message.messaged_by) || "C"
            : isAgentMessage
              ? getInitials(message.agent_name || message.messaged_by) || "A"
              : "AI";

          if (isSystemEvent) {
            return [
              <MessageAppear
                key={message.id ?? index}
                outgoing={false}
                index={index}
                total={messages.length}
                className="py-1"
              >
                <div className="flex justify-center">
                  <div
                    className={
                      isInternalNote
                        ? "flex max-w-[82%] items-start gap-2 rounded-lg border border-dashed border-amber-300/80 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-700/70 dark:bg-amber-950/30 dark:text-amber-100"
                        : "flex max-w-[82%] items-center gap-2 rounded-full border border-dashed bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground"
                    }
                  >
                    {isInternalNote ? (
                      <IconLock className="mt-0.5 size-3.5 shrink-0" />
                    ) : (
                      <IconSparkles className="size-3.5 shrink-0 text-primary" />
                    )}
                    <div className="min-w-0">
                      {isInternalNote ? (
                        <>
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="font-medium">
                              Internal note ·{" "}
                              {message.agent_name ||
                                message.messaged_by ||
                                "Agent"}
                            </span>
                            <span className="shrink-0 opacity-60">
                              {formatDateTime(message.created_at)}
                            </span>
                          </div>
                          <p className="mt-0.5 whitespace-pre-wrap wrap-break-word">
                            {message.message}
                          </p>
                        </>
                      ) : (
                        <span>{message.message}</span>
                      )}
                    </div>
                  </div>
                </div>
              </MessageAppear>,
              ...eventRows(eventsAfter.get(index) ?? [], `live-after-${index}`),
            ];
          }

          return [
            <MessageAppear
              key={message.id ?? index}
              outgoing={isOutgoing}
              index={index}
              total={messages.length}
              className="space-y-2 pb-2"
            >
              <div
                className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex min-w-0 gap-2.5 max-w-[82%] ${
                    isCustomer ? "flex-row-reverse" : "flex-row"
                  } ${
                    message.json_content?.products?.length ||
                    message.json_content?.related_products?.length
                      ? "w-full"
                      : ""
                  }`}
                >
                  <Avatar className="h-7 w-7 shrink-0 mt-1">
                    <AvatarFallback
                      className={
                        isCustomer
                          ? "bg-muted text-muted-foreground text-xs"
                          : "bg-primary/10 text-primary text-xs"
                      }
                    >
                      {avatarLabel}
                    </AvatarFallback>
                  </Avatar>
                  {/* min-w-0: a flex child will not shrink below its content
                      (a product carousel, a long URL) unless told it may,
                      which pushed the whole pane into sideways scrolling. */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div
                      className={`flex flex-wrap items-center gap-x-2 mb-1 ${isCustomer ? "justify-end" : "justify-start"}`}
                    >
                      <span className="text-xs font-medium text-foreground capitalize">
                        {senderLabel}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(message.created_at)}
                      </span>
                      {!isCustomer &&
                      !isAgentMessage &&
                      message.confidence != null ? (
                        <span className="text-xs text-primary">
                          {Math.round(message.confidence * 100)}%
                        </span>
                      ) : null}
                    </div>
                    {!message.message.trim() ? (
                      <></>
                    ) : (
                      <div
                        id="markdown-message-bubble"
                        style={{ borderRadius: "0.7rem" }}
                        className={`min-w-0 max-w-full p-3 text-sm wrap-anywhere ${isCustomer ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-secondary border border-border rounded-tl-none"}`}
                      >
                        {message.role === "assistant" ? (
                          (() => {
                            if (
                              message?.json_content?.order_details &&
                              message.json_content.order_details?.items
                                ?.length > 0
                            ) {
                              return (
                                <>
                                  <ReactMarkdown>
                                    {message.message}
                                  </ReactMarkdown>
                                  <div className="mt-3">
                                    <OrderBillCard
                                      order={message.json_content.order_details}
                                    />
                                  </div>
                                </>
                              );
                            }

                            // Strategy 2: plain markdown fallback
                            return (
                              <ReactMarkdown>{message.message}</ReactMarkdown>
                            );
                          })()
                        ) : (
                          <span className="whitespace-pre-wrap">
                            {message.message}
                          </span>
                        )}
                      </div>
                    )}

                    {message.role === "assistant" &&
                    !isAgentMessage &&
                    message.source_used ? (
                      <div className="mt-1 text-xs font-medium text-primary">
                        <span>Source: {message.source_used}</span>
                      </div>
                    ) : null}

                    {/* "Reply with AI" — only for user messages, only when a
                    handler is supplied by the parent. Shown on row hover
                    so it doesn't clutter the transcript by default. */}
                    {showReplyWithAI && (
                      <div className="mt-1 flex justify-end transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-primary"
                          onClick={() => onReplyWithAI(message.id)}
                          disabled={
                            replyWithAILoadingId !== null &&
                            replyWithAILoadingId !== undefined
                          }
                        >
                          {replyWithAILoadingId === message.id ? (
                            <>
                              <Spinner className="size-3" />
                              Generating…
                            </>
                          ) : (
                            <>
                              <IconSparkles className="h-3 w-3" />
                              <CreditLabel>Reply with AI</CreditLabel>
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {message.role === "assistant" &&
                      message?.json_content?.products &&
                      message.json_content.products.length > 0 && (
                        <ProductCarousel
                          products={message.json_content.products}
                          comparisonBlock={
                            message.json_content.comparison_block
                          }
                        />
                      )}

                    {message.role === "assistant" &&
                      message?.json_content?.related_products &&
                      message.json_content.related_products.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-xs font-semibold text-muted-foreground">
                            Related Products
                          </h4>
                          <ProductCarousel
                            products={message.json_content.related_products}
                          />
                        </div>
                      )}

                    {message.role === "assistant" &&
                      message?.json_content?.cart_details &&
                      message.json_content.cart_details.items.length > 0 && (
                        <Card className="mt-2 px-0">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <IconShoppingBag className="size-4" />
                              Cart Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-col gap-3">
                            {message.json_content.cart_details.items.map(
                              (item: CartItem, idx: number) => {
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-start justify-between gap-3 text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar>
                                        {item.image ? (
                                          <AvatarImage
                                            src={item.image}
                                            alt={item.name}
                                            className="h-full w-full object-contain"
                                          />
                                        ) : (
                                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                            N/A
                                          </AvatarFallback>
                                        )}
                                      </Avatar>
                                      <span className="flex flex-col items-start">
                                        <span>{item.name}</span>
                                        <span className="text-muted-foreground text-xs">
                                          Qty: {item.quantity}
                                        </span>
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {item.price}
                                    </span>
                                  </div>
                                );
                              },
                            )}
                          </CardContent>
                          <CardFooter>
                            <div className="flex justify-between w-full">
                              Grand Total:{" "}
                              <span className="text-sm font-semibold text-primary">
                                {message.json_content.cart_details.sub_total}
                              </span>
                            </div>
                          </CardFooter>
                        </Card>
                      )}

                    {message.role === "assistant" &&
                      message.json_content?.ticket_details && (
                        <TicketCard
                          ticket={message.json_content.ticket_details}
                        />
                      )}

                    {/* The question card the shopper saw, drawn like the widget's,
                    so agents can read their compiled answer ("Show "Watches"")
                    in context. */}
                    {message.role === "assistant" &&
                      message.json_content?.questions &&
                      message.json_content.questions.length > 0 && (
                        <div className="mt-2 flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-background p-3">
                          {message.json_content.questions.map(
                            (
                              question: ClarifyingQuestion,
                              idx: number,
                              all: ClarifyingQuestion[],
                            ) => (
                              <div key={idx}>
                                <span className="text-xs text-muted-foreground">
                                  {idx + 1} of {all.length}
                                </span>
                                <p className="mb-2.5 mt-1 text-sm font-semibold text-foreground">
                                  {question.question}
                                </p>
                                <div className="flex flex-col gap-1.5">
                                  {question.options.map((option) => (
                                    <div
                                      key={option}
                                      className="flex items-center gap-2.5 rounded-[10px] border border-border bg-secondary px-3 py-2 text-[13px] text-foreground"
                                    >
                                      <span
                                        aria-hidden="true"
                                        className={`size-4 shrink-0 border-[1.5px] border-muted-foreground ${question.multi_select ? "rounded" : "rounded-full"}`}
                                      />
                                      <span>{option}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}

                    {message.role === "assistant" &&
                      message.json_content?.suggestions &&
                      message.json_content.suggestions.length > 0 && (
                        <div className="flex justify-start mt-2">
                          <div className="flex flex-wrap gap-2">
                            {message.json_content.suggestions.map(
                              (s: string, idx: number) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  className="text-xs hover:bg-primary/25 hover:text-primary hover:border-primary rounded-full"
                                >
                                  {s}
                                </Button>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {message.image_url && (
                      <div className="flex flex-wrap gap-2 mt-2 justify-end">
                        {Array.isArray(message.image_url) ? (
                          <div className="flex gap-2">
                            {message.image_url.map((url, idx) => (
                              <HoverZoomImage
                                key={idx}
                                src={url}
                                alt={`User uploaded ${idx + 1}`}
                                className="h-14 w-14 object-contain shrink-0 bg-muted"
                              />
                            ))}
                          </div>
                        ) : (
                          <HoverZoomImage
                            src={message.image_url}
                            alt="User uploaded"
                            className="h-14 w-14 object-contain shrink-0 bg-muted"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </MessageAppear>,
            ...eventRows(eventsAfter.get(index) ?? [], `live-after-${index}`),
          ];
        })}
      </AnimatePresence>
    </div>
  );
}
