import {
  CartItem,
  ProductData,
  ThreadMessage,
} from "@/redux/api-slice/thread-slice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import { formatDateTime } from "@/lib/helpers";
import OrderBillCard from "@/components/custom/order-bill-card";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconShoppingBag, IconCheck } from "@tabler/icons-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import HoverZoomImage from "@/components/custom/hover-zoom-image";
import { useEffect, useRef } from "react";

export default function MessagePan({
  messages,
}: {
  messages: ThreadMessage[];
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
    <div
      className="w-full h-full overflow-y-auto p-6 space-y-4 scroll-smooth bg-gradient-to-b from-background to-background/95"
      ref={containerRef}
    >
      {messages && messages.length > 0 ? (
        messages.map((message: ThreadMessage, index: number) => (
          <div key={index} className="flex group">
            {message.role === "user" && (
              <div className="flex gap-3 max-w-[70%] items-start">
                <Avatar className="h-8 w-8 shrink-0 mt-1 bg-blue-600 border border-blue-400/20">
                  <AvatarFallback className="text-white text-xs font-semibold bg-blue-600">
                    C
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-2">
                  {/* Label */}
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-1">
                    Customer
                  </span>

                  <div className="bg-gray-100 dark:bg-slate-700 rounded-2xl rounded-tl-sm shadow-sm border border-gray-200 dark:border-slate-600 p-4 hover:shadow-md transition-shadow">
                    <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                      {message.message}
                    </div>
                  </div>

                  <span className="text-xs text-gray-500 dark:text-gray-400 px-1 transition-opacity">
                    {formatDateTime(message.created_at)}
                  </span>

                  {message.image_url && (
                    <div className="mt-2">
                      {Array.isArray(message.image_url) ? (
                        <div className="flex gap-2">
                          {message.image_url.map((url, idx) => (
                            <HoverZoomImage
                              key={idx}
                              src={url}
                              alt={`Uploaded ${idx + 1}`}
                              className="h-20 w-20 object-cover rounded-lg border border-purple-300/30 shadow-sm"
                            />
                          ))}
                        </div>
                      ) : (
                        <HoverZoomImage
                          src={message.image_url}
                          alt="Uploaded image"
                          className="h-20 w-20 object-cover rounded-lg border border-purple-300/30 shadow-sm"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {message.role === "assistant" && (
              <div className="flex gap-3 max-w-[70%] items-start ml-auto">
                <div className="flex flex-col gap-2 items-end">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-1">
                    {message.messaged_by ? "You" : "AI Assistant"}
                  </span>

                  <div className="bg-blue-600 dark:bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="prose dark:prose-invert prose-sm prose-invert max-w-none">
                      {(() => {
                        if (
                          message?.json_content?.order_details &&
                          message.json_content.order_details?.items?.length > 0
                        ) {
                          return (
                            <>
                              <ReactMarkdown>{message.message}</ReactMarkdown>
                              <div className="mt-4">
                                <OrderBillCard
                                  order={message.json_content.order_details}
                                />
                              </div>
                            </>
                          );
                        }
                        return <ReactMarkdown>{message.message}</ReactMarkdown>;
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 transition-opacity">
                      {formatDateTime(message.created_at)}
                    </span>
                  </div>

                  {message?.json_content?.products &&
                    message.json_content.products.length > 0 && (
                      <div className="mt-2">
                        <div className="grid grid-cols-2 gap-2 w-full">
                          {message.json_content.products.map(
                            (product: ProductData, idx: number) => (
                              <a
                                key={idx}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-start gap-2 p-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group/product"
                              >
                                {product.image ? (
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    width={60}
                                    height={60}
                                    unoptimized
                                    className="h-14 w-14 object-contain rounded bg-gray-100 dark:bg-slate-800 group-hover/product:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="h-14 w-14 rounded bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 text-[10px] font-medium">
                                    No image
                                  </div>
                                )}
                                <div className="flex-1 w-full min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate leading-snug">
                                    {product.name}
                                  </p>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono mt-1 truncate">
                                    {product.id}
                                  </p>
                                </div>
                                {product.price && (
                                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                                    {product.price}
                                  </span>
                                )}
                              </a>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {message?.json_content?.cart_details &&
                    message.json_content.cart_details.items.length > 0 && (
                      <div className="mt-2 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                          <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                            <IconShoppingBag className="w-4 h-4" />
                            Cart
                          </p>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-slate-700">
                          {message.json_content.cart_details.items.map(
                            (item: CartItem, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-3 p-3 text-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9 shrink-0 bg-gray-100 dark:bg-slate-800">
                                    {item.image ? (
                                      <AvatarImage
                                        src={item.image}
                                        alt={item.name}
                                        className="object-contain"
                                      />
                                    ) : (
                                      <AvatarFallback className="bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 text-xs font-medium">
                                        N/A
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {item.name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Qty: {item.quantity}
                                    </span>
                                  </div>
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                                  {item.price}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                        <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              Total
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {message.json_content.cart_details.sub_total}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                  {message.json_content?.suggestions &&
                    message.json_content.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.json_content.suggestions.map(
                          (s: string, idx: number) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 border-gray-300 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-slate-500 transition-colors"
                            >
                              {s}
                            </Button>
                          ),
                        )}
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
              <IconShoppingBag className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              No messages yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Messages will appear here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}