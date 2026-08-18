"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  startTransition,
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
  IconMail,
  IconWorld,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandWhatsapp,
  type Icon,
  IconLanguage,
  IconMessageChatbot,
  IconMoodSmile,
  IconPaperclip,
  IconLock,
  IconNote,
  IconPencil,
  IconPlus,
  IconReload,
  IconSend,
  IconSparkles,
} from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";

import { useFormik } from "formik";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import {
  ACTION_TONE_STYLES,
  BADGE_TONE_STYLES,
  type BadgeTone,
} from "@/lib/badge-tones";

import { ConversationRow } from "@/components/custom/conversation-row";
import { MultiSelectCombobox } from "@/components/custom/multi-select-combobox";
import {
  TicketPriorityBar,
  TICKET_PRIORITY_TONES,
  ticketRef,
} from "@/components/custom/ticket-priority-bar";
import { CustomerDetailsPanel } from "@/components/custom/customer-details-panel";
import { CrmLinkButton } from "@/components/custom/customer-header";
import { LinkCustomerDialog } from "@/components/custom/link-customer-dialog";
import { CustomerAvatar } from "@/components/custom/customer-avatar";
import {
  HiddenTagsBadge,
  TagBadge,
} from "@/components/custom/helpdesk/tag-badge";
import { DateRangePicker } from "@/components/custom/date-range-picker";
import { LoadingState } from "@/components/custom/loading-state";
import { SearchInput } from "@/components/custom/search-input";

import { ENDPOINTS } from "@/lib/config";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchSupportTickets,
  FetchSupportTicketTags,
  SupportTicketStaffAssign,
  FetchSupportTicketDetails,
  SupportTicketMessageSend,
  SupportTicketAgentDraftSave,
  SupportTicketTagAssign,
  SupportTicketTagRemove,
  SupportMessageImprove,
  SupportTicketSnooze,
  SupportTicketMarkRead,
  SupportTicketAIMessageDraftGenerate,
  SupportTicketCustomerLink,
  SupportTicketCustomerOrderSync,
  SupportTicketStatusUpdate,
  SupportTicketPriorityUpdate,
  SupportTicketMessagesTranslate,
  type SupportTicket,
  type SupportTicketChannel,
  type SupportTicketPriority,
  type SupportTicketTagData,
  type SupportTicketMessage,
  type SupportTicketDraftMessage,
  type SupportTicketCustomer,
  type SupportTicketStatus,
  type SupportTicketFilters,
  type SupportTicketStatusCounts,
  type SupportSocketPayload,
} from "@/redux/api-slice/support-ticket-slice";
import { FetchStaff, type StaffMember } from "@/redux/api-slice/tenancy-slice";
import { FetchFreshdeskTicketId } from "@/redux/api-slice/thread-slice";
import {
  capitalizeText,
  endOfDay,
  formatDateTime,
  formatRelativeDateTime,
  startOfDay,
} from "@/lib/helpers";

const CKEditorTextArea = dynamic(
  () => import("@/components/custom/ckeditor-text-area"),
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

// Message transalte languages
const translationLanguages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "ru", name: "Russian" },
  { code: "uk", name: "Ukrainian" },
  { code: "tr", name: "Turkish" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "ur", name: "Urdu" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "pa", name: "Punjabi" },
];

/**
 * Priority reuses the shared badge palette rather than its own greens and
 * ambers, so "urgent" here reads the same as any other alarming badge in
 * the app — and so both themes are covered.
 */
const STATUS_TONE: Record<SupportTicketStatus, BadgeTone> = {
  open: "info",
  pending: "warning",
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
      preview={<span className="text-foreground/70">{customerName}</span>}
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
  { key: "pending", label: "Pending" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
] as const;

type TicketFilterSelection = {
  channels: SupportTicketChannel[];
  tags: string[];
  priorities: SupportTicketPriority[];
  fromDate: string;
  toDate: string;
};

const emptyTicketFilters: TicketFilterSelection = {
  channels: [],
  tags: [],
  priorities: [],
  fromDate: "",
  toDate: "",
};

/**
 * How each channel is named and drawn.
 *
 * One map rather than a label list and an icon chosen at the point of use:
 * the ticket header was showing a generic inbox for every channel, so a
 * Facebook ticket and an email ticket looked identical until you read the
 * word beside them — which is the one thing an icon is there to save.
 */
const CHANNEL_META: Record<
  SupportTicketChannel,
  { label: string; icon: Icon }
> = {
  web: { label: "Web", icon: IconWorld },
  email: { label: "Email", icon: IconMail },
  whatsapp: { label: "WhatsApp", icon: IconBrandWhatsapp },
  facebook: { label: "Facebook", icon: IconBrandFacebook },
  instagram: { label: "Instagram", icon: IconBrandInstagram },
};

const channelOptions: { value: SupportTicketChannel; label: string }[] =
  // Derived, so adding a channel to the map offers it as a filter too.
  (Object.keys(CHANNEL_META) as SupportTicketChannel[]).map((value) => ({
    value,
    label: CHANNEL_META[value].label,
  }));

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
  onSelectTicket,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  searchValue,
  onSearchChange,
  availableTags,
  filters,
  isFilterOpen,
  onFilterOpenChange,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  dateError,
  hasMoreTags,
  isTagListLoading,
  onTagSearchChange,
  onLoadMoreTags,
  supportTicketStatusCount,
}: {
  // ...same prop types as before, unchanged
  rows: SupportTicket[];
  activeTicketId: number | null;
  activeQueue: SupportTicketStatus;
  queueLabel: string;
  onQueueChange: (queue: SupportTicketStatus) => void;
  onSelectTicket: (ticketId: number) => void;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  availableTags: SupportTicketTagData[];
  filters: TicketFilterSelection;
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  onFiltersChange: (filters: TicketFilterSelection) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  dateError?: string;
  hasMoreTags: boolean;
  isTagListLoading: boolean;
  onTagSearchChange: (value: string) => void;
  onLoadMoreTags: () => void;
  supportTicketStatusCount: SupportTicketStatusCounts;
}) {
  const activeFilterCount =
    filters.channels.length +
    filters.tags.length +
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
    <section className="hidden h-full min-h-0 w-72 shrink-0 flex-col border-r md:flex 2xl:w-84">
      {/* One header, not two: the queue switcher is the inbox's title, so a
          separate "Your inbox" line above it said nothing extra. */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="-ml-2 gap-1">
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
                    Channel
                  </Typography>
                </legend>
                <MultiSelectCombobox
                  options={channelOptions}
                  value={filters.channels}
                  onValueChange={(channels) =>
                    onFiltersChange({
                      ...filters,
                      channels: channels as SupportTicketChannel[],
                    })
                  }
                  placeholder="Search channels…"
                  emptyMessage="No channels found."
                />
              </fieldset>

              <fieldset>
                <legend className="mb-2">
                  <Typography variant="small" as="span">
                    Tags
                  </Typography>
                </legend>
                <MultiSelectCombobox
                  options={availableTags.map((tag) => ({
                    value: tag.name,
                    label: tag.name,
                  }))}
                  value={filters.tags}
                  onValueChange={(tags) =>
                    onFiltersChange({ ...filters, tags })
                  }
                  placeholder="Search tags…"
                  emptyMessage="No tags found."
                  onSearchChange={onTagSearchChange}
                  hasMore={hasMoreTags}
                  isLoading={isTagListLoading}
                  onLoadMore={onLoadMoreTags}
                />
              </fieldset>

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
  ticket,
  messages,
  reply,
  isSending,
  onReplyChange,
  onSend,
  onAcceptDraft,
  onSaveDraft,
  availableTags,
  isTagPickerOpen,
  isTagPickerLoading,
  hasMoreTags,
  onLoadMoreTags,
  onToggleTagPicker,
  onAddTag,
  onRemoveTag,
  availableStaff,
  onAssignStaff,
  onMessageImprove,
  isMessageImproving,
  onTicketSnooze,
  onTicketStatusUpdate,
  onTicketPriorityUpdate,
  onAIDraftGenerate,
  isAIDraftLoading,
  aiDraft,
  isClosed,
  onTranslate,
  isTranslating,
  translatedLanguage,
  onLinkCustomer,
}: {
  ticket: SupportTicket;
  messages: SupportTicketMessage[];
  reply: string;
  isSending: boolean;
  onReplyChange: (value: string) => void;
  /** Reply is the default; an internal note is the deliberate other choice. */
  onSend: (mode: "reply" | "note") => void;
  onAcceptDraft: () => void;
  onSaveDraft: () => void;
  availableTags: SupportTicketTagData[];
  isTagPickerOpen: boolean;
  isTagPickerLoading: boolean;
  hasMoreTags: boolean;
  onLoadMoreTags: () => void;
  onToggleTagPicker: () => void;
  onAddTag: (tagId: number) => void;
  onRemoveTag: (tagId: number) => void;
  availableStaff: StaffMember[];
  onAssignStaff: (staffId: number | null) => void;
  onMessageImprove: (action: string) => void;
  isMessageImproving: boolean;
  onTicketSnooze: (snoozeTime: number | null) => void;
  onTicketStatusUpdate: (status: SupportTicketStatus) => void;
  onTicketPriorityUpdate: (priority: SupportTicketPriority) => void;
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
  const [tagSearch, setTagSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [ticket.id, messages.length]);

  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase()),
  );

  const customerName = customerLabel(ticket.customer);
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
    <main className="flex min-w-0 flex-1 flex-col">
      {/* Same 4rem header as the two side panels, so all three borders line
          up across the screen. The customer leads — who you are talking to
          is the first thing you need — and the subject follows below. */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
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

        <div className="flex shrink-0 items-center gap-2">
          <Combobox items={availableStaff}>
            <ComboboxInput
              className="h-8 w-28 2xl:w-40"
              placeholder={
                ticket?.internal_assignee?.id
                  ? ticket?.internal_assignee?.name
                  : "Assign to…"
              }
              disabled={isClosed}
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
                {(staff) => (
                  <ComboboxItem
                    key={staff.id}
                    value={`${staff.first_name} ${staff.last_name}`}
                    onClick={() =>
                      staff.id !== ticket?.internal_assignee?.id &&
                      onAssignStaff(staff.id)
                    }
                  >
                    {staff.first_name} {staff.last_name}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>

          {/* The two endings a ticket actually has, one click away —
              they were buried in the status Select behind the ⋮ menu. */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Mark as resolved"
                className={ACTION_TONE_STYLES.success}
                onClick={() => onTicketStatusUpdate("resolved")}
                disabled={isClosed}
              >
                <IconCircleCheck className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mark as resolved</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Close ticket"
                className={ACTION_TONE_STYLES.danger}
                onClick={() => onTicketStatusUpdate("closed")}
                disabled={ticket.status === "closed"}
              >
                <IconCircleX className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close ticket</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild disabled={isClosed}>
                  {/* Icon only until it is snoozed — then the time it wakes
                      up is worth the width. */}
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
          </DropdownMenu>
        </div>
      </header>

      {/* Two rows, at a fixed h-20 that cannot grow. The subject needs a
          line of its own — sharing one with the status chips left it
          truncated to a few words. Height stays independent of the data:
          neither row wraps, the subject truncates, and the tag list is
          capped with a +N, so a ticket with nine tags sits at exactly the
          same height as one with none. */}
      <div className="flex h-20 shrink-0 flex-col justify-center gap-2 overflow-hidden border-b px-4">
        <div className="flex items-baseline gap-3">
          <div className="flex min-w-0 flex-1 items-baseline gap-2">
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
              {ticketRef(ticket.id)}
            </Typography>
          </div>

          {/* Facts close the subject line, and say what each date is — two
              bare timestamps side by side told you nothing. Below 2xl they
              collapse to their icons (the tooltip carries the value), so
              the subject keeps the line on a laptop screen. */}
          <div className="hidden shrink-0 items-center gap-3 lg:flex 2xl:gap-4">
            {facts.map((fact) => (
              <TicketFact key={fact.label} {...fact} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex shrink-0 items-center gap-2">
            {/* Status and priority are set on the badges that report them,
              rather than in a menu behind a ⋮ that showed the same two
              values a second time. */}
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Change status"
                className={cn(
                  badgeVariants({ variant: "outline" }),
                  "cursor-pointer capitalize",
                  BADGE_TONE_STYLES[STATUS_TONE[ticket.status]],
                )}
              >
                {capitalizeText(ticket.status)}
                <IconChevronDown />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {queues.map((queue) => (
                  <DropdownMenuItem
                    key={queue.key}
                    onClick={() =>
                      queue.key !== ticket.status &&
                      onTicketStatusUpdate(queue.key)
                    }
                    className={cn(queue.key === ticket.status && "font-medium")}
                  >
                    {queue.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

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

            {!ticket.internal_assignee && ticket.status === "open" ? (
              <Badge variant="outline" className={BADGE_TONE_STYLES.accent}>
                Unassigned
              </Badge>
            ) : null}
          </div>

          {/* Tags live in their own scrollable strip, so however many
              there are they can never push the +N chip or the add button
              out of the pane on a narrow screen. */}
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
                  onChange={setTagSearch}
                  placeholder="Search tags…"
                  label="Search tags"
                />
              </div>
              {isTagPickerLoading && availableTags.length === 0 ? (
                <LoadingState label="Loading tags…" className="py-6" />
              ) : filteredTags.length === 0 ? (
                <div className="px-3 pb-4 text-center">
                  <Typography variant="muted">
                    {availableTags.length === 0
                      ? "No tags available."
                      : "No matching tags."}
                  </Typography>
                </div>
              ) : (
                <div className="max-h-56 space-y-1 overflow-y-auto p-2 pt-0">
                  {filteredTags.map((tag) => {
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
                  {hasMoreTags && !tagSearch ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={onLoadMoreTags}
                      disabled={isTagPickerLoading}
                    >
                      {isTagPickerLoading ? "Loading…" : "Load More"}
                    </Button>
                  ) : null}
                </div>
              )}
            </PopoverContent>
          </Popover>
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
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-primary/40 bg-primary/10 text-primary">
                      <IconNote className="size-3.5" />
                    </div>
                  ) : isOutgoing ? (
                    <Avatar className="size-7 shrink-0">
                      <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
                        A
                      </AvatarFallback>
                    </Avatar>
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
                          "rounded-br-md border border-dashed border-primary/40 bg-primary/5"
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
                    <div className="text-sm leading-6 text-foreground [&_p]:mb-2 [&_p:last-child]:mb-0">
                      <ReactMarkdown>{message.message}</ReactMarkdown>
                    </div>
                    <Typography
                      variant="caption"
                      as="div"
                      className="mt-1 text-right"
                    >
                      {formatDateTime(message.created_at)}
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
        <CKEditorTextArea
          id="ticket-reply-editor"
          value={reply}
          onChange={onReplyChange}
          useMarkdown
          disabled={isMessageImproving || isClosed || isTranslating}
          placeholder="Write a reply, or use the AI draft…"
          minHeight="6rem"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* AI tools stay icons — the two sends are what need words. */}
          <Tooltip>
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
                  isMessageImproving ||
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
          </Tooltip>

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

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  {/* Icon only until a language is applied — after that the
                      language is the state of the thread you are reading,
                      so it is worth the width. */}
                  <Button
                    variant="outline"
                    size={translatedLanguage ? "sm" : "icon-sm"}
                    aria-label="Translate the conversation"
                    disabled={isClosed || isTranslating}
                  >
                    {isTranslating ? (
                      <Spinner className="size-4" />
                    ) : (
                      <IconLanguage className="size-4" />
                    )}
                    {translatedLanguage
                      ? `Translated to ${translatedLanguage.name}`
                      : null}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                {isTranslating
                  ? "Translating…"
                  : translatedLanguage
                    ? `Translated to ${translatedLanguage.name}`
                    : "Translate"}
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="start"
              className="max-h-72 overflow-y-auto"
            >
              <DropdownMenuLabel>Translate to</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {translationLanguages.map((language) => (
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
                    isSending || isMessageImproving || isClosed || isTranslating
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
            <Button
              size="sm"
              onClick={() => onSend("reply")}
              disabled={
                isSending || isMessageImproving || isClosed || isTranslating
              }
            >
              {isSending ? (
                <Spinner className="size-4" />
              ) : (
                <IconSend className="size-4" />
              )}
              {isSending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

/** Icon + value, with the field name in a tooltip — the label is the icon. */
function TicketFact({
  icon: Icon,
  label,
  value,
}: {
  // The shared tabler type rather than one specific icon's: the channel
  // fact now picks its icon from a map, and every entry has to fit.
  icon: Icon;
  label: string;
  value: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <Typography variant="caption" className="hidden truncate 2xl:inline">
            {value}
          </Typography>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {label}: {value}
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
    <aside className="hidden w-80 shrink-0 flex-col items-center justify-center border-l px-6 text-center xl:flex 2xl:w-95">
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
  const { SupportMessageImproveIsLoading } = useAppSelector(
    (state) => state.GetSupportTicketsReducer.SupportMessageImproveState,
  );
  const { SupportTicketAIMessageDraftGenerateIsLoading } = useAppSelector(
    (state) =>
      state.GetSupportTicketsReducer.SupportTicketAIMessageDraftGenerateState,
  );
  const { SupportTicketCustomerOrderSyncIsLoading } = useAppSelector(
    (state) =>
      state.GetSupportTicketsReducer.SupportTicketCustomerOrderSyncState,
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
  const [activeQueue, setActiveQueue] = useState<SupportTicketStatus>("open");
  const [supportTikcetMessages, setSupportTicketMessages] = useState<
    SupportTicketMessage[]
  >([]);
  const [activeSupportTicket, setActiveSupportTicket] =
    useState<SupportTicket | null>(null);
  const currentActiveSupportTicketIdRef = useRef<number | null>(null);
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

  // Support Ticket Search Filters
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [, setTagSearch] = useState("");
  const [, setDebouncedTagSearch] = useState("");
  const [tagPage, setTagPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] =
    useState<TicketFilterSelection>(emptyTicketFilters);

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
    setActiveTicketId(null);
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
      setAppliedFilters(values);
      setPage(1);
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

      setSupportTicketMessages((currentMessages) => [
        ...currentMessages,
        incomingMessage,
      ]);

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

        if (payload.event === "ticket_created") {
          upsertSocketTicket(payload.ticket);
          return;
        }

        if (payload.event === "customer_message") {
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

  useEffect(() => {
    if (!storeCode) return;

    dispatch(FetchStaff());
  }, [dispatch, storeCode]);

  useEffect(() => {
    if (!storeCode) return;

    const filters: SupportTicketFilters = {
      status: activeQueue,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(appliedFilters.channels.length
        ? { channel: appliedFilters.channels }
        : {}),
      ...(appliedFilters.tags.length ? { tags: appliedFilters.tags } : {}),
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

    if (activeFilter === "unassigned") {
      filters.is_assigned = false;
    }

    if (activeFilter === "snoozed") {
      filters.is_snoozed = true;
    }

    if (activeFilter === "Order_Return") {
      filters.tags = [...(filters.tags ?? []), "Order Return"];
    }

    if (activeFilter === "Payment_Failed") {
      filters.tags = [...(filters.tags ?? []), "Payment Failed"];
    }

    if (activeFilter === "Exchange_Request") {
      filters.tags = [...(filters.tags ?? []), "Exchange Request"];
    }

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

        // Open the first ticket only when nothing is open yet.
        //
        // This used to replace the open ticket with the list's first row
        // whenever that ticket was not among the loaded ones — so every
        // link to a ticket sitting under another filter, or past the first
        // page, silently landed on a different ticket instead. The list is
        // a view of the queue; it does not get to decide what is open.
        if (page === 1 && !currentActiveSupportTicketIdRef.current) {
          const first = data.results[0] ?? null;
          setActiveTicketId(first?.id ?? null);
          setActiveSupportTicket(first);
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

  useEffect(() => {
    if (!storeCode) return;
    dispatch(
      FetchSupportTicketTags({
        storeCode,
        page: tagPage,
        limit: 15,
        append: tagPage > 1,
      }),
    );
  }, [dispatch, storeCode, tagPage]);

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
    setReply("");
    setTranslatedLanguage(null);
  };

  const handleQueueChange = (queue: SupportTicketStatus) => {
    setActiveQueue(queue);
    setPage(1);
    setActiveTicketId(null);
    setTicketRows([]);
    toast.info(`${queue[0].toUpperCase()}${queue.slice(1)} tickets loaded`, {
      description: "Fetching support tickets for the selected queue.",
    });
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

  const handleToggleTagPicker = () => {
    setShowTagPicker((current) => !current);
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

        setShowTagPicker(false);

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

        setShowTagPicker(false);

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

  const handleStaffAssign = async (staffId: number | null) => {
    if (!storeCode || !currentActiveSupportTicketIdRef.current) return;

    try {
      const payload = {
        internal_assignee: staffId,
      };

      await dispatch(
        SupportTicketStaffAssign({
          storeCode,
          ticketId: currentActiveSupportTicketIdRef.current,
          payload,
        }),
      ).unwrap();

      const assignedStaff = staff.find((member) => member.id === staffId);

      setTicketRows((current) =>
        current.map((ticket) =>
          ticket.id === currentActiveSupportTicketIdRef.current
            ? {
                ...ticket,
                internal_assignee: assignedStaff
                  ? {
                      id: assignedStaff.id,
                      name: `${assignedStaff.first_name} ${assignedStaff.last_name}`,
                      email: assignedStaff.email,
                    }
                  : null,
              }
            : ticket,
        ),
      );

      setActiveSupportTicket((current) =>
        current
          ? {
              ...current,
              internal_assignee: assignedStaff
                ? {
                    id: assignedStaff.id,
                    name: `${assignedStaff.first_name} ${assignedStaff.last_name}`,
                    email: assignedStaff.email,
                  }
                : null,
            }
          : current,
      );

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

  const handleSend = async (mode: "reply" | "note" = "reply") => {
    if (!storeCode) return;

    const trimmedReply = reply.trim();
    if (!trimmedReply) {
      toast.error("Write a reply first", {
        description: "Or accept the AI draft to populate the composer.",
      });
      return;
    }

    if (!currentActiveSupportTicketIdRef.current) {
      toast.error("No ticket selected to send a reply.");
      return;
    }

    const tempId = -Date.now();
    const optimisticMessage: SupportTicketMessage = {
      id: tempId,
      sender_type: "agent",
      message: trimmedReply,
      message_type: mode === "note" ? "internal" : "external",
      agent: tempId,
      message_direction: "outgoing",
      platform: "internal",
      channel: "web",
      content_type: "text/plain",
      metadata: {},
      attachments: [],
      created_at: new Date().toISOString(),
    };

    setReply("");
    setSupportTicketMessages((current) => [...current, optimisticMessage]);

    try {
      const formData = new FormData();
      formData.append("message", trimmedReply);

      if (mode === "note") {
        formData.append("message_type", "internal");
      }

      const sentMessage = await dispatch(
        SupportTicketMessageSend({
          storeCode,
          ticketId: currentActiveSupportTicketIdRef.current,
          formData,
        }),
      ).unwrap();

      setSupportTicketMessages((current) =>
        current.map((message) =>
          message.id === tempId ? sentMessage : message,
        ),
      );

      toast.success(mode === "note" ? "Internal note added" : "Reply sent");
    } catch {
      setSupportTicketMessages((current) =>
        current.filter((message) => message.id !== tempId),
      );
      setReply(trimmedReply);
    }
  };

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
        setTicketRows((current) =>
          current.map((ticket) =>
            ticket.id === currentActiveSupportTicketIdRef.current
              ? { ...ticket, is_snoozed: !!ticketSnoozed?.snoozed_until }
              : ticket,
          ),
        );

        setActiveSupportTicket((current) =>
          current
            ? {
                ...current,
                is_snoozed: !!ticketSnoozed?.snoozed_until,
                snoozed_until: ticketSnoozed?.snoozed_until,
              }
            : current,
        );

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

  const handleCustomerOrderSync = async () => {
    if (!storeCode || !currentActiveSupportTicketIdRef.current) return;

    try {
      const syncedOrders = await dispatch(
        SupportTicketCustomerOrderSync({
          storeCode,
          ticketId: currentActiveSupportTicketIdRef.current,
        }),
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
  ) => {
    if (!storeCode || !currentActiveSupportTicketIdRef.current) return;

    try {
      const payload = {
        status: status,
      };

      const ticketId = currentActiveSupportTicketIdRef.current;

      const updatedStatus = await dispatch(
        SupportTicketStatusUpdate({
          storeCode,
          ticketId,
          payload,
        }),
      ).unwrap();

      if (updatedStatus) {
        setTicketRows((current) => {
          const remainingRows = current.filter(
            (ticket) => ticket.id !== ticketId,
          );

          const nextTicket =
            ticketId === currentActiveSupportTicketIdRef.current
              ? (remainingRows[0] ?? null)
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
    if (!storeCode || !currentActiveSupportTicketIdRef.current) return;

    try {
      const payload = {
        priority: priority,
      };

      const updatedPriority = await dispatch(
        SupportTicketPriorityUpdate({
          storeCode,
          ticketId: currentActiveSupportTicketIdRef.current,
          payload,
        }),
      ).unwrap();

      if (updatedPriority) {
        setTicketRows((current) =>
          current.map((ticket) =>
            ticket.id === currentActiveSupportTicketIdRef.current
              ? {
                  ...ticket,
                  priority: updatedPriority.priority,
                }
              : ticket,
          ),
        );

        setActiveSupportTicket((current) =>
          current
            ? {
                ...current,
                priority: updatedPriority.priority,
              }
            : current,
        );

        toast.success("Ticket priority", {
          description: `Ticket priority updated to ${updatedPriority.priority}.`,
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

    const language = translationLanguages.find(
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
      setTagSearch("");
      setDebouncedTagSearch("");
      setTagPage(1);
    }
  };

  const handleApplyFilters = () => {
    filterFormik.handleSubmit();
  };

  const handleClearFilters = () => {
    filterFormik.resetForm({ values: emptyTicketFilters });
    setAppliedFilters(emptyTicketFilters);
    setPage(1);
    setIsFilterOpen(false);
  };

  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden border-y">
      <div className="flex min-h-0 flex-1">
        <TicketListPanel
          rows={ticketRows}
          activeTicketId={activeSupportTicket?.id ?? null}
          activeQueue={activeQueue}
          queueLabel={activeQueueLabel}
          onQueueChange={handleQueueChange}
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
          availableTags={ticketTags}
          filters={filterFormik.values}
          isFilterOpen={isFilterOpen}
          onFilterOpenChange={handleFilterOpenChange}
          onFiltersChange={(filters) => filterFormik.setValues(filters)}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          dateError={filterFormik.errors.fromDate ?? filterFormik.errors.toDate}
          hasMoreTags={Boolean(FetchSupportTicketTagsData?.next)}
          isTagListLoading={FetchSupportTicketTagsIsLoading}
          onTagSearchChange={setTagSearch}
          onLoadMoreTags={() => {
            if (FetchSupportTicketTagsData?.next) {
              setTagPage((current) => current + 1);
            }
          }}
          supportTicketStatusCount={FetchSupportTicketsListData.status_counts}
        />
        {(FetchSupportTicketsLoading || FetchSupportTicketDetailsIsLoading) &&
        activeSupportTicket?.id !== activeTicketId ? (
          <div className="flex min-w-0 flex-1 items-center justify-center">
            <LoadingState label="Loading conversation…" />
          </div>
        ) : linkedTicketMissing ? (
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-6 text-center">
            <IconInbox className="mb-1 size-6 text-muted-foreground opacity-40" />
            <Typography variant="small" as="p">
              Ticket Not Found
            </Typography>
            <Typography variant="muted">
              {ticketRef(activeTicketId ?? "")} could not be opened. It may
              belong to another store, or have been removed.
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
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-6 text-center">
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
            ticket={activeSupportTicket}
            messages={supportTikcetMessages}
            reply={reply}
            isSending={SupportTicketMessageSendIsLoading}
            onReplyChange={setReply}
            onSend={handleSend}
            onAcceptDraft={handleAcceptDraft}
            onSaveDraft={handleSaveDraft}
            availableTags={ticketTags}
            isTagPickerOpen={showTagPicker}
            isTagPickerLoading={FetchSupportTicketTagsIsLoading}
            hasMoreTags={Boolean(FetchSupportTicketTagsData?.next)}
            onLoadMoreTags={() => {
              if (FetchSupportTicketTagsData?.next) {
                setTagPage((current) => current + 1);
              }
            }}
            onToggleTagPicker={handleToggleTagPicker}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            availableStaff={staff}
            onAssignStaff={handleStaffAssign}
            onMessageImprove={handleMessageImprove}
            isMessageImproving={SupportMessageImproveIsLoading}
            onTicketSnooze={handleTicketSnooze}
            onTicketStatusUpdate={handleSupportTicketStatusUpdate}
            onTicketPriorityUpdate={handleSupportTicketPriorityUpdate}
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
            customerData={ticketCustomer}
            orders={ticketCustomer?.orders}
            ordersLoading={FetchSupportTicketDetailsIsLoading}
            onOrdersSync={handleCustomerOrderSync}
            orderSyncLoading={SupportTicketCustomerOrderSyncIsLoading}
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
