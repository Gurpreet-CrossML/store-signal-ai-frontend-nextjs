"use client";

import { useEffect, useMemo, useState, useRef, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  IconCheck,
  IconChevronDown,
  IconClock,
  IconDotsVertical,
  IconFilter,
  IconGift,
  IconLanguage,
  IconLoader2,
  IconMessageChatbot,
  IconMoodSmile,
  IconPencil,
  IconPlus,
  IconReload,
  IconSearch,
  IconSend,
  IconSparkles,
  IconUsers,
  IconX,
  IconAlarmSnoozeFilled,
} from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";

import { useFormik } from "formik";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  resolveTicketingSettingsSection,
  TicketingSettingsContent,
} from "@/components/custom/ticketing-settings";
import { Spinner } from "@/components/ui/spinner";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxValue,
  useComboboxAnchor,
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
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { OrdersCard } from "@/components/custom/thread-detail-panels";

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
  SupportTicketCustomerOrderSync,
  SupportTicketStatusUpdate,
  SupportTicketPriorityUpdate,
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
} from "@/redux/api-slice/support-ticket-slice";
import { FetchStaff, type StaffMember } from "@/redux/api-slice/tenancy-slice";
import {
  formatRelativeDateTime,
  formatDateTime,
  capitalizeText,
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

const priorityBadgeClass = {
  low: "border-emerald-100 bg-emerald-50 text-emerald-700",
  normal: "border-slate-200 bg-slate-100 text-slate-700",
  high: "border-amber-100 bg-amber-50 text-amber-700",
  urgent: "border-red-100 bg-red-50 text-red-700",
} satisfies Record<SupportTicketPriority, string>;

function getCustomerInitials(
  customer: SupportTicketCustomer | null | string,
): string {
  if (!customer) return "C";

  if (typeof customer === "object") {
    const name = customer.name?.trim();

    // Use name if available
    if (name) {
      const parts = name.split(/\s+/);

      if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
      }

      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }

    // Fallback to email
    if (customer.email) {
      return customer.email.charAt(0).toUpperCase();
    }
  } else {
    return customer.charAt(0).toUpperCase();
  }

  return "C";
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
  const visibleTags = ticket.tags?.slice(0, MAX_VISIBLE_TKT_ROW_TAGS);
  const hiddenTags = ticket.tags?.slice(MAX_VISIBLE_TKT_ROW_TAGS);

  const customerName =
    typeof ticket.customer === "string"
      ? ticket.customer
      : ticket.customer?.name || ticket.customer?.email;

  const customerInitials = getCustomerInitials(ticket.customer);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group flex w-full gap-3 rounded-xl px-3 py-3 text-left transition",
        active ? "bg-indigo-50" : "hover:bg-slate-50",
      )}
    >
      <div className="relative shrink-0">
        <Avatar className={cn("size-9")}>
          <AvatarFallback className="bg-slate-500 text-xs font-medium text-white">
            {customerInitials}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              ticket.is_read
                ? "font-medium text-slate-700"
                : "font-semibold text-slate-950",
            )}
          >
            {ticket.subject}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {ticket.is_snoozed ? (
              <IconAlarmSnoozeFilled className="size-3 text-amber-500" />
            ) : null}
            <span className="text-[11px] text-slate-400">
              {formatRelativeDateTime(
                ticket.last_message_at || ticket.created_at,
              )}
            </span>
          </div>
        </div>

        <p
          className={cn(
            "mt-0.5 truncate text-xs",
            ticket.is_read ? "text-slate-500" : "text-slate-600",
          )}
        >
          {customerName}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-400">
          <ReactMarkdown>
            {ticket.last_message || ticket.description}
          </ReactMarkdown>
        </p>

        {(visibleTags?.length ?? 0) > 0 || (hiddenTags?.length ?? 0) > 0 ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {visibleTags?.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
                style={{ color: tag.color, borderColor: tag.color + "40" }}
              >
                {tag.name}
              </span>
            ))}
            {hiddenTags?.length > 0 && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <span className="inline-flex items-center rounded-full border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                    +{hiddenTags.length}
                  </span>
                </HoverCardTrigger>
                <HoverCardContent
                  align="start"
                  className="flex w-auto max-w-xs flex-wrap gap-1.5"
                >
                  {hiddenTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      style={{ color: tag.color }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </HoverCardContent>
              </HoverCard>
            )}
          </div>
        ) : null}
      </div>
    </button>
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

const channelOptions: { value: SupportTicketChannel; label: string }[] = [
  { value: "web", label: "Web" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
];

const priorityOptions: { value: SupportTicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function MultiSelectCombobox({
  options,
  value,
  onValueChange,
  placeholder,
  emptyMessage,
  onSearchChange,
  hasMore = false,
  isLoading = false,
  onLoadMore,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder: string;
  emptyMessage: string;
  onSearchChange?: (value: string) => void;
  hasMore?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
}) {
  const anchor = useComboboxAnchor();
  const optionLabels = new Map(
    options.map((option) => [option.value, option.label]),
  );
  const values = options.map((option) => option.value);

  return (
    <Combobox
      multiple
      autoHighlight
      items={values}
      value={value}
      onValueChange={onValueChange}
      itemToStringLabel={(item) => optionLabels.get(item) ?? item}
      onInputValueChange={(inputValue) => onSearchChange?.(inputValue)}
    >
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(selectedValues) => (
            <>
              {(selectedValues as string[]).map((selectedValue) => (
                <ComboboxChip key={selectedValue}>
                  {optionLabels.get(selectedValue) ?? selectedValue}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder={placeholder} />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList
          onScroll={(event) => {
            const target = event.currentTarget;
            if (
              hasMore &&
              !isLoading &&
              target.scrollHeight - target.scrollTop <= target.clientHeight + 40
            ) {
              onLoadMore?.();
            }
          }}
        >
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {optionLabels.get(item) ?? item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

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
    <section className="hidden w-[336px] shrink-0 border-r bg-white md:block">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h2 className="font-medium text-slate-950">Your inbox</h2>
      </div>

      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 text-sm font-semibold text-slate-950 hover:text-slate-700">
              {supportTicketStatusCount?.[activeQueue] ?? 0} {queueLabel}
              <IconChevronDown className="size-3.5 text-slate-400" />
            </button>
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
                  activeQueue === queue.key && "font-medium text-indigo-600",
                )}
              >
                {queue.label}
                <span className="text-slate-400">
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
              className="relative bg-white"
              aria-label="Filter tickets"
            >
              <IconFilter className="size-4" />
              {activeFilterCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold">Filter tickets</p>
            </div>
            <div className="max-h-[65vh] space-y-5 overflow-y-auto p-4">
              <fieldset>
                <legend className="mb-2 text-xs font-semibold text-slate-700">
                  Channel
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
                  placeholder="Search channels..."
                  emptyMessage="No channels found."
                />
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-xs font-semibold text-slate-700">
                  Tags
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
                  placeholder="Search tags..."
                  emptyMessage="No tags found."
                  onSearchChange={onTagSearchChange}
                  hasMore={hasMoreTags}
                  isLoading={isTagListLoading}
                  onLoadMore={onLoadMoreTags}
                />
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-xs font-semibold text-slate-700">
                  Last message date
                </legend>
                <div className="grid gap-2">
                  <label className="grid gap-1 text-xs text-slate-500">
                    From
                    <Input
                      type="datetime-local"
                      value={filters.fromDate}
                      onChange={(event) =>
                        onFiltersChange({
                          ...filters,
                          fromDate: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-slate-500">
                    To
                    <Input
                      type="datetime-local"
                      value={filters.toDate}
                      onChange={(event) =>
                        onFiltersChange({
                          ...filters,
                          toDate: event.target.value,
                        })
                      }
                    />
                  </label>
                  {dateError ? (
                    <p className="text-xs text-red-600">{dateError}</p>
                  ) : null}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-xs font-semibold text-slate-700">
                  Priority
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
                  placeholder="Search priorities..."
                  emptyMessage="No priorities found."
                />
              </fieldset>
            </div>
            <div className="flex justify-between border-t p-3">
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                Clear
              </Button>
              <Button size="sm" onClick={onApplyFilters}>
                Apply filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Search */}
      <div className="border-b px-4 py-2.5">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search tickets..."
            aria-label="Search tickets"
            className="h-9 rounded-full bg-slate-50 pl-9 focus-visible:bg-white"
          />
          {searchValue ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label="Clear ticket search"
            >
              <IconX className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* List */}
      <div
        className="h-[80vh]! overflow-y-auto px-2 py-1"
        onScroll={handleScroll}
      >
        {isLoading && rows?.length === 0 ? (
          <div className="flex min-h-[360px] items-center justify-center px-4 py-8">
            <div className="text-center">
              <Spinner className="mx-auto mb-3 size-6" />
              <p className="text-sm text-slate-500">Loading tickets...</p>
            </div>
          </div>
        ) : !rows || rows?.length === 0 ? (
          <div className="flex min-h-[360px] items-center justify-center px-4 py-8">
            <p className="text-sm text-slate-500">No tickets found.</p>
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
        {rows?.length > 0 && hasMore ? (
          <div className="flex items-center justify-center py-4">
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Spinner className="size-4" />
                Loading more tickets...
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ConversationPanel({
  ticket,
  messages,
  reply,
  composerMode,
  isSending,
  onReplyChange,
  onComposerModeChange,
  onSend,
  onAcceptDraft,
  onSaveDraft,
  availableTags,
  isTagPickerOpen,
  isTagPickerLoading,
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
}: {
  ticket: SupportTicket;
  messages: SupportTicketMessage[];
  reply: string;
  composerMode: "reply" | "note";
  isSending: boolean;
  onReplyChange: (value: string) => void;
  onComposerModeChange: (mode: "reply" | "note") => void;
  onSend: () => void;
  onAcceptDraft: () => void;
  onSaveDraft: () => void;
  availableTags: SupportTicketTagData[];
  isTagPickerOpen: boolean;
  isTagPickerLoading: boolean;
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
}) {
  const [tagSearch, setTagSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [ticket.id, messages.length]);

  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase()),
  );

  const visibleTags = ticket.tags?.slice(0, MAX_VISIBLE_TKT_CONV_TAGS);
  const hiddenTags = ticket.tags?.slice(MAX_VISIBLE_TKT_CONV_TAGS);

  const customerInitials = getCustomerInitials(ticket.customer);

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
    <main className="flex min-w-0 flex-1 flex-col bg-white">
      <div className="border-b px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <h2 className="truncate max-w-[400px] text-xl font-semibold leading-tight text-slate-950">
                  {ticket.subject}
                </h2>
              </TooltipTrigger>
              <TooltipContent className="max-w-[320px]">
                <p>{ticket.subject}</p>
              </TooltipContent>
            </Tooltip>
            <span className="mt-1 inline-block text-xs font-semibold text-slate-400">
              #{ticket.id}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Combobox items={availableStaff}>
              <ComboboxInput
                className="h-8 w-40"
                placeholder={
                  ticket?.internal_assignee?.id
                    ? ticket?.internal_assignee?.name
                    : "Assign staff..."
                }
                disabled={isClosed}
              />
              <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={isClosed}>
                <Button variant="outline" size="sm" className="bg-white">
                  <IconAlarmSnoozeFilled className="size-4" />
                  {snoozeLabel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
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
                      className="text-red-600 focus:text-red-600"
                      onClick={() => onTicketSnooze(null)}
                    >
                      <IconAlarmSnoozeFilled className="mr-2 size-4" />
                      Remove snooze
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" className="bg-white">
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="space-y-4 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-sm text-slate-500">Status</Label>

                    <Select
                      value={ticket.status}
                      onValueChange={onTicketStatusUpdate}
                      disabled={isClosed}
                    >
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-sm text-slate-500">Priority</Label>

                    <Select
                      value={ticket.priority}
                      onValueChange={onTicketPriorityUpdate}
                      disabled={isClosed}
                    >
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!ticket.internal_assignee && ticket.status === "open" && (
            <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">
              Open - Unassigned
            </Badge>
          )}
          <Badge
            className={
              priorityBadgeClass[ticket.priority] ??
              "border-slate-200 bg-slate-100 text-slate-700"
            }
          >
            <span
              className={cn(
                priorityBadgeClass[ticket.priority] ??
                  "border-slate-200 bg-slate-100 text-slate-700",
                "capitalize",
              )}
            />
            {ticket?.priority?.charAt(0).toUpperCase() +
              ticket?.priority?.slice(1)}
          </Badge>
          {visibleTags?.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="cursor-default hover:bg-accent"
              style={{ color: tag.color }}
            >
              {tag.name}
              <IconX
                className="!pointer-events-auto cursor-pointer"
                onClick={() => tag.id && !isClosed && onRemoveTag(tag.id)}
              />
            </Badge>
          ))}
          {hiddenTags?.length > 0 && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Badge
                  variant="outline"
                  className="cursor-default font-normal hover:bg-accent"
                >
                  +{hiddenTags.length} more
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent
                align="start"
                className="flex w-auto max-w-xs flex-wrap gap-1.5"
              >
                {hiddenTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="cursor-default hover:bg-accent"
                    style={{ color: tag.color }}
                  >
                    {tag.name}
                    <IconX
                      className="!pointer-events-auto cursor-pointer"
                      onClick={() => tag.id && !isClosed && onRemoveTag(tag.id)}
                    />
                  </Badge>
                ))}
              </HoverCardContent>
            </HoverCard>
          )}
          <div className="relative flex">
            <Button
              variant="outline"
              size="sm"
              className="inline-flex h-5 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold bg-white text-slate-700 hover:bg-slate-50"
              onClick={onToggleTagPicker}
              disabled={isClosed}
            >
              <IconPlus /> Tag
            </Button>
            {isTagPickerOpen ? (
              <div className="absolute right-0 z-10 mt-2 w-[260px] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-200/20">
                <div className="mb-2 flex items-center justify-between gap-3 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Choose tag
                    </p>
                    <p className="text-xs text-slate-500">
                      Add a label to the current ticket.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    onClick={onToggleTagPicker}
                  >
                    <IconX size={16} />
                  </button>
                </div>
                <div className="border-t border-slate-200" />
                <div className="border-t border-slate-200" />
                <div className="p-2">
                  <div className="relative">
                    <IconSearch
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      type="text"
                      placeholder="Search tags..."
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary"
                    />
                  </div>
                </div>
                {isTagPickerLoading ? (
                  <div className="flex min-h-[96px] items-center justify-center gap-2 px-3 py-4 text-sm text-slate-500">
                    <Spinner className="size-4" />
                    Loading tags...
                  </div>
                ) : availableTags.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-slate-500">
                    No tags available.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto p-2">
                    {filteredTags.length === 0 ? (
                      <div className="py-6 text-center text-sm text-slate-500">
                        No matching tags found.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredTags.map((tag) => {
                          const alreadyAdded = ticket.tags.some(
                            (existingTag) => existingTag.id === tag.id,
                          );
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              className={cn(
                                "flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm transition",
                                alreadyAdded
                                  ? "border-slate-200 bg-slate-50 text-slate-500 line-through opacity-80"
                                  : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50",
                              )}
                              onClick={() =>
                                !alreadyAdded && tag.id && onAddTag(tag.id)
                              }
                              disabled={alreadyAdded}
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="truncate text-xs">
                                  {tag.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-[360px] flex-1 bg-slate-50/60">
        <div className="px-5 py-6">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[320px] items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600">
                  No messages yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Messages exchanged with the customer will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((message) =>
                message.message_type === "internal" ? (
                  <div key={message.id} className="flex justify-center">
                    <div className="w-full max-w-[480px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <div className="mb-1.5 flex items-center gap-2">
                        <Badge className="rounded-full border-amber-300 bg-amber-100 text-[10px] text-amber-800">
                          Internal note
                        </Badge>
                        <span className="text-[11px] text-slate-500">
                          {formatDateTime(message.created_at)}
                        </span>
                      </div>
                      <div className="text-sm leading-6 text-slate-700">
                        <ReactMarkdown>{message.message}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-end gap-2.5",
                      message.sender_type === "agent" && "flex-row-reverse",
                    )}
                  >
                    <Avatar className="size-7 shrink-0">
                      <AvatarFallback
                        className={cn(
                          "text-[10px] font-medium text-white",
                          message.sender_type === "agent"
                            ? "bg-indigo-600"
                            : "bg-slate-500",
                        )}
                      >
                        {message.sender_type === "agent"
                          ? "A"
                          : customerInitials}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={cn(
                        "flex max-w-[75%] flex-col gap-1",
                        message.sender_type === "agent" && "items-end",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm",
                          message.sender_type === "agent"
                            ? "rounded-br-md border border-indigo-200 bg-indigo-50 text-slate-900"
                            : "rounded-bl-md border border-slate-200 bg-white text-slate-900",
                        )}
                      >
                        <div
                          className={cn(
                            message.sender_type === "agent" &&
                              "[&_strong]:text-indigo-900",
                          )}
                        >
                          <ReactMarkdown>{message.message}</ReactMarkdown>
                        </div>
                      </div>
                      <span className="px-1 text-[11px] text-slate-400">
                        {message.sender_type === "agent"
                          ? "You"
                          : ticket.channel}
                        {" · "}
                        {formatDateTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t bg-white p-4">
        <div className="mb-2 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => onComposerModeChange("reply")}
            className={cn(
              composerMode === "reply"
                ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                : "bg-white text-slate-700 hover:bg-slate-100",
            )}
            disabled={isClosed}
          >
            <IconReload className="size-4" />
            Reply
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "border-amber-200",
              composerMode === "note"
                ? "bg-amber-50 text-amber-700"
                : "bg-white text-slate-700",
            )}
            onClick={() => onComposerModeChange("note")}
            disabled={isClosed}
          >
            <IconPencil className="size-4" />
            Internal note
          </Button>
        </div>
        <div className="mb-2 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="xs"
            className="bg-white text-indigo-700"
            onClick={() =>
              aiDraft?.message ? onAcceptDraft() : onAIDraftGenerate()
            }
            disabled={isAIDraftLoading || isClosed}
          >
            <IconMessageChatbot className="size-3" />
            {isAIDraftLoading
              ? "Generating..."
              : aiDraft?.message
                ? "Accept AI draft"
                : "Generate AI draft"}
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="bg-white"
            disabled={isClosed}
          >
            <IconGift className="size-3" />
            Macro
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={isMessageImproving || isClosed}
                variant="outline"
                size="xs"
              >
                <IconSparkles className="size-3" />
                {isMessageImproving ? "AI is improving..." : "Improve"}
                <IconChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => onMessageImprove("rephrase")}
                className="cursor-pointer"
              >
                <IconReload className="mr-2 size-4" />
                Rephrase
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onMessageImprove("warmer")}
                className="cursor-pointer"
              >
                <IconMoodSmile className="mr-2 size-4" />
                Warmer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="xs"
            className="bg-white"
            disabled={isClosed}
          >
            <IconLanguage className="size-3" />
            Translate
          </Button>
        </div>
        <div className="composer-editor rounded-lg border bg-white text-sm">
          <CKEditorTextArea
            id="ticket-reply-editor"
            value={reply}
            onChange={onReplyChange}
            useMarkdown
            disabled={isMessageImproving || isClosed}
            placeholder={
              composerMode === "note"
                ? "Write an internal note..."
                : "Write a reply, or accept the AI draft..."
            }
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
          <div className="flex gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              className="bg-white"
              onClick={onSaveDraft}
              disabled={isClosed}
            >
              Save draft
            </Button>
            <Button
              size="sm"
              onClick={onSend}
              disabled={isSending || isMessageImproving || isClosed}
            >
              <IconSend className="size-4" />
              {isSending ? "Sending..." : "Send"}
              <IconChevronDown className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

function TicketInsights({
  ticket,
  onAcceptDraft,
  onAIDraftGenerate,
  isAIDraftLoading,
  aiDraft,
  isOrdersLoading,
  isOrderSyncLoading,
  onOrdersSync,
  isClosed,
}: {
  ticket: SupportTicket;
  onAcceptDraft: () => void;
  onAIDraftGenerate: () => void;
  isAIDraftLoading: boolean;
  aiDraft: SupportTicketDraftMessage | null;
  isOrdersLoading: boolean;
  isOrderSyncLoading: boolean;
  onOrdersSync: () => void;
  isClosed: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"ticket" | "customer">("ticket");

  const customerInitials = getCustomerInitials(ticket.customer);
  const customerData =
    ticket.customer && typeof ticket.customer === "object"
      ? ticket.customer
      : null;

  const customerName = customerData?.name ?? null;
  const customerEmail = customerData?.email ?? null;

  const totalAttachments =
    ticket.messages?.reduce(
      (count, message) => count + (message.attachments?.length ?? 0),
      0,
    ) ?? 0;

  return (
    <aside className="hidden w-[380px] shrink-0 border-l bg-white xl:block">
      <div className="grid h-11 grid-cols-2 border-b text-sm font-medium">
        <button
          className={cn(
            "flex items-center justify-center gap-2",
            activeTab === "ticket"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-slate-500",
          )}
          onClick={() => setActiveTab("ticket")}
        >
          <IconMessageChatbot className="size-4" />
          Ticket
        </button>
        <button
          className={cn(
            "flex items-center justify-center gap-2",
            activeTab === "customer"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-slate-500",
          )}
          onClick={() => setActiveTab("customer")}
        >
          <IconUsers className="size-4" />
          Customer
        </button>
      </div>
      <div className="space-y-3 overflow-y-auto p-4 h-[88vh]!">
        {activeTab === "ticket" ? (
          <>
            <section className="rounded-lg border bg-white">
              <div className="flex items-center justify-between border-b px-3 py-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-slate-950">
                  <IconMessageChatbot className="size-4 text-indigo-600" />
                  Suggested reply
                </h3>
              </div>
              <div className="p-3">
                {isAIDraftLoading ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-indigo-600">
                      <IconLoader2 className="size-4 animate-spin" />
                      Generating AI reply...
                    </div>

                    <div className="space-y-2 rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
                      <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-4/6 animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                    </div>
                  </div>
                ) : aiDraft?.message ? (
                  <>
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 text-sm leading-6 text-slate-950">
                      {aiDraft?.message}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        onClick={onAcceptDraft}
                        disabled={isClosed}
                      >
                        <IconCheck className="size-4" />
                        Use draft
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white"
                        onClick={onAIDraftGenerate}
                        disabled={isClosed}
                      >
                        <IconReload className="size-4" />
                        Regenerate
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50 px-6 py-10 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-indigo-100">
                      <IconMessageChatbot className="size-6 text-indigo-600" />
                    </div>

                    <h4 className="mt-4 text-sm font-semibold text-slate-900">
                      No AI draft available
                    </h4>

                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                      Generate an AI-powered reply based on the customer&apos;s
                      conversation. You can review and edit it before sending.
                    </p>
                  </div>
                )}
              </div>
            </section>
            <section className="rounded-xl border bg-white">
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <IconClock className="size-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Ticket insights
                </h3>
              </div>

              <div className="space-y-4 p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Status</span>
                    <span className="font-medium text-slate-900">
                      {capitalizeText(ticket.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Priority</span>
                    <span className="font-medium text-slate-900">
                      {capitalizeText(ticket.priority)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Assignee</span>
                    <span className="font-medium text-slate-900">
                      {ticket.internal_assignee?.name ||
                        ticket.internal_assignee?.name ||
                        "-"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Channel</span>
                    <span className="truncate text-right font-medium text-slate-900">
                      {capitalizeText(ticket.channel)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Customer</span>
                    <span className="truncate text-right font-medium text-slate-900">
                      {customerName || customerEmail || "-"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Created At</span>
                    <span className="truncate text-right font-medium text-slate-900">
                      {formatDateTime(ticket.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Last activity</span>
                    <span className="truncate text-right font-medium text-slate-900">
                      {formatDateTime(
                        ticket.last_message_at ?? ticket.updated_at ?? null,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Messages</span>
                    <span className="truncate text-right font-medium text-slate-900">
                      {ticket.messages?.length} message
                      {ticket.messages?.length || 0 > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Attachments</span>
                    <span className="truncate text-right font-medium text-slate-900">
                      {totalAttachments} attachment
                      {totalAttachments > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Tags</span>
                    <span className="truncate text-right font-medium text-slate-900">
                      {ticket.tags?.length} tag
                      {ticket.tags?.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarFallback className="bg-slate-500 text-xs font-medium text-white">
                  {customerInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-slate-950">
                  {customerName || "No name available"}
                </h3>
                <p className="truncate text-xs text-slate-500">
                  {customerEmail || "No email available"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <OrdersCard
                orders={customerData?.orders}
                loading={isOrdersLoading}
                handleOrdersSync={() => !isClosed && onOrdersSync()}
                orderSyncLoading={isOrderSyncLoading}
                custometData={customerData}
              />
            </div>
          </>
        )}

        {/* <section className="rounded-lg border bg-white">
          <h3 className="flex items-center gap-2 border-b px-3 py-3 text-sm font-medium text-slate-950">
            <IconWand className="size-4 text-indigo-600" />
            Assist commands
          </h3>
          <div className="grid grid-cols-2 gap-2 p-3">
            {[
              ["Expand bullets", IconArrowsDiagonal],
              ["Summarise thread", IconArchive],
              ["Translate", IconLanguage],
              ["Adjust tone", IconMoodSmile],
            ].map(([label, Icon]) => (
              <Button
                key={label as string}
                variant="outline"
                className="h-12 justify-start bg-white text-xs"
                onClick={() => onAction(`${label as string} applied`)}
              >
                <Icon className="size-4" />
                <span className="whitespace-normal text-left leading-tight">
                  {label as string}
                </span>
              </Button>
            ))}
          </div>
        </section> */}

        {/* <section className="rounded-lg border bg-white">
          <h3 className="flex items-center gap-2 border-b px-3 py-3 text-sm font-medium text-slate-950">
            <IconBolt className="size-4 text-indigo-600" />
            What the AI checked
          </h3>
          <ul className="space-y-1 px-3 py-3 text-xs font-medium leading-5 text-slate-700">
            <li>Checked: Pulled order #8821 - in transit</li>
            <li>Checked: Verified customer identity</li>
            <li>Checked: Checked 2 past tickets from this customer</li>
            <li>Checked: Applied brand voice profile</li>
            <li>Checked: 18 safety checks passed</li>
          </ul>
        </section> */}
      </div>
    </aside>
  );
}

export default function HelpDesk() {
  const searchParams = useSearchParams();
  const activeSection = resolveTicketingSettingsSection(
    searchParams?.get("section") ?? null,
  );
  const activeFilter = searchParams?.get("filter") ?? "";

  const dispatch = useAppDispatch();

  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchSupportTicketsListData, FetchSupportTicketsLoading } =
    useAppSelector(
      (state) => state.SupportTicketsSliceReducer.FetchSupportTicketsState,
    );
  const { FetchSupportTicketDetailsData, FetchSupportTicketDetailsIsLoading } =
    useAppSelector(
      (state) =>
        state.SupportTicketsSliceReducer.FetchSupportTicketDetailsState,
    );
  const { SupportTicketMessageSendIsLoading } = useAppSelector(
    (state) => state.SupportTicketsSliceReducer.SupportTicketMessageSendState,
  );
  const { FetchSupportTicketTagsData, FetchSupportTicketTagsIsLoading } =
    useAppSelector(
      (state) => state.SupportTicketsSliceReducer.FetchSupportTicketTagsState,
    );
  const { SupportMessageImproveIsLoading } = useAppSelector(
    (state) => state.SupportTicketsSliceReducer.SupportMessageImproveState,
  );
  const { SupportTicketAIMessageDraftGenerateIsLoading } = useAppSelector(
    (state) =>
      state.SupportTicketsSliceReducer.SupportTicketAIMessageDraftGenerateState,
  );
  const { SupportTicketCustomerOrderSyncIsLoading } = useAppSelector(
    (state) =>
      state.SupportTicketsSliceReducer.SupportTicketCustomerOrderSyncState,
  );
  const { staff } = useAppSelector((state) => state.GetTenancyReducer);

  const [ticketRows, setTicketRows] = useState<SupportTicket[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [activeQueue, setActiveQueue] = useState<SupportTicketStatus>("open");
  const [supportTikcetMessages, setSupportTicketMessage] = useState<
    SupportTicketMessage[]
  >([]);
  const [activeSupportTicket, setActiveSupportTicket] =
    useState<SupportTicket | null>(null);
  const currentActiveSupportTicketIdRef = useRef<number | null>(null);

  const [showTagPicker, setShowTagPicker] = useState(false);

  const [reply, setReply] = useState("");
  const [composerMode, setComposerMode] = useState<"reply" | "note">("reply");

  // Support Ticket Search Filters
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [debouncedTagSearch, setDebouncedTagSearch] = useState("");
  const [tagPage, setTagPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] =
    useState<TicketFilterSelection>(emptyTicketFilters);

  const filterFormik = useFormik<TicketFilterSelection>({
    initialValues: emptyTicketFilters,
    validate: (values) => {
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
      ...(appliedFilters.fromDate
        ? { from_date: new Date(appliedFilters.fromDate).toISOString() }
        : {}),
      ...(appliedFilters.toDate
        ? { to_date: new Date(appliedFilters.toDate).toISOString() }
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

        setTicketRows((prev) => {
          const rows = page === 1 ? data.results : [...prev, ...data.results];

          setActiveTicketId((current) => {
            if (rows.length === 0) return null;

            return current && rows.some((t) => t.id === current)
              ? current
              : rows[0].id;
          });

          setActiveSupportTicket((current) => {
            if (rows.length === 0) return null;

            return current && rows.some((t) => t.id === current.id)
              ? current
              : rows[0];
          });

          return rows;
        });
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
        page: 1,
        limit: 20,
      }),
    );
  }, [dispatch, storeCode]);

  useEffect(() => {
    currentActiveSupportTicketIdRef.current = activeTicketId || null;
    if (!storeCode || !activeTicketId) return;

    dispatch(
      FetchSupportTicketDetails({ storeCode, ticketId: activeTicketId }),
    );
  }, [activeTicketId]);

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
    if (!FetchSupportTicketDetailsData) return;

    startTransition(() => {
      setActiveSupportTicket(FetchSupportTicketDetailsData);
      setSupportTicketMessage(FetchSupportTicketDetailsData.messages ?? []);

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
  }, [FetchSupportTicketDetailsData]);

  const activeQueueLabel = useMemo(
    () => queues.find((queue) => queue.key === activeQueue)?.label ?? "Open",
    [activeQueue],
  );

  const handleSelectTicket = (ticketId: number) => {
    const nextTicket = ticketRows.find((ticket) => ticket.id === ticketId);
    if (!nextTicket) return;
    setActiveTicketId(ticketId);
    setReply("");
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

        toast.success("AI draft generated", {
          description: "A new AI draft is ready to review.",
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
    alert();
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

  const handleSend = async () => {
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
      message_type: composerMode === "note" ? "internal" : "external",
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
    setSupportTicketMessage((current) => [...current, optimisticMessage]);

    try {
      const formData = new FormData();
      formData.append("message", trimmedReply);

      if (composerMode === "note") {
        formData.append("message_type", "internal");
      }

      const sentMessage = await dispatch(
        SupportTicketMessageSend({
          storeCode,
          ticketId: currentActiveSupportTicketIdRef.current,
          formData,
        }),
      ).unwrap();

      setSupportTicketMessage((current) =>
        current.map((message) =>
          message.id === tempId ? sentMessage : message,
        ),
      );

      toast.success(
        composerMode === "note" ? "Internal note added" : "Reply sent",
      );
    } catch {
      setSupportTicketMessage((current) =>
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
    <div className="-my-4 flex h-[calc(100vh-var(--header-height))] flex-col overflow-hidden border-y bg-white font-sans text-slate-950 md:-my-6">
      <div className="flex min-h-0 flex-1">
        {activeSection ? (
          <TicketingSettingsContent active={activeSection} />
        ) : (
          <>
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
              dateError={filterFormik.errors.toDate}
              hasMoreTags={Boolean(FetchSupportTicketTagsData?.next)}
              isTagListLoading={FetchSupportTicketTagsIsLoading}
              onTagSearchChange={setTagSearch}
              onLoadMoreTags={() => {
                if (FetchSupportTicketTagsData?.next) {
                  setTagPage((current) => current + 1);
                }
              }}
              supportTicketStatusCount={
                FetchSupportTicketsListData.status_counts
              }
            />
            {(FetchSupportTicketsLoading ||
              FetchSupportTicketDetailsIsLoading) &&
            activeSupportTicket?.id !== activeTicketId ? (
              <div className="flex min-w-0 flex-1 items-center justify-center bg-slate-50">
                <div className="text-center">
                  <Spinner className="mx-auto mb-4 size-8" />
                  <p className="text-sm text-slate-500">
                    Loading conversation...
                  </p>
                </div>
              </div>
            ) : !activeSupportTicket ? (
              <div className="flex min-w-0 flex-1 items-center justify-center bg-slate-50 px-6 text-center">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    Select a ticket to view
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Open a ticket from the left panel to see the conversation.
                  </p>
                </div>
              </div>
            ) : (
              <ConversationPanel
                ticket={activeSupportTicket}
                messages={supportTikcetMessages}
                reply={reply}
                composerMode={composerMode}
                isSending={SupportTicketMessageSendIsLoading}
                onReplyChange={setReply}
                onComposerModeChange={setComposerMode}
                onSend={handleSend}
                onAcceptDraft={handleAcceptDraft}
                onSaveDraft={handleSaveDraft}
                availableTags={ticketTags}
                isTagPickerOpen={showTagPicker}
                isTagPickerLoading={FetchSupportTicketTagsIsLoading}
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
                isClosed={activeSupportTicket.status === "closed"}
              />
            )}
            {(FetchSupportTicketsLoading ||
              FetchSupportTicketDetailsIsLoading) &&
            activeSupportTicket?.id !== activeTicketId ? (
              <aside className="hidden w-[340px] shrink-0 border-l bg-white xl:block">
                <div className="flex h-[calc(100vh-var(--header-height)-4rem)] items-center justify-center px-4 text-center">
                  <div>
                    <Spinner className="mx-auto mb-4 size-8" />
                    <p className="text-sm text-slate-500">
                      Loading AI Copilot...
                    </p>
                  </div>
                </div>
              </aside>
            ) : !activeSupportTicket ? (
              <aside className="hidden w-[340px] shrink-0 border-l bg-white xl:block">
                <div className="flex h-[calc(100vh-var(--header-height)-4rem)] items-center justify-center px-4 text-center">
                  <p className="text-sm text-slate-500">
                    Select a ticket to enable AI Copilot.
                  </p>
                </div>
              </aside>
            ) : (
              <TicketInsights
                ticket={activeSupportTicket}
                onAcceptDraft={handleAcceptDraft}
                onAIDraftGenerate={handleAiDraftGenerate}
                isAIDraftLoading={SupportTicketAIMessageDraftGenerateIsLoading}
                aiDraft={
                  activeSupportTicket?.drafts?.find(
                    (draft) => draft.draft_type === "ai",
                  ) ?? null
                }
                isOrdersLoading={FetchSupportTicketDetailsIsLoading}
                isOrderSyncLoading={SupportTicketCustomerOrderSyncIsLoading}
                onOrdersSync={handleCustomerOrderSync}
                isClosed={activeSupportTicket.status === "closed"}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
