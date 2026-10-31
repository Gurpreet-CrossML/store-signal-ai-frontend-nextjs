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
    },
  },
  {
    title: "Helpdesk AI",
    features: {
      ticket_message_draft: {
        name: "Copilot Replies",
        description: "Drafts a reply for your agent to send",
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
        name: "Reply in Customer's Language",
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
        name: "Comment Classification and Tagging",
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
