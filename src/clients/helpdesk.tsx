"use client";

import { useMemo, useState, type ReactNode } from "react";
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
  IconReload,
  IconSend,
  IconSparkles,
  IconTag,
  IconUser,
  IconUsers,
  IconWand,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  resolveTicketingSettingsSection,
  TicketingSettingsContent,
} from "@/components/custom/ticketing-settings";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Channel = "whatsapp" | "email" | "instagram" | "webchat";

type ActiveQueue = "open" | "pending" | "resolved" | "closed";

type Ticket = {
  id: string;
  customer: string;
  initials: string;
  channel: Channel;
  subject: string;
  preview: string;
  time: string;
  unread?: boolean;
  vip?: boolean;
  tags: {
    label: string;
    tone: "blue" | "red" | "amber" | "green" | "cyan" | "orange";
  }[];
  sla?: string;
};

type ChatMessage = {
  id: string;
  author: "customer" | "agent";
  body: string;
  time: string;
};

const suggestedReply =
  "Hi Sarah - I completely understand, and I am sorry it has felt like a long wait. Good news: your order shipped Tuesday and is out for delivery with DHL today. I will keep an eye on it too.";

const tickets: Ticket[] = [
  {
    id: "8821",
    customer: "Sarah Whelan",
    initials: "SW",
    channel: "whatsapp",
    subject: "Where is my order? Been 5 days",
    preview: "hi my order still hasn't arrived and i'm getting a bit wor...",
    time: "2m",
    unread: true,
    tags: [
      { label: "WISMO", tone: "cyan" },
      { label: "Draft ready", tone: "blue" },
    ],
    sla: "12m",
  },
  {
    id: "8818",
    customer: "Emma O'Brien",
    initials: "EO",
    channel: "email",
    subject: "This arrived damaged and I am really upset",
    preview: "The changing bag came with a broken zip and a tear o...",
    time: "22m",
    unread: true,
    tags: [
      { label: "Complaint", tone: "red" },
      { label: "Escalated", tone: "amber" },
      { label: "Breached", tone: "red" },
    ],
  },
  {
    id: "8811",
    customer: "Liam Murphy",
    initials: "LM",
    channel: "instagram",
    subject: "Is the bottle set BPA-free?",
    preview: "saw your feeding set on the story, are they BPA free?",
    time: "31m",
    tags: [
      { label: "Product", tone: "blue" },
      { label: "Draft ready", tone: "blue" },
    ],
    sla: "38m",
  },
  {
    id: "8807",
    customer: "Niamh Doyle",
    initials: "ND",
    channel: "email",
    subject: "Bulk order for a new nursery (30+ items)",
    preview: "We're opening a nursery in Cork and need to order cot...",
    time: "1h",
    unread: true,
    vip: true,
    tags: [
      { label: "B2B", tone: "green" },
      { label: "VIP", tone: "orange" },
    ],
    sla: "1h 40m",
  },
  {
    id: "8799",
    customer: "Ciara Kelly",
    initials: "CK",
    channel: "whatsapp",
    subject: "Where's my refund?",
    preview: "you said 3-5 days for the refund and it's been a week ...",
    time: "1h",
    unread: true,
    tags: [
      { label: "Refund", tone: "red" },
      { label: "Draft ready", tone: "blue" },
    ],
    sla: "25m",
  },
  {
    id: "8788",
    customer: "Aoife Ryan",
    initials: "AR",
    channel: "webchat",
    subject: "Can I return a sleepsuit? Wrong size",
    preview: "Resolved by AI - exchange initiated for size 3-6m",
    time: "2h",
    tags: [
      { label: "Returns", tone: "orange" },
      { label: "AI resolved", tone: "green" },
    ],
  },
  {
    id: "8788",
    customer: "Aoife Ryan",
    initials: "AR",
    channel: "webchat",
    subject: "Can I return a sleepsuit? Wrong size",
    preview: "Resolved by AI - exchange initiated for size 3-6m",
    time: "2h",
    tags: [
      { label: "Returns", tone: "orange" },
      { label: "AI resolved", tone: "green" },
    ],
  },
  {
    id: "8788",
    customer: "Aoife Ryan",
    initials: "AR",
    channel: "webchat",
    subject: "Can I return a sleepsuit? Wrong size",
    preview: "Resolved by AI - exchange initiated for size 3-6m",
    time: "2h",
    tags: [
      { label: "Returns", tone: "orange" },
      { label: "AI resolved", tone: "green" },
    ],
  },
  {
    id: "8788",
    customer: "Aoife Ryan",
    initials: "AR",
    channel: "webchat",
    subject: "Can I return a sleepsuit? Wrong size",
    preview: "Resolved by AI - exchange initiated for size 3-6m",
    time: "2h",
    tags: [
      { label: "Returns", tone: "orange" },
      { label: "AI resolved", tone: "green" },
    ],
  },
  {
    id: "8788",
    customer: "Aoife Ryan",
    initials: "AR",
    channel: "webchat",
    subject: "Can I return a sleepsuit? Wrong size",
    preview: "Resolved by AI - exchange initiated for size 3-6m",
    time: "2h",
    tags: [
      { label: "Returns", tone: "orange" },
      { label: "AI resolved", tone: "green" },
    ],
  },
  {
    id: "8788",
    customer: "Aoife Ryan",
    initials: "AR",
    channel: "webchat",
    subject: "Can I return a sleepsuit? Wrong size",
    preview: "Resolved by AI - exchange initiated for size 3-6m",
    time: "2h",
    tags: [
      { label: "Returns", tone: "orange" },
      { label: "AI resolved", tone: "green" },
    ],
  },
  {
    id: "8788",
    customer: "Aoife Ryan",
    initials: "AR",
    channel: "webchat",
    subject: "Can I return a sleepsuit? Wrong size",
    preview: "Resolved by AI - exchange initiated for size 3-6m",
    time: "2h",
    tags: [
      { label: "Returns", tone: "orange" },
      { label: "AI resolved", tone: "green" },
    ],
  },
  {
    id: "8788",
    customer: "Aoife Ryan",
    initials: "AR",
    channel: "webchat",
    subject: "Can I return a sleepsuit? Wrong size",
    preview: "Resolved by AI - exchange initiated for size 3-6m",
    time: "2h",
    tags: [
      { label: "Returns", tone: "orange" },
      { label: "AI resolved", tone: "green" },
    ],
  },
  {
    id: "8788",
    customer: "Aoife Ryan",
    initials: "AR",
    channel: "webchat",
    subject: "Can I return a sleepsuit? Wrong size",
    preview: "Resolved by AI - exchange initiated for size 3-6m",
    time: "2h",
    tags: [
      { label: "Returns", tone: "orange" },
      { label: "AI resolved", tone: "green" },
    ],
  },
];

const tagStyles = {
  blue: "bg-indigo-50 text-indigo-700 border-indigo-100",
  red: "bg-red-50 text-red-700 border-red-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  cyan: "bg-cyan-50 text-cyan-700 border-cyan-100",
  orange: "bg-orange-50 text-orange-700 border-orange-100",
} satisfies Record<Ticket["tags"][number]["tone"], string>;

const channelIcon = {
  whatsapp: IconBrandWhatsapp,
  email: IconMail,
  instagram: IconBrandInstagram,
  webchat: IconMessage2,
} satisfies Record<Channel, typeof IconBrandWhatsapp>;

const channelColor = {
  whatsapp: "text-emerald-500",
  email: "text-orange-500",
  instagram: "text-rose-500",
  webchat: "text-indigo-500",
} satisfies Record<Channel, string>;

function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold",
        className,
      )}
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
  ticket: Ticket;
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
          ticket.unread ? "bg-red-500" : "bg-slate-300",
        )}
      />
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <ChannelIcon
            className={cn("size-5 shrink-0", channelColor[ticket.channel])}
          />
          <span className="truncate text-sm font-medium text-slate-950">
            {ticket.customer}
          </span>
          {ticket.vip ? (
            <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
              VIP
            </span>
          ) : null}
        </div>
        <p className="truncate text-sm font-medium text-slate-950">
          {ticket.subject}
        </p>
        <p className="mt-1 truncate text-xs text-slate-500">{ticket.preview}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {ticket.tags.map((tag) => (
            <Badge key={tag.label} className={tagStyles[tag.tone]}>
              {tag.label}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-8">
        <span className="text-xs text-slate-400">{ticket.time}</span>
        {ticket.sla ? (
          <span className="rounded-md bg-orange-50 px-1.5 py-0.5 text-[11px] font-medium text-orange-600">
            {ticket.sla}
          </span>
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

function TicketListPanel({
  rows,
  activeTicketId,
  activeQueue,
  onQueueChange,
  onSelectTicket,
  onUtilityAction,
}: {
  rows: Ticket[];
  activeTicketId: string;
  activeQueue: ActiveQueue;
  onQueueChange: (queue: ActiveQueue) => void;
  onSelectTicket: (ticketId: string) => void;
  onUtilityAction: (action: string) => void;
}) {
  return (
    <section className="hidden w-[336px] shrink-0 border-r bg-white md:block">
      <div className="flex h-14 items-center justify-between border-b px-3">
        <h2 className="font-medium text-slate-950">All open</h2>
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
            onClick={() => onQueueChange(queue.key)}
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
      <div className="h-[83vh]! overflow-y-auto">
        {rows.map((ticket, index) => (
          <TicketRow
            key={`${ticket.id}-${ticket.customer}-${index}`}
            ticket={ticket}
            active={ticket.id === activeTicketId}
            onSelect={() => onSelectTicket(ticket.id)}
          />
        ))}
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
}: {
  ticket: Ticket;
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
}) {
  return (
    <main className="flex min-w-0 flex-1 flex-col bg-white">
      <div className="border-b px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="max-w-[280px] text-xl font-semibold leading-tight text-slate-950">
              {ticket.subject}
            </h2>
            <span className="mt-1 inline-block text-xs font-semibold text-slate-400">
              #{ticket.id}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white"
              onClick={() => onAction(`${ticket.customer} assigned to you`)}
            >
              <IconUser className="size-4" />
              Assign
            </Button>
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
          <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">
            Open - unassigned
          </Badge>
          <Badge className="border-red-100 bg-red-50 text-red-700">
            <span className="size-2 rounded-full bg-red-500" />
            Urgent
          </Badge>
          <Badge className="border-cyan-100 bg-cyan-50 text-cyan-700">
            WISMO
          </Badge>
          <Badge className="border-slate-200 bg-white text-slate-700">
            <IconTag className="size-3" /> + Tag
          </Badge>
          <Badge className="border-orange-100 bg-orange-50 text-orange-600">
            First response due in 12m
          </Badge>
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
              {message.author === "customer" ? (
                <Avatar className="size-8">
                  <AvatarFallback className="bg-slate-500 text-xs font-medium text-white">
                    {ticket.initials}
                  </AvatarFallback>
                </Avatar>
              ) : null}
              <div>
                <div
                  className={cn(
                    "mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500",
                    message.author === "agent" && "justify-end",
                  )}
                >
                  <span>
                    {message.author === "agent" ? "You" : ticket.customer} -{" "}
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
  const [ticketRows, setTicketRows] = useState(tickets);
  const [activeTicketId, setActiveTicketId] = useState(tickets[0].id);
  const [activeQueue, setActiveQueue] = useState<ActiveQueue>("open");
  const [reply, setReply] = useState("");
  const [composerMode, setComposerMode] = useState<"reply" | "note">("reply");
  const [isSending, setIsSending] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [extraMessages, setExtraMessages] = useState<
    Record<string, ChatMessage[]>
  >({});

  const activeTicket = useMemo(
    () =>
      ticketRows.find((ticket) => ticket.id === activeTicketId) ??
      ticketRows[0],
    [activeTicketId, ticketRows],
  );

  const activeMessages = useMemo<ChatMessage[]>(() => {
    const customerMessage = {
      id: `${activeTicket.id}-customer`,
      author: "customer" as const,
      body:
        activeTicket.id === "8821"
          ? "hi my order still has not arrived and i am getting a bit worried, it has been 5 days now."
          : activeTicket.preview,
      time: "9:42 AM",
    };

    return [customerMessage, ...(extraMessages[activeTicket.id] ?? [])];
  }, [activeTicket, extraMessages]);

  const handleSelectTicket = (ticketId: string) => {
    const nextTicket = ticketRows.find((ticket) => ticket.id === ticketId);
    if (!nextTicket) return;
    setActiveTicketId(ticketId);
    setReply("");
    setTicketRows((rows) =>
      rows.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, unread: false } : ticket,
      ),
    );
    toast.info(`Opened ${nextTicket.customer}`, {
      description: nextTicket.subject,
    });
  };

  const handleQueueChange = (queue: ActiveQueue) => {
    setActiveQueue(queue);
    toast.info(`${queue[0].toUpperCase()}${queue.slice(1)} tickets loaded`, {
      description: "Using the same mock tickets for this demo.",
    });
  };

  const handleAction = (message: string) => {
    if (message.endsWith("resolved")) {
      setIsResolving(true);
      setTimeout(() => {
        setIsResolving(false);
        setTicketRows((rows) =>
          rows.map((ticket) =>
            ticket.id === activeTicket.id
              ? {
                  ...ticket,
                  unread: false,
                  preview: "Resolved by agent - mock status updated",
                  tags: [
                    ...ticket.tags.filter((tag) => tag.label !== "Resolved"),
                    { label: "Resolved", tone: "green" },
                  ],
                }
              : ticket,
          ),
        );
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

  const handleSaveDraft = () => {
    toast.success("Draft saved", {
      description: reply.trim() || "Empty draft placeholder saved.",
    });
  };

  const handleSend = () => {
    const trimmedReply = reply.trim();
    if (!trimmedReply) {
      toast.error("Write a reply first", {
        description: "Or accept the AI draft to populate the composer.",
      });
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      const message: ChatMessage = {
        id: `${activeTicket.id}-${Date.now()}`,
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
      setTicketRows((rows) =>
        rows.map((ticket) =>
          ticket.id === activeTicket.id
            ? {
                ...ticket,
                unread: false,
                preview:
                  composerMode === "note"
                    ? "Internal note added"
                    : trimmedReply,
              }
            : ticket,
        ),
      );
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
              activeTicketId={activeTicket.id}
              activeQueue={activeQueue}
              onQueueChange={handleQueueChange}
              onSelectTicket={handleSelectTicket}
              onUtilityAction={handleAction}
            />
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
            />
            <CopilotPanel
              onAcceptDraft={handleAcceptDraft}
              onAction={handleAction}
            />
          </>
        )}
      </div>
    </div>
  );
}
