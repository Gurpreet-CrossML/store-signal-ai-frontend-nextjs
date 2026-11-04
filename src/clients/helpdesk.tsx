"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  startTransition,
  type ChangeEvent,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  IconAlarmSnoozeFilled,
  IconArrowsSort,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconCircleCheck,
  IconCircleX,
  IconDeviceFloppy,
  IconFilter,
  IconInbox,
  IconInfoCircle,
  IconLanguage,
  IconLayoutSidebar,
  IconLayoutSidebarRight,
  IconLock,
  IconMessageChatbot,
  IconPaperclip,
  IconReload,
  IconSend,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { useSubSidebar } from "@/hooks/use-sub-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

import { SyncCustomerOrders } from "@/redux/api-slice/order-slice";
import { ticketRef } from "@/components/custom/ticket-priority-bar";
import { LinkCustomerDialog } from "@/components/custom/link-customer-dialog";
import {
  CustomerAvatar,
  getInitials,
} from "@/components/custom/customer-avatar";
import { MessageAttachments } from "@/components/custom/helpdesk/message-attachments";
import { HiddenTagsBadge, tint } from "@/components/custom/helpdesk/tag-badge";
import { TicketSlaIndicator } from "@/components/custom/helpdesk/ticket-sla";
import { CreateTicketAction } from "@/components/custom/helpdesk/create-ticket-action";
import { HelpdeskViewsMenuItems } from "@/components/custom/helpdesk/helpdesk-nav-panel";
import {
  PRIORITY_META,
  STATUS_META,
  TicketDetailsPanel,
  TicketDetailsPlaceholder,
  findLinkedOrder,
  formatMoney,
  formatTicketDateTime,
  formatTicketTime,
} from "@/components/custom/helpdesk/ticket-details-panel";
import { LoadingState } from "@/components/custom/loading-state";
import { SearchInput } from "@/components/custom/search-input";

import { DEFAULT_HELPDESK_QUEUE, ENDPOINTS } from "@/lib/config";
import {
  SUPPORT_ATTACHMENT_ALLOWED_EXTENSIONS,
  prepareSupportAttachments,
} from "@/lib/support-attachment-constants";
import {
  DEFAULT_TICKET_LANGUAGE,
  CHANNEL_META,
  SUPPORTED_LANGUAGES,
  TICKET_SENTIMENTS,
  type TicketLanguage,
  type TicketSentiment,
} from "@/lib/ticket-options";
import {
  helpdeskChannelRows,
  helpdeskFilterToQuery,
  helpdeskViewCount,
  helpdeskViewLabel,
  ticketBelongsToHelpdeskFilter,
} from "@/lib/helpdesk-filters";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchSupportTickets,
  refreshFilterCounts,
  setHelpdeskQueue,
  FetchSupportTicketTags,
  SupportTicketStaffAssign,
  FetchSupportTicketDetails,
  SupportTicketMessageSend,
  SupportTicketAgentDraftSave,
  SupportTicketTagAssign,
  SupportTicketTagRemove,
  // SupportMessageImprove,
  SupportTicketSnooze,
  SupportTicketMarkRead,
  SupportTicketAIMessageDraftGenerate,
  SupportTicketCustomerLink,
  SupportTicketStatusUpdate,
  SupportTicketPriorityUpdate,
  SupportTicketLanguageSentimentUpdate,
  SupportTicketMessagesTranslate,
  SupportTicketActivityFetch,
  TicketTagCreate,
  type SupportTicket,
  type SupportTicketActivityItem,
  type SupportTicketChannel,
  type SupportTicketCreatedBy,
  type SupportTicketPriority,
  type SupportTicketMessage,
  type SupportTicketCustomer,
  type SupportTicketOrdering,
  type SupportTicketStatus,
  type SupportTicketFilterCounts,
  type SupportTicketFilters,
  type SupportTicketStatusCounts,
  type SupportSocketPayload,
} from "@/redux/api-slice/support-ticket-slice";
import { FetchStaff, type StaffMember } from "@/redux/api-slice/tenancy-slice";
import { can } from "@/lib/access-rules";
import { FetchFreshdeskTicketId } from "@/redux/api-slice/thread-slice";
import { capitalizeText, formatRelativeDateTime } from "@/lib/helpers";

const RichTextArea = dynamic(
  () => import("@/components/custom/rich-text-area"),
  {
    ssr: false,
  },
);

// Max tags to show in a ticket row, before a "+N".
const MAX_VISIBLE_TKT_ROW_TAGS = 2;
// Narrower rows on a phone.
const MAX_VISIBLE_TKT_ROW_TAGS_MOBILE = 1;

/** Hides a horizontal scrollbar while keeping the strip scrollable. */
const NO_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/**
 * A phone: one pane at a time, list or conversation. From `md` (an iPad,
 * either way up) the list stays beside the conversation.
 */
function isPhoneWidth() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches
  );
}

/**
 * How a customer is named on screen. The API sends either a customer object
 * or a bare string, and either may be empty — an unidentified customer is a
 * "Guest", the same word the live chat uses for one.
 */
function customerLabel(
  customer: SupportTicketCustomer | null | string,
): string {
  if (!customer) return "Guest";
  if (typeof customer === "string") return customer.trim() || "Guest";
  return customer.name?.trim() || customer.email?.trim() || "Guest";
}

/** How a channel reads in a ticket row and the conversation. */
function channelLabel(channel: SupportTicket["channel"]) {
  return CHANNEL_META[channel]?.label ?? capitalizeText(channel);
}

/** A high or urgent ticket says so in its row; the others stay quiet. */
const ROW_PRIORITY_CHIP: Partial<Record<SupportTicketPriority, string>> = {
  high: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  urgent: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

function RowChip({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-28 shrink-0 items-center truncate rounded px-1.5 py-0.5 text-[11px] font-medium leading-none",
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}

function TicketRow({
  ticket,
  active,
  onSelect,
}: {
  ticket: SupportTicket;
  active?: boolean;
  onSelect: () => void;
}) {
  const customerName = customerLabel(ticket.customer);
  const order = findLinkedOrder(
    ticket.order_id,
    ticket.customer && typeof ticket.customer === "object"
      ? ticket.customer.orders
      : null,
  );
  const unread = !ticket.is_read;
  const priorityChip = ROW_PRIORITY_CHIP[ticket.priority];
  const tags = ticket.tags ?? [];

  const renderTags = (max: number, showHidden = true) => (
    <>
      {tags.slice(0, max).map((tag) => (
        <RowChip
          key={tag.id}
          style={
            tag.color
              ? { color: tag.color, backgroundColor: tint(tag.color, 0.12) }
              : undefined
          }
          className={tag.color ? undefined : "bg-muted text-muted-foreground"}
        >
          {tag.name}
        </RowChip>
      ))}
      {showHidden && tags.length > max ? (
        <HiddenTagsBadge
          tags={tags.slice(max)}
          label={`+${tags.length - max}`}
        />
      ) : null}
    </>
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "relative flex w-full items-start gap-3 border-b px-4 py-3.5 text-left transition-colors",
        active ? "bg-primary/5" : "hover:bg-muted/50",
      )}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px] bg-primary"
        />
      ) : null}
      <span className="relative shrink-0">
        <CustomerAvatar name={customerName} size="size-9" />
        {unread ? (
          <span
            aria-label="Unread"
            className="absolute -top-0.5 -left-1 size-3 rounded-[3px] bg-primary ring-2 ring-background"
          />
        ) : null}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[15px] font-semibold text-foreground">
            {customerName}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            {/* Only a ticket being worked on can be late. */}
            {ticket.status === "open" || ticket.status === "reopen" ? (
              <TicketSlaIndicator sla={ticket.sla} />
            ) : null}
            {ticket.is_snoozed ? (
              <IconAlarmSnoozeFilled className="size-3 text-primary" />
            ) : null}
            {formatRelativeDateTime(
              ticket.last_message_at || ticket.created_at,
            )}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <p
              className={cn(
                "mt-0.5 truncate text-sm",
                unread ? "font-semibold text-foreground" : "text-foreground/80",
              )}
            >
              {ticket.subject}
            </p>
          </TooltipTrigger>
          <TooltipContent className="max-w-80">{ticket.subject}</TooltipContent>
        </Tooltip>
        <div className="mt-1.5 flex min-w-0 items-center gap-1.5 overflow-hidden text-xs text-muted-foreground">
          <span className="shrink-0">
            {ticket.order_id ? `#${ticket.order_id}` : "No order linked"}
            {order
              ? ` · ${formatMoney(order.total_price, order.currency).replace(/\.00$/, "")}`
              : ""}
          </span>
          <span aria-hidden>·</span>
          <span className="shrink-0">{channelLabel(ticket.channel)}</span>
          {priorityChip ? (
            <RowChip className={priorityChip}>
              {capitalizeText(ticket.priority)}
            </RowChip>
          ) : null}
          <span className="hidden min-w-0 items-center gap-1.5 md:flex">
            {renderTags(MAX_VISIBLE_TKT_ROW_TAGS)}
          </span>
          {/* A phone row has room for one chip: the priority, else a tag. */}
          <span className="flex min-w-0 items-center gap-1.5 md:hidden">
            {renderTags(
              priorityChip ? 0 : MAX_VISIBLE_TKT_ROW_TAGS_MOBILE,
              false,
            )}
          </span>
        </div>
      </div>
    </button>
  );
}

const queues = [
  { key: "open", label: "Open" },
  { key: "reopen", label: "Reopen" },
  // Hidden for now: snoozing is not available from the UI yet.
  // { key: "snoozed", label: "Snoozed" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
] as const;

const DEFAULT_SORT_ORDER: SupportTicketOrdering = "last_updated";

const SORT_OPTIONS: { key: SupportTicketOrdering; label: string }[] = [
  { key: "last_updated", label: "Last updated" },
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
];

/**
 * Where an agent can move a ticket from the status menu. Mirrors the API:
 * only a resolved ticket can be opened or closed and a closed one only
 * reopened, and snoozed is set from the snooze control, never from here.
 */
const STATUS_TRANSITIONS: Record<SupportTicketStatus, SupportTicketStatus[]> = {
  open: ["resolved"],
  reopen: ["resolved"],
  snoozed: ["resolved"],
  resolved: ["open", "closed"],
  closed: ["reopen"],
};

/** Negative so an optimistic message can never collide with a server id. */
const createTempMessageId = () => -Date.now();

/** Copy for the confirmation shown before each status change. */
const STATUS_CONFIRMATIONS = {
  open: {
    title: "Open ticket",
    description:
      "Are you sure you want to open this ticket? This will mark the ticket as open.",
    action: "Open ticket",
  },
  reopen: {
    title: "Reopen ticket",
    description:
      "Are you sure you want to reopen this ticket? This will mark the ticket as reopened.",
    action: "Reopen ticket",
  },
  resolved: {
    title: "Mark ticket as resolved",
    description:
      "Are you sure this issue has been resolved? This will mark the ticket as resolved.",
    action: "Mark resolved",
  },
  closed: {
    title: "Close ticket",
    description:
      "Are you sure you want to close this ticket? This will mark the ticket as closed.",
    action: "Close ticket",
  },
} as const;

type TicketFilterSelection = {
  channels: SupportTicketChannel[];
  priorities: SupportTicketPriority[];
  sentiments: TicketSentiment[];
  assignees: AssigneeChoice[];
};

type AssigneeChoice = "me" | "unassigned" | "teammates";

const emptyTicketFilters: TicketFilterSelection = {
  channels: [],
  priorities: [],
  sentiments: [],
  assignees: [],
};

/** The known values of a comma-separated param; a hand-edited URL may hold others. */
const pickParam = <T extends string>(param: string, known: readonly T[]) =>
  known.filter((value) => param.split(",").includes(value));

/** Who opened a ticket, as the conversation's opening card says it. */
const CREATED_BY_LABEL: Record<SupportTicketCreatedBy, string> = {
  ai: "AI",
  agent: "an agent",
  rule: "a rule",
};

const priorityOptions: { value: SupportTicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const assigneeOptions: { value: AssigneeChoice; label: string }[] = [
  { value: "me", label: "Me" },
  { value: "unassigned", label: "Unassigned" },
  { value: "teammates", label: "Teammates" },
];

/** Sidebar views that already decide the assignee, so the chips stay off. */
const ASSIGNEE_VIEWS = ["unassigned", "assigned_to_me"];

/** "Me" with "Unassigned" has no API equivalent, so picking one disables the other. */
const EXCLUSIVE_ASSIGNEE: Partial<Record<string, AssigneeChoice>> = {
  me: "unassigned",
  unassigned: "me",
};

/** The assignee chips as the list API's two assignment filters. */
function assigneeQuery(choices: AssigneeChoice[]): SupportTicketFilters {
  const me = choices.includes("me");
  const unassigned = choices.includes("unassigned");
  const teammates = choices.includes("teammates");
  // Never offered together (see EXCLUSIVE_ASSIGNEE); a hand-edited URL with
  // both is not filtered, as all three chips would not be.
  if (me && unassigned) return {};
  if (me) return teammates ? { is_assigned: true } : { assigned_to_me: true };
  if (unassigned) {
    return teammates ? { assigned_to_me: false } : { is_assigned: false };
  }
  return teammates ? { is_assigned: true, assigned_to_me: false } : {};
}

/** The open view's ticket count, for the list's title. */
function viewCount(
  filter: string,
  counts: SupportTicketFilterCounts | null,
  fallback: number,
) {
  const fixed = helpdeskViewCount(filter, counts);
  if (fixed !== undefined) return fixed;
  const [param, ...rest] = filter.split(":");
  const value = rest.join(":");
  if (param === "tags") {
    return counts?.tags.find((tag) => tag.name === value)?.count ?? fallback;
  }
  if (param === "channel") {
    return (
      counts?.channels.find((channel) => channel.value === value)?.count ??
      fallback
    );
  }
  return fallback;
}

function TicketListPanel({
  rows,
  activeTicketId,
  activeQueue,
  activeFilter,
  filterCounts,
  onQueueChange,
  sortOrder,
  onSortChange,
  onSelectTicket,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  searchValue,
  onSearchChange,
  filters,
  isFilterOpen,
  onFilterOpenChange,
  onFiltersChange,
  onApplyFilters,
  supportTicketStatusCount,
  className,
}: {
  /** Visibility below `lg`, where list and conversation take turns. */
  className?: string;
  rows: SupportTicket[];
  activeTicketId: number | null;
  activeQueue: SupportTicketStatus;
  /** The left panel's view (`?filter=`), which names the list. */
  activeFilter: string;
  filterCounts: SupportTicketFilterCounts | null;
  onQueueChange: (queue: SupportTicketStatus) => void;
  sortOrder: SupportTicketOrdering;
  onSortChange: (order: SupportTicketOrdering) => void;
  onSelectTicket: (ticketId: number) => void;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: TicketFilterSelection;
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  onFiltersChange: (filters: TicketFilterSelection) => void;
  onApplyFilters: () => void;
  supportTicketStatusCount: SupportTicketStatusCounts;
}) {
  const subSidebar = useSubSidebar();
  const isPhone = useIsMobile();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const activeFilterCount =
    Object.values(filters).flat().length -
    (ASSIGNEE_VIEWS.includes(activeFilter) ? filters.assignees.length : 0);
  const filterGroups: {
    key: keyof TicketFilterSelection;
    label: string;
    options: readonly { value: string; label: string }[];
  }[] = [
    {
      key: "channels",
      label: "Channel",
      options: helpdeskChannelRows(filterCounts),
    },
    { key: "priorities", label: "Priority", options: priorityOptions },
    { key: "sentiments", label: "Sentiment", options: TICKET_SENTIMENTS },
    { key: "assignees", label: "Assignee", options: assigneeOptions },
  ];
  const title = helpdeskViewLabel(activeFilter, filterCounts);
  const count = viewCount(
    activeFilter,
    filterCounts,
    supportTicketStatusCount?.[activeQueue] ?? 0,
  );

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (!hasMore || isLoading || isLoadingMore) return;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 120) {
      onLoadMore();
    }
  };

  const viewsMenu = (withTags: boolean) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-w-0 items-center gap-1.5 rounded-md text-left"
        >
          <span className="truncate text-xl font-semibold tracking-tight">
            {title}
          </span>
          <span className="text-xl font-normal text-muted-foreground">
            {count}
          </span>
          <IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-68 p-1.5">
        <HelpdeskViewsMenuItems
          onCreateTicket={() => setIsCreateOpen(true)}
          withTags={withTags}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const filterButton = (
    <Popover open={isFilterOpen} onOpenChange={onFilterOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label="Filter Tickets"
        >
          <IconFilter className="size-4" />
          {activeFilterCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {activeFilterCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Filter tickets</p>
          <button
            type="button"
            className="text-sm font-medium text-primary"
            onClick={() => onFiltersChange(emptyTicketFilters)}
          >
            Clear all
          </button>
        </div>
        <div className="max-h-[65vh] divide-y overflow-y-auto">
          {filterGroups.map((group) => {
            const selected: string[] = filters[group.key];
            const isAssignee = group.key === "assignees";
            const setByView =
              isAssignee && ASSIGNEE_VIEWS.includes(activeFilter);
            return (
              <div
                key={group.key}
                role="group"
                aria-labelledby={`ticket-filter-${group.key}`}
                className="px-4 py-3"
              >
                <p
                  id={`ticket-filter-${group.key}`}
                  className="mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  {group.label}
                  {setByView ? (
                    <span className="ml-1 font-normal tracking-normal normal-case">
                      · Set by the {title} view
                    </span>
                  ) : null}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const active =
                      !setByView && selected.includes(option.value);
                    const exclusive = EXCLUSIVE_ASSIGNEE[option.value];
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        disabled={
                          setByView ||
                          (isAssignee &&
                            !!exclusive &&
                            selected.includes(exclusive))
                        }
                        onClick={() =>
                          onFiltersChange({
                            ...filters,
                            [group.key]: active
                              ? selected.filter(
                                  (value) => value !== option.value,
                                )
                              : [...selected, option.value],
                          })
                        }
                        className={cn(
                          "h-8 rounded-full border px-3 text-sm transition-colors disabled:pointer-events-none disabled:opacity-50",
                          active
                            ? "border-primary bg-primary/10 font-medium text-primary"
                            : "bg-background text-foreground hover:bg-muted",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 border-t p-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFilterOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={onApplyFilters}>
            Show results
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <section
      className={cn(
        "h-full min-h-0 w-full min-w-0 flex-col border-r bg-background md:flex md:w-[300px] md:shrink-0 desktop:w-[340px] 2xl:w-[380px]",
        className,
      )}
    >
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 md:border-b">
        <div className="flex min-w-0 items-center gap-2">
          {/* Below xl (iPad, phone) the panel stays shut and its views live
              in this menu — with tags on a phone only, as designed. On a
              desktop they move here only once the panel is hidden. */}
          <div className="min-w-0 md:hidden">{viewsMenu(true)}</div>
          <div className="hidden min-w-0 md:block xl:hidden">
            {viewsMenu(false)}
          </div>
          {subSidebar.hidden ? (
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Show Help Desk menu"
              className="hidden shrink-0 xl:inline-flex"
              onClick={subSidebar.toggle}
            >
              <IconLayoutSidebar className="size-4" />
            </Button>
          ) : null}
          <div className="hidden min-w-0 xl:block">
            {subSidebar.hidden ? (
              viewsMenu(false)
            ) : (
              <h1 className="flex items-baseline gap-1.5 text-xl font-semibold tracking-tight">
                <span className="truncate">{title}</span>
                <span className="font-normal text-muted-foreground">
                  {count}
                </span>
              </h1>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {filterButton}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Sort tickets"
                  >
                    <IconArrowsSort className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                Sort: {SORT_OPTIONS.find((o) => o.key === sortOrder)?.label}
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Sort by
              </DropdownMenuLabel>
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.key}
                  onSelect={() =>
                    option.key !== sortOrder && onSortChange(option.key)
                  }
                  className="justify-between py-2"
                >
                  {option.label}
                  {option.key === sortOrder ? (
                    <IconCheck className="size-4 text-primary" />
                  ) : null}
                </DropdownMenuItem>
              ))}
              {/* Shown as designed; the list API cannot order by priority yet. */}
              <DropdownMenuItem disabled className="justify-between py-2">
                Priority, highest first
                <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
                  Soon
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <CreateTicketAction variant="fab" className="md:hidden" />
        </div>
      </header>

      <div className="shrink-0 px-4 pt-1 pb-3 md:pt-3">
        <SearchInput
          className="w-full"
          value={searchValue}
          onChange={onSearchChange}
          placeholder={
            isPhone
              ? "Search name, ticket or order #"
              : "Search name, email, ticket or order #"
          }
          label="Search tickets"
        />
      </div>

      {/* Status tabs: a segmented control from `md`, scrolling pills on a
          phone — never a visible scrollbar or clipped labels. */}
      <div className="shrink-0 px-4 pb-3">
        <div className="hidden gap-0.5 rounded-lg bg-muted p-1 md:flex">
          {queues.map((queue) => {
            const active = queue.key === activeQueue;
            return (
              <button
                key={queue.key}
                type="button"
                aria-pressed={active}
                onClick={() => !active && onQueueChange(queue.key)}
                className={cn(
                  // Sized to fit all four in the narrowest list (300px at `md`).
                  "flex h-8 flex-auto items-center justify-center gap-1 rounded-md px-1 text-xs whitespace-nowrap transition-colors desktop:px-1.5 desktop:text-[13px]",
                  active
                    ? "bg-background font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {queue.label}
                <span className={cn(active ? "text-primary" : undefined)}>
                  {supportTicketStatusCount?.[queue.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
        <div
          className={cn(
            "-mx-4 flex gap-2 overflow-x-auto px-4 md:hidden",
            NO_SCROLLBAR,
          )}
        >
          {queues.map((queue) => {
            const active = queue.key === activeQueue;
            return (
              <button
                key={queue.key}
                type="button"
                aria-pressed={active}
                onClick={() => !active && onQueueChange(queue.key)}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-1 rounded-full border px-4 text-sm whitespace-nowrap",
                  active
                    ? "border-foreground bg-foreground font-medium text-background"
                    : "bg-background text-foreground",
                )}
              >
                {queue.label} {supportTicketStatusCount?.[queue.key] ?? 0}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto border-t"
        onScroll={handleScroll}
      >
        {isLoading && rows?.length === 0 ? (
          <LoadingState label="Loading tickets…" className="py-10" />
        ) : !rows || rows?.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
            <IconInbox className="mb-1 size-7 text-muted-foreground opacity-40" />
            <Typography variant="small" as="p">
              No tickets found
            </Typography>
            <Typography variant="muted">
              Try a different view, search, or filter.
            </Typography>
          </div>
        ) : (
          rows?.map((ticket, index) => (
            <TicketRow
              key={`${ticket.id}-${ticket.customer}-${index}`}
              ticket={ticket}
              active={ticket.id === activeTicketId}
              onSelect={() => onSelectTicket(ticket.id)}
            />
          ))
        )}
        {rows?.length > 0 && hasMore && isLoadingMore ? (
          <LoadingState label="Loading more tickets…" className="py-4" />
        ) : null}
      </div>

      <CreateTicketAction
        variant="dialog"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </section>
  );
}

/** The first message of a day says the date as well as the time. */
function messageTime(value: string, withDate: boolean) {
  const date = new Date(value);
  const time = formatTicketTime(value);
  return withDate
    ? `${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${time}`
    : time;
}

/** A status change, as one line between the messages. */
type ThreadEvent = {
  kind: "event";
  id: string;
  created_at: string;
  text: string;
};

const STATUS_VERBS: Record<string, string> = {
  open: "opened",
  reopen: "reopened",
  resolved: "resolved",
  closed: "closed",
  snoozed: "snoozed",
};

/**
 * The ticket's status changes as lines for the conversation, oldest first.
 * Two changes by the same person within two minutes read as one line:
 * "resolved and closed this ticket".
 */
function threadEvents(activity: SupportTicketActivityItem[]): ThreadEvent[] {
  const changes = activity
    .filter((item) => item.type === "status_changed" && item.to_value)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  const events: ThreadEvent[] = [];
  let last: { actor: string | null; at: number; verbs: string[] } | null = null;
  changes.forEach((item, index) => {
    const at = new Date(item.created_at).getTime();
    const verb =
      STATUS_VERBS[item.to_value ?? ""] ?? `moved to ${item.to_value}`;
    if (last && last.actor === item.actor && at - last.at < 2 * 60000) {
      last.verbs.push(verb);
      last.at = at;
      const event = events[events.length - 1];
      event.text = `${item.actor ?? "Someone"} ${last.verbs.join(" and ")} this ticket`;
      return;
    }
    last = { actor: item.actor, at, verbs: [verb] };
    events.push({
      kind: "event",
      id: `event-${index}-${item.created_at}`,
      created_at: item.created_at,
      text: `${item.actor ?? "Someone"} ${verb} this ticket`,
    });
  });
  return events;
}

/**
 * Staff names in a note, wrapped so the markdown renderer can colour them
 * as mentions. Only real teammates' names are matched, so an email address
 * or a stray "@" stays as typed.
 */
function markMentions(text: string, names: string[]) {
  return names
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .reduce(
      (current, name) =>
        current.replace(
          new RegExp(
            `@${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w*])`,
            "g",
          ),
          `**@${name}**`,
        ),
      text,
    );
}

function ConversationPanel({
  ticket,
  messages,
  staff,
  currentUser,
  activity,
  reply,
  attachments,
  onAttachmentsChange,
  isSending,
  onReplyChange,
  onSend,
  onSaveDraft,
  isClosed,
  onTranslate,
  isTranslating,
  translatedLanguage,
  onRequestStatus,
  onBack,
  onShowDetails,
  className,
}: {
  /** Opens the details drawer, for widths where the panel is not docked. */
  onShowDetails: () => void;
  /** Returns to the ticket list. Only offered below `lg`, where the two panes take turns. */
  onBack: () => void;
  className?: string;
  ticket: SupportTicket;
  messages: SupportTicketMessage[];
  /** Who wrote the agent messages and notes. */
  staff: StaffMember[];
  currentUser: { name?: string | null; email?: string | null };
  /** The ticket's history, for the status lines between messages. */
  activity: SupportTicketActivityItem[];
  reply: string;
  attachments: File[];
  onAttachmentsChange: (files: File[]) => void;
  isSending: boolean;
  onReplyChange: (value: string) => void;
  /** Reply is the default; internal note and translated reply are deliberate choices. */
  onSend: (
    mode: "reply" | "note" | "customer_language" | "reply_and_resolve",
  ) => void;
  onSaveDraft: () => void;
  isClosed: boolean;
  onTranslate: (code: string) => void;
  isTranslating: boolean;
  /** Language the messages are currently shown in, if translated. */
  translatedLanguage: { code: string; name: string } | null;
  /** Asks first: every status change emails the customer. */
  onRequestStatus: (status: SupportTicketStatus) => void;
}) {
  const [selectedSendMode, setSelectedSendMode] = useState<
    "reply" | "customer_language" | "reply_and_resolve"
  >("reply");
  const [noteMode, setNoteMode] = useState(false);
  // Opening another ticket goes back to replying, so a note meant for one
  // ticket is never sent to the next one's customer by mistake, or the reverse.
  const [noteTicketId, setNoteTicketId] = useState(ticket.id);
  if (noteTicketId !== ticket.id) {
    setNoteTicketId(ticket.id);
    setNoteMode(false);
  }
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const transitions = STATUS_TRANSITIONS[ticket.status] ?? [];
  // Only offered while resolving is a legal move for the ticket's status.
  const canResolve = transitions.includes("resolved");
  // The ticket may have moved on since "send and resolve" was picked.
  const effectiveSendMode =
    selectedSendMode === "reply_and_resolve" && !canResolve
      ? "reply"
      : selectedSendMode;
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const result = prepareSupportAttachments(
      Array.from(event.target.files ?? []),
      attachments,
    );
    result.errors.forEach((error) => toast.error(error));
    onAttachmentsChange(result.files);
    event.target.value = "";
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [ticket.id, messages.length]);
  const isPhone = useIsMobile();

  // Tickets from before these fields existed come back without them.
  const ticketLanguage = ticket.language ?? DEFAULT_TICKET_LANGUAGE;
  const customerName = customerLabel(ticket.customer);
  const firstName = customerName.split(" ")[0];
  const chatThreadId =
    ticket.customer && typeof ticket.customer === "object"
      ? ticket.customer.thread_id
      : null;
  const staffNames = staff.map((member) =>
    `${member.first_name} ${member.last_name}`.trim(),
  );

  /** Who wrote an agent message or note. */
  const authorOf = (message: SupportTicketMessage) => {
    if (message.id < 0) return currentUser.name || "You";
    const member = staff.find((candidate) => candidate.id === message.agent);
    return member
      ? `${member.first_name} ${member.last_name}`.trim() || member.email
      : "Agent";
  };
  // Your own messages carry the accent colour; a teammate's are blue.
  const isMine = (message: SupportTicketMessage) =>
    message.id < 0 ||
    (Boolean(currentUser.email) &&
      staff
        .find((candidate) => candidate.id === message.agent)
        ?.email?.toLowerCase() === currentUser.email?.toLowerCase());
  // A phone has room for first names only.
  const shortName = (name: string) => (isPhone ? name.split(" ")[0] : name);

  // Messages and status lines in one timeline, oldest first.
  const timeline: (
    | { kind: "message"; message: SupportTicketMessage; index: number }
    | ThreadEvent
  )[] = [
    ...messages.map((message, index) => ({
      kind: "message" as const,
      message,
      index,
    })),
    ...threadEvents(activity),
  ].sort((a, b) => {
    const at = (item: typeof a) =>
      new Date(
        item.kind === "message" ? item.message.created_at : item.created_at,
      ).getTime();
    return at(a) - at(b);
  });

  const sendLabel = noteMode
    ? "Add note"
    : effectiveSendMode === "customer_language"
      ? "Send translated"
      : effectiveSendMode === "reply_and_resolve"
        ? "Send & resolve"
        : "Send";
  // Replies on a non-English ticket are always translated, so billed.
  const sendCostsCredit =
    !noteMode &&
    (effectiveSendMode === "customer_language" ||
      ticketLanguage !== DEFAULT_TICKET_LANGUAGE);
  const composerDisabled = isSending || isClosed || isTranslating;

  const statusButtons = (
    <>
      {canResolve ? (
        <Button
          variant="outline"
          size="sm"
          className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
          onClick={() => onRequestStatus("resolved")}
        >
          <IconCheck data-icon="inline-start" />
          Resolve
        </Button>
      ) : null}
      {transitions.includes("open") ? (
        <Button
          variant="outline"
          size="sm"
          className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400"
          onClick={() => onRequestStatus("open")}
        >
          <IconInbox data-icon="inline-start" />
          Open
        </Button>
      ) : null}
      {transitions.includes("closed") ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRequestStatus("closed")}
        >
          <IconCircleX data-icon="inline-start" />
          Close
        </Button>
      ) : null}
      {transitions.includes("reopen") ? (
        <Button
          variant="outline"
          size="sm"
          className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400"
          onClick={() => onRequestStatus("reopen")}
        >
          <IconReload data-icon="inline-start" />
          Reopen
        </Button>
      ) : null}
    </>
  );

  const translateMenu = (trigger: React.ReactNode) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isClosed || isTranslating}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-0">
        <div className="border-b px-3 py-2.5">
          <p className="text-sm font-semibold">Translate the conversation</p>
          <p className="text-xs text-muted-foreground">
            Shows the messages in another language. Uses 1 AI credit.
          </p>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {SUPPORTED_LANGUAGES.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onSelect={() => onTranslate(language.code)}
              className="justify-between py-2"
            >
              {language.name}
              {language.code === translatedLanguage?.code ? (
                <IconCheck className="size-4 text-primary" />
              ) : language.code === ticketLanguage ? (
                <span className="text-xs font-medium text-primary">
                  Customer&apos;s language
                </span>
              ) : null}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const attachButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Attach files"
      title="Attach files"
      disabled={composerDisabled}
      onClick={() => attachmentInputRef.current?.click()}
    >
      <IconPaperclip className="size-4" />
    </Button>
  );

  const sendButton = (
    <ButtonGroup>
      <Button
        size="sm"
        className="h-9 px-3.5"
        onClick={() => onSend(noteMode ? "note" : effectiveSendMode)}
        disabled={composerDisabled}
        title={sendCostsCredit ? "Uses 1 AI credit" : undefined}
      >
        {isSending ? (
          <Spinner className="size-4" />
        ) : (
          <IconSend className="size-4" />
        )}
        {isSending ? "Sending…" : sendLabel}
      </Button>
      {!noteMode ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="h-9 border-l border-primary-foreground/20 px-2"
              disabled={composerDisabled}
              aria-label="Choose send option"
            >
              <IconChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 p-1.5">
            {(
              [
                { mode: "reply", label: "Send", icon: IconSend },
                {
                  mode: "customer_language",
                  label: "Send in customer's language",
                  icon: IconLanguage,
                  credit: true,
                },
                ...(canResolve
                  ? [
                      {
                        mode: "reply_and_resolve",
                        label: "Send and resolve",
                        icon: IconCircleCheck,
                      },
                    ]
                  : []),
              ] as {
                mode: typeof selectedSendMode;
                label: string;
                icon: typeof IconSend;
                credit?: boolean;
              }[]
            ).map((option) => (
              <DropdownMenuItem
                key={option.mode}
                onSelect={() => setSelectedSendMode(option.mode)}
                className="items-start gap-3 py-2.5"
              >
                <option.icon className="mt-0.5 size-4" />
                <span className="flex-1">
                  <span className="block text-sm">{option.label}</span>
                  {option.credit ? (
                    <span className="block text-xs text-destructive">
                      1 AI credit
                    </span>
                  ) : null}
                </span>
                {option.mode === effectiveSendMode ? (
                  <IconCheck className="mt-0.5 size-4 text-primary" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </ButtonGroup>
  );

  return (
    <main
      className={cn("min-w-0 flex-1 flex-col bg-background md:flex", className)}
    >
      {/* Desktop and tablet header. */}
      <header className="hidden h-16 shrink-0 items-center gap-3 border-b px-4 md:flex md:px-6">
        <CustomerAvatar name={customerName} size="size-9" />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-2">
            <h2 className="truncate text-base font-semibold">
              {ticket.subject}
            </h2>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {ticketRef(ticket.ticket_id)}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {customerName} · opened {formatTicketDateTime(ticket.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="xl:hidden"
            onClick={onShowDetails}
          >
            <IconLayoutSidebarRight data-icon="inline-start" />
            Details
          </Button>
          {statusButtons}
        </div>
      </header>

      {/* Phone header: back, the ticket, and its state as chips. */}
      <header className="shrink-0 border-b md:hidden">
        <div className="flex items-center gap-2 px-2 pt-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to ticket list"
            onClick={onBack}
          >
            <IconChevronLeft className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold">
              {ticket.subject}
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {customerName} · {ticketRef(ticket.ticket_id)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ticket details"
            onClick={onShowDetails}
          >
            <IconInfoCircle className="size-5" />
          </Button>
          <div className="flex shrink-0 items-center gap-1.5">
            {statusButtons}
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 pt-1 pb-2.5">
          <div
            className={cn(
              "flex min-w-0 flex-1 gap-2 overflow-x-auto",
              NO_SCROLLBAR,
            )}
          >
            <button
              type="button"
              onClick={onShowDetails}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-sm font-medium",
                ticket.status === "closed"
                  ? "bg-zinc-100 text-zinc-600"
                  : ticket.status === "resolved"
                    ? "bg-emerald-50 text-emerald-700"
                    : ticket.status === "reopen"
                      ? "bg-pink-50 text-pink-700"
                      : "bg-blue-50 text-blue-700",
              )}
            >
              {STATUS_META[ticket.status].label}
            </button>
            <button
              type="button"
              onClick={onShowDetails}
              className="shrink-0 rounded-full bg-muted px-3 py-1 text-sm"
            >
              {PRIORITY_META[ticket.priority].label}
            </button>
            <button
              type="button"
              onClick={onShowDetails}
              className="shrink-0 truncate rounded-full bg-muted px-3 py-1 text-sm"
            >
              {ticket.internal_assignee?.name ?? "Unassigned"}
            </button>
          </div>
          <button
            type="button"
            onClick={onShowDetails}
            className="shrink-0 text-sm font-medium text-primary"
          >
            Details
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-muted/30">
        <div className="flex flex-col gap-5 px-4 py-5 md:px-6">
          {timeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 p-6 text-center">
              <IconMessageChatbot className="mb-1 size-6 text-muted-foreground opacity-40" />
              <Typography variant="small" as="p">
                No messages yet
              </Typography>
              <Typography variant="muted">
                Messages exchanged with the customer will appear here.
              </Typography>
            </div>
          ) : (
            timeline.map((item, position) => {
              if (item.kind === "event") {
                return (
                  <p
                    key={item.id}
                    className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"
                  >
                    <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                    {item.text} · {messageTime(item.created_at, true)}
                  </p>
                );
              }

              const { message, index } = item;
              const previous = timeline
                .slice(0, position)
                .reverse()
                .find((entry) => entry.kind === "message");
              const newDay =
                !previous ||
                previous.kind !== "message" ||
                new Date(previous.message.created_at).toDateString() !==
                  new Date(message.created_at).toDateString();
              const time =
                message.id < 0
                  ? "Sending…"
                  : messageTime(message.created_at, newDay);
              const isNote = message.message_type === "internal";
              const isAgent = !isNote && message.sender_type === "agent";
              const isSystem = message.sender_type === "system";

              const body = (
                <>
                  <MessageAttachments
                    attachments={message.attachments}
                    pendingFiles={message.pendingFiles}
                  />
                  <div className="rich-text-render text-[15px] leading-6 [overflow-wrap:anywhere] text-foreground">
                    <ReactMarkdown
                      components={{
                        // A note's mentions read as names, in the accent colour.
                        strong: ({ children }) => {
                          const text = String(children ?? "");
                          return text.startsWith("@") ? (
                            <strong className="font-semibold text-primary">
                              {children}
                            </strong>
                          ) : (
                            <strong>{children}</strong>
                          );
                        },
                      }}
                    >
                      {isNote
                        ? markMentions(message.message, staffNames)
                        : message.message}
                    </ReactMarkdown>
                  </div>
                  {/* What the customer actually received, so a wrong
                      language is caught and fixed from the language field. */}
                  {message.metadata?.translated_message ? (
                    <div className="mt-2 border-t border-primary/20 pt-2">
                      <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <IconLanguage className="size-3.5" />
                        Sent in{" "}
                        {message.metadata.translated_message.language_name}
                      </p>
                      <div className="rich-text-render text-[15px] leading-6 [overflow-wrap:anywhere] text-foreground">
                        <ReactMarkdown>
                          {message.metadata.translated_message.message}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : null}
                </>
              );

              // The issue a ticket opens with: the card heading the thread.
              if (isSystem && index === 0) {
                const creator = ticket.created_by_type
                  ? CREATED_BY_LABEL[ticket.created_by_type]
                  : "AI";
                const source =
                  ticket.channel === "web"
                    ? "a live chat"
                    : channelLabel(ticket.channel);
                return (
                  <div
                    key={message.id}
                    className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 md:mr-12"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-primary">
                        <IconSparkles className="size-3.5 shrink-0" />
                        <span className="truncate">
                          {isPhone
                            ? `Created by ${creator} from ${source.replace(/^a /, "")}`
                            : `Ticket created by ${creator} from ${source}`}{" "}
                          · {time}
                        </span>
                      </p>
                      {chatThreadId ? (
                        <Link
                          href={`/support/?chat=${chatThreadId}`}
                          className="hidden shrink-0 text-xs font-medium text-primary underline md:inline"
                        >
                          View chat
                        </Link>
                      ) : null}
                    </div>
                    {body}
                    {chatThreadId ? (
                      <Link
                        href={`/support/?chat=${chatThreadId}`}
                        className="mt-1 inline-block text-sm font-medium text-primary underline md:hidden"
                      >
                        View chat
                      </Link>
                    ) : null}
                  </div>
                );
              }

              if (isNote || isAgent) {
                const author = shortName(authorOf(message));
                return (
                  <div
                    key={message.id}
                    className="flex items-start justify-end gap-3"
                  >
                    <div
                      className={cn(
                        "min-w-0 max-w-full md:max-w-[75%]",
                        isNote
                          ? "rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10"
                          : "",
                      )}
                    >
                      {isNote ? (
                        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                          <IconLock className="size-3.5" />
                          Internal note · {author} · {time}
                        </p>
                      ) : (
                        <p className="mb-1 text-right text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {author}
                          </span>{" "}
                          · {time}
                        </p>
                      )}
                      {isNote ? (
                        body
                      ) : (
                        <div className="rounded-2xl bg-primary/10 px-4 py-3">
                          {body}
                        </div>
                      )}
                    </div>
                    <span className="hidden md:block">
                      <Avatar className="size-9">
                        <AvatarFallback
                          className={cn(
                            "text-xs font-semibold text-white",
                            isMine(message) ? "bg-primary" : "bg-blue-600",
                          )}
                        >
                          {getInitials(author) ?? "A"}
                        </AvatarFallback>
                      </Avatar>
                    </span>
                  </div>
                );
              }

              // The customer: their own words, or an issue the AI summarised.
              return (
                <div key={message.id} className="flex items-start gap-3">
                  <span className="hidden md:block">
                    <CustomerAvatar name={customerName} size="size-9" />
                  </span>
                  <div className="min-w-0 max-w-full md:max-w-[75%]">
                    <p className="mb-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {shortName(customerName)}
                      </span>{" "}
                      · {time}
                      {isSystem
                        ? " · summarised by AI"
                        : ticket.channel !== "web"
                          ? ` · by ${channelLabel(ticket.channel).toLowerCase()}`
                          : ""}
                    </p>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3",
                        isSystem ? "bg-muted" : "border bg-background",
                      )}
                    >
                      {body}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {isClosed ? (
        <div className="shrink-0 bg-muted/30 p-4 md:px-6">
          <div className="flex items-center gap-3 rounded-xl border bg-background px-4 py-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <IconLock className="size-4 text-muted-foreground" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                This ticket is{" "}
                {ticket.status === "resolved" ? "resolved" : "closed"}
              </p>
              <p className="text-sm text-muted-foreground">
                {ticket.status === "resolved" ? "Open" : "Reopen"} it to reply
                to {firstName} or add an internal note.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="shrink-0 bg-muted/30 p-3 md:px-6 md:pt-0 md:pb-4">
          <div
            className={cn(
              "overflow-hidden rounded-2xl border bg-background shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30 md:rounded-xl",
              noteMode && "border-amber-300 bg-amber-50/40 dark:bg-amber-500/5",
              // The phone composer has no formatting row.
              "max-md:[&_[role=toolbar]]:hidden",
            )}
          >
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 border-b px-3 py-2">
                {attachments.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex max-w-full items-center gap-2 rounded-md border bg-muted/40 px-2 py-1 text-sm"
                  >
                    <IconPaperclip className="size-4 shrink-0" />
                    <span className="max-w-48 truncate" title={file.name}>
                      {file.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Remove ${file.name}`}
                      disabled={isSending}
                      onClick={() =>
                        onAttachmentsChange(
                          attachments.filter(
                            (_, fileIndex) => fileIndex !== index,
                          ),
                        )
                      }
                    >
                      <IconX className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <RichTextArea
              id="ticket-reply-editor"
              value={reply}
              onChange={onReplyChange}
              useMarkdown
              toolbar="compact"
              toolbarEnd={
                <>
                  {attachButton}
                  {translateMenu(
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 px-2"
                      title={
                        translatedLanguage
                          ? `Translated to ${translatedLanguage.name}`
                          : undefined
                      }
                    >
                      {isTranslating ? (
                        <Spinner className="size-4" />
                      ) : (
                        <IconLanguage className="size-4" />
                      )}
                      {translatedLanguage
                        ? `Translated to ${translatedLanguage.name}`
                        : "Translate"}
                      <span className="text-xs font-normal text-destructive">
                        1 credit
                      </span>
                    </Button>,
                  )}
                </>
              }
              disabled={composerDisabled}
              placeholder={
                noteMode
                  ? "Write an internal note…"
                  : `${isPhone ? "Reply" : "Write a reply"} to ${firstName}…`
              }
              minHeight="4.5rem"
              className="bg-transparent"
            />
            <input
              ref={attachmentInputRef}
              type="file"
              multiple
              accept={SUPPORT_ATTACHMENT_ALLOWED_EXTENSIONS.join(",")}
              className="hidden"
              aria-label="Choose attachments"
              onChange={handleAttachmentChange}
            />
            <div className="flex items-center gap-2 px-3 pt-1 pb-3">
              {/* The phone's attach and translate, where the toolbar was. */}
              <span className="flex items-center md:hidden">
                {attachButton}
                {translateMenu(
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Translate the conversation"
                  >
                    {isTranslating ? (
                      <Spinner className="size-4" />
                    ) : (
                      <IconLanguage className="size-4" />
                    )}
                  </Button>,
                )}
              </span>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Switch
                  checked={noteMode}
                  onCheckedChange={setNoteMode}
                  disabled={composerDisabled}
                  aria-label="Internal note"
                />
                <span className="hidden md:inline">Internal note</span>
                <span className="md:hidden">Note</span>
              </label>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={onSaveDraft}
                  disabled={isClosed || isTranslating}
                  aria-label="Save draft"
                >
                  <IconDeviceFloppy className="size-4 md:hidden" />
                  <span className="hidden md:inline">Save draft</span>
                </Button>
                {sendButton}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function HelpDesk() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeFilter = searchParams?.get("filter") ?? "";
  /** Deep link to one ticket, e.g. from the Live Support detail panel. */
  const linkedTicketId = Number(searchParams?.get("ticket") ?? "");

  const dispatch = useAppDispatch();
  const { data: session } = useSession();

  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchSupportTicketsListData, FetchSupportTicketsLoading } =
    useAppSelector(
      (state) => state.GetSupportTicketsReducer.FetchSupportTicketsState,
    );
  const {
    FetchSupportTicketDetailsData,
    FetchSupportTicketDetailsIsLoading,
    FetchSupportTicketDetailsIsError,
  } = useAppSelector(
    (state) => state.GetSupportTicketsReducer.FetchSupportTicketDetailsState,
  );
  const { SupportTicketMessageSendIsLoading } = useAppSelector(
    (state) => state.GetSupportTicketsReducer.SupportTicketMessageSendState,
  );
  const { FetchSupportTicketTagsData, FetchSupportTicketTagsIsLoading } =
    useAppSelector(
      (state) => state.GetSupportTicketsReducer.FetchSupportTicketTagsState,
    );
  //  const { SupportMessageImproveIsLoading } = useAppSelector(
  //   (state) => state.GetSupportTicketsReducer.SupportMessageImproveState,
  // );
  const { SupportTicketAIMessageDraftGenerateIsLoading } = useAppSelector(
    (state) =>
      state.GetSupportTicketsReducer.SupportTicketAIMessageDraftGenerateState,
  );
  const { SyncCustomerOrdersIsLoading } = useAppSelector(
    (state) => state.GetOrderReducer.SyncCustomerOrdersState,
  );
  const { SupportTicketMessagesTranslateIsLoading } = useAppSelector(
    (state) =>
      state.GetSupportTicketsReducer.SupportTicketMessagesTranslateState,
  );
  const { staff } = useAppSelector((state) => state.GetTenancyReducer);
  const { FetchFreshdeskTicketIdData, FetchFreshdeskTicketIdIsLoading } =
    useAppSelector(
      (state) => state.GetThreadReducer.FetchFreshdeskTicketIdState,
    );

  const [ticketRows, setTicketRows] = useState<SupportTicket[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  // Below `lg` there is room for one of the list and the conversation, not
  // both. This only decides which one shows there; it never touches the
  // open ticket, so the first ticket still opens on load and every
  // handler behaves exactly as it does on a wide screen. A ticket id in the
  // URL (a deep link, or a refresh after the user opened one) shows the
  // conversation; with none, it shows the list. That only holds because
  // narrow screens never open a ticket on their own — see the first-ticket
  // default in the list fetch — so an id in the URL means the user chose it.
  const [portraitView, setPortraitView] = useState<"list" | "conversation">(
    Number.isInteger(linkedTicketId) && linkedTicketId > 0
      ? "conversation"
      : "list",
  );
  // In the store rather than here: the left panel counts the tickets of this
  // tab only.
  const activeQueue = useAppSelector(
    (state) => state.GetSupportTicketsReducer.HelpdeskQueue,
  );
  const setActiveQueue = (queue: SupportTicketStatus) =>
    dispatch(setHelpdeskQueue(queue));
  // Back on "Open" next time, as it was when the tab was local to the screen.
  useEffect(
    () => () => {
      dispatch(setHelpdeskQueue(DEFAULT_HELPDESK_QUEUE));
    },
    [dispatch],
  );
  const [supportTikcetMessages, setSupportTicketMessages] = useState<
    SupportTicketMessage[]
  >([]);
  const [activeSupportTicket, setActiveSupportTicket] =
    useState<SupportTicket | null>(null);
  const currentActiveSupportTicketIdRef = useRef<number | null>(null);
  // What the list was last filtered by, to tell a filter change from a plain
  // refetch (another page, a new sort, a different store).
  const lastFilterKeyRef = useRef<string | null>(null);
  const supportSocketRef = useRef<WebSocket | null>(null);
  const supportSocketReconnectTimerRef = useRef<number | null>(null);

  const [showTagPicker, setShowTagPicker] = useState(false);

  // Every status change waits for a yes, since each one emails the customer.
  // Here rather than in a pane: the header, the details panel and the phone
  // chips all ask for one.
  const [pendingStatus, setPendingStatus] = useState<
    keyof typeof STATUS_CONFIRMATIONS | null
  >(null);
  const pendingConfirmation = pendingStatus
    ? STATUS_CONFIRMATIONS[pendingStatus]
    : null;
  // Taking a tag off changes the ticket's SLA, so it waits for a yes too.
  const [pendingTagRemoval, setPendingTagRemoval] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // The open ticket's history: the Activity tab, and the status lines in the
  // conversation. Only shown once it is this ticket's.
  const [activityTicketId, setActivityTicketId] = useState<number | null>(null);
  const {
    SupportTicketActivityFetchData,
    SupportTicketActivityFetchIsLoading,
  } = useAppSelector(
    (state) => state.GetSupportTicketsReducer.SupportTicketActivityFetchState,
  );
  const { FetchSupportTicketFilterCountsData } = useAppSelector(
    (state) =>
      state.GetSupportTicketsReducer.FetchSupportTicketFilterCountsState,
  );

  // Which language the open ticket's messages are being shown in. Scoped to
  // the ticket: translating rewrites the loaded messages, and opening
  // another ticket loads untranslated ones.
  const [translatedLanguage, setTranslatedLanguage] = useState<{
    code: string;
    name: string;
  } | null>(null);

  const [reply, setReply] = useState("");
  const [attachmentSelection, setAttachmentSelection] = useState<{
    ticketId: number | null;
    files: File[];
  }>({ ticketId: null, files: [] });
  const attachments =
    attachmentSelection.ticketId === activeTicketId
      ? attachmentSelection.files
      : [];

  // Support Ticket Search Filters
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tagPage, setTagPage] = useState(1);
  const [tagSearchInput, setTagSearchInput] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // The filter popover's choices and the sort live in the query string, so
  // they survive a refresh and a shared link, and stay put while the sidebar
  // view changes (its links carry them along). Read as plain strings first so
  // the objects below keep their identity until one really changes.
  const channelParam = searchParams?.get("channel") ?? "";
  const priorityParam = searchParams?.get("priority") ?? "";
  const sentimentParam = searchParams?.get("sentiment") ?? "";
  const assigneeParam = searchParams?.get("assignee") ?? "";
  const sortParam = searchParams?.get("sort");

  const appliedFilters = useMemo<TicketFilterSelection>(
    () => ({
      channels: pickParam(
        channelParam,
        Object.keys(CHANNEL_META) as SupportTicketChannel[],
      ),
      priorities: pickParam(
        priorityParam,
        priorityOptions.map((option) => option.value),
      ),
      sentiments: pickParam(
        sentimentParam,
        TICKET_SENTIMENTS.map((option) => option.value),
      ),
      assignees: pickParam(
        assigneeParam,
        assigneeOptions.map((option) => option.value),
      ),
    }),
    [channelParam, priorityParam, sentimentParam, assigneeParam],
  );
  const sortOrder: SupportTicketOrdering =
    SORT_OPTIONS.find((option) => option.key === sortParam)?.key ??
    DEFAULT_SORT_ORDER;

  /** Sets (or, with null, drops) query params, leaving the others as they are. */
  const updateQueryParams = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : (pathname ?? ""), {
      scroll: false,
    });
  };

  // Open a deep-linked ticket once. The detail request keys on the id
  // alone, so the ticket does not have to be on the loaded page — which is
  // the point, since the link may arrive from another screen entirely.
  const [seededTicketId, setSeededTicketId] = useState<number | null>(null);
  if (
    Number.isInteger(linkedTicketId) &&
    linkedTicketId > 0 &&
    seededTicketId !== linkedTicketId
  ) {
    setSeededTicketId(linkedTicketId);
    setActiveTicketId(linkedTicketId);
  }

  // A ticket belongs to a store, so switching stores cannot leave one
  // open. Guarded on the *previous* code being set: the first transition is
  // "" → the loaded store, which is initialisation, not a switch — treating
  // it as one would throw away a ticket named in the URL before its request
  // was ever made.
  const [lastStoreCode, setLastStoreCode] = useState(storeCode);
  if (lastStoreCode !== storeCode) {
    setLastStoreCode(storeCode);
    if (lastStoreCode) {
      setActiveTicketId(null);
      setPortraitView("list");
      setActiveSupportTicket(null);
      setTicketRows([]);
      setPage(1);
    }
  }

  // Switching sidebar filter resets paging. The list request keys on
  // `page`, so arriving on a filter while page 2 was loaded asked for a
  // second page that a narrower filter may not have — the API answers
  // "invalid page" and the screen shows nothing.
  const [lastActiveFilter, setLastActiveFilter] = useState(activeFilter);
  if (lastActiveFilter !== activeFilter) {
    setLastActiveFilter(activeFilter);
    setPage(1);
    setTicketRows([]);
    setPortraitView("list");
  }

  // A new filter or sort starts the list over, whether it came from the
  // controls or from the back button.
  const listParamsKey = JSON.stringify([appliedFilters, sortOrder]);
  const [lastListParamsKey, setLastListParamsKey] = useState(listParamsKey);
  if (lastListParamsKey !== listParamsKey) {
    setLastListParamsKey(listParamsKey);
    setPage(1);
    setTicketRows([]);
  }

  // The popover's choices until "Show results" puts them in the URL.
  const [draftFilters, setDraftFilters] =
    useState<TicketFilterSelection>(emptyTicketFilters);

  const ticketTags = FetchSupportTicketTagsData?.results;

  const upsertSocketTicket = useCallback(
    (incomingTicket: SupportTicket) => {
      setTicketRows((currentRows) => {
        const existedIndex = currentRows.findIndex(
          (row) => row.id === incomingTicket.id,
        );

        if (existedIndex !== -1) {
          const existingTicket = currentRows[existedIndex];
          const updatedTicket = {
            ...existingTicket,
            ...incomingTicket,
            tags: incomingTicket.tags.length
              ? incomingTicket.tags
              : existingTicket.tags,
            messages: incomingTicket.messages?.length
              ? incomingTicket.messages
              : existingTicket.messages,
            drafts: incomingTicket.drafts?.length
              ? incomingTicket.drafts
              : existingTicket.drafts,
            last_message:
              incomingTicket.last_message ??
              existingTicket.last_message ??
              incomingTicket.description,
            last_message_at:
              incomingTicket.last_message_at ??
              existingTicket.last_message_at ??
              incomingTicket.created_at,
          };

          // A status that changed on its own (a customer reply reopening a
          // closed ticket) takes the ticket out of the queue being viewed.
          if (updatedTicket.status !== activeQueue) {
            return currentRows.filter((row) => row.id !== incomingTicket.id);
          }

          return currentRows.map((row) =>
            row.id === incomingTicket.id ? updatedTicket : row,
          );
        }

        if (incomingTicket.status !== activeQueue) {
          return currentRows;
        }

        return [
          {
            ...incomingTicket,
            tags: incomingTicket.tags ?? [],
            messages: incomingTicket.messages ?? [],
            drafts: incomingTicket.drafts ?? [],
            last_message:
              incomingTicket.last_message ?? incomingTicket.description,
            last_message_at:
              incomingTicket.last_message_at ?? incomingTicket.created_at,
          },
          ...currentRows,
        ];
      });

      setActiveSupportTicket((current) => {
        if (!current || current.id !== incomingTicket.id) {
          return current;
        }

        return {
          ...current,
          ...incomingTicket,
          tags: incomingTicket.tags.length ? incomingTicket.tags : current.tags,
          messages: incomingTicket.messages?.length
            ? incomingTicket.messages
            : current.messages,
          drafts: incomingTicket.drafts?.length
            ? incomingTicket.drafts
            : current.drafts,
          last_message: incomingTicket.last_message ?? current.last_message,
          last_message_at:
            incomingTicket.last_message_at ?? current.last_message_at,
        };
      });
    },
    [activeQueue],
  );

  const appendSocketMessage = useCallback(
    (ticketId: number, incomingMessage: SupportTicketMessage) => {
      if (currentActiveSupportTicketIdRef.current !== ticketId) {
        return;
      }

      setSupportTicketMessages((currentMessages) =>
        currentMessages.some((message) => message.id === incomingMessage.id)
          ? currentMessages.map((message) =>
              message.id === incomingMessage.id ? incomingMessage : message,
            )
          : [...currentMessages, incomingMessage],
      );

      setActiveSupportTicket((current) => {
        if (!current || current.id !== ticketId) {
          return current;
        }

        return {
          ...current,
          messages: [...(current.messages ?? []), incomingMessage],
          last_message: incomingMessage.message,
          last_message_at: incomingMessage.created_at,
        };
      });
    },
    [],
  );

  const handleSupportTicketMarkRead = async () => {
    if (!storeCode || !currentActiveSupportTicketIdRef.current) return;

    try {
      const markReadTicket = await dispatch(
        SupportTicketMarkRead({
          storeCode,
          ticketId: currentActiveSupportTicketIdRef.current,
        }),
      ).unwrap();

      if (markReadTicket) {
        setTicketRows((current) =>
          current.map((ticket) =>
            ticket.id === currentActiveSupportTicketIdRef.current
              ? { ...ticket, is_read: markReadTicket.is_read }
              : ticket,
          ),
        );

        setActiveSupportTicket((current) =>
          current
            ? {
                ...current,
                is_read: markReadTicket.is_read,
              }
            : current,
        );
      }
    } catch {
      //
    }
  };

  useEffect(() => {
    if (!storeCode || !session?.user?.access_token) {
      if (supportSocketRef.current) {
        supportSocketRef.current.close();
        supportSocketRef.current = null;
      }

      if (supportSocketReconnectTimerRef.current) {
        window.clearTimeout(supportSocketReconnectTimerRef.current);
        supportSocketReconnectTimerRef.current = null;
      }

      return;
    }

    let isMounted = true;

    const connectSocket = () => {
      if (!isMounted) return;

      const token = session?.user?.access_token;
      if (!token) {
        return;
      }

      if (supportSocketRef.current) {
        supportSocketRef.current.close();
        supportSocketRef.current = null;
      }

      const socketUrl = ENDPOINTS.supportSocket(storeCode, token);
      const socket = new WebSocket(socketUrl);
      supportSocketRef.current = socket;

      socket.onopen = () => {
        console.info("Support socket connected");
        if (supportSocketReconnectTimerRef.current) {
          window.clearTimeout(supportSocketReconnectTimerRef.current);
          supportSocketReconnectTimerRef.current = null;
        }
      };

      socket.onmessage = (event) => {
        let payload: SupportSocketPayload;

        try {
          payload = JSON.parse(event.data) as SupportSocketPayload;
        } catch (error) {
          console.error("Failed to parse support socket message", error);
          return;
        }

        if (!payload.ticket) return;

        // An agent's reply or a status change moved the ticket's SLA: update
        // its timers on the list and in the open ticket's header, nothing else.
        if (payload.event === "ticket_sla_updated") {
          const slaTicketId = payload.ticket.id;
          const sla = payload.ticket.sla ?? null;
          setTicketRows((currentRows) =>
            currentRows.map((row) =>
              row.id === slaTicketId ? { ...row, sla } : row,
            ),
          );
          setActiveSupportTicket((current) =>
            current && current.id === slaTicketId
              ? { ...current, sla }
              : current,
          );
          return;
        }

        dispatch(refreshFilterCounts());

        if (payload.event === "ticket_created") {
          upsertSocketTicket(payload.ticket);
          return;
        }

        // "ticket_updated" is the AI adding an issue to an existing ticket:
        // same payload as a customer message, and the same consequences —
        // top of the list, unread, new preview, appended if open.
        if (
          payload.event === "customer_message" ||
          payload.event === "ticket_updated"
        ) {
          const incomingTicket = payload.ticket;
          const incomingMessage = payload.message;

          if (!incomingMessage) return;

          setTicketRows((currentRows) => {
            const existingIndex = currentRows.findIndex(
              (row) => row.id === incomingTicket.id,
            );

            if (existingIndex !== -1) {
              const existingTicket = currentRows[existingIndex];
              const updatedTicket = {
                ...existingTicket,
                ...incomingTicket,
                last_message: incomingMessage.message,
                last_message_at: incomingMessage.created_at,
                is_read: incomingTicket.is_read ?? existingTicket.is_read,
                tags: incomingTicket.tags.length
                  ? incomingTicket.tags
                  : existingTicket.tags,
                messages: existingTicket.messages ?? incomingTicket.messages,
                drafts: existingTicket.drafts ?? incomingTicket.drafts,
              };

              const rowsWithoutTicket = currentRows.filter(
                (row) => row.id !== incomingTicket.id,
              );

              // The reply may have reopened the ticket, moving it to
              // another queue.
              if (updatedTicket.status !== activeQueue) {
                return rowsWithoutTicket;
              }

              if (incomingTicket.is_snoozed) {
                return currentRows.map((row) =>
                  row.id === incomingTicket.id ? updatedTicket : row,
                );
              }

              return [updatedTicket, ...rowsWithoutTicket];
            }

            if (incomingTicket.status !== activeQueue) {
              return currentRows;
            }

            if (incomingTicket.is_snoozed) {
              return currentRows;
            }

            return [
              {
                ...incomingTicket,
                tags: incomingTicket.tags ?? [],
                messages: incomingTicket.messages ?? [],
                drafts: incomingTicket.drafts ?? [],
                last_message: incomingMessage.message,
                last_message_at: incomingMessage.created_at,
              },
              ...currentRows,
            ];
          });

          if (currentActiveSupportTicketIdRef.current === incomingTicket.id) {
            appendSocketMessage(incomingTicket.id, incomingMessage);
            void handleSupportTicketMarkRead();
            // The message may have started a new wait for a reply: the open
            // ticket's header follows its list row.
            setActiveSupportTicket((current) =>
              current && current.id === incomingTicket.id
                ? { ...current, sla: incomingTicket.sla ?? null }
                : current,
            );
          }
        }
      };

      socket.onclose = () => {
        if (supportSocketRef.current === socket) {
          supportSocketRef.current = null;
        }

        if (!isMounted) return;

        supportSocketReconnectTimerRef.current = window.setTimeout(() => {
          connectSocket();
        }, 5000);
      };

      socket.onerror = () => {
        // console.error("Support socket error", error);
      };
    };

    connectSocket();

    return () => {
      isMounted = false;

      if (supportSocketReconnectTimerRef.current) {
        window.clearTimeout(supportSocketReconnectTimerRef.current);
        supportSocketReconnectTimerRef.current = null;
      }

      if (supportSocketRef.current) {
        supportSocketRef.current.close();
        supportSocketRef.current = null;
      }
    };
    // Reopening the socket on mark-read handler changes would churn the
    // connection; the handler is invoked with fresh state via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeQueue,
    appendSocketMessage,
    session?.user?.access_token,
    storeCode,
    upsertSocketTicket,
  ]);

  // Only admins and supervisors assign tickets, and only they may read the
  // staff list; fetching it as anyone else would only fail with an error toast.
  const canAssign = can(session?.user, "reassignment", { write: true });
  useEffect(() => {
    if (!storeCode || !canAssign) return;

    dispatch(FetchStaff());
  }, [dispatch, storeCode, canAssign]);

  useEffect(() => {
    if (!storeCode) return;

    const filters: SupportTicketFilters = {
      status: activeQueue,
      ordering: sortOrder,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(appliedFilters.channels.length
        ? { channel: appliedFilters.channels }
        : {}),
      ...(appliedFilters.priorities.length
        ? { priority: appliedFilters.priorities }
        : {}),
      ...(appliedFilters.sentiments.length
        ? { sentiment: appliedFilters.sentiments }
        : {}),
      // An assignee view decides the assignee itself; see ASSIGNEE_VIEWS.
      ...(ASSIGNEE_VIEWS.includes(activeFilter)
        ? {}
        : assigneeQuery(appliedFilters.assignees)),
    };

    // The sidebar view is the narrower of the two: it replaces, rather than
    // adds to, whatever the filter panel set for the same field.
    Object.assign(filters, helpdeskFilterToQuery(activeFilter));

    // Did this fetch come from changing what the list is filtered by? The
    // first fetch is not one: it must leave a deep-linked ticket alone.
    const filterKey = JSON.stringify([
      activeFilter,
      debouncedSearch,
      appliedFilters,
      activeQueue,
    ]);
    const isFilterChange =
      lastFilterKeyRef.current !== null &&
      lastFilterKeyRef.current !== filterKey;
    lastFilterKeyRef.current = filterKey;

    const fetchArgs = {
      store_code: storeCode,
      page,
      limit: 20,
      filters,
    };

    const fetchTickets = async () => {
      const isLoadMore = page > 1;

      if (isLoadMore) {
        setIsLoadingMore(true);
      }

      try {
        const data = await dispatch(FetchSupportTickets(fetchArgs)).unwrap();

        setTicketRows((prev) =>
          page === 1 ? data.results : [...prev, ...data.results],
        );

        // Which ticket is open once the list is in.
        //
        // Nothing open: open the list's first. Applying a filter: the open
        // ticket stays if it is in the filtered list, otherwise the first of
        // that list opens, or none when the list is empty. A plain refetch
        // never swaps the ticket — this used to replace it with the first row
        // whenever it was not among the loaded ones, so every link to a
        // ticket past the first page silently landed on a different ticket.
        //
        // Not on a narrow screen: there the list is the landing view and a
        // ticket opens only when tapped, so defaulting one would put its id
        // in the URL and open it on the next refresh.
        const openId = currentActiveSupportTicketIdRef.current;
        const openTicketLeftList =
          isFilterChange &&
          openId !== null &&
          !data.results.some((ticket) => ticket.id === openId);

        if (page === 1 && (!openId || openTicketLeftList)) {
          const next = isPhoneWidth() ? null : (data.results[0] ?? null);
          setActiveTicketId(next?.id ?? null);
          setActiveSupportTicket(next);
        }
      } finally {
        if (isLoadMore) {
          setIsLoadingMore(false);
        }
      }
    };

    fetchTickets();
  }, [
    dispatch,
    storeCode,
    page,
    activeQueue,
    activeFilter,
    debouncedSearch,
    appliedFilters,
    sortOrder,
  ]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextSearch = searchValue.trim();
      if (nextSearch === debouncedSearch) return;

      setDebouncedSearch(nextSearch);
      setPage(1);
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [searchValue, debouncedSearch]);

  // Debounced like the ticket search above, and back to the first page: the
  // tags already loaded say nothing about which ones match.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextSearch = tagSearchInput.trim();
      if (nextSearch === tagSearch) return;

      setTagSearch(nextSearch);
      setTagPage(1);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [tagSearchInput, tagSearch]);

  useEffect(() => {
    if (!storeCode) return;
    const request = dispatch(
      FetchSupportTicketTags({
        storeCode,
        page: tagPage,
        limit: 15,
        search: tagSearch,
        append: tagPage > 1,
      }),
    );

    // A slower answer to an earlier search must not overwrite a newer one.
    return () => request.abort();
  }, [dispatch, storeCode, tagPage, tagSearch]);

  // Mirror the open ticket into the query string, so a refresh, a shared
  // link and the back button all land on the same ticket. `replace`, not
  // `push`: clicking down a queue should not bury the previous page under
  // twenty history entries.
  useEffect(() => {
    if (!pathname) return;

    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const current = params.get("ticket");
    const next = activeTicketId ? String(activeTicketId) : null;
    if (current === next) return;

    if (next) params.set("ticket", next);
    else params.delete("ticket");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [activeTicketId, pathname, router, searchParams]);

  useEffect(() => {
    currentActiveSupportTicketIdRef.current = activeTicketId || null;
    if (!storeCode || !activeTicketId) return;

    dispatch(
      FetchSupportTicketDetails({ storeCode, ticketId: activeTicketId }),
    );
    // `storeCode` belongs in here, not just in the guard above. A ticket
    // deep-linked in the address bar is selected on the very first render,
    // before the store list has resolved — so this effect ran once, bailed
    // on the empty store code, and never ran again. The list masked it:
    // it used to overwrite the selection when its rows arrived, which
    // re-fired this effect by accident, on the wrong ticket.
  }, [dispatch, storeCode, activeTicketId]);

  useEffect(() => {
    if (!FetchSupportTicketDetailsData) return;

    startTransition(() => {
      setActiveSupportTicket(FetchSupportTicketDetailsData);
      setSupportTicketMessages(FetchSupportTicketDetailsData.messages ?? []);

      // Followed from a link, it may belong to another queue or sit ten
      // pages down. Put it at the head of the list so the open ticket is
      // visible and selected there, rather than leaving the list with
      // nothing highlighted while the pane shows a conversation.
      setTicketRows((rows) =>
        rows.some((row) => row.id === FetchSupportTicketDetailsData.id)
          ? rows
          : [FetchSupportTicketDetailsData, ...rows],
      );

      const agentDraft = FetchSupportTicketDetailsData.drafts?.find(
        (draft) => draft.draft_type === "manual",
      );

      if (agentDraft?.message) {
        setReply(agentDraft.message);
      }
    });

    if (!FetchSupportTicketDetailsData.is_read) {
      handleSupportTicketMarkRead();
    }
    // Mark-read should fire once per loaded ticket payload, not when the
    // handler identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [FetchSupportTicketDetailsData]);

  // Loaded with the ticket, not on opening the tab: its count heads the tab
  // and its status changes are drawn between the messages.
  const loadActivity = useCallback(
    (ticketId: number) => {
      if (!storeCode) return undefined;
      const request = dispatch(
        SupportTicketActivityFetch({ storeCode, ticketId }),
      );
      // Marked as this ticket's once it has arrived, so another ticket's
      // history never shows while this one loads.
      void request.then((result) => {
        if (SupportTicketActivityFetch.fulfilled.match(result)) {
          setActivityTicketId(ticketId);
        }
      });
      return request;
    },
    [dispatch, storeCode],
  );

  useEffect(() => {
    if (!activeTicketId) return;
    const request = loadActivity(activeTicketId);
    // A slower answer for the previous ticket must not land on this one.
    return () => request?.abort();
  }, [activeTicketId, loadActivity]);

  const ticketActivity: SupportTicketActivityItem[] =
    activityTicketId === activeTicketId && !SupportTicketActivityFetchIsLoading
      ? SupportTicketActivityFetchData
      : [];

  // A link can name a ticket that was deleted, belongs to another store,
  // or was simply mistyped. Saying so beats "no ticket selected", which
  // reads as though nothing was asked for.
  const linkedTicketMissing =
    Boolean(activeTicketId) &&
    !FetchSupportTicketDetailsIsLoading &&
    Boolean(FetchSupportTicketDetailsIsError) &&
    activeSupportTicket?.id !== activeTicketId;

  // The customer behind the open ticket, and their other tickets. No
  // session data is requested: a ticket can arrive by email, phone or
  // social, so there is no browsing session behind it to report.
  const ticketCustomer =
    activeSupportTicket?.customer &&
    typeof activeSupportTicket.customer === "object"
      ? activeSupportTicket.customer
      : null;

  useEffect(() => {
    if (!storeCode || !ticketCustomer?.id) return;
    dispatch(
      FetchFreshdeskTicketId({
        threadId: ticketCustomer.thread_id ?? "",
        customerId: ticketCustomer.id,
        storeCode,
      }),
    );
  }, [dispatch, storeCode, ticketCustomer?.id, ticketCustomer?.thread_id]);

  // The ticket being read is not "another ticket from this customer" — it
  // is the one on screen, and listing it beside itself is noise.
  const otherCustomerTickets = (FetchFreshdeskTicketIdData ?? []).filter(
    (ticket) => ticket.id !== activeSupportTicket?.id,
  );

  // Linking a customer to a guest ticket. Offered only when there is none
  // attached — once linked, the panel shows the record instead.
  const [isLinkCustomerOpen, setIsLinkCustomerOpen] = useState(false);
  // Below `xl` the customer details open as a sheet from the header.
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { SupportTicketCustomerLinkIsLoading } = useAppSelector(
    (state) => state.GetSupportTicketsReducer.SupportTicketCustomerLinkState,
  );

  const handleLinkCustomer = async (customerId: number) => {
    if (!storeCode || !activeTicketId) return;
    const result = await dispatch(
      SupportTicketCustomerLink({
        storeCode,
        ticketId: activeTicketId,
        customerId,
      }),
    );
    if (SupportTicketCustomerLink.fulfilled.match(result)) {
      setIsLinkCustomerOpen(false);
      // Refetch rather than patching locally: linking changes the orders
      // and ticket history the panel shows, not just the name on it.
      dispatch(
        FetchSupportTicketDetails({ storeCode, ticketId: activeTicketId }),
      );
    }
  };

  const handleSelectTicket = (ticketId: number) => {
    const nextTicket = ticketRows.find((ticket) => ticket.id === ticketId);
    if (!nextTicket) return;
    setActiveTicketId(ticketId);
    setPortraitView("conversation");
    setReply("");
    setTranslatedLanguage(null);
    setAttachmentSelection({ ticketId: null, files: [] });
  };

  const handleQueueChange = (queue: SupportTicketStatus) => {
    setActiveQueue(queue);
    setPage(1);
    setActiveTicketId(null);
    setPortraitView("list");
    setAttachmentSelection({ ticketId: null, files: [] });
    setTicketRows([]);
    toast.info(`${queue[0].toUpperCase()}${queue.slice(1)} tickets loaded`, {
      description: "Fetching support tickets for the selected queue.",
    });
  };

  const handleSortChange = (order: SupportTicketOrdering) => {
    updateQueryParams({ sort: order === DEFAULT_SORT_ORDER ? null : order });
  };

  const handleAiDraftGenerate = async () => {
    if (!storeCode || !currentActiveSupportTicketIdRef.current) return;

    try {
      const generatedDraft = await dispatch(
        SupportTicketAIMessageDraftGenerate({
          storeCode,
          ticketId: currentActiveSupportTicketIdRef.current,
        }),
      ).unwrap();

      if (generatedDraft && generatedDraft?.draft_type === "ai") {
        setActiveSupportTicket((current) => {
          if (!current) return current;

          const drafts = current.drafts ?? [];

          const aiDraftIndex = drafts.findIndex(
            (draft) => draft.draft_type === "ai",
          );

          if (aiDraftIndex === -1) {
            return {
              ...current,
              drafts: [...drafts, generatedDraft],
            };
          }

          const updatedDrafts = [...drafts];
          updatedDrafts[aiDraftIndex] = generatedDraft;

          return {
            ...current,
            drafts: updatedDrafts,
          };
        });

        // Straight into the composer. Generating and then using it were
        // two clicks on the same button: the first produced a draft and a
        // toast about it, and the agent had to press again to see it —
        // having asked for a draft, they are not asking to be told one
        // exists. Taken from the response rather than read back out of
        // state, which has not been updated yet this tick.
        setReply(generatedDraft.message);

        toast.success("AI draft ready", {
          description: "It is in the composer — edit it before sending.",
        });
      } else {
        toast.error("Draft generate", {
          description: "Failed to generate ai draft. Please try again.",
        });
      }
    } catch {
      //
    }
  };

  const handleAcceptDraft = () => {
    const aiDraft = activeSupportTicket?.drafts?.find(
      (draft) => draft.draft_type === "ai",
    );

    if (aiDraft?.message) {
      setReply(aiDraft.message);
      toast.success("AI draft added to the composer");
    } else {
      toast.info("AI generated draft not found", {
        description: "Click on Generate draft to accept ai generated draft.",
      });
    }
  };

  const closeTagPicker = () => {
    setShowTagPicker(false);
    setTagSearchInput("");
  };

  const handleToggleTagPicker = () => {
    if (showTagPicker) {
      closeTagPicker();
    } else {
      setShowTagPicker(true);
    }
  };

  const handleAddTag = async (tagId: number) => {
    if (!storeCode || !currentActiveSupportTicketIdRef.current) return;

    try {
      const assignedTag = await dispatch(
        SupportTicketTagAssign({
          storeCode,
          ticketId: currentActiveSupportTicketIdRef.current,
          tagId,
        }),
      ).unwrap();

      if (assignedTag && assignedTag?.id === tagId) {
        setTicketRows((current) =>
          current.map((ticket) =>
            ticket.id === currentActiveSupportTicketIdRef.current &&
            !ticket.tags.some((existing) => existing.id === assignedTag.id)
              ? {
                  ...ticket,
                  tags: [...ticket.tags, assignedTag],
                  sla: assignedTag.ticket_sla ?? null,
                }
              : ticket,
          ),
        );

        setActiveSupportTicket((current) => {
          if (!current) return current;

          if (current.tags.some((tag) => tag.id === assignedTag.id)) {
            return current;
          }

          return {
            ...current,
            tags: [...current.tags, assignedTag],
            // The tag may change which SLA the ticket follows.
            sla: assignedTag.ticket_sla ?? null,
          };
        });

        closeTagPicker();

        toast.success(`Tag assigned: ${assignedTag.name}`);
      } else {
        toast.error("Failed to assign tag", {
          description: "The tag could not be assigned. Please try again.",
        });
      }
    } catch {
      //
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!storeCode || !currentActiveSupportTicketIdRef.current) return;

    try {
      const assignedTag = await dispatch(
        SupportTicketTagRemove({
          storeCode,
          ticketId: currentActiveSupportTicketIdRef.current,
          tagId,
        }),
      ).unwrap();

      if (assignedTag && assignedTag?.id === tagId) {
        setTicketRows((current) =>
          current.map((ticket) =>
            ticket.id === currentActiveSupportTicketIdRef.current
              ? {
                  ...ticket,
                  tags: ticket.tags.filter((tag) => tag.id !== tagId),
                  sla: assignedTag.ticket_sla ?? null,
                }
              : ticket,
          ),
        );

        setActiveSupportTicket((current) =>
          current
            ? {
                ...current,
                tags: current.tags.filter((tag) => tag.id !== assignedTag.id),
                sla: assignedTag.ticket_sla ?? null,
              }
            : current,
        );

        closeTagPicker();

        toast.success("Tag removed");
      } else {
        toast.error("Failed to remove tag", {
          description: "The tag could not be removed. Please try again.",
        });
      }
    } catch {
      //
    }
  };

  /**
   * Applies an edit to a ticket in the list. When the edit takes it out of
   * the view being shown (assigned from "Unassigned", re-rated out of
   * "Negative sentiment") or the filter popover's priority, the row leaves the list and, if it was the open
   * one, the next row opens, rather than waiting for a refetch.
   */
  const applyTicketRowUpdate = (
    ticketId: number,
    patch: Partial<SupportTicket>,
  ) => {
    setTicketRows((current) => {
      const index = current.findIndex((ticket) => ticket.id === ticketId);
      if (index === -1) return current;

      const updated = { ...current[index], ...patch };
      const matchesPriority =
        appliedFilters.priorities.length === 0 ||
        appliedFilters.priorities.includes(updated.priority);
      if (
        matchesPriority &&
        ticketBelongsToHelpdeskFilter(
          activeFilter,
          updated,
          session?.user?.email,
        )
      ) {
        return current.map((ticket) =>
          ticket.id === ticketId ? updated : ticket,
        );
      }

      if (ticketId === currentActiveSupportTicketIdRef.current) {
        // Both ids: the conversation pane shows `activeSupportTicket`, so
        // clearing only the id left the ticket open beside an empty list.
        const nextTicket = current[index + 1] ?? current[index - 1] ?? null;
        setActiveTicketId(nextTicket?.id ?? null);
        setActiveSupportTicket(nextTicket);
      }
      return current.filter((ticket) => ticket.id !== ticketId);
    });

    // The open ticket takes the edit too (a no-op if it was just replaced by
    // the next row above).
    setActiveSupportTicket((current) =>
      current?.id === ticketId ? { ...current, ...patch } : current,
    );
  };

  const handleStaffAssign = async (staffId: number | null) => {
    const ticketId = currentActiveSupportTicketIdRef.current;
    if (!storeCode || !ticketId) return;

    try {
      const payload = {
        internal_assignee: staffId,
      };

      await dispatch(
        SupportTicketStaffAssign({
          storeCode,
          ticketId,
          payload,
        }),
      ).unwrap();

      const assignedStaff = staff.find((member) => member.id === staffId);

      applyTicketRowUpdate(ticketId, {
        internal_assignee: assignedStaff
          ? {
              id: assignedStaff.id,
              name: `${assignedStaff.first_name} ${assignedStaff.last_name}`,
              email: assignedStaff.email,
            }
          : null,
      });
      // The assignment is now part of the ticket's history.
      if (currentActiveSupportTicketIdRef.current === ticketId) {
        loadActivity(ticketId);
      }

      toast.success(
        staffId === null
          ? "Staff unassigned successfully."
          : "Staff assigned successfully.",
      );
    } catch {
      //
    }
  };

  const handleSaveDraft = async () => {
    if (!storeCode || !currentActiveSupportTicketIdRef.current) return;

    const trimmedReply = reply.trim();

    if (!trimmedReply) {
      toast.info("Nothing to save", {
        description: "Type a message before saving a draft.",
      });
      return;
    }

    try {
      const payload = {
        message: trimmedReply,
      };

      const savedDraft = await dispatch(
        SupportTicketAgentDraftSave({
          storeCode,
          ticketId: currentActiveSupportTicketIdRef.current,
          payload,
        }),
      ).unwrap();

      if (
        savedDraft &&
        savedDraft?.draft_type === "manual" &&
        savedDraft?.message
      ) {
        setReply(savedDraft.message);
      }

      toast.success("Draft saved", {
        description: "Your reply has been saved as a draft.",
      });
    } catch {
      //
    }
  };

  const handleSend = async (
    mode:
      | "reply"
      | "note"
      | "customer_language"
      | "reply_and_resolve" = "reply",
  ) => {
    if (!storeCode || SupportTicketMessageSendIsLoading) return;

    const trimmedReply = reply.trim();
    if (!trimmedReply) {
      toast.error("Write a reply first", {
        description: "Type your reply in the composer before sending.",
      });
      return;
    }

    const ticketId = currentActiveSupportTicketIdRef.current;
    if (!ticketId) {
      toast.error("No ticket selected to send a reply.");
      return;
    }

    const tempId = createTempMessageId();
    const selectedFiles = attachments;
    const draftReply = reply;
    const optimisticMessage: SupportTicketMessage = {
      id: tempId,
      sender_type: "agent",
      message: trimmedReply,
      message_type: mode === "note" ? "internal" : "external",
      agent: tempId,
      message_direction: "outgoing",
      platform: "internal",
      channel: "web",
      content_type: selectedFiles.length ? "multipart" : "text/plain",
      metadata: {},
      attachments: [],
      pendingFiles: selectedFiles,
      created_at: new Date().toISOString(),
    };
    setSupportTicketMessages((current) => [...current, optimisticMessage]);
    setReply("");
    setAttachmentSelection({ ticketId: null, files: [] });

    try {
      const formData = new FormData();
      formData.append("message", trimmedReply);
      selectedFiles.forEach((file) => formData.append("attachments", file));

      if (mode === "note") {
        formData.append("message_type", "internal");
      }
      if (mode === "customer_language") {
        formData.append("translate_message", "true");
      }

      const sentMessage = await dispatch(
        SupportTicketMessageSend({
          storeCode,
          ticketId,
          formData,
        }),
      ).unwrap();

      if (currentActiveSupportTicketIdRef.current !== ticketId) return;
      setSupportTicketMessages((current) => {
        const messages = current.filter(
          (message) => message.id !== sentMessage.id,
        );
        return messages.some((message) => message.id === tempId)
          ? messages.map((message) =>
              message.id === tempId ? sentMessage : message,
            )
          : [...messages, sentMessage];
      });

      toast.success(mode === "note" ? "Internal note added" : "Reply sent");
    } catch {
      if (currentActiveSupportTicketIdRef.current !== ticketId) return;
      setSupportTicketMessages((current) =>
        current.filter((message) => message.id !== tempId),
      );
      setReply(draftReply);
      setAttachmentSelection({ ticketId, files: selectedFiles });
      return;
    }

    // Only reached once the reply is out: a failed send leaves the ticket as is.
    if (mode === "reply_and_resolve") {
      await handleSupportTicketStatusUpdate("resolved", ticketId);
    }
  };

  /*
  const handleMessageImprove = async (action: string) => {
    if (!storeCode || !currentActiveSupportTicketIdRef.current) return;

    const trimmedReply = reply.trim();

    if (!trimmedReply) {
      toast.info("Nothing to improve", {
        description: "Type a message before before imrove a message.",
      });
      return;
    }

    try {
      const payload = {
        message: trimmedReply,
        action: action,
      };

      const improvedMessage = await dispatch(
        SupportMessageImprove({
          storeCode,
          ticketId: currentActiveSupportTicketIdRef.current,
          payload,
        }),
      ).unwrap();

      if (improvedMessage && improvedMessage?.message) {
        setReply(improvedMessage?.message);
      }

      toast.success("Message improved", {
        description: "Your message has been improved by AI.",
      });
    } catch {
      //
    }
  };
  */

  const handleTicketSnooze = async (snoozeTime: number | null) => {
    if (!storeCode || !currentActiveSupportTicketIdRef.current) return;

    try {
      const payload = {
        snoozed_until: snoozeTime
          ? new Date(Date.now() + snoozeTime).toISOString()
          : null,
      };

      const ticketSnoozed = await dispatch(
        SupportTicketSnooze({
          storeCode,
          ticketId: currentActiveSupportTicketIdRef.current,
          payload,
        }),
      ).unwrap();

      if (ticketSnoozed) {
        const isUnsnoozed = !ticketSnoozed?.snoozed_until;

        // When removing a snooze while the "Snoozed" filter is active, the
        // ticket no longer belongs in this view — pull it out of the list and
        // clear the active ticket so the panel resets to "No ticket selected".
        if (isUnsnoozed && activeFilter === "snoozed") {
          setTicketRows((current) =>
            current.filter(
              (ticket) => ticket.id !== currentActiveSupportTicketIdRef.current,
            ),
          );
          setActiveSupportTicket(null);
          setActiveTicketId(null);
        } else {
          setTicketRows((current) =>
            current.map((ticket) =>
              ticket.id === currentActiveSupportTicketIdRef.current
                ? { ...ticket, is_snoozed: isUnsnoozed ? false : true }
                : ticket,
            ),
          );

          setActiveSupportTicket((current) =>
            current
              ? {
                  ...current,
                  is_snoozed: !isUnsnoozed,
                  snoozed_until: ticketSnoozed?.snoozed_until,
                }
              : current,
          );
        }

        toast.success(
          snoozeTime === null ? "Snooze removed" : "Ticket snoozed",
          {
            description:
              snoozeTime === null
                ? "The ticket is no longer snoozed."
                : "The ticket has been snoozed successfully.",
          },
        );
      } else {
        toast.success("Ticket snooze", {
          description: "Failed to snooze this ticket.",
        });
      }
    } catch {
      //
    }
  };

  // Addressed by the customer rather than the ticket: the ticket-scoped
  // route resolved to this same shopper before doing anything, and a ticket
  // raised by a guest has nobody to refresh.
  const handleCustomerOrderSync = async () => {
    if (!storeCode || !ticketCustomer?.id) return;

    try {
      const syncedOrders = await dispatch(
        SyncCustomerOrders({ storeCode, customerId: ticketCustomer.id }),
      ).unwrap();

      if (syncedOrders) {
        setActiveSupportTicket((current) =>
          current
            ? {
                ...current,
                customer:
                  current.customer && typeof current.customer !== "string"
                    ? {
                        ...current.customer,
                        orders: syncedOrders,
                      }
                    : current.customer,
              }
            : current,
        );

        toast.success("Order sync", {
          description: "Customer orders synced successfully.",
        });
      }
    } catch {
      //
    }
  };

  const handleSupportTicketStatusUpdate = async (
    status: SupportTicketStatus,
    // Passed by callers that act on a ticket that may no longer be the
    // active one by the time they get here.
    targetTicketId?: number,
  ) => {
    const ticketId = targetTicketId ?? currentActiveSupportTicketIdRef.current;
    if (!storeCode || !ticketId) return;

    try {
      const payload = {
        status: status,
      };

      // Read before the update: the queue counts move from this status.
      const previousStatus =
        ticketRows.find((ticket) => ticket.id === ticketId)?.status ??
        activeSupportTicket?.status;

      const updatedStatus = await dispatch(
        SupportTicketStatusUpdate({
          storeCode,
          ticketId,
          payload,
          previousStatus,
        }),
      ).unwrap();

      if (updatedStatus) {
        setTicketRows((current) => {
          const remainingRows = current.filter(
            (ticket) => ticket.id !== ticketId,
          );

          // Narrow screens go back to the list rather than opening the
          // next ticket unasked.
          const narrow = isPhoneWidth();
          if (narrow && ticketId === currentActiveSupportTicketIdRef.current) {
            setPortraitView("list");
          }
          const nextTicket =
            ticketId === currentActiveSupportTicketIdRef.current
              ? narrow
                ? null
                : (remainingRows[0] ?? null)
              : undefined;

          if (nextTicket !== undefined) {
            setActiveSupportTicket((activeCurrent) =>
              activeCurrent && activeCurrent.id === ticketId
                ? nextTicket
                : activeCurrent,
            );

            setActiveTicketId((activeIdCurrent) =>
              activeIdCurrent === ticketId
                ? (nextTicket?.id ?? null)
                : activeIdCurrent,
            );
          }

          return remainingRows;
        });

        toast.success("Ticket status", {
          description: `Ticket status updated to ${updatedStatus.status}.`,
        });
      }
    } catch {
      //
    }
  };

  const handleSupportTicketPriorityUpdate = async (
    priority: SupportTicketPriority,
  ) => {
    const ticketId = currentActiveSupportTicketIdRef.current;
    if (!storeCode || !ticketId) return;

    try {
      const payload = {
        priority: priority,
      };

      const updatedPriority = await dispatch(
        SupportTicketPriorityUpdate({ storeCode, ticketId, payload }),
      ).unwrap();

      if (updatedPriority) {
        applyTicketRowUpdate(ticketId, { priority: updatedPriority.priority });

        toast.success("Ticket priority", {
          description: `Ticket priority updated to ${updatedPriority.priority}.`,
        });
      }
    } catch {
      //
    }
  };

  const handleSupportTicketLanguageSentimentUpdate = async (payload: {
    language?: TicketLanguage;
    sentiment?: TicketSentiment;
  }) => {
    const ticketId = currentActiveSupportTicketIdRef.current;
    if (!storeCode || !ticketId) return;

    try {
      const updated = await dispatch(
        SupportTicketLanguageSentimentUpdate({ storeCode, ticketId, payload }),
      ).unwrap();

      if (updated) {
        applyTicketRowUpdate(ticketId, updated);

        toast.success("Ticket updated", {
          description: "Ticket language and sentiment saved.",
        });
      }
    } catch {
      //
    }
  };

  const handleSupportTicketMessagesTranslate = async (code: string) => {
    if (!storeCode || !currentActiveSupportTicketIdRef.current) return;

    if (supportTikcetMessages?.length === 0) {
      toast.success("Messages translation", {
        description: "No messages to translate.",
      });
      return;
    }

    const language = SUPPORTED_LANGUAGES.find(
      (language) => language.code === code,
    );

    if (!language) return;

    try {
      const payload = {
        language_code: language.code,
        language_name: language.name,
      };

      const translatedMessages = await dispatch(
        SupportTicketMessagesTranslate({
          storeCode,
          ticketId: currentActiveSupportTicketIdRef.current,
          payload,
        }),
      ).unwrap();

      setTranslatedLanguage({ code: language.code, name: language.name });

      if (translatedMessages?.messages?.length) {
        const translatedMessageMap = new Map<string, string>(
          translatedMessages.messages.map((message) => [
            String(message.id),
            message.message,
          ]),
        );

        const applyTranslations = (messages: SupportTicketMessage[] = []) =>
          messages.map((message) => {
            const translatedMessage = translatedMessageMap.get(
              String(message.id),
            );

            return translatedMessage
              ? {
                  ...message,
                  message: translatedMessage,
                }
              : message;
          });

        setSupportTicketMessages((currentMessages) =>
          applyTranslations(currentMessages),
        );

        setActiveSupportTicket((current) =>
          current
            ? {
                ...current,
                messages: applyTranslations(current.messages),
              }
            : current,
        );

        toast.success("Messages translated", {
          description: `Translated to ${language.name}.`,
        });
      }
    } catch {
      //
    }
  };

  // A tag typed into the picker that does not exist yet: create it, then put
  // it on the ticket like any other.
  const handleCreateTag = async (name: string, color: string) => {
    if (!storeCode) return;
    try {
      const created = await dispatch(
        TicketTagCreate({
          storeCode,
          payload: { name, color, description: "" },
        }),
      ).unwrap();
      if (created?.id) {
        setTagSearchInput("");
        setTagPage(1);
        await handleAddTag(created.id);
      }
    } catch {
      // The thunk has already said why.
    }
  };

  /** Opens another of the customer's tickets, from the Customer tab. */
  const handleOpenOtherTicket = (ticketId: number) => {
    setIsDetailsOpen(false);
    setPortraitView("conversation");
    setReply("");
    setTranslatedLanguage(null);
    setAttachmentSelection({ ticketId: null, files: [] });
    setActiveTicketId(ticketId);
  };

  // Support Ticket Filter Utilities
  const handleFilterOpenChange = (open: boolean) => {
    setIsFilterOpen(open);
    if (open) {
      setDraftFilters(appliedFilters);
    }
  };

  const handleApplyFilters = () => {
    updateQueryParams({
      channel: draftFilters.channels.join(",") || null,
      priority: draftFilters.priorities.join(",") || null,
      sentiment: draftFilters.sentiments.join(",") || null,
      assignee: draftFilters.assignees.join(",") || null,
    });
    setIsFilterOpen(false);
  };

  // On a phone the conversation pane (and its placeholders) show only when
  // a ticket is open and the user has chosen it; otherwise the list does.
  const showConversationBelowLg =
    portraitView === "conversation" && activeTicketId !== null;
  const conversationPaneClass = showConversationBelowLg ? "flex" : "hidden";

  const ticketIsClosed =
    activeSupportTicket?.status === "closed" ||
    activeSupportTicket?.status === "resolved";

  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1">
        <TicketListPanel
          className={showConversationBelowLg ? "hidden" : "flex"}
          rows={ticketRows}
          activeTicketId={activeSupportTicket?.id ?? null}
          activeQueue={activeQueue}
          activeFilter={activeFilter}
          filterCounts={FetchSupportTicketFilterCountsData}
          onQueueChange={handleQueueChange}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onSelectTicket={handleSelectTicket}
          isLoading={FetchSupportTicketsLoading}
          isLoadingMore={isLoadingMore}
          hasMore={Boolean(FetchSupportTicketsListData?.next)}
          onLoadMore={() => {
            if (Boolean(FetchSupportTicketsListData?.next)) {
              setPage((current) => current + 1);
            }
          }}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={draftFilters}
          isFilterOpen={isFilterOpen}
          onFilterOpenChange={handleFilterOpenChange}
          onFiltersChange={setDraftFilters}
          onApplyFilters={handleApplyFilters}
          supportTicketStatusCount={FetchSupportTicketsListData.status_counts}
        />
        {(FetchSupportTicketsLoading || FetchSupportTicketDetailsIsLoading) &&
        activeSupportTicket?.id !== activeTicketId ? (
          <div
            className={cn(
              "min-w-0 flex-1 items-center justify-center bg-muted/30 md:flex",
              conversationPaneClass,
            )}
          >
            <LoadingState label="Loading conversation…" />
          </div>
        ) : linkedTicketMissing ? (
          <div
            className={cn(
              "min-w-0 flex-1 flex-col items-center justify-center gap-1 bg-muted/30 px-6 text-center md:flex",
              conversationPaneClass,
            )}
          >
            <IconInbox className="mb-1 size-7 text-muted-foreground opacity-40" />
            <Typography variant="small" as="p">
              Ticket not found
            </Typography>
            <Typography variant="muted">
              This ticket could not be opened. It may belong to another store,
              or have been removed.
            </Typography>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setActiveTicketId(null)}
            >
              Back to inbox
            </Button>
          </div>
        ) : !activeSupportTicket ? (
          <div
            className={cn(
              "min-w-0 flex-1 flex-col items-center justify-center gap-1 bg-muted/30 px-6 text-center md:flex",
              conversationPaneClass,
            )}
          >
            <IconInbox className="mb-1 size-7 text-muted-foreground opacity-40" />
            <Typography variant="small" as="p">
              No ticket selected
            </Typography>
            <Typography variant="muted">
              Open a ticket from the list to see its conversation.
            </Typography>
          </div>
        ) : (
          <ConversationPanel
            className={conversationPaneClass}
            onBack={() => {
              // Closes the ticket, not just the pane: leaving it open would
              // keep its id in the URL, and a refresh would reopen it.
              setPortraitView("list");
              setActiveTicketId(null);
            }}
            onShowDetails={() => setIsDetailsOpen(true)}
            ticket={activeSupportTicket}
            messages={supportTikcetMessages}
            staff={staff}
            currentUser={{
              name: session?.user?.name,
              email: session?.user?.email,
            }}
            activity={ticketActivity}
            reply={reply}
            attachments={attachments}
            onAttachmentsChange={(files) =>
              setAttachmentSelection({ ticketId: activeTicketId, files })
            }
            isSending={SupportTicketMessageSendIsLoading}
            onReplyChange={setReply}
            onSend={handleSend}
            onSaveDraft={handleSaveDraft}
            isClosed={ticketIsClosed}
            onTranslate={handleSupportTicketMessagesTranslate}
            isTranslating={SupportTicketMessagesTranslateIsLoading}
            translatedLanguage={translatedLanguage}
            onRequestStatus={(status) =>
              status !== "snoozed" && setPendingStatus(status)
            }
          />
        )}
        {(FetchSupportTicketsLoading || FetchSupportTicketDetailsIsLoading) &&
        activeSupportTicket?.id !== activeTicketId ? (
          <TicketDetailsPlaceholder loading label="Loading ticket details…" />
        ) : !activeSupportTicket ? (
          <TicketDetailsPlaceholder label="Select a ticket to see its details." />
        ) : (
          <TicketDetailsPanel
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            ticket={activeSupportTicket}
            copilot={
              storeCode
                ? {
                    storeCode,
                    ticketId: activeSupportTicket.id,
                    refreshKey: activeSupportTicket.status,
                    onInsertDraft: setReply,
                  }
                : undefined
            }
            isClosed={ticketIsClosed}
            allowedStatuses={
              STATUS_TRANSITIONS[activeSupportTicket.status] ?? []
            }
            onRequestStatus={(status) =>
              status !== "snoozed" && setPendingStatus(status)
            }
            onPriorityChange={handleSupportTicketPriorityUpdate}
            staff={staff}
            canAssign={canAssign}
            currentUserEmail={session?.user?.email}
            onAssign={handleStaffAssign}
            onLanguageSentimentChange={
              handleSupportTicketLanguageSentimentUpdate
            }
            availableTags={ticketTags ?? []}
            isTagPickerOpen={showTagPicker}
            onTagPickerOpenChange={(open) =>
              open !== showTagPicker && handleToggleTagPicker()
            }
            tagsLoading={FetchSupportTicketTagsIsLoading}
            isLoadingMoreTags={FetchSupportTicketTagsIsLoading && tagPage > 1}
            hasMoreTags={Boolean(FetchSupportTicketTagsData?.next)}
            onLoadMoreTags={() => {
              if (FetchSupportTicketTagsData?.next) {
                setTagPage((current) => current + 1);
              }
            }}
            tagSearch={tagSearchInput}
            onTagSearchChange={setTagSearchInput}
            onAddTag={handleAddTag}
            onRequestTagRemoval={(tagId) => {
              const tag = activeSupportTicket.tags?.find(
                (candidate) => candidate.id === tagId,
              );
              setPendingTagRemoval({
                id: tagId,
                name: tag?.name ?? "this tag",
              });
            }}
            onCreateTag={handleCreateTag}
            customer={ticketCustomer}
            customerName={customerLabel(activeSupportTicket.customer)}
            ordersLoading={FetchSupportTicketDetailsIsLoading}
            onOrdersSync={handleCustomerOrderSync}
            orderSyncLoading={SyncCustomerOrdersIsLoading}
            ordersDisabled={ticketIsClosed}
            otherTickets={otherCustomerTickets}
            otherTicketsLoading={FetchFreshdeskTicketIdIsLoading}
            onLinkCustomer={() => setIsLinkCustomerOpen(true)}
            onOpenTicket={handleOpenOtherTicket}
            activity={ticketActivity}
            activityLoading={
              SupportTicketActivityFetchIsLoading ||
              activityTicketId !== activeTicketId
            }
          />
        )}
      </div>

      {storeCode ? (
        <LinkCustomerDialog
          open={isLinkCustomerOpen}
          onOpenChange={setIsLinkCustomerOpen}
          storeCode={storeCode}
          linking={SupportTicketCustomerLinkIsLoading}
          onLink={(customer) => handleLinkCustomer(customer.id)}
        />
      ) : null}

      <AlertDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => {
          if (!open) setPendingStatus(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingConfirmation?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingConfirmation?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            <IconInfoCircle className="mt-0.5 size-4 shrink-0" />A mail will be
            sent to the customer to let them know about this change.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={pendingStatus === "closed" ? "destructive" : "default"}
              onClick={() => {
                if (pendingStatus)
                  handleSupportTicketStatusUpdate(pendingStatus);
              }}
            >
              {pendingConfirmation?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingTagRemoval !== null}
        onOpenChange={(open) => {
          if (!open) setPendingTagRemoval(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this tag?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">
                {pendingTagRemoval?.name}
              </span>{" "}
              will be taken off this ticket. If it set the ticket&apos;s SLA,
              the SLA is recalculated from the ticket&apos;s remaining tags, or
              removed when none sets one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingTagRemoval) handleRemoveTag(pendingTagRemoval.id);
              }}
            >
              Remove tag
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
