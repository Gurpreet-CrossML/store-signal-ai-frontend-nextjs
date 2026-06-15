import { CartItem, ProductData, ThreadMessage } from "@/redux/api-slice/thread-slice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import { formatDateTime } from "@/lib/helpers";
import OrderBillCard from "@/components/custom/order-bill-card";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IconShoppingBag } from "@tabler/icons-react";

export default function MessagePan({
  messages,
}: {
  messages: ThreadMessage[];
}) {
  return (
    <div className="h-full space-y-4 p-2 overflow-y-auto">
      {messages?.map((message: ThreadMessage, index: number) => (
        <div key={index} className="space-y-2 pb-2">
          <div
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="flex gap-2.5 max-w-[82%]">
              {message.role === "assistant" && (
                <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                    A
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex flex-col">
                <div
                  className={`flex items-center gap-2 mb-1 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <span className="text-xs font-medium text-foreground capitalize">
                    {message.role}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(message.created_at)}
                  </span>
                </div>
                <div
                  className={`p-3 text-sm break-words ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary border border-border rounded-tl-none"}`}
                >
                  {message.role === "assistant" ? (
                    (() => {
                      if (
                        message?.json_content?.order_details &&
                        message.json_content.order_details?.items?.length > 0
                      ) {
                        return (
                          <>
                            <ReactMarkdown>{message.message}</ReactMarkdown>
                            <div className="mt-3">
                              <OrderBillCard
                                order={message.json_content.order_details}
                              />
                            </div>
                          </>
                        );
                      }

                      // Strategy 2: plain markdown fallback
                      return <ReactMarkdown>{message.message}</ReactMarkdown>;
                    })()
                  ) : (
                    <span className="whitespace-pre-wrap">
                      {message.message}
                    </span>
                  )}
                </div>
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
                                className="flex items-center gap-3 p-2.5 border border-border bg-background hover:bg-muted/50 transition-colors no-underline w-[240px] flex-shrink-0"
                              >
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-12 w-12 object-contain flex-shrink-0 bg-muted"
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground text-[10px]">
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
                                  <span className="text-xs font-semibold text-primary flex-shrink-0">
                                    {product.price}
                                  </span>
                                )}
                              </a>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )
                }
                {
                  message.role === "assistant" &&
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
                              <div key={idx} className="flex items-start justify-between gap-3 text-sm">
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
                  )
                }
              </div>
              {message.role === "user" && (
                <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    U
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>

          {/* {message.role === "assistant" && message.suggestions?.length > 0 && (
                        <div className="flex justify-start ml-12">
                            <div className="flex flex-wrap gap-2 max-w-[82%]">
                                {message.suggestions.map((s: string, idx: number) => (
                                    <button key={idx} onClick={() => handleSuggestionClick(s)} className="text-xs px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer">{s}</button>
                                ))}
                            </div>
                        </div>
                    )} */}
        </div>
      ))}
    </div>
  );
}
