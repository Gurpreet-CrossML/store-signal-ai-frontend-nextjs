"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type CSSProperties,
  useRef,
} from "react";
import { useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import { toast } from "sonner";
import {
  IconArchive,
  IconArrowsDiagonal,
  IconBolt,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconDotsVertical,
  IconFilter,
  IconGift,
  IconLanguage,
  IconMail,
  IconMessage2,
  IconMessageChatbot,
  IconMoodSmile,
  IconPencil,
  IconPlus,
  IconReload,
  IconSearch,
  IconSend,
  IconSparkles,
  IconTag,
  IconUser,
  IconUsers,
  IconWand,
  IconX,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchSupportTickets,
  FetchSupportTicketTags,
  SupportTicketStaffAssign,
  FetchSupportTicketDetails,
  SupportTicketMessageSend,
  SupportTicketAgentDraftSave,
  type SupportTicket,
  type SupportTicketChannel,
  type SupportTicketFilters,
  type SupportTicketPriority,
  type SupportTicketTagsResponse,
  type SupportTicketMessage,
} from "@/redux/api-slice/support-ticket-slice";
import { FetchStaff, type StaffMember } from "@/redux/api-slice/tenancy-slice";
import { formatRelativeDateTime, formatDateTime } from "@/lib/helpers";

type ActiveQueue = "open" | "pending" | "resolved" | "closed";

const suggestedReply =
  "Hi Sarah - I completely understand, and I am sorry it has felt like a long wait. Good news: your order shipped Tuesday and is out for delivery with DHL today. I will keep an eye on it too.";

const channelIcon = {
  whatsapp: IconBrandWhatsapp,
  email: IconMail,
  facebook: IconBrandFacebook,
  instagram: IconBrandInstagram,
  web: IconMessage2,
} satisfies Record<SupportTicketChannel, typeof IconBrandWhatsapp>;

const channelColor = {
  whatsapp: "text-emerald-500",
  email: "text-orange-500",
  facebook: "text-blue-600",
  instagram: "text-rose-500",
  web: "text-indigo-500",
} satisfies Record<SupportTicketChannel, string>;

const priorityBadgeClass = {
  low: "border-emerald-100 bg-emerald-50 text-emerald-700",
  normal: "border-slate-200 bg-slate-100 text-slate-700",
  high: "border-amber-100 bg-amber-50 text-amber-700",
  urgent: "border-red-100 bg-red-50 text-red-700",
} satisfies Record<SupportTicketPriority, string>;

function Badge({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold",
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}

function getCustomerName(customer: SupportTicket["customer"]) {
  if (typeof customer === "string") return customer;
  return customer?.name || "Unknown customer";
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
  const ChannelIcon = channelIcon[ticket.channel];

  return (
    <button
      onClick={onSelect}
      className={cn(
        "grid w-full grid-cols-[16px_1fr_auto] gap-2 border-b px-3 py-3 text-left transition hover:bg-slate-50",
        active && "bg-indigo-50/70 hover:bg-indigo-50",
      )}
    >
      <span
        className={cn(
          "mt-2 size-2 rounded-full",
          ticket.is_read ? "bg-slate-300" : "bg-red-500",
        )}
      />
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <ChannelIcon
            className={cn("size-5 shrink-0", channelColor[ticket.channel])}
          />
          <span className="truncate text-sm font-medium text-slate-950">
            {getCustomerName(ticket.customer)}
          </span>
        </div>
        <p className="truncate text-sm font-medium text-slate-950">
          {ticket.subject}
        </p>
        <p className="mt-1 truncate text-xs text-slate-500">
          {ticket.last_message || ticket.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {ticket.tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id} style={{ color: tag.color }}>
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-8">
        <span className="text-xs text-slate-400">
          {formatRelativeDateTime(ticket.last_message_at || ticket.created_at)}
        </span>
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
  count,
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
}: {
  rows: SupportTicket[];
  activeTicketId: number | null;
  activeQueue: ActiveQueue;
  queueLabel: string;
  onQueueChange: (queue: ActiveQueue) => void;
  onSelectTicket: (ticketId: number) => void;
  count: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  availableTags: SupportTicketTagsResponse[];
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
      <div className="flex h-14 items-center justify-between border-b px-3">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="font-medium text-slate-950">All {queueLabel}</h2>
            <span className="text-sm text-slate-500">{count}</span>
          </div>
        </div>
        <div className="flex gap-2">
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
                      onFiltersChange({
                        ...filters,
                        tags,
                      })
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
      </div>
      <div className="flex gap-2 border-b px-3 py-2">
        {queues.map((queue) => (
          <Button
            key={queue.key}
            size="sm"
            onClick={() =>
              queue.key !== activeQueue && onQueueChange(queue.key)
            }
            className={cn(
              "h-7 border",
              activeQueue === queue.key
                ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
            )}
          >
            {queue.label}
          </Button>
        ))}
      </div>
      <div className="border-b px-3 py-2">
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search tickets..."
            aria-label="Search tickets"
            className="h-8 pl-8"
          />
          {searchValue ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label="Clear ticket search"
            >
              <IconX className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
      <div
        className="h-[calc(83vh-49px)]! overflow-y-auto"
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
  isResolving,
  onReplyChange,
  onComposerModeChange,
  onSend,
  onAcceptDraft,
  onSaveDraft,
  onAction,
  availableTags,
  isTagPickerOpen,
  isTagPickerLoading,
  onToggleTagPicker,
  onAddTag,
  onRemoveTag,
  isStaffPickerOpen,
  onToggleStaffPicker,
  availableStaff,
  isStaffPickerLoading,
  onAssignStaff,
}: {
  ticket: SupportTicket;
  messages: SupportTicketMessage[];
  reply: string;
  composerMode: "reply" | "note";
  isSending: boolean;
  isResolving: boolean;
  onReplyChange: (value: string) => void;
  onComposerModeChange: (mode: "reply" | "note") => void;
  onSend: () => void;
  onAcceptDraft: () => void;
  onSaveDraft: () => void;
  onAction: (action: string) => void;
  availableTags: SupportTicketTagsResponse[];
  isTagPickerOpen: boolean;
  isTagPickerLoading: boolean;
  onToggleTagPicker: () => void;
  onAddTag: (tag: SupportTicketTagsResponse) => void;
  onRemoveTag: (tagId: number) => void;
  isStaffPickerOpen: boolean;
  onToggleStaffPicker: () => void;
  availableStaff: StaffMember[];
  isStaffPickerLoading: boolean;
  onAssignStaff: (ticketId: number, staffId: number | null) => void;
}) {
  const [tagSearch, setTagSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages.length]);

  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase()),
  );

  const customerInitials =
    getCustomerName(ticket.customer)
      ?.trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

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
            <div className="relative flex">
              <Button
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={onToggleStaffPicker}
              >
                <IconUser className="size-4" />
                Assign
              </Button>
              {isStaffPickerOpen ? (
                <div className="absolute right-0 z-10 mt-2 w-[260px] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-200/20">
                  <div className="mb-2 flex items-center justify-between gap-3 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Choose staff
                      </p>
                      <p className="text-xs text-slate-500">
                        Assign a staff to the current ticket.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      onClick={onToggleStaffPicker}
                    >
                      <IconX size={16} />
                    </button>
                  </div>
                  <div className="border-t border-slate-200" />
                  {isStaffPickerLoading ? (
                    <div className="flex min-h-[96px] items-center justify-center gap-2 px-3 py-4 text-sm text-slate-500">
                      <Spinner className="size-4" />
                      Loading staff...
                    </div>
                  ) : availableStaff.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-slate-500">
                      No tags available.
                    </div>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          {ticket.internal_assignee?.name ?? "Select staff"}
                          <IconChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-[320px] p-0">
                        <Command>
                          <CommandInput placeholder="Search staff..." />

                          <CommandEmpty>No staff found.</CommandEmpty>

                          <CommandGroup heading="Staff">
                            {availableStaff.map((staff) => (
                              <CommandItem
                                key={staff.id}
                                value={`${staff.first_name} ${staff.last_name}`}
                                onSelect={() =>
                                  ticket.internal_assignee?.id !== staff.id &&
                                  onAssignStaff(ticket.id, staff.id)
                                }
                              >
                                <IconCheck
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    ticket.internal_assignee?.id === staff.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {staff.first_name} {staff.last_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>

                          <CommandSeparator />

                          <CommandItem
                            className="text-red-600"
                            onSelect={() =>
                              ticket.internal_assignee?.id &&
                              onAssignStaff(ticket.id, null)
                            }
                          >
                            <IconX className="mr-2 h-4 w-4" />
                            Unassign
                          </CommandItem>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              ) : null}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white"
              onClick={() =>
                onAction(
                  `${getCustomerName(ticket.customer)} snoozed for 1 hour`,
                )
              }
            >
              <IconClock className="size-4" />
              Snooze
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="bg-white"
              onClick={() => onAction("More ticket actions opened")}
            >
              <IconDotsVertical className="size-4" />
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isResolving}
              onClick={() => onAction(`${ticket.subject} resolved`)}
            >
              <IconCheck className="size-4" />
              {isResolving ? "Resolving..." : "Resolve"}
            </Button>
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
          {ticket?.tags?.map((tag) => (
            <Badge
              key={tag.id}
              className="border-cyan-100 bg-cyan-50 text-cyan-700"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <IconTag className="size-3" />
                  <span>{tag.name}</span>
                </div>
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                  onClick={() => onRemoveTag(tag.id)}
                  aria-label={`Remove ${tag.name}`}
                >
                  <IconX className="size-3" />
                </button>
              </div>
            </Badge>
          ))}
          <div className="relative flex">
            <Button
              variant="outline"
              size="sm"
              className="inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold bg-white text-slate-700 hover:bg-slate-50"
              onClick={onToggleTagPicker}
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
                              onClick={() => !alreadyAdded && onAddTag(tag)}
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

      <div
        className="min-h-[360px] flex-1 overflow-y-auto bg-slate-50 px-4 py-5"
        ref={messagesEndRef}
      >
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
          <div className="space-y-4 overflow-y-auto">
            {messages.map((message) =>
              message.message_type === "internal" ? (
                <div key={message.id} className="py-2">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="border-amber-300 bg-amber-100 text-amber-800">
                          Internal note
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {formatDateTime(message.created_at)}
                        </span>
                      </div>
                    </div>

                    <p className="whitespace-pre-wrap text-sm text-slate-700">
                      {message.message}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3",
                    message.sender_type === "agent" && "justify-end",
                  )}
                >
                  {message.sender_type === "customer" ? (
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-slate-500 text-xs font-medium text-white">
                        {customerInitials}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                  <div>
                    <div
                      className={cn(
                        "mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500",
                        message.sender_type === "agent" && "justify-end",
                      )}
                    >
                      <span>
                        {/* {message.author === "agent" ? "You" : ticket.customer} -{" "} */}
                        {formatDateTime(message.created_at)}
                      </span>
                      <span className="font-medium uppercase tracking-wide">
                        {message.sender_type === "agent"
                          ? "Agent reply"
                          : ticket.channel}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "max-w-[320px] rounded-xl border px-4 py-3 text-sm font-medium leading-6 shadow-sm",
                        message.sender_type === "agent"
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-slate-950",
                      )}
                    >
                      {message.message}
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

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
            onClick={onAcceptDraft}
          >
            <IconMessageChatbot className="size-3" />
            Accept AI draft
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="bg-white"
            onClick={() => onAction("Macro picker opened")}
          >
            <IconGift className="size-3" />
            Macro
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="bg-white"
            onClick={() => onAction("Reply rephrased")}
          >
            <IconReload className="size-3" />
            Rephrase
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="bg-white"
            onClick={() => onReplyChange(`${reply} Thanks again.`.trim())}
          >
            <IconMoodSmile className="size-3" />
            Warmer
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="bg-white"
            onClick={() => onAction("Translate menu opened")}
          >
            <IconLanguage className="size-3" />
            Translate
          </Button>
        </div>
        <Textarea
          value={reply}
          onChange={(event) => onReplyChange(event.target.value)}
          className="min-h-20 resize-none rounded-lg bg-white text-sm"
          placeholder={
            composerMode === "note"
              ? "Write an internal note..."
              : "Write a reply, or accept the AI draft..."
          }
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-[240px] text-xs text-slate-500">
            An AI draft in your brand voice is ready - click Accept
          </p>
          <div className="flex gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              className="bg-white"
              onClick={onSaveDraft}
            >
              Save draft
            </Button>
            <Button size="sm" onClick={onSend} disabled={isSending}>
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

function CopilotPanel({
  onAcceptDraft,
  onAction,
}: {
  onAcceptDraft: () => void;
  onAction: (action: string) => void;
}) {
  return (
    <aside className="hidden w-[340px] shrink-0 border-l bg-white xl:block">
      <div className="grid h-11 grid-cols-2 border-b text-sm font-medium">
        <button className="flex items-center justify-center gap-2 border-b-2 border-indigo-600 text-indigo-600">
          <IconMessageChatbot className="size-4" />
          AI Copilot
        </button>
        <button className="flex items-center justify-center gap-2 text-slate-500">
          <IconUsers className="size-4" />
          Customer
        </button>
      </div>
      <div className="space-y-3 overflow-y-auto p-4 h-[88vh]!">
        <section className="rounded-lg border bg-white">
          <div className="border-b px-3 py-3">
            <IconSparkles className="size-4 text-indigo-600" />
          </div>
          <p className="px-3 py-4 text-sm leading-6 text-slate-700">
            Sarah is asking where her order #8821 is - it&apos;s been 5 days and
            she&apos;s worried. The order shipped Tuesday via DHL and is out for
            delivery today. No action needed beyond reassurance + tracking.
          </p>
        </section>

        <section className="rounded-lg border bg-white">
          <div className="flex items-center justify-between border-b px-3 py-3">
            <h3 className="flex items-center gap-2 text-sm font-medium text-slate-950">
              <IconMessageChatbot className="size-4 text-indigo-600" />
              Suggested reply
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              brand voice
            </span>
          </div>
          <div className="p-3">
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 text-sm leading-6 text-slate-950">
              Hi Sarah - I completely understand, and I&apos;m sorry it&apos;s
              felt like a long wait. Good news: your order #8821 shipped Tuesday
              and it&apos;s out for delivery with DHL today, before 6pm.
              Here&apos;s your live tracking: DHL 4429 8817 22. I&apos;ll keep
              an eye on it too.
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              Confidence
              <div className="h-1 flex-1 rounded-full bg-slate-100">
                <div className="h-1 w-[94%] rounded-full bg-emerald-500" />
              </div>
              <span className="font-medium text-emerald-600">94%</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" onClick={onAcceptDraft}>
                <IconCheck className="size-4" />
                Use draft
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={() => onAction("Suggested reply regenerated")}
              >
                <IconReload className="size-4" />
                Regenerate
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-white">
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
        </section>

        <section className="rounded-lg border bg-white">
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
        </section>
      </div>
    </aside>
  );
}

export default function HelpDesk() {
  const searchParams = useSearchParams();
  const activeSection = resolveTicketingSettingsSection(
    searchParams?.get("section") ?? null,
  );

  const dispatch = useAppDispatch();

  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchSupportTicketsListData, FetchSupportTicketsLoading } =
    useAppSelector(
      (state) => state.SupportTicketsSliceReducer.FetchSupportTicketsState,
    );
  const { FetchSupportTicketDetailsData } = useAppSelector(
    (state) => state.SupportTicketsSliceReducer.FetchSupportTicketDetailsState,
  );
  const { SupportTicketMessageSendIsLoading } = useAppSelector(
    (state) => state.SupportTicketsSliceReducer.SupportTicketMessageSendState,
  );
  const {
    FetchSupportTicketTagsData,
    FetchSupportTicketTagsIsLoading,
    FetchSupportTicketTagsNext,
  } = useAppSelector(
    (state) => state.SupportTicketsSliceReducer.FetchSupportTicketTagsState,
  );
  const { staff, staffLoading } = useAppSelector(
    (state) => state.GetTenancyReducer,
  );

  const [ticketRows, setTicketRows] = useState<SupportTicket[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [activeQueue, setActiveQueue] = useState<ActiveQueue>("open");
  const [supportTikcetMessages, setSupportTicketMessage] = useState<
    SupportTicketMessage[]
  >([]);
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

  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showStaffPicker, setShowStaffPicker] = useState(false);

  const [reply, setReply] = useState("");
  const [composerMode, setComposerMode] = useState<"reply" | "note">("reply");

  const [isResolving, setIsResolving] = useState(false);

  const activeSupportTicket: SupportTicket | null =
    FetchSupportTicketDetailsData;

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
        ? { channel: appliedFilters.channels.join(",") }
        : {}),
      ...(appliedFilters.tags.length
        ? { tags: appliedFilters.tags.join(",") }
        : {}),
      ...(appliedFilters.fromDate
        ? { from_date: new Date(appliedFilters.fromDate).toISOString() }
        : {}),
      ...(appliedFilters.toDate
        ? { to_date: new Date(appliedFilters.toDate).toISOString() }
        : {}),
      ...(appliedFilters.priorities.length
        ? { priority: appliedFilters.priorities.join(",") }
        : {}),
    };

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

          return rows;
        });
      } finally {
        if (isLoadMore) {
          setIsLoadingMore(false);
        }
      }
    };

    fetchTickets();
  }, [dispatch, storeCode, page, activeQueue, debouncedSearch, appliedFilters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextSearch = searchValue.trim();
      if (nextSearch === debouncedSearch) return;

      setDebouncedSearch(nextSearch);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchValue, debouncedSearch]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextSearch = tagSearch.trim();
      if (nextSearch === debouncedTagSearch) return;
      setDebouncedTagSearch(nextSearch);
      setTagPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [tagSearch, debouncedTagSearch]);

  useEffect(() => {
    if (!storeCode) return;
    dispatch(
      FetchSupportTicketTags({
        storeCode,
        search: debouncedTagSearch,
        page: tagPage,
        limit: 20,
      }),
    );
  }, [dispatch, storeCode, debouncedTagSearch, tagPage]);

  useEffect(() => {
    if (!storeCode || !activeTicketId) return;

    let isCurrent = true;
    dispatch(FetchSupportTicketDetails({ storeCode, ticketId: activeTicketId }))
      .unwrap()
      .then((ticket: SupportTicket) => {
        if (!isCurrent) return;
        setSupportTicketMessage(ticket.messages ?? []);
        const agentDraft = ticket.drafts?.find(
          (draft) => draft.draft_type === "manual",
        );
        if (agentDraft?.message) setReply(agentDraft.message);
      })
      .catch(() => {
        // The thunk displays the API error toast.
      });

    return () => {
      isCurrent = false;
    };
  }, [activeTicketId, dispatch, storeCode]);

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

  const handleQueueChange = (queue: ActiveQueue) => {
    setActiveQueue(queue);
    setPage(1);
    setActiveTicketId(null);
    setTicketRows([]);
    toast.info(`${queue[0].toUpperCase()}${queue.slice(1)} tickets loaded`, {
      description: "Fetching support tickets for the selected queue.",
    });
  };

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

  const handleAction = (message: string) => {
    if (!activeSupportTicket) {
      toast.error("No active ticket selected.");
      return;
    }

    if (message.endsWith("resolved")) {
      setIsResolving(true);
      setTimeout(() => {
        setIsResolving(false);
        toast.success(message);
      }, 650);
      return;
    }

    toast.success(message);
  };

  const handleAcceptDraft = () => {
    setReply(suggestedReply);
    toast.success("AI draft added to the composer");
  };

  const handleToggleTagPicker = () => {
    setShowTagPicker((current) => !current);
  };

  const handleToggleStaffPicker = () => {
    setShowStaffPicker((current) => !current);
  };

  const handleAddTag = (tag: SupportTicketTagsResponse) => {
    if (!activeSupportTicket) return;

    setTicketRows((current) =>
      current.map((ticket) =>
        ticket.id === activeSupportTicket.id &&
        !ticket.tags.some((existing) => existing.id === tag.id)
          ? { ...ticket, tags: [...ticket.tags, tag] }
          : ticket,
      ),
    );
    setShowTagPicker(false);
    toast.success(`Tag added: ${tag.name}`);
  };

  const handleStaffAssign = async (
    ticketId: number,
    staffId: number | null,
  ) => {
    if (!storeCode) return;

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

      setTicketRows((current) =>
        current.map((ticket) =>
          ticket.id === ticketId
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

      toast.success(
        staffId === null
          ? "Staff unassigned successfully."
          : "Staff assigned successfully.",
      );
    } catch {
      //
    }
  };

  const handleRemoveTag = (tagId: number) => {
    if (!activeSupportTicket) return;

    setTicketRows((current) =>
      current.map((ticket) =>
        ticket.id === activeSupportTicket.id
          ? { ...ticket, tags: ticket.tags.filter((tag) => tag.id !== tagId) }
          : ticket,
      ),
    );
    toast.success("Tag removed");
  };

  const handleSaveDraft = async () => {
    if (!storeCode || !activeTicketId) return;

    const trimmedReply = reply.trim();

    if (!trimmedReply) {
      toast.info("Nothing to save", {
        description: "Type a message before saving a draft.",
      });
      return;
    }

    try {
      const payload = {
        message: reply,
      };

      const savedDraft = await dispatch(
        SupportTicketAgentDraftSave({
          storeCode,
          ticketId: activeTicketId,
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

    if (!activeSupportTicket || !activeTicketId) {
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
          ticketId: activeTicketId,
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
              count={FetchSupportTicketsListData?.count ?? 0}
              isLoading={FetchSupportTicketsLoading}
              isLoadingMore={isLoadingMore}
              hasMore={Boolean(FetchSupportTicketsListData?.next)}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              availableTags={FetchSupportTicketTagsData}
              filters={filterFormik.values}
              isFilterOpen={isFilterOpen}
              onFilterOpenChange={handleFilterOpenChange}
              onFiltersChange={(filters) => filterFormik.setValues(filters)}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
              dateError={filterFormik.errors.toDate}
              hasMoreTags={Boolean(FetchSupportTicketTagsNext)}
              isTagListLoading={FetchSupportTicketTagsIsLoading}
              onTagSearchChange={setTagSearch}
              onLoadMoreTags={() => {
                if (FetchSupportTicketTagsNext) {
                  setTagPage((current) => current + 1);
                }
              }}
              onLoadMore={() => {
                if (Boolean(FetchSupportTicketsListData?.next)) {
                  setPage((current) => current + 1);
                }
              }}
            />
            {FetchSupportTicketsLoading && !activeSupportTicket ? (
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
                isResolving={isResolving}
                onReplyChange={setReply}
                onComposerModeChange={setComposerMode}
                onSend={handleSend}
                onAcceptDraft={handleAcceptDraft}
                onSaveDraft={handleSaveDraft}
                onAction={handleAction}
                availableTags={FetchSupportTicketTagsData}
                isTagPickerOpen={showTagPicker}
                isTagPickerLoading={FetchSupportTicketTagsIsLoading}
                onToggleTagPicker={handleToggleTagPicker}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                isStaffPickerOpen={showStaffPicker}
                onToggleStaffPicker={handleToggleStaffPicker}
                availableStaff={staff}
                isStaffPickerLoading={staffLoading}
                onAssignStaff={handleStaffAssign}
              />
            )}
            {FetchSupportTicketsLoading && !activeSupportTicket ? (
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
              <CopilotPanel
                onAcceptDraft={handleAcceptDraft}
                onAction={handleAction}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
