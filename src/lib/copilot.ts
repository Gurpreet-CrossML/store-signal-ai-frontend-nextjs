/** The three things Copilot can do on a ticket. Agents cannot type to it. */
export type CopilotAction = "summary" | "kb_answer" | "draft";
export type CopilotSender = "agent" | "ai";
export type CopilotFeedback = "good" | "bad";

/** Why an action would or would not run right now (`actions[...].reason`). */
export type CopilotReason =
  | "first_use"
  | "ticket_changed"
  | "kb_changed"
  | "retry_after_bad_feedback"
  | "up_to_date"
  | "running"
  | "ticket_resolved"
  | "no_customer_message";

export type CopilotActionState = {
  reason: CopilotReason;
};

export type CopilotActions = Record<CopilotAction, CopilotActionState>;

/** One thing an answer was built from, shown as a badge under it. */
export type CopilotSource = {
  type: "ticket" | "order" | "kb" | "product";
  label: string;
  /** Knowledge sources only: "Help article" or "Internal runbook". */
  scope?: string;
};

export type CopilotCitation = {
  knowledge_id: number;
  title: string;
  url: string | null;
  scope: string;
  snippet: string;
  relevance: number;
};

export type CopilotSimilarTicket = {
  id: number;
  ticket_id: string;
  subject: string;
  status: string;
};

/** The raw data behind an AI message; which keys exist depends on its action. */
export type CopilotMetadata = {
  action?: CopilotAction;
  sources?: CopilotSource[];
  /** One sentence on how the answer was produced. */
  basis?: string;
  credit?: number;
  // summary
  summary?: {
    core_issue: string;
    steps_attempted: string;
    pending_action: string;
  };
  sentiment?: "positive" | "neutral" | "negative";
  urgency?: "low" | "normal" | "high" | "critical";
  errors?: string[];
  // kb_answer (draft carries citations too)
  query?: string;
  citations?: CopilotCitation[];
  similar_tickets?: CopilotSimilarTicket[];
};

export type CopilotMessage = {
  id: number;
  sender: CopilotSender;
  action: CopilotAction;
  message: string;
  metadata: CopilotMetadata;
  feedback: CopilotFeedback | null;
  feedback_message: string;
  created_at: string;
};

export type CopilotConversation = {
  messages: CopilotMessage[];
  actions: CopilotActions;
};

/** What each action is called and does, in the order they are offered. */
export const COPILOT_ACTION_OPTIONS: {
  action: CopilotAction;
  title: string;
  description: string;
}[] = [
  {
    action: "summary",
    title: "Summarize this ticket",
    description:
      "Core issue, steps tried, what's pending, sentiment and urgency",
  },
  {
    action: "kb_answer",
    title: "Search the KB and answer",
    description: "Answer from your knowledge base and products, with citations",
  },
  {
    action: "draft",
    title: "Draft a reply",
    description: "A reply to review, then insert into the editor",
  },
];

/** Shown when the ticket is resolved or closed: Copilot is off until it is reopened. */
export const COPILOT_TICKET_CLOSED_NOTICE = "Reopen the ticket to use Copilot.";

/** The ratings an agent can give a Bad answer, matching what Copilot gets wrong. */
export const COPILOT_BAD_REASONS = [
  "Inaccurate",
  "Not helpful",
  "Missing KB content",
  "Wrong tone",
] as const;
