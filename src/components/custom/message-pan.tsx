import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import {
  CartItem,
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
import {
  IconLock,
  IconShoppingBag,
  IconSparkles,
} from "@tabler/icons-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import HoverZoomImage from "@/components/custom/hover-zoom-image";
import { Spinner } from "../ui/spinner";

export default function MessagePan({
  messages,
  onReplyWithAI,
  replyWithAILoadingId,
}: {
  messages: ThreadMessage[];
  onReplyWithAI?: (message_id: number | string) => void;
  replyWithAILoadingId?: string | number | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

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
        {messages?.map((message: ThreadMessage, index: number) => {
          const isLastMessage = index === messages.length - 1;
          const isInternalNote = message.message_type === "internal";
          const isAiAction = message.message_type === "ai_action";
          const isSystemEvent = isInternalNote || isAiAction;
          const isAgentMessage = Boolean(
            message.agent_name || message.messaged_by,
          );
          const showReplyWithAI =
            isLastMessage && message.role === "user" && !!onReplyWithAI;
          const isCustomer = message.role === "user";
          const isOutgoing = !isCustomer;

          if (isSystemEvent) {
            return (
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
                    <div>
                      {isInternalNote ? (
                        <>
                          <span className="font-medium">
                            Internal note · {message.agent_name || message.messaged_by || "Agent"}
                          </span>
                          <span className="mx-1.5 opacity-60">·</span>
                          <span>{message.message}</span>
                          <span className="ml-1.5 opacity-60">
                            {formatDateTime(message.created_at)}
                          </span>
                        </>
                      ) : (
                        <span>{message.message}</span>
                      )}
                    </div>
                  </div>
                </div>
              </MessageAppear>
            );
          }

          return (
            <MessageAppear
              key={message.id ?? index}
              outgoing={isOutgoing}
              index={index}
              total={messages.length}
              className="space-y-2 pb-2"
            >
              <div
                className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}
              >
                <div className="flex gap-2.5 max-w-[82%]">
                  {isCustomer && (
                    <Avatar className="h-7 w-7 shrink-0 mt-1">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        C
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex flex-col">
                    <div
                      className={`flex items-center gap-2 mb-1 ${isCustomer ? "justify-start" : "justify-end"}`}
                    >
                      <span className="text-xs font-medium text-foreground capitalize">
                        {!isCustomer && !isAgentMessage ? (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <IconSparkles className="size-3" />
                            AI
                          </span>
                        ) : isCustomer ? (
                          "Customer"
                        ) : (
                          message.agent_name || message.messaged_by || "Agent"
                        )}
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
                        className={`p-3 text-sm wrap-break-word ${isCustomer ? "bg-secondary border border-border rounded-tl-none" : "bg-primary/10 text-foreground rounded-tr-none"}`}
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
            </MessageAppear>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
