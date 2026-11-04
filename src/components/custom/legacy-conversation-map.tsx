import { ThreadCard } from "@/components/custom/thread-card";
import { cn } from "@/lib/utils";
import type { ThreadMessage } from "@/redux/api-slice/thread-slice";

export function LegacyConversationMap({
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