/** A billed feature as the store owner sees it. */
export type FeatureInfo = { name: string; description: string };

// Billed features, grouped the way the store owner thinks about them. Keys
// are the backend's AIFeature values.
export const FEATURE_GROUPS: {
  title: string;
  features: Record<string, FeatureInfo>;
}[] = [
  {
    title: "Chat AI",
    features: {
      chat_turn: {
        name: "AI chat replies",
        description:
          "Answers your customers in the website chat widget and on WhatsApp",
      },
    },
  },
  {
    title: "Chat Insights",
    features: {
      thread_analytics: {
        name: "Chat analysis",
        description:
          "Sums up each closed chat: solved or not, what it was about, and how well the AI did",
      },
    },
  },
  {
    title: "Helpdesk AI",
    features: {
      ticket_message_draft: {
        name: "Copilot replies",
        description: "Drafts a reply for your agent to send",
      },
      ticket_message_improve: {
        name: "Reply polishing",
        description: "Rewrites an agent's reply to make it clearer",
      },
      ticket_draft: {
        name: "Ticket auto-fill",
        description: "Fills in a new ticket from the chat or DM",
      },
      ticket_translate: {
        name: "Ticket translations",
        description: "Translates the customer's messages for your agent",
      },
      ticket_auto_translate: {
        name: "Reply in customer's language",
        description: "Sends your agent's reply in the customer's language",
      },
    },
  },
  {
    title: "Social AI",
    features: {
      comment_reply: {
        name: "Comment replies",
        description: "Replies to comments on your posts",
      },
      dm_reply: {
        name: "Direct message replies",
        description: "Replies to Instagram and Facebook DMs",
      },
      comment_tagging: {
        name: "Comment classification and tagging",
        description: "Sorts comments by type and tags",
      },
    },
  },
];

/** Every feature's display info, keyed by feature code. */
export const FEATURE_INFO: Record<string, FeatureInfo> = Object.assign(
  {},
  ...FEATURE_GROUPS.map((group) => group.features),
);
