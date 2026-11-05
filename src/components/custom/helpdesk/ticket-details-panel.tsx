"use client";

import { createContext, useContext, useMemo, useState } from "react";
import {
  IconArrowUpRight,
  IconArrowRight,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconCircleCheck,
  IconClockHour4,
  IconCopy,
  IconMail,
  IconMapPin,
  IconPhone,
  IconPlus,
  IconRefresh,
  IconShoppingBag,
  IconSparkles,
  IconTag,
  IconUserPlus,
  IconWorld,
  IconX,
  type Icon,
} from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";

import { AssigneeSelect } from "@/components/custom/assignee-select";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { LoadingState } from "@/components/custom/loading-state";
import { TicketCopilotPanel } from "@/components/custom/ticket-copilot-panel";
import { useCan } from "@/hooks/use-can";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ticketRef } from "@/components/custom/ticket-priority-bar";
import { useNow } from "@/hooks/use-now";
import { capitalizeText } from "@/lib/helpers";
import {
  CHANNEL_META,
  DEFAULT_TICKET_LANGUAGE,
  DEFAULT_TICKET_SENTIMENT,
  SUPPORTED_LANGUAGES,
  TICKET_SENTIMENTS,
  type TicketLanguage,
  type TicketSentiment,
} from "@/lib/ticket-options";
import { cn } from "@/lib/utils";
import type {
  SlaTarget,
  SupportTicket,
  SupportTicketActivityItem,
  SupportTicketCustomer,
  SupportTicketPriority,
  SupportTicketSla,
  SupportTicketStatus,
  SupportTicketTagData,
} from "@/redux/api-slice/support-ticket-slice";
import type { StaffMember } from "@/redux/api-slice/tenancy-slice";
import type {
  OrderData,
  ThreadTicketData,
} from "@/redux/api-slice/thread-slice";

// --- Shared look --------------------------------------------------------

/** The four statuses an agent can move a ticket between, with their dots. */
export const STATUS_META: Record<
  SupportTicketStatus,
  { label: string; dot: string; text: string }
> = {
  open: { label: "Open", dot: "bg-blue-600", text: "text-blue-600" },
  reopen: { label: "Reopen", dot: "bg-pink-500", text: "text-pink-600" },
  snoozed: { label: "Snoozed", dot: "bg-amber-500", text: "text-amber-600" },
  resolved: {
    label: "Resolved",
    dot: "bg-emerald-600",
    text: "text-emerald-600",
  },
  closed: { label: "Closed", dot: "bg-zinc-400", text: "text-zinc-500" },
};

export const PRIORITY_META: Record<
  SupportTicketPriority,
  { label: string; dot: string }
> = {
  low: { label: "Low", dot: "bg-zinc-400" },
  normal: { label: "Normal", dot: "bg-blue-600" },
  high: { label: "High", dot: "bg-orange-500" },
  urgent: { label: "Urgent", dot: "bg-red-600" },
};

const STATUS_MENU: SupportTicketStatus[] = [
  "open",
  "reopen",
  "resolved",
  "closed",
];
const PRIORITY_MENU: SupportTicketPriority[] = [
  "low",
  "normal",
  "high",
  "urgent",
];

/** "4 Nov 2026, 1:28 PM". */
export function formatTicketDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}, ${formatTicketTime(value)}`;
}

/** "1:28 PM". */
export function formatTicketTime(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "4 Nov 2026". */
function formatTicketDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "4 Nov". */
function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

/** An amount in its order's currency, "$4,299.00". */
export function formatMoney(
  amount: string | number | null | undefined,
  currency?: string | null,
) {
  const value = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(Number.isFinite(value) ? value : 0);
  } catch {
    return `${currency ?? ""} ${value.toFixed(2)}`.trim();
  }
}

/**
 * A length of time in its two largest units: "2h 36m", "1d 0h". With
 * `trim`, a zero second unit is dropped: "13d", "21m".
 */
function formatSpan(minutes: number, trim = false) {
  const total = Math.max(0, Math.round(minutes));
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const mins = total % 60;
  if (days) return trim && !hours ? `${days}d` : `${days}d ${hours}h`;
  if (hours) return trim && !mins ? `${hours}h` : `${hours}h ${mins}m`;
  return `${mins}m`;
}

/** The ticket's order among the customer's, matched on its number. */
export function findLinkedOrder(
  orderId: string | null | undefined,
  orders: OrderData[] | null | undefined,
) {
  if (!orderId || !orders?.length) return null;
  const wanted = String(orderId).replace(/^#/, "").trim();
  return (
    orders.find(
      (order) =>
        String(order.order_number ?? "")
          .replace(/^#/, "")
          .trim() === wanted || String(order.order_id ?? "").trim() === wanted,
    ) ?? null
  );
}

/**
 * True inside the phone's full-screen Details page, which shows the same
 * controls as grouped cards with "›" rows instead of pills.
 */
const PhoneLayout = createContext(false);

/** A phone card: the page is grey and each group sits on its own card. */
const PHONE_CARD = "mx-4 mt-3 rounded-2xl border bg-background";

function FieldRow({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const phone = useContext(PhoneLayout);
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        phone ? "min-h-14 px-4 py-2" : "min-h-9",
        className,
      )}
    >
      <span
        className={cn(
          "shrink-0 text-muted-foreground",
          phone ? "text-[15px]" : "text-sm",
        )}
      >
        {label}
      </span>
      <div className="flex min-w-0 justify-end">{children}</div>
    </div>
  );
}

const pillClass =
  "inline-flex h-8 max-w-full items-center gap-1.5 rounded-md border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-60 disabled:hover:bg-background";

/** A field's value on the phone page: plain text, no pill. */
const phoneValueClass =
  "inline-flex max-w-full min-w-0 items-center gap-2 text-[15px] disabled:cursor-default disabled:opacity-60";

/** What opens a field's menu: a right chevron on the phone page. */
function MenuChevron() {
  return useContext(PhoneLayout) ? (
    <IconChevronRight className="size-4 shrink-0 text-muted-foreground" />
  ) : (
    <IconChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
  );
}

function Section({
  icon: SectionIcon,
  title,
  aside,
  children,
}: {
  icon?: Icon;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const phone = useContext(PhoneLayout);
  return (
    <section className={phone ? cn(PHONE_CARD, "p-4") : "border-t px-4 py-4"}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3
          className={cn(
            "flex items-center gap-2 font-semibold",
            phone ? "text-base" : "text-sm",
          )}
        >
          {SectionIcon && !phone ? (
            <SectionIcon className="size-4 text-muted-foreground" />
          ) : null}
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

// --- SLA ----------------------------------------------------------------

type SlaRow = {
  key: string;
  label: string;
  value: string;
  tone: "primary" | "warning" | "success" | "danger";
  fraction: number;
  caption: string;
};

const SLA_LABELS: Record<"first_reply" | "every_reply" | "resolution", string> =
  {
    first_reply: "First response",
    every_reply: "Next response",
    resolution: "Resolution",
  };

function slaRows(sla: SupportTicketSla, now: number): SlaRow[] {
  return (["first_reply", "every_reply", "resolution"] as const)
    .map((key): SlaRow | null => {
      const target: SlaTarget = sla[key];
      if (!target || target.status === "not_applicable" || !target.due_at) {
        return null;
      }
      const due = new Date(target.due_at).getTime();
      const span = (target.target_minutes ?? 0) * 60000;
      const start = span ? due - span : due;
      const targetLabel = target.target_minutes
        ? `Target ${formatSpan(target.target_minutes)}`
        : "";

      if (target.completed_at) {
        const done = new Date(target.completed_at).getTime();
        const late = Boolean(target.breached_at) || done > due;
        return {
          key,
          label: SLA_LABELS[key],
          value: late
            ? `Breached by ${formatSpan((done - due) / 60000, true)}`
            : `Met in ${formatSpan((done - start) / 60000, true)}`,
          tone: late ? "danger" : "success",
          fraction: late ? 1 : span ? Math.min(1, (done - start) / span) : 1,
          caption: late
            ? `${targetLabel} · ${key === "resolution" ? "resolved late" : "replied late"}`
            : targetLabel,
        };
      }

      const remaining = due - now;
      const overdue = remaining < 0 || Boolean(target.breached_at);
      return {
        key,
        label: SLA_LABELS[key],
        value: overdue
          ? `Overdue by ${formatSpan(Math.abs(remaining) / 60000, true)}`
          : `Due in ${formatSpan(remaining / 60000, true)}`,
        tone: overdue
          ? "danger"
          : target.status === "due_soon"
            ? "warning"
            : "primary",
        fraction: overdue
          ? 1
          : span
            ? Math.min(1, Math.max(0.02, (now - start) / span))
            : 0,
        caption: [
          targetLabel,
          `started ${formatTicketTime(new Date(start).toISOString())}`,
        ]
          .filter(Boolean)
          .join(" · "),
      };
    })
    .filter((row): row is SlaRow => row !== null);
}

const SLA_TONE: Record<SlaRow["tone"], { text: string; bar: string }> = {
  primary: { text: "text-foreground", bar: "bg-primary" },
  warning: { text: "text-amber-600", bar: "bg-amber-500" },
  success: { text: "text-emerald-600", bar: "bg-emerald-500" },
  danger: { text: "text-red-600", bar: "bg-red-500" },
};

function SlaSection({
  sla,
  priority,
}: {
  sla: SupportTicketSla | null | undefined;
  priority: SupportTicketPriority;
}) {
  const now = useNow();
  const phone = useContext(PhoneLayout);
  const rows = sla ? slaRows(sla, now) : [];
  const badge = rows.some((row) => row.tone === "danger")
    ? { label: "Breached", className: "bg-red-100 text-red-700" }
    : rows.some((row) => row.tone === "warning")
      ? { label: "Due soon", className: "bg-amber-100 text-amber-700" }
      : rows.length > 0 && rows.every((row) => row.tone === "success")
        ? { label: "Met", className: "bg-emerald-100 text-emerald-700" }
        : { label: "On track", className: "bg-primary/10 text-primary" };

  return (
    <Section
      icon={IconClockHour4}
      title="SLA"
      aside={
        sla ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              badge.className,
            )}
          >
            {badge.label}
          </span>
        ) : null
      }
    >
      {!sla ? (
        <p className="text-sm text-muted-foreground">
          No SLA applies to this ticket.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <div key={row.key}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span>{row.label}</span>
                <span className={cn("font-semibold", SLA_TONE[row.tone].text)}>
                  {row.value}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", SLA_TONE[row.tone].bar)}
                  style={{ width: `${Math.round(row.fraction * 100)}%` }}
                />
              </div>
              {row.caption && !phone ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.caption}
                </p>
              ) : null}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            {phone ? "" : "Policy: "}
            {sla.tag.name} · {PRIORITY_META[priority].label} priority
          </p>
        </div>
      )}
    </Section>
  );
}

// --- Tags ---------------------------------------------------------------

/** A colour for a tag created from the picker. */
const NEW_TAG_COLORS = [
  "#7c3aed",
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#db2777",
];

function TagsSection({
  ticket,
  isClosed,
  availableTags,
  isTagPickerOpen,
  onTagPickerOpenChange,
  tagsLoading,
  isLoadingMoreTags,
  hasMoreTags,
  onLoadMoreTags,
  tagSearch,
  onTagSearchChange,
  onAddTag,
  onRequestTagRemoval,
  onCreateTag,
}: TagProps & { ticket: SupportTicket; isClosed: boolean }) {
  const search = tagSearch.trim();
  const exists = availableTags.some(
    (tag) => tag.name.toLowerCase() === search.toLowerCase(),
  );
  const assigned = (id?: number) => ticket.tags.some((tag) => tag.id === id);
  // On the phone page a tag comes off by unticking it in Add Tag.
  const phone = useContext(PhoneLayout);
  const removable = !isClosed && !phone;

  return (
    <Section icon={IconTag} title="Tags">
      <div className="flex flex-wrap items-center gap-2">
        {ticket.tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-sm text-sky-800 dark:bg-sky-500/15 dark:text-sky-300"
          >
            <span className="truncate">{tag.name}</span>
            {removable && tag.id ? (
              <button
                type="button"
                aria-label={`Remove tag ${tag.name}`}
                className="opacity-60 hover:opacity-100"
                onClick={() => tag.id && onRequestTagRemoval(tag.id)}
              >
                <IconX className="size-3.5" />
              </button>
            ) : null}
          </span>
        ))}
      </div>
      <Popover open={isTagPickerOpen} onOpenChange={onTagPickerOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={isClosed}
          >
            <IconPlus data-icon="inline-start" />
            Add Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0">
          <div className="p-2">
            <input
              autoFocus
              value={tagSearch}
              onChange={(event) => onTagSearchChange(event.target.value)}
              placeholder="Search or create a tag"
              aria-label="Search or create a tag"
              className="h-9 w-full rounded-md border border-primary/60 bg-background px-3 text-sm outline-none focus:ring-3 focus:ring-primary/20"
            />
          </div>
          <div className="max-h-64 overflow-x-hidden overflow-y-auto px-1 pb-1">
            {tagsLoading && !isLoadingMoreTags ? (
              <LoadingState label="Loading tags…" className="py-6" />
            ) : (
              <>
                {availableTags.map((tag) => {
                  const checked = assigned(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={checked}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        if (!tag.id) return;
                        if (checked) onRequestTagRemoval(tag.id);
                        else onAddTag(tag.id);
                      }}
                    >
                      {/* Drawn, not <Checkbox>: that is a button, and a
                          button can't sit inside this one. */}
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input",
                        )}
                      >
                        {checked ? <IconCheck className="size-3.5" /> : null}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {tag.name}
                      </span>
                    </button>
                  );
                })}
                {search && !exists ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-primary hover:bg-muted"
                    onClick={() =>
                      onCreateTag(
                        search,
                        NEW_TAG_COLORS[search.length % NEW_TAG_COLORS.length],
                      )
                    }
                  >
                    <IconPlus className="size-4" />
                    Create &ldquo;{search}&rdquo;
                  </button>
                ) : null}
                {availableTags.length === 0 && !search ? (
                  <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No tags available.
                  </p>
                ) : null}
                {hasMoreTags ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    disabled={isLoadingMoreTags}
                    onClick={onLoadMoreTags}
                  >
                    {isLoadingMoreTags ? "Loading…" : "Load more"}
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </Section>
  );
}

// --- Orders -------------------------------------------------------------

function fulfillmentBadge(status: string | null) {
  const value = (status ?? "unfulfilled").toLowerCase();
  if (value === "fulfilled") {
    return { label: "Fulfilled", className: "bg-emerald-100 text-emerald-700" };
  }
  if (value.includes("partial")) {
    return {
      label: "Partially fulfilled",
      className: "bg-amber-100 text-amber-700",
    };
  }
  return {
    label: capitalizeText(value.replace(/_/g, " ")),
    className: "bg-amber-100 text-amber-700",
  };
}

function itemCount(order: OrderData) {
  const count =
    order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0;
  return `${count} item${count === 1 ? "" : "s"}`;
}

function OrderCard({
  order,
  expandable,
}: {
  order: OrderData;
  expandable?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const badge = fulfillmentBadge(order.fulfillment_status);
  const number = String(order.order_number ?? "").replace(/^#/, "");
  // On the phone page the order sits straight on its card, paid state as a chip.
  const phone = useContext(PhoneLayout);
  const paid = order.financial_status
    ? capitalizeText(order.financial_status.replace(/_/g, " "))
    : null;

  return (
    <div
      className={
        phone ? "overflow-hidden" : "overflow-hidden rounded-lg border"
      }
    >
      <button
        type="button"
        className={cn(
          "flex w-full items-start justify-between gap-2 py-3 text-left",
          phone ? "px-0" : "px-3",
          expandable ? "hover:bg-muted/50" : "cursor-default",
        )}
        onClick={() => expandable && setExpanded((open) => !open)}
        aria-expanded={expandable ? expanded : undefined}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold">#{number}</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] font-medium",
                badge.className,
              )}
            >
              {badge.label}
            </span>
            {phone && paid ? (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {paid}
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {formatTicketDate(order.created_at)} · {itemCount(order)}
            {paid && !phone ? ` · ${paid}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className={cn(
              "font-semibold",
              expandable ? "text-primary" : "text-foreground",
            )}
          >
            {formatMoney(order.total_price, order.currency)}
          </span>
          {expandable ? (
            expanded ? (
              <IconChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <IconChevronDown className="size-4 text-muted-foreground" />
            )
          ) : null}
        </div>
      </button>
      {expandable && expanded ? (
        <div className="border-t bg-muted/30 px-3 py-3 text-sm">
          {order.items?.map((item, index) => (
            <div
              key={`${item.sku}-${index}`}
              className="flex items-start gap-3 py-1.5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background">
                {order.item_images?.[String(item.product_id)] ? (
                  // Product images come from arbitrary store CDNs, so
                  // next/image's domain allowlist can't cover them.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={order.item_images[String(item.product_id)]}
                    alt={item.name}
                    className="size-full object-contain"
                  />
                ) : (
                  <IconShoppingBag className="size-4 text-muted-foreground" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-tight">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.sku ? `${item.sku} · ` : ""}Qty {item.quantity}
                </p>
              </div>
              <span className="shrink-0">
                {formatMoney(item.total_price ?? item.price, order.currency)}
              </span>
            </div>
          ))}
          <dl className="mt-2 flex flex-col gap-1.5 border-t pt-2">
            {[
              ["Subtotal", formatMoney(order.subtotal_price, order.currency)],
              ["Shipping", formatMoney(order.total_shipping, order.currency)],
              ["Tax", formatMoney(order.total_tax, order.currency)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd className="text-primary">
                {formatMoney(order.total_price, order.currency)}
              </dd>
            </div>
          </dl>
          <dl className="mt-2 flex flex-col gap-1.5 border-t pt-2">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Payment</dt>
              <dd className="truncate">{order.gateway || "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Payment status</dt>
              <dd>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                  {capitalizeText(
                    (order.financial_status ?? "unknown").replace(/_/g, " "),
                  )}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping method</dt>
              <dd className="truncate">{order.shipping_method || "—"}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}

function LinkedOrderSection({
  ticket,
  orders,
  onOrdersSync,
  orderSyncLoading,
  ordersDisabled,
}: {
  ticket: SupportTicket;
  orders?: OrderData[] | null;
  onOrdersSync: () => void;
  orderSyncLoading?: boolean;
  ordersDisabled?: boolean;
}) {
  const order = findLinkedOrder(ticket.order_id, orders);
  const phone = useContext(PhoneLayout);

  return (
    <Section
      title="Linked order"
      aside={
        order?.admin_url ? (
          <a
            href={order.admin_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-0.5 text-sm text-primary hover:underline"
          >
            {phone ? "Store admin" : "Open in store admin"}
            <IconArrowUpRight className="size-3.5" />
          </a>
        ) : null
      }
    >
      {order ? (
        <OrderCard order={order} expandable />
      ) : ticket.order_id ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-3">
          <div>
            <p className="font-semibold">#{ticket.order_id}</p>
            <p className="text-xs text-muted-foreground">
              Order details not synced yet.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={orderSyncLoading || ordersDisabled}
            onClick={onOrdersSync}
          >
            <IconRefresh
              data-icon="inline-start"
              className={cn(orderSyncLoading && "animate-spin")}
            />
            Sync
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No order linked.</p>
      )}
    </Section>
  );
}

// --- Ticket tab -----------------------------------------------------------

type TagProps = {
  availableTags: SupportTicketTagData[];
  isTagPickerOpen: boolean;
  onTagPickerOpenChange: (open: boolean) => void;
  tagsLoading: boolean;
  isLoadingMoreTags: boolean;
  hasMoreTags: boolean;
  onLoadMoreTags: () => void;
  tagSearch: string;
  onTagSearchChange: (value: string) => void;
  onAddTag: (tagId: number) => void;
  /** Asks first: taking a tag off can change the ticket's SLA. */
  onRequestTagRemoval: (tagId: number) => void;
  onCreateTag: (name: string, color: string) => void;
};

export type TicketDetailsProps = TagProps & {
  ticket: SupportTicket;
  /** Adds the Copilot tab; left out when no store is selected. */
  copilot?: {
    storeCode: string;
    ticketId: number;
    /** Changes whenever the ticket does, so Copilot re-checks its buttons. */
    refreshKey: string;
    onInsertDraft: (text: string) => void;
  };
  /** Resolved or closed: the fields are read-only. */
  isClosed: boolean;
  /** Which statuses the ticket can move to from where it is. */
  allowedStatuses: SupportTicketStatus[];
  /** Asks first: every status change emails the customer. */
  onRequestStatus: (status: SupportTicketStatus) => void;
  onPriorityChange: (priority: SupportTicketPriority) => void;
  staff: StaffMember[];
  canAssign: boolean;
  onAssign: (staffId: number | null) => void;
  onLanguageSentimentChange: (payload: {
    language?: TicketLanguage;
    sentiment?: TicketSentiment;
  }) => void;
  customer: SupportTicketCustomer | null;
  customerName: string;
  ordersLoading?: boolean;
  onOrdersSync: () => void;
  orderSyncLoading?: boolean;
  ordersDisabled?: boolean;
  otherTickets: ThreadTicketData[];
  otherTicketsLoading?: boolean;
  onLinkCustomer: () => void;
  onOpenTicket: (ticketId: number) => void;
  activity: SupportTicketActivityItem[];
  activityLoading?: boolean;
};

function AssigneePicker({
  ticket,
  staff,
  canAssign,
  isClosed,
  onAssign,
}: Pick<
  TicketDetailsProps,
  "ticket" | "staff" | "canAssign" | "isClosed" | "onAssign"
>) {
  const assignee = ticket.internal_assignee;
  return (
    <AssigneeSelect
      noun="ticket"
      hideLabel
      agents={staff.map((member) => ({
        email: member.email,
        name: `${member.first_name} ${member.last_name}`.trim() || member.email,
      }))}
      currentAgent={assignee?.email ?? null}
      currentAgentName={assignee?.name}
      disabled={!canAssign || isClosed}
      onReassign={(email) =>
        onAssign(staff.find((member) => member.email === email)?.id ?? null)
      }
    />
  );
}

function LanguagePicker({
  language,
  disabled,
  onChange,
}: {
  language: TicketLanguage;
  disabled: boolean;
  onChange: (language: TicketLanguage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const name =
    SUPPORTED_LANGUAGES.find((item) => item.code === language)?.name ??
    language;
  const term = search.trim().toLowerCase();
  const matches = SUPPORTED_LANGUAGES.filter((item) =>
    item.name.toLowerCase().includes(term),
  );
  const phone = useContext(PhoneLayout);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={phone ? phoneValueClass : pillClass}
          disabled={disabled}
        >
          {!phone ? (
            <IconWorld className="size-4 text-muted-foreground" />
          ) : null}
          {name}
          {!disabled ? <MenuChevron /> : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="p-2">
          <input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search languages"
            aria-label="Search languages"
            className="h-9 w-full rounded-md border border-primary/60 bg-background px-3 text-sm outline-none focus:ring-3 focus:ring-primary/20"
          />
        </div>
        <div className="max-h-60 overflow-x-hidden overflow-y-auto px-1 pb-1">
          {matches.map((item) => (
            <button
              key={item.code}
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                setOpen(false);
                if (item.code !== language) onChange(item.code);
              }}
            >
              {item.name}
              {item.code === language ? (
                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                  Detected
                  <IconCheck className="size-4" />
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <p className="border-t px-3 py-2 text-xs text-muted-foreground">
          Detected by AI from the customer&apos;s messages. &ldquo;Send in
          customer&apos;s language&rdquo; uses this.
        </p>
      </PopoverContent>
    </Popover>
  );
}

function TicketTab(props: TicketDetailsProps) {
  const {
    ticket,
    isClosed,
    allowedStatuses,
    onRequestStatus,
    onPriorityChange,
    onLanguageSentimentChange,
  } = props;
  const status = STATUS_META[ticket.status];
  const language = ticket.language ?? DEFAULT_TICKET_LANGUAGE;
  const sentiment = ticket.sentiment ?? DEFAULT_TICKET_SENTIMENT;
  const channel =
    ticket.channel === "web"
      ? "Web chat"
      : (CHANNEL_META[ticket.channel]?.label ?? capitalizeText(ticket.channel));
  const creator =
    ticket.created_by?.name ||
    ticket.created_by?.email ||
    (ticket.created_by_type === "ai"
      ? "AI"
      : ticket.created_by_type
        ? capitalizeText(ticket.created_by_type)
        : null);
  const phone = useContext(PhoneLayout);
  const valueClass = phone ? phoneValueClass : pillClass;

  const statusRow = (
    <FieldRow label="Status">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(valueClass, status.text, phone && "font-medium")}
          >
            <span className={cn("size-2 rounded-full", status.dot)} />
            {status.label}
            {ticket.status === "reopen" && (ticket.reopen_count ?? 0) > 0
              ? ` (${ticket.reopen_count})`
              : ""}
            <MenuChevron />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {STATUS_MENU.map((option) => {
            const meta = STATUS_META[option];
            const current = option === ticket.status;
            return (
              <DropdownMenuItem
                key={option}
                disabled={!current && !allowedStatuses.includes(option)}
                onSelect={() => !current && onRequestStatus(option)}
                className="gap-2.5 py-2"
              >
                <span className={cn("size-2 rounded-full", meta.dot)} />
                <span className="flex-1">{meta.label}</span>
                {current ? <IconCheck className="size-4 text-primary" /> : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </FieldRow>
  );

  const priorityRow = (
    <FieldRow label="Priority">
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isClosed}>
          <button type="button" className={valueClass} disabled={isClosed}>
            <span
              className={cn(
                "size-2 rounded-full",
                PRIORITY_META[ticket.priority].dot,
              )}
            />
            {PRIORITY_META[ticket.priority].label}
            {!isClosed ? <MenuChevron /> : null}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {PRIORITY_MENU.map((option) => (
            <DropdownMenuItem
              key={option}
              onSelect={() =>
                option !== ticket.priority && onPriorityChange(option)
              }
              className="gap-2.5 py-2"
            >
              <span
                className={cn("size-2 rounded-full", PRIORITY_META[option].dot)}
              />
              <span className="flex-1">{PRIORITY_META[option].label}</span>
              {option === ticket.priority ? (
                <IconCheck className="size-4 text-primary" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </FieldRow>
  );

  const assigneeRow = (
    <FieldRow label="Assignee">
      <AssigneePicker {...props} />
    </FieldRow>
  );

  const languageRow = (
    <FieldRow label="Language">
      <LanguagePicker
        language={language}
        disabled={isClosed}
        onChange={(next) => onLanguageSentimentChange({ language: next })}
      />
    </FieldRow>
  );

  // On the phone page these three sit on a card with inset dividers.
  const insetRow = phone ? "px-0" : undefined;
  const textClass = phone ? "text-[15px]" : "text-sm";

  const channelRow = (
    <FieldRow label="Channel" className={insetRow}>
      <span className={textClass}>{channel}</span>
    </FieldRow>
  );

  const sentimentRow = (
    <FieldRow label="Sentiment" className={insetRow}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isClosed}>
          <button
            type="button"
            disabled={isClosed}
            className={cn(
              "group/sentiment inline-flex items-center gap-1 rounded-md px-1 hover:bg-muted disabled:hover:bg-transparent",
              textClass,
            )}
          >
            {capitalizeText(sentiment)}
            {!isClosed ? (
              <IconChevronDown className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/sentiment:opacity-100" />
            ) : null}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {TICKET_SENTIMENTS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onSelect={() =>
                option.value !== sentiment &&
                onLanguageSentimentChange({ sentiment: option.value })
              }
              className="justify-between"
            >
              {option.label}
              {option.value === sentiment ? (
                <IconCheck className="size-4 text-primary" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </FieldRow>
  );

  const createdRow = (
    <FieldRow label="Created" className={insetRow}>
      <span className={cn("truncate", textClass)}>
        {phone
          ? `${formatShortDate(ticket.created_at)}, ${formatTicketTime(ticket.created_at)}`
          : formatTicketDateTime(ticket.created_at)}
        {creator ? ` by ${creator}` : ""}
      </span>
    </FieldRow>
  );

  const sla = <SlaSection sla={ticket.sla} priority={ticket.priority} />;
  const tags = <TagsSection {...props} />;
  const linkedOrder = (
    <LinkedOrderSection
      ticket={ticket}
      orders={props.customer?.orders}
      onOrdersSync={props.onOrdersSync}
      orderSyncLoading={props.orderSyncLoading}
      ordersDisabled={props.ordersDisabled}
    />
  );

  // The phone page groups the fields as the design does: what an agent
  // changes first, then the SLA and tags, then the read-only facts.
  if (phone) {
    return (
      <div className="pb-4">
        <div className={cn(PHONE_CARD, "divide-y")}>
          {statusRow}
          {priorityRow}
          {assigneeRow}
          {languageRow}
        </div>
        {sla}
        {tags}
        <div className={cn(PHONE_CARD, "divide-y px-4")}>
          {channelRow}
          {sentimentRow}
          {createdRow}
        </div>
        {linkedOrder}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1.5 px-4 py-4">
        {statusRow}
        {priorityRow}
        {assigneeRow}
        {languageRow}
        {channelRow}
        {sentimentRow}
        {createdRow}
      </div>
      {sla}
      {tags}
      {linkedOrder}
    </>
  );
}

// --- Customer tab ---------------------------------------------------------

type AddressLike = {
  phone?: string | null;
  city?: string | null;
  province?: string | null;
  province_code?: string | null;
  country?: string | null;
  country_code?: string | null;
};

const VISIBLE_OTHER_ORDERS = 1;
const VISIBLE_OTHER_TICKETS = 2;

function CustomerTab({
  ticket,
  customer,
  customerName,
  ordersLoading,
  onOrdersSync,
  orderSyncLoading,
  ordersDisabled,
  otherTickets,
  otherTicketsLoading,
  onLinkCustomer,
  onOpenTicket,
}: TicketDetailsProps) {
  const [allOrders, setAllOrders] = useState(false);
  const [allTickets, setAllTickets] = useState(false);
  const orders = useMemo(() => customer?.orders ?? [], [customer?.orders]);
  const linked = findLinkedOrder(ticket.order_id, orders);

  if (!customer) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <CustomerAvatar name={customerName} size="size-12" />
        <div>
          <p className="font-semibold">{customerName}</p>
          <p className="text-sm text-muted-foreground">
            This ticket isn&apos;t linked to a customer yet.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onLinkCustomer}>
          <IconUserPlus data-icon="inline-start" />
          Link customer
        </Button>
      </div>
    );
  }

  const address = (customer.addresses?.[0] ?? null) as AddressLike | null;
  const shipping = orders[0]?.shipping_address as
    | (AddressLike & Record<string, unknown>)
    | undefined;
  const phone =
    address?.phone ||
    orders.find((order) => order.customer_phone)?.customer_phone;
  const place = [
    address?.city ?? shipping?.city,
    address?.province_code ?? address?.province,
    address?.country ?? shipping?.country,
  ]
    .filter(Boolean)
    .join(", ");
  const currency = orders[0]?.currency;
  const lifetime = orders.reduce(
    (sum, order) => sum + (Number(order.total_price) || 0),
    0,
  );
  const allCustomerTickets = [{ status: ticket.status }, ...otherTickets];
  const openTickets = allCustomerTickets.filter(
    (item) => item.status === "open" || item.status === "reopen",
  ).length;
  const otherOpen = otherTickets.filter(
    (item) => item.status === "open" || item.status === "reopen",
  ).length;
  const others = orders.filter((order) => order.id !== linked?.id);
  const shownOrders = allOrders
    ? others
    : others.slice(0, VISIBLE_OTHER_ORDERS);
  const shownTickets = allTickets
    ? otherTickets
    : otherTickets.slice(0, VISIBLE_OTHER_TICKETS);
  const isShopify = customer.admin_url?.startsWith(
    "https://admin.shopify.com/",
  );
  const platform = isShopify ? "Shopify customer" : "Customer";
  const firstName = customerName.split(" ")[0];

  return (
    <>
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          <CustomerAvatar name={customerName} size="size-11" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">{customerName}</p>
            <p className="text-xs text-muted-foreground">
              {platform} · {orders.length} order{orders.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            {customer.admin_url ? (
              <a href={customer.admin_url} target="_blank" rel="noreferrer">
                {isShopify ? "Shopify" : "Store admin"}
                <IconArrowUpRight data-icon="inline-end" />
              </a>
            ) : (
              <Link href={`/crm/customers/${customer.id}`}>
                Profile
                <IconArrowUpRight data-icon="inline-end" />
              </Link>
            )}
          </Button>
        </div>

        <div className="mt-4 divide-y rounded-lg border text-sm">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <IconMail className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">
              {customer.email || "No email on file"}
            </span>
            {customer.email ? (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Copy email"
                onClick={() => {
                  void navigator.clipboard?.writeText(customer.email);
                  toast.success("Email copied");
                }}
              >
                <IconCopy className="size-3.5" />
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <IconPhone className="size-4 shrink-0 text-muted-foreground" />
            <span className={cn("truncate", !phone && "text-muted-foreground")}>
              {phone || "No phone on file"}
            </span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <IconMapPin className="size-4 shrink-0 text-muted-foreground" />
            <span className={cn("truncate", !place && "text-muted-foreground")}>
              {place || "No address on file"}
            </span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <IconClockHour4 className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              Customer since{" "}
              {/* Their signup on the store; our row's date if not synced. */}
              {new Date(
                customer.registered_at ?? customer.created_at,
              ).toLocaleDateString("en-GB", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      <Section title="Overview">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Lifetime value", value: formatMoney(lifetime, currency) },
            { label: "Orders", value: String(orders.length) },
            {
              label: "Avg. order value",
              value: formatMoney(
                orders.length ? lifetime / orders.length : 0,
                currency,
              ),
            },
            {
              label: "Open tickets",
              value: String(openTickets),
              danger: openTickets > 0,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="min-w-0 rounded-lg border px-3 py-2.5"
            >
              <p className="truncate text-xs text-muted-foreground">
                {stat.label}
              </p>
              <p
                className={cn(
                  "mt-0.5 truncate text-lg font-semibold",
                  stat.danger && "text-red-600",
                )}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Other orders"
        aside={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Sync orders"
              title="Sync orders"
              disabled={orderSyncLoading || ordersDisabled}
              onClick={onOrdersSync}
            >
              <IconRefresh
                className={cn("size-3.5", orderSyncLoading && "animate-spin")}
              />
            </Button>
            {others.length > VISIBLE_OTHER_ORDERS ? (
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => setAllOrders((shown) => !shown)}
              >
                {allOrders ? "Show less" : `View all ${orders.length}`}
              </button>
            ) : null}
          </div>
        }
      >
        {ordersLoading ? (
          <LoadingState label="Loading orders…" className="py-4" />
        ) : shownOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other orders.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {shownOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Other tickets"
        aside={
          otherOpen > 0 ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {otherOpen} open
            </span>
          ) : null
        }
      >
        {otherTicketsLoading ? (
          <LoadingState label="Loading tickets…" className="py-4" />
        ) : shownTickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other tickets.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {shownTickets.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left hover:bg-muted/50"
                onClick={() => onOpenTicket(item.id)}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {item.subject}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {ticketRef(item.ticket_id)} ·{" "}
                    {formatShortDate(item.created_at)} ·{" "}
                    {capitalizeText(item.status)}
                  </span>
                </span>
                <IconChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
            {otherTickets.length > VISIBLE_OTHER_TICKETS ? (
              <button
                type="button"
                className="self-start text-sm font-medium text-primary hover:underline"
                onClick={() => setAllTickets((shown) => !shown)}
              >
                {allTickets
                  ? "Show fewer tickets"
                  : `View all tickets from ${firstName}`}
              </button>
            ) : null}
          </div>
        )}
      </Section>
    </>
  );
}

// --- Activity tab ---------------------------------------------------------

function ActivityPill({ status }: { status: string }) {
  const meta = STATUS_META[status as SupportTicketStatus];
  const tone: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    reopen: "bg-pink-100 text-pink-700",
    snoozed: "bg-amber-100 text-amber-700",
    resolved: "bg-emerald-100 text-emerald-700",
    closed: "bg-zinc-100 text-zinc-600",
  };
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[11px] font-medium",
        tone[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {meta?.label ?? capitalizeText(status)}
    </span>
  );
}

const CREATED_BY_LABEL: Record<string, string> = {
  ai: "AI",
  agent: "Agent",
  rule: "Rule",
};

function ActivityTab({
  activity,
  activityLoading,
}: Pick<TicketDetailsProps, "activity" | "activityLoading">) {
  if (activityLoading) {
    return <LoadingState label="Loading activity…" className="py-8" />;
  }
  if (activity.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        No activity yet.
      </p>
    );
  }

  return (
    <ol className="relative flex flex-col gap-5 px-4 py-4 before:absolute before:top-7 before:bottom-7 before:left-[29px] before:w-px before:bg-border">
      {activity.map((item, index) => {
        const by =
          item.actor ??
          (item.type === "created" && item.to_value
            ? (CREATED_BY_LABEL[item.to_value] ?? capitalizeText(item.to_value))
            : null);
        const icon =
          item.type === "created" ? (
            <IconPlus className="size-3.5 text-primary" />
          ) : item.type === "assigned" ? (
            <IconArrowUpRight className="size-3.5 text-blue-600" />
          ) : (
            <IconCircleCheck className="size-3.5 text-emerald-600" />
          );
        const title =
          item.type === "created" ? (
            "Ticket created"
          ) : item.type === "status_changed" ? (
            <span className="flex flex-wrap items-center gap-1.5">
              Status changed
              {item.from_value ? (
                <>
                  <ActivityPill status={item.from_value} />
                  <IconArrowRight className="size-3 text-muted-foreground" />
                </>
              ) : null}
              {item.to_value ? <ActivityPill status={item.to_value} /> : null}
            </span>
          ) : !item.to_value ? (
            <>Unassigned {item.from_value}</>
          ) : !item.from_value ? (
            <>Assigned to {item.to_value}</>
          ) : (
            <>
              Reassigned from {item.from_value} to {item.to_value}
            </>
          );
        return (
          <li
            key={`${item.type}-${item.created_at}-${index}`}
            className="relative flex items-start gap-3"
          >
            <span className="z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background">
              {icon}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="text-sm font-medium">{title}</div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {by ? `${by} · ` : ""}
                {formatTicketDateTime(item.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// --- The panel ------------------------------------------------------------

function PanelTabs({
  closeButton,
  copilotMounted,
  ...props
}: TicketDetailsProps & { closeButton?: boolean; copilotMounted: boolean }) {
  const canUseCopilot = useCan("copilot");
  const copilot = canUseCopilot ? props.copilot : undefined;
  const phone = useContext(PhoneLayout);

  return (
    <Tabs defaultValue="ticket" className="flex min-h-0 flex-1 flex-col gap-0">
      {phone ? (
        <div className="flex shrink-0 items-center gap-1 px-2 pt-2">
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Back to ticket">
              <IconChevronLeft className="size-5" />
            </Button>
          </SheetClose>
          <h2 className="text-lg font-semibold">Details</h2>
        </div>
      ) : null}
      <div
        className={cn(
          "flex shrink-0 items-end justify-between border-b px-4",
          phone ? "h-14" : "h-16",
        )}
      >
        <TabsList
          variant="line"
          className={cn(
            "p-0 group-data-horizontal/tabs:h-auto",
            phone ? "w-full gap-0" : "gap-4",
          )}
        >
          {[
            { value: "ticket", label: "Ticket" },
            { value: "customer", label: "Customer" },
            { value: "activity", label: "Activity" },
            ...(copilot ? [{ value: "copilot", label: "Copilot" }] : []),
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "h-12 rounded-none px-1 pb-3 text-[15px] after:bg-primary group-data-horizontal/tabs:after:bottom-0 data-active:font-semibold",
                phone ? "flex-1" : "flex-none",
              )}
            >
              {tab.value === "copilot" ? <IconSparkles /> : null}
              {tab.label}
              {tab.value === "activity" &&
              props.activity.length > 0 &&
              !phone ? (
                <span className="rounded-full bg-primary/10 px-1.5 text-xs font-semibold text-primary">
                  {props.activity.length}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
        {closeButton && !phone ? (
          <SheetClose asChild>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Close details"
              className="mb-3"
            >
              <IconX className="size-4" />
            </Button>
          </SheetClose>
        ) : null}
      </div>
      <div
        className={cn(
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto",
          phone && "bg-muted/50",
        )}
      >
        <TabsContent value="ticket">
          <TicketTab {...props} />
        </TabsContent>
        <TabsContent value="customer">
          <CustomerTab {...props} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab
            activity={props.activity}
            activityLoading={props.activityLoading}
          />
        </TabsContent>
        {copilot ? (
          <TabsContent value="copilot" className="flex h-full min-h-0 flex-col">
            {copilotMounted ? (
              <TicketCopilotPanel
                key={copilot.ticketId}
                storeCode={copilot.storeCode}
                ticketId={copilot.ticketId}
                refreshKey={copilot.refreshKey}
                onInsertDraft={copilot.onInsertDraft}
              />
            ) : null}
          </TabsContent>
        ) : null}
      </div>
    </Tabs>
  );
}

/**
 * The open ticket's details beside the conversation: its fields, SLA, tags
 * and linked order; the customer behind it; and its history.
 *
 * Docked from `xl`; narrower, it opens as a drawer from the conversation's
 * "Details" button, and on a phone as a full-screen Details page.
 */
export function TicketDetailsPanel({
  open,
  onOpenChange,
  ...props
}: TicketDetailsProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const phone = useIsMobile();

  return (
    <>
      <aside className="hidden min-h-0 w-[360px] shrink-0 flex-col overflow-hidden border-l bg-background xl:flex 2xl:w-[380px]">
        {/* Copilot runs model calls, so it mounts in the pane or the sheet,
            never both. */}
        <PanelTabs {...props} copilotMounted={!open} />
      </aside>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className={cn(
            "gap-0 overflow-hidden p-0 xl:hidden",
            phone
              ? "data-[side=right]:w-full data-[side=right]:max-w-none data-[side=right]:border-l-0 data-[side=right]:sm:max-w-none"
              : "w-full data-[side=right]:sm:max-w-md",
          )}
        >
          <SheetTitle className="sr-only">Ticket details</SheetTitle>
          <SheetDescription className="sr-only">
            The ticket&apos;s fields, its customer and its history.
          </SheetDescription>
          <PhoneLayout.Provider value={phone}>
            <PanelTabs {...props} closeButton copilotMounted={open} />
          </PhoneLayout.Provider>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** The right column before a ticket is chosen, and while one loads. */
export function TicketDetailsPlaceholder({
  loading,
  label,
}: {
  loading?: boolean;
  label: string;
}) {
  return (
    <aside className="hidden w-[360px] shrink-0 flex-col items-center justify-center border-l px-6 text-center xl:flex 2xl:w-[380px]">
      {loading ? (
        <LoadingState label={label} />
      ) : (
        <p className="text-sm text-muted-foreground">{label}</p>
      )}
    </aside>
  );
}
