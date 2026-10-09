import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CartItem,
  HandlerEvent,
  ProductData,
  ThreadMessage,
} from "@/redux/api-slice/thread-slice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import { formatDateTime } from "@/lib/helpers";
import { MessageAppear } from "@/components/custom/message-appear";
import OrderBillCard from "@/components/custom/order-bill-card";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconLock, IconShoppingBag, IconSparkles } from "@tabler/icons-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import HoverZoomImage from "@/components/custom/hover-zoom-image";
import { Spinner } from "../ui/spinner";

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
      <span className="rounded-full border border-dashed border-border bg-background px-3 py-1 text-center text-xs text-muted-foreground">
        {describeHandlerEvent(event, me)}
      </span>
    </div>
  );
}

export default function MessagePan({
  messages,
  handlerEvents,
  onReplyWithAI,
  replyWithAILoadingId,
}: {
  messages: ThreadMessage[];
  handlerEvents?: HandlerEvent[];
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
        {eventsBefore.map(eventRow)}
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
          const showReplyWithAI =
            isLastMessage && message.role === "user" && !!onReplyWithAI;
          const isCustomer = message.role === "user";
          const isOutgoing = isCustomer;

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
                              {(
                                message.agent_name ||
                                message.messaged_by ||
                                "Agent"
                              ).replace(/\s*\([^)]*@[^)]*\)\s*$/, "")}
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
              ...(eventsAfter.get(index) ?? []).map(eventRow),
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
                  className={`flex gap-2.5 max-w-[82%] ${
                    isCustomer ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {isCustomer && (
                    <Avatar className="h-7 w-7 shrink-0 mt-1">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        C
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex flex-col">
                    <div
                      className={`flex items-center gap-2 mb-1 ${isCustomer ? "justify-end" : "justify-start"}`}
                    >
                      <span className="text-xs font-medium text-foreground capitalize">
                        {message.messaged_by_email &&
                        me &&
                        message.messaged_by_email.toLowerCase() ===
                          me.toLowerCase()
                          ? "You"
                          : message.messaged_by || message.role}
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
                        className={`p-3 text-sm wrap-break-word ${isCustomer ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-secondary border border-border rounded-tl-none"}`}
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
                              Reply with AI
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {message.role === "assistant" &&
                      message?.json_content?.products &&
                      message.json_content.products.length > 0 && (
                        <div className="flex justify-start mt-2">
                          <div className="flex flex-wrap gap-2 w-full">
                            {message.json_content.products.map(
                              (product: ProductData, idx: number) => {
                                return (
                                  <a
                                    key={idx}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-2.5 border border-border bg-background hover:bg-muted/50 transition-colors no-underline w-[240px] shrink-0"
                                  >
                                    {product.image ? (
                                      <Image
                                        src={product.image}
                                        alt={product.name}
                                        width={48}
                                        height={48}
                                        // Product images come from arbitrary, untrusted
                                        // store hostnames (Magento/Shopify/etc.) we can't
                                        // enumerate. unoptimized renders a direct <img> so
                                        // we skip the remotePatterns allowlist and avoid
                                        // proxying third-party bandwidth through our optimizer.
                                        unoptimized
                                        className="h-12 w-12 object-contain shrink-0 bg-muted"
                                      />
                                    ) : (
                                      <div className="h-12 w-12 rounded bg-muted shrink-0 flex items-center justify-center text-muted-foreground text-[10px]">
                                        No img
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-foreground truncate leading-snug">
                                        {product.name}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                        {product.id}
                                      </p>
                                    </div>
                                    {product.price && (
                                      <span className="text-xs font-semibold text-primary shrink-0">
                                        {product.price}
                                      </span>
                                    )}
                                  </a>
                                );
                              },
                            )}
                          </div>
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
                  {!isCustomer && (
                    <Avatar className="h-7 w-7 shrink-0 mt-1">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {isAgentMessage ? "H" : "AI"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            </MessageAppear>,
            ...(eventsAfter.get(index) ?? []).map(eventRow),
          ];
        })}
      </AnimatePresence>
    </div>
  );
}