/** A billed feature as the store owner sees it. */
export type FeatureInfo = { name: string; description: string };

// Billed features, grouped the way the store owner thinks about them. Keys
// are the backend's AIFeature values.
export const FEATURE_GROUPS: {
  title: string;
  features: Record<string, FeatureInfo>;
}[] = [
  {
    title: "AI Chat",
    features: {
      chat_turn: {
        name: "AI Chat Replies",
        description: "Answers your customers in the website chat widget",
      },
      ai_insights: {
        name: "AI Insights",
        description: "Summarises and scores a closed chat on request",
      },
    },
  },
  {
    title: "Helpdesk AI",
    features: {
      ticket_message_draft: {
        name: "Reply With AI",
        description: "Drafts a reply in the reply box for your agent to send",
      },
      copilot_summary: {
        name: "Copilot Ticket Summary",
        description: "Summarises a ticket in the Copilot tab",
      },
      copilot_kb_answer: {
        name: "Copilot KB Answer",
        description:
          "Answers from your knowledge base in the Copilot tab; not charged when nothing relevant is found",
      },
      copilot_draft: {
        name: "Copilot Draft Reply",
        description: "Drafts a reply in the Copilot tab",
      },
      ticket_message_improve: {
        name: "Reply Polishing",
        description: "Rewrites an agent's reply to make it clearer",
      },
      ticket_draft: {
        name: "Ticket Draft",
        description: "Fills in a new ticket from the chat or DM",
      },
      ticket_translate: {
        name: "Ticket Translations",
        description: "Translates the customer's messages for your agent",
      },
      ticket_auto_translate: {
        name: "Reply In Customer's Language",
        description: "Sends your agent's reply in the customer's language",
      },
    },
  },
  {
    title: "Social AI",
    features: {
      comment_reply: {
        name: "Comment Replies",
        description: "Replies to comments on your posts",
      },
      dm_reply: {
        name: "Direct Message Replies",
        description: "Replies to Instagram and Facebook DMs",
      },
      comment_tagging: {
        name: "Comment Classification And Tagging",
        description: "Sorts comments by type and tags",
      },
    },
  },
  {
    title: "Knowledge Base",
    features: {
      knowledge_test_answer: {
        name: "Knowledge Test Answers",
        description: "Answers a test question from your knowledge base",
      },
    },
  },
];

/** Every feature's display info, keyed by feature code. */
export const FEATURE_INFO: Record<string, FeatureInfo> = Object.assign(
  {},
  ...FEATURE_GROUPS.map((group) => group.features),
);
