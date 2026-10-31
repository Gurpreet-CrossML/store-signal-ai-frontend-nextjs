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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  IconAlarmSnoozeFilled,
  IconCalendarPlus,
  IconCircleCheck,
  IconCircleX,
  IconChevronDown,
  IconDeviceFloppy,
  IconFilter,
  IconInbox,
  IconInfoCircle,
  type Icon,
  IconLanguage,
  IconMessageChatbot,
  IconMoodSmile,
  IconPaperclip,
  IconLock,
  IconNote,
  IconPencil,
  IconBolt,
  IconPlus,
  IconArrowLeft,
  IconArrowsSort,
  IconReload,
  IconSend,
  IconSparkles,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";

import { useFormik } from "formik";
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
import { Badge, badgeVariants } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Typography } from "@/components/ui/typography";
import { CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { isBelowLg } from "@/hooks/use-narrow-viewport";
import {
  ACTION_TONE_STYLES,
  BADGE_TONE_STYLES,
  type BadgeTone,
} from "@/lib/badge-tones";

import { ConversationRow } from "@/components/custom/conversation-row";
import { CreditLabel } from "@/components/custom/credit-label";
import { MultiSelectCombobox } from "@/components/custom/multi-select-combobox";
import { SyncCustomerOrders } from "@/redux/api-slice/order-slice";
import {
  TicketPriorityBar,
  TICKET_PRIORITY_TONES,
  ticketRef,
} from "@/components/custom/ticket-priority-bar";
import {
  CustomerDetailsButton,
  CustomerDetailsPanel,
} from "@/components/custom/customer-details-panel";
import { TicketActivityDrawer } from "@/components/custom/ticket-activity-drawer";
import { CrmLinkButton } from "@/components/custom/customer-header";
import { LinkCustomerDialog } from "@/components/custom/link-customer-dialog";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import { MessageAttachments } from "@/components/custom/helpdesk/message-attachments";
import {
  HiddenTagsBadge,
  TagBadge,
} from "@/components/custom/helpdesk/tag-badge";
import { DateRangePicker } from "@/components/custom/date-range-picker";
import { LoadingState } from "@/components/custom/loading-state";
import { SearchInput } from "@/components/custom/search-input";

import {
  ACTIVE_ASSIGNEE_STYLE,
  ACTIVE_QUEUE_STYLE,
  DEFAULT_HELPDESK_QUEUE,
  ENDPOINTS,
} from "@/lib/config";
import {
  SUPPORT_ATTACHMENT_ALLOWED_EXTENSIONS,
  prepareSupportAttachments,
} from "@/lib/support-attachment-constants";
import {
  DEFAULT_TICKET_LANGUAGE,
  CHANNEL_META,
  DEFAULT_TICKET_SENTIMENT,
  SUPPORTED_LANGUAGES,
  TICKET_SENTIMENTS,
  type TicketLanguage,
  type TicketSentiment,
} from "@/lib/ticket-options";
import {
  helpdeskFilterToQuery,
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
  type SupportTicket,
  type SupportTicketCreatedBy,
  type SupportTicketPriority,
  type SupportTicketTagData,
  type SupportTicketMessage,
  type SupportTicketDraftMessage,
  type SupportTicketCustomer,
  type SupportTicketOrdering,
  type SupportTicketStatus,
  type SupportTicketFilters,
  type SupportTicketStatusCounts,
  type SupportSocketPayload,
} from "@/redux/api-slice/support-ticket-slice";
import { FetchStaff, type StaffMember } from "@/redux/api-slice/tenancy-slice";
import { can } from "@/lib/access-rules";
import { FetchFreshdeskTicketId } from "@/redux/api-slice/thread-slice";
import {
  capitalizeText,
  endOfDay,
  formatDateTime,
  formatRelativeDateTime,
  startOfDay,
} from "@/lib/helpers";

const RichTextArea = dynamic(
  () => import("@/components/custom/rich-text-area"),
  {
    ssr: false,
  },
);

// Max tags to show in ticket row for `TicketListPanel`
const MAX_VISIBLE_TKT_ROW_TAGS = 2;

// Max tags to show in ticket conversation for `ConversationPanel`
const MAX_VISIBLE_TKT_CONV_TAGS = 4;

// Snooze time presets
const SNOOZE_PRESETS = [
  { label: "5 minutes", ms: 5 * 60 * 1000 },
  { label: "10 minutes", ms: 10 * 60 * 1000 },
  { label: "30 minutes", ms: 30 * 60 * 1000 },
  { label: "1 day", ms: 24 * 60 * 60 * 1000 },
  { label: "1 week", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "1 month", ms: 30 * 24 * 60 * 60 * 1000 },
];

/**
 * Priority reuses the shared badge palette rather than its own greens and
 * ambers, so "urgent" here reads the same as any other alarming badge in
 * the app — and so both themes are covered.
 */
const STATUS_TONE: Record<SupportTicketStatus, BadgeTone> = {
  open: "info",
  reopen: "danger",
  snoozed: "warning",
  resolved: "success",
  closed: "neutral",
};

const PRIORITY_TONE = TICKET_PRIORITY_TONES;

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

/** "3 tags" / "1 tag" — plural agreement for the count rows. */
function pluralize(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
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
  const visibleTags = ticket.tags?.slice(0, MAX_VISIBLE_TKT_ROW_TAGS) ?? [];
  const hiddenTags = ticket.tags?.slice(MAX_VISIBLE_TKT_ROW_TAGS) ?? [];
  const customerName = customerLabel(ticket.customer);
  // Falls back like the ticket header does, for a channel the backend adds
  // before CHANNEL_META hears about it.
  const ChannelIcon = CHANNEL_META[ticket.channel]?.icon ?? IconInbox;
  const channelLabel =
    CHANNEL_META[ticket.channel]?.label ?? capitalizeText(ticket.channel);

  return (
    <ConversationRow
      active={active}
      onSelect={onSelect}
      unread={!ticket.is_read}
      accent={<TicketPriorityBar priority={ticket.priority} />}
      avatar={<CustomerAvatar name={customerName} />}
      title={ticket.subject}
      titleTooltip={ticket.subject}
      timestamp={formatRelativeDateTime(
        ticket.last_message_at || ticket.created_at,
      )}
      indicator={
        ticket.is_snoozed ? (
          <IconAlarmSnoozeFilled className="size-3 text-primary" />
        ) : null
      }
      // Who it is from, and nothing else. The subject above already says
      // what the ticket is about, so a teaser of the latest message only
      // competed with it — and trailing off mid-sentence after an email
      // address read as one run-on string.
      preview={
        <span className="flex items-center gap-1.5 text-foreground/70">
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                role="img"
                aria-label={channelLabel}
                className="flex shrink-0 items-center"
              >
                <ChannelIcon className="size-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent>{channelLabel}</TooltipContent>
          </Tooltip>
          <span className="truncate">{customerName}</span>
        </span>
      }
      footer={
        visibleTags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            {visibleTags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
            {hiddenTags.length > 0 ? (
              <HiddenTagsBadge
                tags={hiddenTags}
                label={`+${hiddenTags.length}`}
              />
            ) : null}
          </div>
        ) : null
      }
    />
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
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
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
  priorities: SupportTicketPriority[];
  fromDate: string;
  toDate: string;
};

const emptyTicketFilters: TicketFilterSelection = {
  priorities: [],
  fromDate: "",
  toDate: "",
};

/** A date from the URL is only used if it parses; a hand-edited one may not. */
const isValidDateParam = (value: string) =>
  value !== "" && !Number.isNaN(new Date(value).getTime());

/** Who opened a ticket, as the header shows it. */
const CREATED_BY_META: Record<
  SupportTicketCreatedBy,
  { label: string; icon: Icon }
> = {
  ai: { label: "AI", icon: IconSparkles },
  agent: { label: "Agent", icon: IconUser },
  rule: { label: "Rule", icon: IconBolt },
};

const SENTIMENT_TONE: Record<TicketSentiment, BadgeTone> = {
  positive: "success",
  neutral: "neutral",
  negative: "danger",
};

const priorityOptions: { value: SupportTicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function TicketListPanel({
  rows,
  activeTicketId,
  activeQueue,
  queueLabel,
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
  onClearFilters,
  dateError,
  supportTicketStatusCount,
  className,
}: {
  /** Visibility below `lg`, where list and conversation take turns. */
  className?: string;
  // ...same prop types as before, unchanged
  rows: SupportTicket[];
  activeTicketId: number | null;
  activeQueue: SupportTicketStatus;
  queueLabel: string;
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
  onClearFilters: () => void;
  dateError?: string;
  supportTicketStatusCount: SupportTicketStatusCounts;
}) {
  const activeFilterCount =
    filters.priorities.length +
    Number(Boolean(filters.fromDate || filters.toDate));

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (!hasMore || isLoading || isLoadingMore) return;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 120) {
      onLoadMore();
    }
  };

  return (
    <section
      className={cn(
        "h-full min-h-0 w-full min-w-0 flex-col border-r desktop:flex desktop:w-72 desktop:shrink-0 2xl:w-84",
        className,
      )}
    >
      {/* One header, not two: the queue switcher is the inbox's title, so a
          separate "Your inbox" line above it said nothing extra. */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
        <div className="flex min-w-0 items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "-ml-2 gap-1",
                  activeQueue !== DEFAULT_HELPDESK_QUEUE && ACTIVE_QUEUE_STYLE,
                )}
              >
                <CardTitle>
                  {queueLabel}
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    {supportTicketStatusCount?.[activeQueue] ?? 0}
                  </span>
                </CardTitle>
                <IconChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {queues.map((queue) => (
                <DropdownMenuItem
                  key={queue.key}
                  onClick={() =>
                    queue.key !== activeQueue && onQueueChange(queue.key)
                  }
                  className={cn(
                    "justify-between",
                    activeQueue === queue.key && "font-medium text-primary",
                  )}
                >
                  {queue.label}
                  <span className="text-muted-foreground">
                    {supportTicketStatusCount?.[queue.key] ?? 0}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Popover open={isFilterOpen} onOpenChange={onFilterOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="relative"
                aria-label="Filter Tickets"
              >
                <IconFilter className="size-4" />
                {activeFilterCount > 0 ? (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="border-b px-4 py-3">
                <CardTitle>Filter Tickets</CardTitle>
              </div>
              <div className="max-h-[65vh] space-y-5 overflow-y-auto p-4">
                <fieldset>
                  <legend className="mb-2">
                    <Typography variant="small" as="span">
                      Last message date
                    </Typography>
                  </legend>
                  {/* One range, picked on a calendar. Two datetime-local
                    boxes made the reader assemble the range themselves and
                    let them pick a "to" before the "from"; the calendar
                    can't express either mistake. */}
                  <DateRangePicker
                    from={filters.fromDate}
                    to={filters.toDate}
                    disabled={{ after: new Date() }}
                    onRangeChange={(fromDate, toDate) =>
                      onFiltersChange({ ...filters, fromDate, toDate })
                    }
                  />
                  {dateError ? (
                    <Typography
                      variant="caption"
                      as="p"
                      className="mt-2 text-destructive"
                    >
                      {dateError}
                    </Typography>
                  ) : null}
                </fieldset>

                <fieldset>
                  <legend className="mb-2">
                    <Typography variant="small" as="span">
                      Priority
                    </Typography>
                  </legend>
                  <MultiSelectCombobox
                    options={priorityOptions}
                    value={filters.priorities}
                    onValueChange={(priorities) =>
                      onFiltersChange({
                        ...filters,
                        priorities: priorities as SupportTicketPriority[],
                      })
                    }
                    placeholder="Search priorities…"
                    emptyMessage="No priorities found."
                  />
                </fieldset>
              </div>
              <div className="flex justify-between border-t p-3">
                {activeFilterCount > 0 ? (
                  <Button variant="ghost" size="sm" onClick={onClearFilters}>
                    Clear
                  </Button>
                ) : (
                  <span />
                )}
                <Button size="sm" onClick={onApplyFilters}>
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
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
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.key}
                  onClick={() =>
                    option.key !== sortOrder && onSortChange(option.key)
                  }
                  className={cn(
                    option.key === sortOrder && "font-medium text-primary",
                  )}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* h-20, matching the two-row ticket strip opposite so the second
          rule across the screen meets. The height comes from the busier
          side; this one takes the extra as padding rather than making the
          ticket strip give up a row it needs. */}
      <div className="flex h-20 shrink-0 items-center border-b px-4">
        <SearchInput
          className="w-full"
          value={searchValue}
          onChange={onSearchChange}
          placeholder="Search tickets…"
          label="Search tickets"
        />
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-2 py-1"
        onScroll={handleScroll}
      >
        {isLoading && rows?.length === 0 ? (
          <LoadingState label="Loading tickets…" />
        ) : !rows || rows?.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 p-6 text-center">
            <Typography variant="small" as="p">
              No tickets found
            </Typography>
            <Typography variant="muted">
              Try a different queue, search, or filter.
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
    </section>
  );
}

function ConversationPanel({
  storeCode,
  ticket,
  messages,
  reply,
  attachments,
  onAttachmentsChange,
  isSending,
  onReplyChange,
  onSend,
  onAcceptDraft,
  onSaveDraft,
  availableTags,
  isTagPickerOpen,
  isTagPickerLoading,
  isLoadingMoreTags,
  hasMoreTags,
  onLoadMoreTags,
  tagSearch,
  onTagSearchChange,
  onToggleTagPicker,
  onAddTag,
  onRemoveTag,
  availableStaff,
  canAssign,
  onAssignStaff,
  // onMessageImprove,
  // isMessageImproving,
  onTicketSnooze,
  onTicketStatusUpdate,
  onTicketPriorityUpdate,
  onTicketLanguageSentimentUpdate,
  onAIDraftGenerate,
  isAIDraftLoading,
  aiDraft,
  isClosed,
  onTranslate,
  isTranslating,
  translatedLanguage,
  onLinkCustomer,
  onBack,
  onShowDetails,
  className,
}: {
  /** Opens the customer details sheet, for widths where the pane is not docked. */
  onShowDetails: () => void;
  /** Returns to the ticket list. Only offered below `lg`, where the two panes take turns. */
  onBack: () => void;
  className?: string;
  storeCode: string;
  ticket: SupportTicket;
  messages: SupportTicketMessage[];
  reply: string;
  attachments: File[];
  onAttachmentsChange: (files: File[]) => void;
  isSending: boolean;
  onReplyChange: (value: string) => void;
  /** Reply is the default; internal note and translated reply are deliberate choices. */
  onSend: (
    mode: "reply" | "note" | "customer_language" | "reply_and_resolve",
  ) => void;
  onAcceptDraft: () => void;
  onSaveDraft: () => void;
  availableTags: SupportTicketTagData[];
  isTagPickerOpen: boolean;
  isTagPickerLoading: boolean;
  /** True while a further page is loading, as opposed to a first page or a new search. */
  isLoadingMoreTags: boolean;
  hasMoreTags: boolean;
  onLoadMoreTags: () => void;
  /** The picker's search box. The search itself runs on the server. */
  tagSearch: string;
  onTagSearchChange: (value: string) => void;
  onToggleTagPicker: () => void;
  onAddTag: (tagId: number) => void;
  onRemoveTag: (tagId: number) => void;
  availableStaff: StaffMember[];
  // Admins and supervisors assign tickets; others only see the assignee.
  canAssign: boolean;
  onAssignStaff: (staffId: number | null) => void;
  // onMessageImprove: (action: string) => void;
  // isMessageImproving: boolean;
  onTicketSnooze: (snoozeTime: number | null) => void;
  onTicketStatusUpdate: (status: SupportTicketStatus) => void;
  onTicketPriorityUpdate: (priority: SupportTicketPriority) => void;
  onTicketLanguageSentimentUpdate: (payload: {
    language?: TicketLanguage;
    sentiment?: TicketSentiment;
  }) => void;
  onAIDraftGenerate: () => void;
  isAIDraftLoading: boolean;
  aiDraft: SupportTicketDraftMessage | null;
  isClosed: boolean;
  onTranslate: (code: string) => void;
  isTranslating: boolean;
  /** Language the messages are currently shown in, if translated. */
  translatedLanguage: { code: string; name: string } | null;
  /** Offered beside the name when a guest raised this ticket. */
  onLinkCustomer: () => void;
}) {
  // Every status change waits for a yes, since each one emails the customer.
  const [pendingStatus, setPendingStatus] = useState<
    keyof typeof STATUS_CONFIRMATIONS | null
  >(null);
  const pendingConfirmation = pendingStatus
    ? STATUS_CONFIRMATIONS[pendingStatus]
    : null;
  const [selectedSendMode, setSelectedSendMode] = useState<
    "reply" | "customer_language" | "reply_and_resolve"
  >("reply");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // Only offered while resolving is a legal move for the ticket's status.
  const canResolve = (STATUS_TRANSITIONS[ticket.status] ?? []).includes(
    "resolved",
  );
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
  const selectedSendLabel =
    effectiveSendMode === "customer_language"
      ? "Send in Customer Language"
      : effectiveSendMode === "reply_and_resolve"
        ? "Send and Mark Resolved"
        : "Send";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [ticket.id, messages.length]);

  // Tickets from before these fields existed come back without them.
  const ticketLanguage = ticket.language ?? DEFAULT_TICKET_LANGUAGE;
  const ticketSentiment = ticket.sentiment ?? DEFAULT_TICKET_SENTIMENT;
  const languageName =
    SUPPORTED_LANGUAGES.find((language) => language.code === ticketLanguage)
      ?.name ?? ticketLanguage;

  const customerName = customerLabel(ticket.customer);
  // Shown in brackets beside the status — only while the ticket is in the
  // reopen status. The count is lifetime, so a reopened ticket that has since
  // been closed or resolved still carries it, and must not show it.
  const reopenCount =
    ticket.status === "reopen" ? (ticket.reopen_count ?? 0) : 0;
  const customerEmail =
    ticket.customer && typeof ticket.customer === "object"
      ? ticket.customer.email
      : null;

  const totalAttachments =
    ticket.messages?.reduce(
      (count, message) => count + (message.attachments?.length ?? 0),
      0,
    ) ?? 0;

  // Icon + value, so the facts cost one line rather than a labelled list.
  // Attachments only earn their place when there are some.
  const facts = [
    {
      // Falls back to the inbox icon and the raw value for a channel the
      // backend adds before this map hears about it.
      icon: CHANNEL_META[ticket.channel]?.icon ?? IconInbox,
      label: "Channel",
      value:
        CHANNEL_META[ticket.channel]?.label ?? capitalizeText(ticket.channel),
    },
    {
      icon: IconCalendarPlus,
      label: "Created",
      value: `Created ${formatDateTime(ticket.created_at)}`,
    },
    ...(ticket.created_by_type
      ? [
          {
            icon: CREATED_BY_META[ticket.created_by_type]?.icon ?? IconUser,
            label: "Created by",
            value: `Created by ${
              ticket.created_by?.name ||
              ticket.created_by?.email ||
              CREATED_BY_META[ticket.created_by_type]?.label ||
              capitalizeText(ticket.created_by_type)
            }`,
            // Two agents can share a name, so the tooltip adds the email.
            detail: ticket.created_by
              ? [ticket.created_by.name, ticket.created_by.email]
                  .filter(Boolean)
                  .join(" · ")
              : undefined,
          },
        ]
      : []),
    ...(totalAttachments > 0
      ? [
          {
            icon: IconPaperclip,
            label: "Attachments",
            value: pluralize(totalAttachments, "attachment"),
          },
        ]
      : []),
  ];

  const visibleTags = ticket.tags?.slice(0, MAX_VISIBLE_TKT_CONV_TAGS);
  const hiddenTags = ticket.tags?.slice(MAX_VISIBLE_TKT_CONV_TAGS);

  const snoozeLabel = (() => {
    if (!ticket?.is_snoozed || !ticket.snoozed_until) {
      return "Snooze";
    }

    const snoozedUntil = new Date(ticket.snoozed_until);
    const now = new Date();

    const isToday = snoozedUntil.toDateString() === now.toDateString();

    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    const isTomorrow = snoozedUntil.toDateString() === tomorrow.toDateString();

    const timeFormatter = new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });

    if (isToday) {
      return `Snoozed until ${timeFormatter.format(snoozedUntil)}`;
    }

    if (isTomorrow) {
      return `Snoozed until Tomorrow, ${timeFormatter.format(snoozedUntil)}`;
    }

    return `Snoozed until ${new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(snoozedUntil)}`;
  })();

  return (
    // `@container/conv`: the facts below size themselves to this pane, not
    // the viewport — the pane is what the ticket list and the details panel
    // leave over, which on a wide monitor can still be narrow.
    <main
      className={cn(
        "@container/conv min-w-0 flex-1 flex-col desktop:flex",
        className,
      )}
    >
      {/* Same 4rem header as the two side panels, so all three borders line
          up across the screen. The customer leads — who you are talking to
          is the first thing you need — and the subject follows below. */}
      <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-4 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 @3xl/conv:order-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Back to ticket list"
            className="-ml-2 shrink-0 desktop:hidden"
            onClick={onBack}
          >
            <IconArrowLeft />
          </Button>
          <CustomerAvatar name={customerName} />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <CardTitle className="truncate leading-tight">
                {customerName}
              </CardTitle>
              {/* Open their record, or attach one when a guest raised this.
                  No session facts here: a ticket can arrive by email,
                  phone or social, so there is no browsing session. */}
              <CrmLinkButton
                customerId={
                  ticket.customer && typeof ticket.customer === "object"
                    ? ticket.customer.id
                    : null
                }
                onLinkCustomer={onLinkCustomer}
              />
            </div>
            {customerEmail ? (
              <Typography variant="muted" className="truncate">
                {customerEmail}
              </Typography>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 @3xl/conv:order-3">
          {/* Staff are matched by id, not name: several people can share
              a name, and only the assigned one should carry the check. */}
          <Combobox
            items={availableStaff}
            value={
              availableStaff.find(
                (member) => member.id === ticket?.internal_assignee?.id,
              ) ?? null
            }
            isItemEqualToValue={(item, value) => item?.id === value?.id}
            itemToStringLabel={(member) =>
              `${member.first_name} ${member.last_name}`
            }
          >
            <ComboboxInput
              className={cn(
                "h-8 w-28 2xl:w-40",
                ticket?.internal_assignee?.id && ACTIVE_ASSIGNEE_STYLE,
              )}
              placeholder={
                ticket?.internal_assignee?.id
                  ? ticket?.internal_assignee?.name
                  : "Assign to…"
              }
              disabled={isClosed || !canAssign}
            />
            <ComboboxContent>
              <ComboboxEmpty>No staff found.</ComboboxEmpty>
              <div className="p-1">
                {ticket?.internal_assignee?.id && (
                  <ComboboxItem
                    className="hover:bg-muted"
                    onClick={() => onAssignStaff(null)}
                  >
                    Unassign
                  </ComboboxItem>
                )}
              </div>
              <ComboboxList>
                {(staff: StaffMember) => (
                  // The email tells same-name staff apart, on hover only so
                  // the list keeps its width.
                  <Tooltip key={staff.id}>
                    <TooltipTrigger asChild>
                      <ComboboxItem
                        value={staff}
                        onClick={() =>
                          staff.id !== ticket?.internal_assignee?.id &&
                          onAssignStaff(staff.id)
                        }
                      >
                        {staff.first_name} {staff.last_name}
                      </ComboboxItem>
                    </TooltipTrigger>
                    <TooltipContent side="left">{staff.email}</TooltipContent>
                  </Tooltip>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        {/* Narrow panes: the assignee stays on the customer row and the
            rest wraps onto a row of its own, right-aligned. Wide panes
            (`contents`) put everything back on one row, via `order`. */}
        <div className="flex basis-full items-center justify-end gap-2 @3xl/conv:contents">
          <TicketActivityDrawer
            storeCode={storeCode}
            ticketId={ticket.id}
            className="@3xl/conv:order-2"
          />
          <CustomerDetailsButton
            className="@3xl/conv:order-2"
            onClick={onShowDetails}
          />

          {/* Status is changed from here, per the ticket's current status:
              open/reopen → Resolve, resolved → Open or Close, closed →
              Reopen. Offered from STATUS_TRANSITIONS so the buttons can
              never drift from what the API accepts. */}
          {(STATUS_TRANSITIONS[ticket.status] ?? []).includes("resolved") ? (
            <Button
              variant="outline"
              size="sm"
              aria-label="Mark as resolved"
              className={cn(ACTION_TONE_STYLES.success, "@3xl/conv:order-4")}
              onClick={() => setPendingStatus("resolved")}
            >
              <IconCircleCheck className="size-4" />
              Resolve
            </Button>
          ) : null}

          {(STATUS_TRANSITIONS[ticket.status] ?? []).includes("open") ? (
            <Button
              variant="outline"
              size="sm"
              aria-label="Open ticket"
              className={cn(ACTION_TONE_STYLES.info, "@3xl/conv:order-4")}
              onClick={() => setPendingStatus("open")}
            >
              <IconInbox className="size-4" />
              Open
            </Button>
          ) : null}

          {(STATUS_TRANSITIONS[ticket.status] ?? []).includes("closed") ? (
            <Button
              variant="outline"
              size="sm"
              aria-label="Close ticket"
              className={cn(ACTION_TONE_STYLES.danger, "@3xl/conv:order-5")}
              onClick={() => setPendingStatus("closed")}
            >
              <IconCircleX className="size-4" />
              Close
            </Button>
          ) : null}

          {(STATUS_TRANSITIONS[ticket.status] ?? []).includes("reopen") ? (
            <Button
              variant="outline"
              size="sm"
              aria-label="Reopen ticket"
              className={cn(ACTION_TONE_STYLES.info, "@3xl/conv:order-4")}
              onClick={() => setPendingStatus("reopen")}
            >
              <IconReload className="size-4" />
              Reopen
            </Button>
          ) : null}

          {/* <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild disabled={isClosed}>
                  <Button
                    variant="outline"
                    size={ticket?.is_snoozed ? "sm" : "icon-sm"}
                    aria-label="Snooze ticket"
                    className={ACTION_TONE_STYLES.warning}
                  >
                    <IconAlarmSnoozeFilled className="size-4" />
                    {ticket?.is_snoozed ? snoozeLabel : null}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{snoozeLabel}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Snooze for</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SNOOZE_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset.label}
                  onClick={() => onTicketSnooze(preset.ms)}
                >
                  {preset.label}
                </DropdownMenuItem>
              ))}
              {ticket?.is_snoozed && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onTicketSnooze(null)}
                  >
                    <IconAlarmSnoozeFilled className="size-4" />
                    Remove snooze
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu> */}
        </div>
      </header>

      {/* The subject needs a line of its own — sharing one with the status
          chips left it truncated to a few words. The height follows the
          layout, not the data: the subject truncates, the tag list is
          capped with a +N, and the only thing that adds a row is the pane's
          width (the tags wrap to their own row when it runs short), so a
          ticket with nine tags is exactly as tall as one with none. */}
      <div className="flex min-h-20 shrink-0 flex-col justify-center gap-2 overflow-hidden border-b px-4 py-3">
        <div className="flex items-baseline gap-3">
          <div className="flex min-w-0 flex-1 items-baseline gap-2 overflow-hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <Typography variant="small" as="h3" className="truncate">
                  {ticket.subject}
                </Typography>
              </TooltipTrigger>
              <TooltipContent className="max-w-80">
                <p>{ticket.subject}</p>
              </TooltipContent>
            </Tooltip>
            <Typography variant="caption" className="shrink-0">
              {ticketRef(ticket.ticket_id)}
            </Typography>
            {ticket.order_id ? (
              <Typography variant="caption" className="shrink-0">
                ORDER-#{ticket.order_id}
              </Typography>
            ) : null}
          </div>

          {/* Facts close the subject line, and say what each date is — two
              bare timestamps side by side told you nothing. They write
              their values out only when the pane is wide enough (64rem);
              narrower, they collapse to their icons (the tooltip carries
              the value), so the subject keeps the line. */}
          <div className="hidden shrink-0 items-center gap-3 desktop:flex 2xl:gap-4">
            {facts.map((fact) => (
              <TicketFact key={fact.label} {...fact} />
            ))}
          </div>
        </div>

        {/* Below `lg` there is no room for the facts on the subject line, and
            hover tooltips do not exist on a touch screen — so they get a row
            of their own with the values written out. Scrolls sideways
            rather than wrapping, to keep the header's height fixed. */}
        <div className="scrollbar-none flex items-center gap-4 overflow-x-auto *:shrink-0 desktop:hidden">
          {facts.map((fact) => (
            <TicketFact key={fact.label} {...fact} showValue />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <div className="flex shrink-0 items-center gap-2">
            {/* A plain tag: status is changed with the action buttons in the
              header, not from here. Priority is still set on its badge. */}
            <Badge
              variant="outline"
              title={
                reopenCount > 0
                  ? `Reopened ${pluralize(reopenCount, "time")}`
                  : undefined
              }
              className={cn(
                "capitalize",
                BADGE_TONE_STYLES[STATUS_TONE[ticket.status]],
              )}
            >
              {capitalizeText(ticket.status)}
              {reopenCount > 0 ? ` (${reopenCount})` : null}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Change priority"
                disabled={isClosed}
                className={cn(
                  badgeVariants({ variant: "outline" }),
                  "cursor-pointer capitalize disabled:cursor-default disabled:opacity-60",
                  BADGE_TONE_STYLES[PRIORITY_TONE[ticket.priority]],
                )}
              >
                {capitalizeText(ticket.priority)}
                {!isClosed ? <IconChevronDown /> : null}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {priorityOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() =>
                      option.value !== ticket.priority &&
                      onTicketPriorityUpdate(option.value)
                    }
                    className={cn(
                      option.value === ticket.priority && "font-medium",
                    )}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* The language is detected from the conversation, so it is
                only shown here, not set. */}
            <Badge variant="outline" aria-label="Ticket language">
              <IconLanguage />
              {languageName}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Change sentiment"
                disabled={isClosed}
                className={cn(
                  badgeVariants({ variant: "outline" }),
                  "cursor-pointer capitalize disabled:cursor-default disabled:opacity-60",
                  BADGE_TONE_STYLES[SENTIMENT_TONE[ticketSentiment]],
                )}
              >
                {capitalizeText(ticketSentiment)}
                {!isClosed ? <IconChevronDown /> : null}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Sentiment</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {TICKET_SENTIMENTS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() =>
                      option.value !== ticketSentiment &&
                      onTicketLanguageSentimentUpdate({
                        sentiment: option.value,
                      })
                    }
                    className={cn(
                      option.value === ticketSentiment && "font-medium",
                    )}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* {!ticket.internal_assignee && ticket.status === "open" ? (
              <Badge variant="outline" className={BADGE_TONE_STYLES.accent}>
                Unassigned
              </Badge>
            ) : null} */}
          </div>

          {/* Tags and the add button share a group that sits beside the
              status chips while there is room for it, and wraps onto its own
              row the moment there is not — so it follows the pane's real
              width (sidebar open or closed, ticket list shown or hidden)
              rather than a breakpoint. Beside four chips, a narrow pane left
              the tags a sliver, and they showed half-cut. */}
          <div className="flex min-w-64 flex-1 items-center gap-2">
            <div className="scrollbar-none flex min-w-0 flex-1 items-center gap-2 overflow-x-auto *:shrink-0">
              {visibleTags?.map((tag) => {
                const tagId = tag.id;
                return (
                  <TagBadge
                    key={tagId}
                    tag={tag}
                    onRemove={
                      tagId && !isClosed ? () => onRemoveTag(tagId) : undefined
                    }
                  />
                );
              })}
              {hiddenTags?.length > 0 ? (
                <HiddenTagsBadge
                  tags={hiddenTags}
                  label={`+${hiddenTags.length} more`}
                  onRemoveTag={isClosed ? undefined : onRemoveTag}
                />
              ) : null}
            </div>

            <Popover
              open={isTagPickerOpen}
              onOpenChange={() => onToggleTagPicker()}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={isClosed}
                      aria-label="Add Tag"
                      className="shrink-0"
                    >
                      <IconPlus className="size-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Add tag</TooltipContent>
              </Tooltip>
              <PopoverContent align="start" className="w-65 p-0">
                <div className="border-b px-3 py-2.5">
                  <CardTitle>Add tag</CardTitle>
                  <Typography variant="muted">
                    Label this ticket so it is easy to find.
                  </Typography>
                </div>
                <div className="p-2">
                  <SearchInput
                    value={tagSearch}
                    onChange={onTagSearchChange}
                    placeholder="Search tags…"
                    label="Search tags"
                  />
                </div>
                {isTagPickerLoading && !isLoadingMoreTags ? (
                  <LoadingState label="Loading tags…" className="py-6" />
                ) : availableTags.length === 0 ? (
                  <div className="px-3 pb-4 text-center">
                    <Typography variant="muted">
                      {tagSearch.trim()
                        ? "No matching tags."
                        : "No tags available."}
                    </Typography>
                  </div>
                ) : (
                  <div className="max-h-56 space-y-1 overflow-y-auto p-2 pt-0">
                    {availableTags.map((tag) => {
                      const alreadyAdded = ticket.tags.some(
                        (existingTag) => existingTag.id === tag.id,
                      );
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                            alreadyAdded
                              ? "text-muted-foreground line-through"
                              : "text-foreground hover:bg-muted",
                          )}
                          onClick={() =>
                            !alreadyAdded && tag.id && onAddTag(tag.id)
                          }
                          disabled={alreadyAdded}
                        >
                          <span className="truncate">{tag.name}</span>
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                        </button>
                      );
                    })}
                    {hasMoreTags ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={onLoadMoreTags}
                        disabled={isLoadingMoreTags}
                      >
                        {isLoadingMoreTags ? "Loading…" : "Load More"}
                      </Button>
                    ) : null}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 p-4">
          {messages.length === 0 ? (
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
            messages.map((message) => {
              // A "system" message (the ticket summary, or an issue the AI
              // adds later) deliberately shares the customer bubble: it is
              // anything that is not a note or an agent reply.
              const SystemIcon =
                ticket.channel === "web"
                  ? IconSparkles
                  : (CHANNEL_META[ticket.channel]?.icon ?? IconSparkles);
              const isNote = message.message_type === "internal";
              // Notes are written by staff, so they sit on the staff side.
              const isOutgoing = isNote || message.sender_type === "agent";

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-end gap-2",
                    isOutgoing && "flex-row-reverse",
                  )}
                >
                  {isNote ? (
                    // A sticky note, not a pencil: a pencil in a circle
                    // beside a message reads as an edit button, and this
                    // is a label, not something you can press.
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-amber-500/60 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                      <IconNote className="size-3.5" />
                    </div>
                  ) : isOutgoing ? (
                    <Avatar className="size-7 shrink-0">
                      <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
                        A
                      </AvatarFallback>
                    </Avatar>
                  ) : message.sender_type === "system" ? (
                    // Nobody wrote it, so no initials: the channel the
                    // ticket came in on, sparkles for the web assistant.
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <SystemIcon className="size-3.5" />
                    </div>
                  ) : (
                    <CustomerAvatar name={customerName} size="size-7" />
                  )}

                  {/* Wide bubbles with the time tucked inside: a support
                      reply is a paragraph, not a chat line, and a separate
                      meta row under every bubble doubled the spacing. */}
                  <div
                    className={cn(
                      "min-w-0 max-w-4/5 rounded-2xl px-4 py-3",
                      isNote
                        ? // Dashed and tinted: an internal note is the one
                          // thing here the customer never sees, so it has
                          // to be unmistakable at a glance. The old
                          // border-on-background was so faint it read as a
                          // rendering fault.
                          "rounded-br-md border border-dashed border-amber-500/60 bg-amber-50 dark:bg-amber-500/10"
                        : isOutgoing
                          ? "rounded-br-md bg-primary/10"
                          : "rounded-bl-md bg-muted",
                    )}
                  >
                    {isNote ? (
                      <Typography
                        variant="small"
                        as="p"
                        className="mb-1 flex items-center gap-1.5 text-primary"
                      >
                        <IconLock className="size-3.5" />
                        Internal note
                      </Typography>
                    ) : null}
                    <MessageAttachments
                      attachments={message.attachments}
                      pendingFiles={message.pendingFiles}
                    />
                    <div className="rich-text-render text-sm leading-6 [overflow-wrap:anywhere] text-foreground">
                      <ReactMarkdown>{message.message}</ReactMarkdown>
                    </div>
                    <Typography
                      variant="caption"
                      as="div"
                      className="mt-1 text-right"
                    >
                      {message.id < 0
                        ? "Sending..."
                        : formatDateTime(message.created_at)}
                    </Typography>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t p-4">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex max-w-full items-center gap-2 rounded-md border px-2 py-1 text-sm"
              >
                <IconPaperclip className="size-4 shrink-0" />
                <span className="max-w-48 truncate" title={file.name}>
                  {file.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${file.name}`}
                  title="Remove attachment"
                  disabled={isSending}
                  onClick={() =>
                    onAttachmentsChange(
                      attachments.filter((_, fileIndex) => fileIndex !== index),
                    )
                  }
                >
                  <IconX className="size-4" />
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
          disabled={
            // isMessageImproving ||
            isSending || isClosed || isTranslating
          }
          placeholder="Write a reply…"
          minHeight="6rem"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Attach files"
                disabled={isSending || isClosed || isTranslating}
                onClick={() => attachmentInputRef.current?.click()}
              >
                <IconPaperclip className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach files</TooltipContent>
          </Tooltip>
          <input
            ref={attachmentInputRef}
            type="file"
            multiple
            accept={SUPPORT_ATTACHMENT_ALLOWED_EXTENSIONS.join(",")}
            className="hidden"
            aria-label="Choose attachments"
            onChange={handleAttachmentChange}
          />
          {/* AI tools stay icons — the two sends are what need words. */}
          {/* <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={
                  aiDraft?.message ? "Use AI draft" : "Generate AI draft"
                }
                onClick={() =>
                  aiDraft?.message ? onAcceptDraft() : onAIDraftGenerate()
                }
                disabled={
                  isAIDraftLoading ||
                  // isMessageImproving ||
                  isClosed ||
                  isTranslating
                }
              >
                {isAIDraftLoading ? (
                  <Spinner className="size-4" />
                ) : (
                  <IconMessageChatbot className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isAIDraftLoading
                ? "Generating AI draft…"
                : aiDraft?.message
                  ? "Use AI draft"
                  : "Generate AI draft"}
            </TooltipContent>
          </Tooltip> */}

          {/*
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Improve the reply"
                    disabled={isMessageImproving || isClosed || isTranslating}
                  >
                    {isMessageImproving ? (
                      <Spinner className="size-4" />
                    ) : (
                      <IconSparkles className="size-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                {isMessageImproving ? "Improving…" : "Improve"}
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Improve the reply</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onMessageImprove("rephrase")}>
                <IconReload className="size-4" />
                Rephrase
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMessageImprove("warmer")}>
                <IconMoodSmile className="size-4" />
                Warmer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* Small text and tight padding, so the label and its cost fit
                  the button's normal height and the toolbar's one line. */}
              <Button
                variant="outline"
                size="sm"
                className="gap-0.5 px-1.5 text-xs"
                title={
                  translatedLanguage
                    ? `Translated to ${translatedLanguage.name}`
                    : undefined
                }
                disabled={isClosed || isTranslating}
              >
                {isTranslating ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <IconLanguage className="size-3.5" />
                )}
                <CreditLabel className="text-[9px]">
                  {translatedLanguage
                    ? `Translated to ${translatedLanguage.name}`
                    : "Translate"}
                </CreditLabel>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-72 overflow-y-auto"
            >
              <DropdownMenuLabel>Translate to</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SUPPORTED_LANGUAGES.map((language) => (
                <DropdownMenuItem
                  key={language.code}
                  onClick={() => onTranslate(language.code)}
                  className={cn(
                    language.code === translatedLanguage?.code && "font-medium",
                  )}
                >
                  {language.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex items-center gap-2">
            {/* Below 2xl the secondary actions keep their icons and hand
                the label to a tooltip — same rule as the header actions. */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSaveDraft}
                  disabled={isClosed || isTranslating}
                  aria-label="Save Draft"
                >
                  <IconDeviceFloppy className="size-4" />
                  <span className="hidden 2xl:inline">Save Draft</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Draft</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSend("note")}
                  disabled={
                    isSending ||
                    // isMessageImproving ||
                    isClosed ||
                    isTranslating
                  }
                  aria-label="Send as Internal Note"
                >
                  <IconPencil className="size-4" />
                  <span className="hidden 2xl:inline">
                    Send as Internal Note
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send as Internal Note</TooltipContent>
            </Tooltip>
            <ButtonGroup>
              <Button
                size="sm"
                onClick={() => onSend(effectiveSendMode)}
                disabled={
                  isSending ||
                  // isMessageImproving ||
                  isClosed ||
                  isTranslating
                }
              >
                {isSending ? (
                  <Spinner className="size-4" />
                ) : (
                  <IconSend className="size-4" />
                )}
                {isSending ? (
                  "Sending…"
                ) : effectiveSendMode === "customer_language" ? (
                  // The send itself translates the reply, so it is billed.
                  <CreditLabel className="text-primary-foreground/80">
                    {selectedSendLabel}
                  </CreditLabel>
                ) : (
                  selectedSendLabel
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    disabled={
                      isSending ||
                      // isMessageImproving ||
                      isClosed ||
                      isTranslating
                    }
                    className="px-2"
                    aria-label="Choose send option"
                  >
                    <IconChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuItem
                    onClick={() => setSelectedSendMode("reply")}
                  >
                    <IconSend className="size-4" />
                    Send
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedSendMode("customer_language")}
                  >
                    <IconLanguage className="size-4" />
                    <CreditLabel>Send in Customer Language</CreditLabel>
                  </DropdownMenuItem>
                  {canResolve ? (
                    <DropdownMenuItem
                      onClick={() => setSelectedSendMode("reply_and_resolve")}
                    >
                      <IconCircleCheck className="size-4" />
                      Send and Mark Resolved
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          </div>
        </div>
      </div>

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
                if (pendingStatus) onTicketStatusUpdate(pendingStatus);
              }}
            >
              {pendingConfirmation?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

/** Icon + value, with the field name in a tooltip — the label is the icon. */
function TicketFact({
  icon: Icon,
  label,
  value,
  detail,
  showValue = false,
}: {
  /** Write the value out beside the icon at every width, instead of only from `2xl`. */
  showValue?: boolean;
  // The shared tabler type rather than one specific icon's: the channel
  // fact now picks its icon from a map, and every entry has to fit.
  icon: Icon;
  label: string;
  value: string;
  /** What the tooltip says when it should say more than the value does. */
  detail?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <Typography
            variant="caption"
            className={cn(
              "truncate",
              showValue ? "whitespace-nowrap" : "hidden @5xl/conv:inline",
            )}
          >
            {value}
          </Typography>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {label}: {detail ?? value}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * The orders pane before a ticket is chosen, and while one loads. One
 * component so both states keep the pane exactly as wide as the real one.
 */
function TicketInsightsPlaceholder({
  loading,
  label,
}: {
  loading?: boolean;
  label: string;
}) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col items-center justify-center border-l px-6 text-center xl:flex 2xl:w-95">
      {loading ? (
        <LoadingState label={label} />
      ) : (
        <Typography variant="muted">{label}</Typography>
      )}
    </aside>
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
  const priorityParam = searchParams?.get("priority") ?? "";
  const fromDateParam = searchParams?.get("from_date") ?? "";
  const toDateParam = searchParams?.get("to_date") ?? "";
  const sortParam = searchParams?.get("sort");

  const appliedFilters = useMemo<TicketFilterSelection>(
    () => ({
      priorities: priorityOptions
        .map((option) => option.value)
        .filter((value) => priorityParam.split(",").includes(value)),
      fromDate: isValidDateParam(fromDateParam) ? fromDateParam : "",
      toDate: isValidDateParam(toDateParam) ? toDateParam : "",
    }),
    [priorityParam, fromDateParam, toDateParam],
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

  const filterFormik = useFormik<TicketFilterSelection>({
    initialValues: emptyTicketFilters,
    validate: (values) => {
      const now = new Date();

      if (values.fromDate && new Date(values.fromDate) > now) {
        return { fromDate: "The From date/time cannot be in the future" };
      }

      if (values.toDate && new Date(values.toDate) > now) {
        return { toDate: "The To date/time cannot be in the future." };
      }

      if (
        values.fromDate &&
        values.toDate &&
        new Date(values.fromDate) > new Date(values.toDate)
      ) {
        return { toDate: "The To date must be after the From date." };
      }
      return {};
    },
    onSubmit: (values) => {
      updateQueryParams({
        priority: values.priorities.join(",") || null,
        from_date: values.fromDate || null,
        to_date: values.toDate || null,
      });
      setIsFilterOpen(false);
    },
  });

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
      // The picker yields whole days, so the range runs from the start of
      // the first to the end of the last — otherwise "to: today" would stop
      // at midnight and miss everything that happened today.
      ...(appliedFilters.fromDate
        ? { from_date: startOfDay(appliedFilters.fromDate) }
        : {}),
      ...(appliedFilters.toDate
        ? { to_date: endOfDay(appliedFilters.toDate) }
        : {}),
      ...(appliedFilters.priorities.length
        ? { priority: appliedFilters.priorities }
        : {}),
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
          const next = isBelowLg() ? null : (data.results[0] ?? null);
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

  // A link can name a ticket that was deleted, belongs to another store,
  // or was simply mistyped. Saying so beats "no ticket selected", which
  // reads as though nothing was asked for.
  const linkedTicketMissing =
    Boolean(activeTicketId) &&
    !FetchSupportTicketDetailsIsLoading &&
    Boolean(FetchSupportTicketDetailsIsError) &&
    activeSupportTicket?.id !== activeTicketId;

  const activeQueueLabel = useMemo(
    () => queues.find((queue) => queue.key === activeQueue)?.label ?? "Open",
    [activeQueue],
  );

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
              ? { ...ticket, tags: [...ticket.tags, assignedTag] }
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
                }
              : ticket,
          ),
        );

        setActiveSupportTicket((current) =>
          current
            ? {
                ...current,
                tags: current.tags.filter((tag) => tag.id !== assignedTag.id),
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
          const narrow = isBelowLg();
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

  // Support Ticket Filter Utilities
  const handleFilterOpenChange = (open: boolean) => {
    setIsFilterOpen(open);
    if (open) {
      filterFormik.resetForm({ values: appliedFilters });
    }
  };

  const handleApplyFilters = () => {
    filterFormik.handleSubmit();
  };

  const handleClearFilters = () => {
    filterFormik.resetForm({ values: emptyTicketFilters });
    updateQueryParams({ priority: null, from_date: null, to_date: null });
    setIsFilterOpen(false);
  };

  // Below `lg` the conversation pane (and its placeholders) show only when
  // a ticket is open and the user has chosen it; otherwise the list does.
  const showConversationBelowLg =
    portraitView === "conversation" && activeTicketId !== null;
  const conversationPaneClass = showConversationBelowLg ? "flex" : "hidden";

  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden border-y">
      <div className="flex min-h-0 flex-1">
        <TicketListPanel
          className={showConversationBelowLg ? "hidden" : "flex"}
          rows={ticketRows}
          activeTicketId={activeSupportTicket?.id ?? null}
          activeQueue={activeQueue}
          queueLabel={activeQueueLabel}
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
          filters={filterFormik.values}
          isFilterOpen={isFilterOpen}
          onFilterOpenChange={handleFilterOpenChange}
          onFiltersChange={(filters) => filterFormik.setValues(filters)}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          dateError={filterFormik.errors.fromDate ?? filterFormik.errors.toDate}
          supportTicketStatusCount={FetchSupportTicketsListData.status_counts}
        />
        {(FetchSupportTicketsLoading || FetchSupportTicketDetailsIsLoading) &&
        activeSupportTicket?.id !== activeTicketId ? (
          <div
            className={cn(
              "min-w-0 flex-1 items-center justify-center desktop:flex",
              conversationPaneClass,
            )}
          >
            <LoadingState label="Loading conversation…" />
          </div>
        ) : linkedTicketMissing ? (
          <div
            className={cn(
              "min-w-0 flex-1 flex-col items-center justify-center gap-1 px-6 text-center desktop:flex",
              conversationPaneClass,
            )}
          >
            <IconInbox className="mb-1 size-6 text-muted-foreground opacity-40" />
            <Typography variant="small" as="p">
              Ticket Not Found
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
              Back to Inbox
            </Button>
          </div>
        ) : !activeSupportTicket ? (
          <div
            className={cn(
              "min-w-0 flex-1 flex-col items-center justify-center gap-1 px-6 text-center desktop:flex",
              conversationPaneClass,
            )}
          >
            <IconInbox className="mb-1 size-6 text-muted-foreground opacity-40" />
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
            storeCode={storeCode}
            ticket={activeSupportTicket}
            messages={supportTikcetMessages}
            reply={reply}
            attachments={attachments}
            onAttachmentsChange={(files) =>
              setAttachmentSelection({ ticketId: activeTicketId, files })
            }
            isSending={SupportTicketMessageSendIsLoading}
            onReplyChange={setReply}
            onSend={handleSend}
            onAcceptDraft={handleAcceptDraft}
            onSaveDraft={handleSaveDraft}
            availableTags={ticketTags}
            isTagPickerOpen={showTagPicker}
            isTagPickerLoading={FetchSupportTicketTagsIsLoading}
            isLoadingMoreTags={FetchSupportTicketTagsIsLoading && tagPage > 1}
            hasMoreTags={Boolean(FetchSupportTicketTagsData?.next)}
            onLoadMoreTags={() => {
              if (FetchSupportTicketTagsData?.next) {
                setTagPage((current) => current + 1);
              }
            }}
            tagSearch={tagSearchInput}
            onTagSearchChange={setTagSearchInput}
            onToggleTagPicker={handleToggleTagPicker}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            availableStaff={staff}
            canAssign={canAssign}
            onAssignStaff={handleStaffAssign}
            // onMessageImprove={handleMessageImprove}
            // isMessageImproving={SupportMessageImproveIsLoading}
            onTicketSnooze={handleTicketSnooze}
            onTicketStatusUpdate={handleSupportTicketStatusUpdate}
            onTicketPriorityUpdate={handleSupportTicketPriorityUpdate}
            onTicketLanguageSentimentUpdate={
              handleSupportTicketLanguageSentimentUpdate
            }
            onAIDraftGenerate={handleAiDraftGenerate}
            isAIDraftLoading={SupportTicketAIMessageDraftGenerateIsLoading}
            aiDraft={
              activeSupportTicket?.drafts?.find(
                (draft) => draft.draft_type === "ai",
              ) ?? null
            }
            isClosed={
              activeSupportTicket.status === "closed" ||
              activeSupportTicket.status === "resolved"
            }
            onTranslate={handleSupportTicketMessagesTranslate}
            isTranslating={SupportTicketMessagesTranslateIsLoading}
            translatedLanguage={translatedLanguage}
            onLinkCustomer={() => setIsLinkCustomerOpen(true)}
          />
        )}
        {(FetchSupportTicketsLoading || FetchSupportTicketDetailsIsLoading) &&
        activeSupportTicket?.id !== activeTicketId ? (
          <TicketInsightsPlaceholder
            loading
            label="Loading customer details…"
          />
        ) : !activeSupportTicket ? (
          <TicketInsightsPlaceholder label="Select a ticket to see the customer's details." />
        ) : (
          <CustomerDetailsPanel
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            customerData={ticketCustomer}
            orders={ticketCustomer?.orders}
            ordersLoading={FetchSupportTicketDetailsIsLoading}
            onOrdersSync={handleCustomerOrderSync}
            orderSyncLoading={SyncCustomerOrdersIsLoading}
            ordersDisabled={
              activeSupportTicket.status === "closed" ||
              activeSupportTicket.status === "resolved"
            }
            tickets={{
              data: otherCustomerTickets,
              loading: FetchFreshdeskTicketIdIsLoading,
            }}
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
    </div>
  );
}
