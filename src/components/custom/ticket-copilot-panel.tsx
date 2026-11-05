"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  IconBook,
  IconCheck,
  IconChevronDown,
  IconCopy,
  IconExternalLink,
  IconLoader2,
  IconLock,
  IconMail,
  IconSparkles,
  IconThumbDown,
  IconThumbUp,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditLabel } from "@/components/custom/credit-label";
import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import {
  COPILOT_ACTION_OPTIONS,
  COPILOT_BAD_REASONS,
  COPILOT_TICKET_CLOSED_NOTICE,
  type CopilotAction,
  type CopilotFeedback,
  type CopilotMessage,
  type CopilotSource,
} from "@/lib/copilot";
import {
  CopilotActionRun,
  CopilotMessageRate,
  FetchCopilotConversation,
} from "@/redux/api-slice/support-ticket-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { cn } from "@/lib/utils";

const ACTION_ICONS: Record<CopilotAction, typeof IconSparkles> = {
  summary: IconSparkles,
  kb_answer: IconBook,
  draft: IconMail,
};

const SENTIMENT_TONE: Record<string, BadgeTone> = {
  positive: "success",
  neutral: "info",
  negative: "danger",
};
const URGENCY_TONE: Record<string, BadgeTone> = {
  low: "success",
  normal: "info",
  high: "warning",
  critical: "danger",
};

function toneBadge(tone: BadgeTone) {
  return cn("border", BADGE_TONE_STYLES[tone]);
}

/**
 * Helpdesk Copilot for one ticket: three fixed actions and the answers they
 * produced. There is no text box on purpose. Every answer ends with the
 * sources it used, how it was made, and a rating.
 *
 * Mount it with `key={ticketId}`: a different ticket is a different
 * conversation, and remounting starts it clean instead of showing the last
 * ticket's answers while the new ones load.
 *
 * `refreshKey` changes when the ticket's status does, so the panel reloads
 * and shows or hides the resolved-ticket notice. The server decides whether
 * an action runs; the buttons are always available otherwise.
 */
export function TicketCopilotPanel({
  storeCode,
  ticketId,
  refreshKey,
  onInsertDraft,
}: {
  storeCode: string;
  ticketId: number;
  refreshKey: string;
  /** Put the draft in the reply editor. Copilot never sends anything. */
  onInsertDraft: (text: string) => void;
}) {
  const dispatch = useAppDispatch();
  const { FetchCopilotConversationIsError, FetchCopilotConversationData } =
    useAppSelector(
      (state) => state.GetSupportTicketsReducer.FetchCopilotConversationState,
    );
  const {
    CopilotActionRunIsLoading,
    CopilotActionRunTicketId,
    CopilotActionRunAction,
  } = useAppSelector(
    (state) => state.GetSupportTicketsReducer.CopilotActionRunState,
  );
  const endRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  const conversation = FetchCopilotConversationData[ticketId];
  const messages = conversation?.messages ?? [];
  const actions = conversation?.actions ?? null;
  // Answers already loaded for this ticket stay on screen while they reload.
  const loadFailed = Boolean(FetchCopilotConversationIsError) && !conversation;
  const loading = !conversation && !loadFailed;
  const running =
    CopilotActionRunIsLoading && CopilotActionRunTicketId === ticketId
      ? CopilotActionRunAction
      : null;

  useEffect(() => {
    dispatch(FetchCopilotConversation({ storeCode, ticketId }));
  }, [dispatch, storeCode, ticketId, refreshKey]);

  // Bring a new answer into view; opening a ticket stays where it is.
  useEffect(() => {
    if (messages.length > lastCountRef.current && lastCountRef.current > 0) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    lastCountRef.current = messages.length;
  }, [messages.length]);

  const handleRun = (action: CopilotAction) =>
    dispatch(CopilotActionRun({ storeCode, ticketId, action }));

  const handleRate = (
    messageId: number,
    feedback: CopilotFeedback,
    feedbackMessage = "",
  ) =>
    dispatch(
      CopilotMessageRate({
        storeCode,
        ticketId,
        messageId,
        feedback,
        feedbackMessage,
      }),
    );

  // Resolved and closed tickets are done: the server blocks every action.
  const ticketClosed =
    actions !== null &&
    Object.values(actions).every((state) => state.reason === "ticket_resolved");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 *:shrink-0">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconLoader2 className="size-4 animate-spin" />
            Loading Copilot…
          </p>
        ) : loadFailed && messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load Copilot for this ticket. Try again in a moment.
          </p>
        ) : messages.length === 0 ? (
          <div className="my-auto flex flex-col gap-1.5">
            <p className="flex items-center gap-2 text-base font-semibold">
              <IconSparkles className="size-5 text-primary" />
              Ticket Copilot
            </p>
            <p className="text-sm text-muted-foreground">
              Pick an action below. Copilot reads this ticket, shows the sources
              it used, and never sends anything on its own.
            </p>
          </div>
        ) : (
          messages.map((message) =>
            message.sender === "agent" ? (
              <div
                key={message.id}
                className="max-w-[88%] self-end rounded-2xl rounded-br-sm bg-primary/10 px-3 py-2 text-sm"
              >
                {message.message}
              </div>
            ) : (
              <AnswerCard
                key={message.id}
                message={message}
                onRate={handleRate}
                onInsertDraft={onInsertDraft}
              />
            ),
          )
        )}
        <div ref={endRef} />
      </div>

      <div className="flex shrink-0 flex-col gap-1.5 border-t bg-background p-3">
        {ticketClosed ? (
          <p className="flex items-start gap-2 rounded-lg bg-muted px-2.5 py-2 text-xs text-muted-foreground">
            <IconLock className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {COPILOT_TICKET_CLOSED_NOTICE} Earlier answers stay readable
              above.
            </span>
          </p>
        ) : null}
        {COPILOT_ACTION_OPTIONS.map(({ action, title, description }) => {
          const Icon = ACTION_ICONS[action];
          const isRunning = running === action;
          // Always clickable: the server decides whether anything changed and
          // answers with a toast instead of a new message. Only a resolved
          // ticket (one notice above) or a run in progress turns them off.
          const blocked = ticketClosed || running !== null || loading;
          return (
            <button
              key={action}
              type="button"
              disabled={blocked}
              onClick={() => handleRun(action)}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-lg border bg-card px-2.5 py-2 text-left transition-colors",
                "hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:bg-card",
              )}
            >
              {isRunning ? (
                <IconLoader2 className="mt-0.5 size-4 shrink-0 animate-spin text-primary" />
              ) : (
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2 text-sm font-medium">
                  <CreditLabel>{isRunning ? "Working…" : title}</CreditLabel>
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {description}
                </span>
              </span>
            </button>
          );
        })}
        <p className="text-[11px] text-muted-foreground">
          Copilot can make mistakes. Check answers against the sources.
        </p>
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: CopilotSource }) {
  const tone: BadgeTone =
    source.type === "kb"
      ? source.scope === "Internal runbook"
        ? "warning"
        : "info"
      : source.type === "order"
        ? "accent"
        : source.type === "product"
          ? "success"
          : "neutral";
  return (
    <Badge variant="outline" className={toneBadge(tone)}>
      {source.label}
    </Badge>
  );
}

function AnswerCard({
  message,
  onRate,
  onInsertDraft,
}: {
  message: CopilotMessage;
  onRate: (
    messageId: number,
    feedback: CopilotFeedback,
    feedbackMessage?: string,
  ) => void;
  onInsertDraft: (text: string) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border bg-card text-sm">
      <div className="flex flex-col gap-2.5 p-3">
        {message.action === "summary" ? (
          <SummaryBody message={message} />
        ) : message.action === "draft" ? (
          <DraftBody message={message} onInsertDraft={onInsertDraft} />
        ) : (
          <p className="whitespace-pre-wrap">{message.message}</p>
        )}
      </div>

      {showDetails ? <AnswerDetails message={message} /> : null}

      <FeedbackRow
        message={message}
        onRate={onRate}
        leading={
          <Button
            type="button"
            size="xs"
            variant="ghost"
            aria-expanded={showDetails}
            onClick={() => setShowDetails((open) => !open)}
            className="-ml-1.5 text-muted-foreground"
          >
            {showDetails ? "Hide sources & basis" : "View sources & basis"}
            <IconChevronDown
              className={cn(
                "size-3.5 transition-transform",
                showDetails && "rotate-180",
              )}
            />
          </Button>
        }
      />
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function SummaryBody({ message }: { message: CopilotMessage }) {
  const { summary, sentiment, urgency, errors } = message.metadata;
  if (!summary) {
    return <p className="whitespace-pre-wrap">{message.message}</p>;
  }
  return (
    <>
      <p>Here is a summary of this ticket.</p>
      {(
        [
          ["Core issue", summary.core_issue],
          ["Steps attempted", summary.steps_attempted],
          ["Pending action", summary.pending_action],
        ] as const
      ).map(([label, text]) => (
        <div key={label}>
          <SectionLabel>{label}</SectionLabel>
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      ))}
      <div className="flex flex-wrap gap-1.5">
        {sentiment ? (
          <Badge
            variant="outline"
            className={toneBadge(SENTIMENT_TONE[sentiment] ?? "neutral")}
          >
            Sentiment: {sentiment}
          </Badge>
        ) : null}
        {urgency ? (
          <Badge
            variant="outline"
            className={toneBadge(URGENCY_TONE[urgency] ?? "neutral")}
          >
            Urgency: {urgency}
          </Badge>
        ) : null}
        {(errors ?? []).map((error) => (
          <Badge
            key={error}
            variant="outline"
            className={cn(toneBadge("danger"), "font-mono")}
          >
            {error}
          </Badge>
        ))}
      </div>
    </>
  );
}

/** What an answer was built from and why. Hidden until the agent asks. */
function AnswerDetails({ message }: { message: CopilotMessage }) {
  const { sources, basis, citations, similar_tickets, credit } =
    message.metadata;

  return (
    <div className="flex flex-col gap-2.5 border-t bg-muted/30 px-3 py-2.5 text-xs">
      {sources && sources.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <SectionLabel>Sources used</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {sources.map((source, index) => (
              <SourceBadge key={`${source.label}-${index}`} source={source} />
            ))}
          </div>
        </div>
      ) : null}
      {basis ? (
        <div className="flex flex-col gap-1.5">
          <SectionLabel>Basis</SectionLabel>
          <p className="text-foreground/80">{basis}</p>
        </div>
      ) : null}
      {citations && citations.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <SectionLabel>Citations</SectionLabel>
          {citations.map((citation, index) => (
            <div
              key={citation.knowledge_id}
              className="flex gap-2 rounded-lg border bg-background p-2"
            >
              <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded bg-primary/10 text-[11px] font-semibold text-primary">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="font-medium">
                  {citation.title}{" "}
                  <Badge
                    variant="outline"
                    className={toneBadge(
                      citation.scope === "Internal runbook"
                        ? "warning"
                        : "info",
                    )}
                  >
                    {citation.scope}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  {citation.snippet}
                </p>
                {citation.url ? (
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <IconExternalLink className="size-3" />
                    Open source
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {similar_tickets && similar_tickets.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <SectionLabel>Similar tickets</SectionLabel>
          {similar_tickets.map((ticket) => (
            <p
              key={ticket.id}
              className="flex items-center gap-2 rounded-lg border bg-background p-2"
            >
              <Badge variant="outline" className={toneBadge("neutral")}>
                {ticket.status}
              </Badge>
              <span className="min-w-0 truncate">
                <span className="font-medium">{ticket.ticket_id}</span>{" "}
                {ticket.subject}
              </span>
            </p>
          ))}
        </div>
      ) : null}
      <p className="text-muted-foreground">
        {credit ? `${credit} AI credit used` : "No credit used"}
      </p>
    </div>
  );
}

function DraftBody({
  message,
  onInsertDraft,
}: {
  message: CopilotMessage;
  onInsertDraft: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy", {
        description: "Select the text and copy it instead.",
      });
    }
  };

  return (
    <>
      <p>Here is a draft reply. Review it, then insert it into the editor.</p>
      <p className="rounded-lg border bg-background p-2.5 whitespace-pre-wrap">
        {message.message}
      </p>
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            onInsertDraft(message.message);
            toast.success("Draft added to the composer", {
              description: "Review and edit it before sending.",
            });
          }}
        >
          <IconCheck className="size-4" />
          Insert into reply editor
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={copy}>
          <IconCopy className="size-4" />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Nothing is sent automatically. You press Send yourself.
      </p>
    </>
  );
}

function FeedbackRow({
  message,
  onRate,
  leading,
}: {
  message: CopilotMessage;
  onRate: (
    messageId: number,
    feedback: CopilotFeedback,
    feedbackMessage?: string,
  ) => void;
  leading: ReactNode;
}) {
  return (
    <div className="border-t bg-muted/50">
      <div className="flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground">
        {leading}
        <span className="flex-1" />
        <span>Helpful?</span>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Good answer"
          aria-pressed={message.feedback === "good"}
          className={cn(message.feedback === "good" && "text-primary")}
          onClick={() => {
            if (message.feedback !== "good") onRate(message.id, "good");
          }}
        >
          <IconThumbUp className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Bad answer"
          aria-pressed={message.feedback === "bad"}
          className={cn(
            message.feedback === "bad" &&
              "text-rose-600 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-400",
          )}
          onClick={() => {
            if (message.feedback !== "bad") {
              onRate(message.id, "bad", message.feedback_message);
            }
          }}
        >
          <IconThumbDown className="size-4" />
        </Button>
      </div>
      {message.feedback === "bad" ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-900 dark:bg-rose-950/40">
          <p className="w-full text-xs font-medium text-rose-700 dark:text-rose-300">
            {message.feedback_message ? "Thanks, logged." : "What was wrong?"}
          </p>
          {COPILOT_BAD_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              aria-pressed={message.feedback_message === reason}
              onClick={() => {
                if (message.feedback_message !== reason) {
                  onRate(message.id, "bad", reason);
                }
              }}
              className={cn(
                "rounded-full border bg-background px-2.5 py-0.5 text-xs text-foreground transition-colors hover:bg-muted",
                message.feedback_message === reason &&
                  cn(
                    BADGE_TONE_STYLES.danger,
                    "font-medium hover:bg-rose-100 dark:hover:bg-rose-900",
                  ),
              )}
            >
              {reason}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
