"use client";

import { useEffect, useMemo, useState, useRef, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconClockOff,
  IconDotsVertical,
  IconFilter,
  IconGift,
  IconLanguage,
  IconLoader2,
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
  IconUsers,
  IconX,
} from "@tabler/icons-react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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
import { OrdersCard } from "@/components/custom/thread-detail-panels";
import { cn } from "@/lib/utils";

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
  SupportTicketStatus,
} from "@/redux/api-slice/support-ticket-slice";
import { FetchStaff, type StaffMember } from "@/redux/api-slice/tenancy-slice";
import { formatRelativeDateTime, formatDateTime } from "@/lib/helpers";

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

const channelIcon = {
  whatsapp: IconBrandWhatsapp,
  email: IconMail,
  instagram: IconBrandInstagram,
  web: IconMessage2,
} satisfies Record<SupportTicketChannel, typeof IconBrandWhatsapp>;

const channelColor = {
  whatsapp: "text-emerald-500",
  email: "text-orange-500",
  instagram: "text-rose-500",
  web: "text-indigo-500",
} satisfies Record<SupportTicketChannel, string>;

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
  const ChannelIcon = channelIcon[ticket.channel];
  const visibleTags = ticket.tags?.slice(0, MAX_VISIBLE_TKT_ROW_TAGS);
  const hiddenTags = ticket.tags?.slice(MAX_VISIBLE_TKT_ROW_TAGS);

  const customerName =
    typeof ticket.customer === "string"
      ? ticket.customer
      : ticket.customer?.name || ticket.customer?.email;

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
            {customerName || "Unknown customer"}
          </span>
        </div>
        <p className="truncate text-sm font-medium text-slate-950">
          {ticket.subject}
        </p>
        <p className="mt-1 truncate text-xs text-slate-500">
          {ticket.last_message || ticket.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {visibleTags?.map((tag) => (
            <Badge key={tag.id} variant="outline" style={{ color: tag.color }}>
              {tag.name}
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
                    style={{ color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </HoverCardContent>
            </HoverCard>
          )}
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

function TicketListPanel({
  rows,
  activeTicketId,
  activeQueue,
  queueLabel,
  onQueueChange,
  onSelectTicket,
  onUtilityAction,
  count,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
}: {
  rows: SupportTicket[];
  activeTicketId: number | null;
  activeQueue: SupportTicketStatus;
  queueLabel: string;
  onQueueChange: (queue: SupportTicketStatus) => void;
  onSelectTicket: (ticketId: number) => void;
  onUtilityAction: (action: string) => void;
  count: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
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
          <Button variant="outline" size="icon-sm" className="bg-white">
            <IconFilter className="size-4" />
          </Button>
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
      <div className="h-[83vh]! overflow-y-auto" onScroll={handleScroll}>
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
            {/* <Combobox items={availableStaff}>
              <ComboboxInput
                className="h-8 w-40"
                placeholder={
                  ticket?.internal_assignee?.id
                    ? ticket?.internal_assignee?.name
                    : "Assign staff..."
                }
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
            </Combobox> */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white">
                  <IconClock className="size-4" />
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
                      <IconClockOff className="mr-2 size-4" />
                      Remove snooze
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon-sm" className="bg-white">
              <IconDotsVertical className="size-4" />
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isResolving}
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
                onClick={() => tag.id && onRemoveTag(tag.id)}
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
                      onClick={() => tag.id && onRemoveTag(tag.id)}
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
          <Button variant="outline" size="xs" className="bg-white">
            <IconGift className="size-3" />
            Macro
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isMessageImproving} variant="outline" size="xs">
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
          <Button variant="outline" size="xs" className="bg-white">
            <IconLanguage className="size-3" />
            Translate
          </Button>
        </div>
        <Textarea
          value={reply}
          onChange={(event) => onReplyChange(event.target.value)}
          className="min-h-20 resize-none rounded-lg bg-white text-sm"
          disabled={isMessageImproving}
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
            <Button
              size="sm"
              onClick={onSend}
              disabled={isSending || isMessageImproving}
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
  availableStaff,
  onAssignStaff,
  onTicketStatusUpdate,
  onTicketPriorityUpdate,
}: {
  ticket: SupportTicket;
  onAcceptDraft: () => void;
  onAIDraftGenerate: () => void;
  isAIDraftLoading: boolean;
  aiDraft: SupportTicketDraftMessage | null;
  isOrdersLoading: boolean;
  isOrderSyncLoading: boolean;
  onOrdersSync: () => void;
  availableStaff: StaffMember[];
  onAssignStaff: (staffId: number | null) => void;
  onTicketStatusUpdate: (status: SupportTicketStatus) => void;
  onTicketPriorityUpdate: (priority: SupportTicketPriority) => void;
}) {
  const [activeTab, setActiveTab] = useState<"ticket" | "customer">("ticket");

  const customerInitials = getCustomerInitials(ticket.customer);
  const customerData =
    ticket.customer && typeof ticket.customer === "object"
      ? ticket.customer
      : null;

  const customerName = customerData?.name ?? null;
  const customerEmail = customerData?.email ?? null;

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

                    <Button size="sm" disabled className="w-full">
                      <IconLoader2 className="size-4 animate-spin" />
                      Generating...
                    </Button>
                  </div>
                ) : aiDraft ? (
                  <>
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 text-sm leading-6 text-slate-950">
                      {aiDraft?.message}
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
                        onClick={onAIDraftGenerate}
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

                    <Button
                      className="mt-5"
                      size="sm"
                      onClick={onAIDraftGenerate}
                    >
                      <IconSparkles className="size-4" />
                      Generate draft
                    </Button>
                  </div>
                )}
              </div>
            </section>
            <section className="rounded-lg border bg-white">
              <div className="border-b px-3 py-3">
                <h3 className="text-sm font-medium text-slate-950">Actions</h3>
              </div>

              <div className="space-y-4 p-3">
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-sm text-slate-500">Status</Label>

                  <Select
                    value={ticket.status}
                    onValueChange={onTicketStatusUpdate}
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

                <div className="flex items-center justify-between gap-3">
                  <Label className="text-sm text-slate-500">Asignee</Label>

                  <Combobox items={availableStaff}>
                    <ComboboxInput
                      className="h-8 w-40"
                      placeholder={
                        ticket?.internal_assignee?.id
                          ? ticket?.internal_assignee?.name
                          : "Assign staff..."
                      }
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
                </div>
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
                    <span className="text-slate-500">First response</span>
                    <span className="font-medium text-slate-900">1h 25m</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Last response</span>
                    <span className="font-medium text-slate-900">30m</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Channel</span>
                    <span className="font-medium text-slate-900">Web</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Customer</span>
                    <span className="truncate text-right font-medium text-slate-900">
                      ajay.verma@crossml.com
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
                handleOrdersSync={onOrdersSync}
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

  const [isResolving, setIsResolving] = useState(false);

  const ticketTags = FetchSupportTicketTagsData?.results;

  useEffect(() => {
    if (!storeCode) return;

    dispatch(FetchStaff());
  }, [dispatch, storeCode]);

  useEffect(() => {
    if (!storeCode) return;

    const filters: Record<string, unknown> = {
      status: activeQueue,
    };

    if (activeFilter === "unassigned") {
      filters.is_assigned = false;
    }

    if (activeFilter === "snoozed") {
      filters.is_snoozed = true;
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
  }, [dispatch, storeCode, page, activeQueue, activeFilter]);

  useEffect(() => {
    if (!storeCode) return;
    // dispatch(FetchSupportTicketTags({storeCode}));
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

      const updatedStatus = await dispatch(
        SupportTicketStatusUpdate({
          storeCode,
          ticketId: currentActiveSupportTicketIdRef.current,
          payload,
        }),
      ).unwrap();

      if (updatedStatus) {
        setTicketRows((current) =>
          current.map((ticket) =>
            ticket.id === currentActiveSupportTicketIdRef.current
              ? {
                  ...ticket,
                  status: updatedStatus.status,
                }
              : ticket,
          ),
        );

        setActiveSupportTicket((current) =>
          current
            ? {
                ...current,
                status: updatedStatus.status,
              }
            : current,
        );

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
              onUtilityAction={() => {}}
              count={FetchSupportTicketsListData?.count ?? 0}
              isLoading={FetchSupportTicketsLoading}
              isLoadingMore={isLoadingMore}
              hasMore={Boolean(FetchSupportTicketsListData?.next)}
              onLoadMore={() => {
                if (Boolean(FetchSupportTicketsListData?.next)) {
                  setPage((current) => current + 1);
                }
              }}
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
                isResolving={isResolving}
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
                availableStaff={staff}
                onAssignStaff={handleStaffAssign}
                onTicketStatusUpdate={handleSupportTicketStatusUpdate}
                onTicketPriorityUpdate={handleSupportTicketPriorityUpdate}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
