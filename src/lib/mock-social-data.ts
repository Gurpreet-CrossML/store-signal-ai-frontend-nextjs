export type SocialPlatform = "facebook" | "instagram";

export type SocialAccount = {
  id: string;
  name: string;
  username: string;
  platform: SocialPlatform;
};

export type SocialContact = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  location?: string;
  lastOrder?: string;
  tags?: string[];
};

export type SocialMessage = {
  id: string;
  sender: "contact" | "agent";
  text: string;
  timeAgo: string;
};

export type SocialConversation = {
  id: string;
  accountId: string;
  contact: SocialContact;
  lastMessage: string;
  timeAgo: string;
  unreadCount?: number;
  messages: SocialMessage[];
};

export const MOCK_FB_ACCOUNTS: SocialAccount[] = [
  { id: "fb-1", name: "StoreSignal Outlet", username: "storesignal", platform: "facebook" },
  { id: "fb-2", name: "StoreSignal Support", username: "storesignal.support", platform: "facebook" },
];

export const MOCK_IG_ACCOUNTS: SocialAccount[] = [
  { id: "ig-1", name: "storesignal.ai", username: "storesignal.ai", platform: "instagram" },
  { id: "ig-2", name: "storesignal.shop", username: "storesignal.shop", platform: "instagram" },
];

export const MOCK_CONVERSATIONS: SocialConversation[] = [
  {
    id: "conv-1",
    accountId: "fb-1",
    contact: {
      id: "contact-1",
      name: "Ava Thompson",
      username: "ava.thompson",
      email: "ava.thompson@example.com",
      phone: "+1 (415) 555-0132",
      location: "San Francisco, CA",
      lastOrder: "#SS-10234 — $128.00",
      tags: ["VIP", "Repeat customer"],
    },
    lastMessage: "Hey! Does this come in a size medium?",
    timeAgo: "2m",
    unreadCount: 2,
    messages: [
      {
        id: "m1",
        sender: "contact",
        text: "Hi, I saw your latest post about the new jacket.",
        timeAgo: "10m",
      },
      {
        id: "m2",
        sender: "contact",
        text: "Hey! Does this come in a size medium?",
        timeAgo: "2m",
      },
    ],
  },
  {
    id: "conv-2",
    accountId: "fb-1",
    contact: {
      id: "contact-2",
      name: "Marcus Lee",
      username: "marcus.lee",
      email: "marcus.lee@example.com",
      location: "Austin, TX",
      lastOrder: "#SS-10198 — $54.50",
      tags: ["New customer"],
    },
    lastMessage: "Thanks, that answers my question!",
    timeAgo: "1h",
    messages: [
      {
        id: "m1",
        sender: "contact",
        text: "When will my order ship?",
        timeAgo: "3h",
      },
      {
        id: "m2",
        sender: "agent",
        text: "It ships tomorrow morning — you'll get a tracking link by email.",
        timeAgo: "2h",
      },
      {
        id: "m3",
        sender: "contact",
        text: "Thanks, that answers my question!",
        timeAgo: "1h",
      },
    ],
  },
  {
    id: "conv-3",
    accountId: "ig-1",
    contact: {
      id: "contact-3",
      name: "Priya Nair",
      username: "priya.nair",
      email: "priya.nair@example.com",
      location: "Toronto, ON",
      lastOrder: "#SS-10301 — $212.00",
      tags: ["VIP"],
    },
    lastMessage: "Can I get a discount code for my next order?",
    timeAgo: "20m",
    unreadCount: 1,
    messages: [
      {
        id: "m1",
        sender: "contact",
        text: "Loved the last order, thank you!",
        timeAgo: "1d",
      },
      {
        id: "m2",
        sender: "contact",
        text: "Can I get a discount code for my next order?",
        timeAgo: "20m",
      },
    ],
  },
  {
    id: "conv-4",
    accountId: "ig-1",
    contact: {
      id: "contact-4",
      name: "Jordan Kim",
      username: "jordan.kim",
      location: "Seattle, WA",
    },
    lastMessage: "Is this restocking soon?",
    timeAgo: "3h",
    messages: [
      {
        id: "m1",
        sender: "contact",
        text: "Is this restocking soon?",
        timeAgo: "3h",
      },
    ],
  },
];
