"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  IconArchive,
  IconArrowsDiagonal,
  IconBolt,
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

// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  type SupportTicket,
  type SupportTicketCustomer,
  type SupportTicketChannel,
  type SupportTicketPriority,
  type SupportTicketTagsResponse,
} from "@/redux/api-slice/support-ticket-slice";
import { FetchStaff, type StaffMember } from "@/redux/api-slice/tenancy-slice";
import { formatRelativeDateTime } from "@/lib/helpers";

type ActiveQueue = "open" | "pending" | "resolved" | "closed";

type ChatMessage = {
  id: number | string;
  author: "customer" | "agent";
  body: string;
  time: string;
};

const suggestedReply =
  "Hi Sarah - I completely understand, and I am sorry it has felt like a long wait. Good news: your order shipped Tuesday and is out for delivery with DHL today. I will keep an eye on it too.";

function getCustomerName(customer: SupportTicketCustomer | null) {
  if (!customer) return "Unknown customer";

  return customer.name || customer.email || "Unknown customer";
}

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
  activeQueue: ActiveQueue;
  queueLabel: string;
  onQueueChange: (queue: ActiveQueue) => void;
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
}: {
  ticket: SupportTicket;
  messages: ChatMessage[];
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
}) {
  const [tagSearch, setTagSearch] = useState("");

  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase()),
  );

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
                                // onSelect={() =>
                                //   onAssignStaff(
                                //     selectedStaff?.id === staff.id ? null : staff.id
                                //   )
                                // }
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
                            // onSelect={() => onAssignStaff(null)}
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
              onClick={() => onAction(`${ticket.customer} snoozed for 1 hour`)}
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
            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
          </Badge>
          {ticket.tags.map((tag) => (
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

      <div className="min-h-[360px] flex-1 overflow-y-auto bg-slate-50 px-4 py-5">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.author === "agent" && "justify-end",
              )}
            >
              {/* {message.author === "customer" ? (
                <Avatar className="size-8">
                  <AvatarFallback className="bg-slate-500 text-xs font-medium text-white">
                    {ticket.initials}
                  </AvatarFallback>
                </Avatar>
              ) : null} */}
              <div>
                <div
                  className={cn(
                    "mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500",
                    message.author === "agent" && "justify-end",
                  )}
                >
                  <span>
                    {/* {message.author === "agent" ? "You" : ticket.customer} -{" "} */}
                    {message.time}
                  </span>
                  <span className="font-medium uppercase tracking-wide">
                    {message.author === "agent"
                      ? "Agent reply"
                      : ticket.channel}
                  </span>
                </div>
                <div
                  className={cn(
                    "max-w-[320px] rounded-xl border px-4 py-3 text-sm font-medium leading-6 shadow-sm",
                    message.author === "agent"
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-slate-950",
                  )}
                >
                  {message.body}
                </div>
              </div>
            </div>
          ))}
          {isSending ? (
            <div className="text-sm font-medium text-slate-500">
              Sending reply...
            </div>
          ) : null}
        </div>
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
  const { FetchSupportTicketTagsData, FetchSupportTicketTagsIsLoading } =
    useAppSelector(
      (state) => state.SupportTicketsSliceReducer.FetchSupportTicketTagsState,
    );
  const { staff, staffLoading } = useAppSelector(
    (state) => state.GetTenancyReducer,
  );

  const [ticketRows, setTicketRows] = useState<SupportTicket[]>([]);
  const [page, setPage] = useState(1);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [activeQueue, setActiveQueue] = useState<ActiveQueue>("open");
  const [reply, setReply] = useState("");
  const [composerMode, setComposerMode] = useState<"reply" | "note">("reply");
  const [isSending, setIsSending] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [extraMessages, setExtraMessages] = useState<
    Record<string, ChatMessage[]>
  >({});

  useEffect(() => {
    if (!storeCode) return;

    dispatch(FetchStaff());
  }, [dispatch, storeCode]);

  useEffect(() => {
    if (!storeCode) return;

    const fetchArgs = {
      store_code: storeCode,
      page,
      limit: 20,
      filters: {
        is_active: true,
        ...(activeQueue !== "open" ? { status: activeQueue } : {}),
      },
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
  }, [dispatch, storeCode, page, activeQueue]);

  useEffect(() => {
    if (!storeCode) return;
    dispatch(FetchSupportTicketTags(storeCode));
  }, [dispatch, storeCode]);

  const activeTicket = useMemo(
    () => ticketRows?.find((ticket) => ticket.id === activeTicketId) ?? null,
    [activeTicketId, ticketRows],
  );

  const activeMessages = useMemo<ChatMessage[]>(() => {
    if (!activeTicket) return [];

    const customerMessage = {
      id: `${activeTicket.id}-customer`,
      author: "customer" as const,
      body:
        activeTicket.id === 8821
          ? "hi my order still has not arrived and i am getting a bit worried, it has been 5 days now."
          : activeTicket.last_message || activeTicket.description,
      time: "9:42 AM",
    };

    return [customerMessage, ...(extraMessages[activeTicket.id] ?? [])];
  }, [activeTicket, extraMessages]);

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

  const handleAction = (message: string) => {
    if (!activeTicket) {
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
    if (!activeTicket) return;

    setTicketRows((current) =>
      current.map((ticket) =>
        ticket.id === activeTicket.id &&
        !ticket.tags.some((existing) => existing.id === tag.id)
          ? { ...ticket, tags: [...ticket.tags, tag] }
          : ticket,
      ),
    );
    setShowTagPicker(false);
    toast.success(`Tag added: ${tag.name}`);
  };

  const handleRemoveTag = (tagId: number) => {
    if (!activeTicket) return;

    setTicketRows((current) =>
      current.map((ticket) =>
        ticket.id === activeTicket.id
          ? { ...ticket, tags: ticket.tags.filter((tag) => tag.id !== tagId) }
          : ticket,
      ),
    );
    toast.success("Tag removed");
  };

  const handleSaveDraft = () =>
    toast.success("Draft saved", {
      description: reply.trim() || "Empty draft placeholder saved.",
    });

  const handleSend = () => {
    const trimmedReply = reply.trim();
    if (!trimmedReply) {
      toast.error("Write a reply first", {
        description: "Or accept the AI draft to populate the composer.",
      });
      return;
    }

    if (!activeTicket) {
      toast.error("No ticket selected to send a reply.");
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      const message: ChatMessage = {
        id: activeTicket.id,
        author: "agent",
        body:
          composerMode === "note"
            ? `Internal note: ${trimmedReply}`
            : trimmedReply,
        time: "now",
      };

      setExtraMessages((current) => ({
        ...current,
        [activeTicket.id]: [...(current[activeTicket.id] ?? []), message],
      }));
      setReply("");
      setIsSending(false);
      toast.success(
        composerMode === "note" ? "Internal note added" : "Reply sent",
      );
    }, 700);
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
              activeTicketId={activeTicket?.id ?? null}
              activeQueue={activeQueue}
              queueLabel={activeQueueLabel}
              onQueueChange={handleQueueChange}
              onSelectTicket={handleSelectTicket}
              onUtilityAction={handleAction}
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
            {FetchSupportTicketsLoading && !activeTicket ? (
              <div className="flex min-w-0 flex-1 items-center justify-center bg-slate-50">
                <div className="text-center">
                  <Spinner className="mx-auto mb-4 size-8" />
                  <p className="text-sm text-slate-500">
                    Loading conversation...
                  </p>
                </div>
              </div>
            ) : !activeTicket ? (
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
                ticket={activeTicket}
                messages={activeMessages}
                reply={reply}
                composerMode={composerMode}
                isSending={isSending}
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
              />
            )}
            {FetchSupportTicketsLoading && !activeTicket ? (
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
            ) : !activeTicket ? (
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
