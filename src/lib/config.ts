import {
  Icon,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandWhatsapp,
} from "@tabler/icons-react";

const DJANGO_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000";
const LOCAL_BASE_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "";

export type APITarget = "django" | "local";

/**
 * Build an API URL against the requested backend.
 *  - target "django": the Django backend.
 *  - target "local" (default): this Next.js app's own /api routes.
 */
export function createAPIUrl(path?: string, target: APITarget = "local") {
  const rawBase = target === "django" ? DJANGO_BASE_URL : LOCAL_BASE_URL;
  const baseUrl = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;
  const formattedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${baseUrl}/api${formattedPath}`;
}

export function createWebSocketUrl(path?: string) {
  const baseUrl = DJANGO_BASE_URL.replace(/\/$/, "");
  const wsBaseUrl = baseUrl.replace(/^http/, "ws");
  const formattedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";

  return `${wsBaseUrl}/ws${formattedPath}`;
}

export const ENDPOINTS = {
  login: () => createAPIUrl("/auth/login/", "django"),

  // Auth/session (Django) — token lifecycle + identity.
  refreshToken: () => createAPIUrl("/auth/token/refresh/", "django"),
  verifyToken: () => createAPIUrl("/auth/token/verify/", "django"),
  logout: () => createAPIUrl("/auth/logout/", "django"),
  profile: () => createAPIUrl("/auth/profile/", "django"),

  // Chat Websocket (Django)
  chatSocket: (threadId: string, token: string) =>
    createWebSocketUrl(`/chat/${threadId}/?role=agent&token=${token}`),

  // Dashboard Websocket (Django)
  dashboardSocket: (storeCode: string, token: string) =>
    createWebSocketUrl(`/support/dashboard/${storeCode}/?token=${token}`),

  // Social AI Websocket (Django) — read-only stream of new DMs, new
  // comments, and comment tagging for every connected account on the store.
  socialSocket: (storeCode: string, token: string) =>
    createWebSocketUrl(`/social/${storeCode}/?token=${token}`),

  // Image upload (Django) — POST multipart/form-data to this endpoint, then
  // use the returned URL in a message payload.
  uploadAttachments: () =>
    createAPIUrl("/support/attachments/upload/", "django"),

  // Company & staff management (Django /api/tenancy/). These are Django-owned;
  // GET calls must pass `useBackend: true` (writes auto-route to Django).
  // Public self-serve sign-up (Django) — creates the company and its first
  // admin; the password is generated server-side and emailed.
  registerCompany: () => "/tenancy/register/",
  fetchCompanyProfile: () => "/tenancy/company/",
  updateCompanyProfile: () => "/tenancy/company/",
  fetchStaff: () => "/tenancy/staff/",
  createStaff: () => "/tenancy/staff/",
  updateStaff: (id: number) => `/tenancy/staff/${id}/`,
  resetStaffPassword: (id: number) => `/tenancy/staff/${id}/reset-password/`,
  // Per-store access grants for a staff user (Django; GET needs useBackend).
  fetchStoreAccess: (userId: number) =>
    `/tenancy/staff/${userId}/store-access/`,
  updateStoreAccess: (userId: number, storeCode: string) =>
    `/tenancy/staff/${userId}/store-access/${storeCode}/`,

  // Store Management
  fetchStoresList: () => "/store/list",
  // Per-store settings (Django) — currently the widget's allowed-IP list.
  // GET returns the settings, PATCH updates them.
  storeAllowedIPsSettings: () =>
    createAPIUrl("/store/settings/allowed-ips/", "django"),

  // Dashboard Analytics. Local GET routes (Next) — NO trailing slash, otherwise
  // Next.js issues a 308 redirect (an extra round-trip) before each call.
  // fetchDashboard consolidates the 5 summary calls into one request.
  fetchDashboard: () => "/analytics/dashboard",
  fetchFeedbackInsights: () => "/analytics/feedback-insights",
  fetchConversationData: () => "/analytics/conversion",
  fetchEngagementData: () => "/analytics/engagements",
  fetchOperationalEfficiencyData: () => "/analytics/operational-efficiency",
  fetchUserMatrix: () => "/analytics/user-matrix",
  fetchConversaionRateData: () => "/analytics/conversion-rate",
  fetchQueryCategoryInsights: () => "/analytics/query-category-insights",
  fetchConversationHistory: () => "/analytics/chat-history",
  // AI Usage analytics (Django; GET requests require useBackend: true).
  fetchAIUsageSummary: () => "/chat/ai-usage/summary/",
  fetchAIUsageDaily: () => "/chat/ai-usage/daily/",
  fetchAIUsageTokenSplit: () => "/chat/ai-usage/token-split/",
  fetchAIUsageWorkflowCosts: () => "/chat/ai-usage/workflow-costs/",
  fetchAIUsageLatencyTrend: () => "/chat/ai-usage/latency-trend/",

  // Thread-level Analytics (local GETs — no trailing slash).
  fetchThreads: () => "/analytics/threads",
  fetchThreadDetails: (threadId: string) => `/analytics/threads/${threadId}`,
  fetchUserMetadata: (threadId: string) =>
    `/analytics/threads/${threadId}/user-metadata`,
  fetchConversationSummary: (threadId: string) =>
    `/analytics/threads/${threadId}/summary`,
  fetchFeedbackSequence: (threadId: string) =>
    `/analytics/threads/${threadId}/feedback-sequence`,
  fetchTags: (threadId: string) => `/analytics/threads/${threadId}/tags`,
  fetchThreadTagOptions: () => "/analytics/threads/tags",
  fetchAIInsight: (threadId: string) =>
    `/analytics/threads/${threadId}/ai-insights`,
  fetchCartData: (threadId: string) =>
    `/analytics/threads/${threadId}/cart-data`,
  // Support tickets (Django). Same payload from both, so the caller only
  // picks the URL: customer-scoped for a logged-in customer (spans all
  // their conversations), thread-scoped for a guest.
  fetchCustomerTickets: (customerId: number) =>
    createAPIUrl(`/support/customers/${customerId}/tickets/`, "django"),
  fetchThreadTickets: (threadId: string) =>
    createAPIUrl(`/support/threads/${threadId}/tickets/`, "django"),
  fetchOrderData: (threadId: string) =>
    `/analytics/threads/${threadId}/order-data`,

  // Chatbot Customization (Django via useBackend — keep trailing slash).
  widgetCustomization: (storeId: number) =>
    `/store/widget-customization/${storeId}/`,

  // Brand Voice. GET uses the local tenant-scoped API route; writes are routed
  // to Django by axios-config so its serializer validation remains authoritative.
  personaIdentity: () => "/chat/persona-identity/",
  neverSayRules: () => "/chat/never-say-rules/",

  // Knowledge Base Management. Local GETs have no trailing slash; Django writes
  // (upload/create/update/delete) keep theirs (DRF requires it).
  fetchLibraryDocuments: () => `/knowledge/library-documents`,
  uploadLibraryDocument: () => `/knowledge/library-documents/`,
  fetchStoreFaqs: () => `/knowledge/store-faqs`,
  createStoreFaq: () => `/knowledge/store-faqs/`,
  updateStoreFaq: (id: number) => `/knowledge/store-faqs/${id}/`,
  deleteStoreFaq: (id: number) => `/knowledge/store-faqs/${id}/`,
  fetchScrapeLinkTypes: () => `/knowledge/scrape-links/types`,
  createScrapeLink: () => `/knowledge/scrape-links/`,
  fetchScrapeLink: () => `/knowledge/scrape-links`,

  // Integrations
  fetchIntegrations: () => `/integrations`,
  // Write — connecting a store to an integration stays on the Django backend.
  // NOTE: endpoint is still being finalised by the backend dev; adjust the path
  // here once it's confirmed.
  connectStoreIntegration: () => `/store/integrations/`,
  // Detail route — disconnect targets a StoreIntegration by its own object id.
  storeIntegrationDetail: (id: number) => `/store/integrations/${id}/`,

  // Brand Voice reads use the local DB-backed chat routes; writes go straight to
  // Django's upsert endpoints.
  tonePresets: () => `/chat/tone-presets/`,
  vocabularyPresets: () => "/chat/vocabulary-presets/",
  neverSayRulesPresets: () => "/chat/never-say-rules-presets/",
  toneStyle: () => `/chat/tone-style/`,
  vocabulary: () => `/chat/vocabulary/`,

  // Catalog. Store-scoped directories of shoppers and their orders. Both lists
  // take search, filter and ordering query params — see CustomerFilters and
  // OrderFilters in their slices for the full set.
  //
  // NOTE: the backend confirmed the two list routes. The detail routes are
  // the DRF convention on top of them and are still to be verified.
  fetchCustomers: () => createAPIUrl("/chat/customers/", "django"),
  fetchCustomerDetails: (customerId: number) =>
    createAPIUrl(`/chat/customers/${customerId}/`, "django"),
  // POST — create a shopper from just an email, so a guest ticket can be
  // attached to a real record and filled in later from Catalog.
  // NOTE: pending confirmation from the backend team.
  createCustomer: () => createAPIUrl("/chat/customers/", "django"),
  fetchOrders: () => createAPIUrl("/chat/orders/", "django"),
  // One customer's stored orders. Read-only — it never calls the commerce
  // platform, so it is the cheap one to reach for.
  fetchCustomerOrders: (customerId: number) =>
    createAPIUrl(`/chat/customers/${customerId}/orders/`, "django"),
  // GET, not POST: refreshing a customer's history from Shopify or Magento
  // and handing it back. The single sync route — the thread-scoped and
  // ticket-scoped ones it replaced both went through the customer anyway.
  syncCustomerOrders: (customerId: number) =>
    createAPIUrl(`/chat/customers/${customerId}/orders/sync/`, "django"),
  fetchOrderDetails: (orderId: number) =>
    createAPIUrl(`/chat/orders/${orderId}/`, "django"),

  // Helpdesk(Support) apis
  fetchSupportTickets: () => createAPIUrl("/support/tickets", "django"),
  // POST — raise a ticket from a live-chat conversation. The counterpart
  // of metaCreateSupportTicket: same fields, same payload, addressed by
  // the thread behind it rather than a social contact.
  createThreadSupportTicket: (threadId: string) =>
    createAPIUrl(
      `/support/threads/${threadId}/create-support-ticket/`,
      "django",
    ),
  // GET — an AI reading of the conversation, as a ticket an agent can edit.
  // Slow (it calls the model), so it is asked for on demand rather than on
  // opening the form.
  threadSupportTicketDraft: (threadId: string) =>
    createAPIUrl(
      `/support/threads/${threadId}/support-ticket/draft/`,
      "django",
    ),
  fetchSupportTicketDeatils: (ticket_id: number) =>
    createAPIUrl(`/support/tickets/${ticket_id}/`, "django"),
  supportTicketMessageSend: (ticket_id: number) =>
    createAPIUrl(`/support/tickets/${ticket_id}/messages/`, "django"),
  fetchSupportTicketTags: () => createAPIUrl("/support/ticket-tags", "django"),
  // PATCH — attach an existing customer to a ticket raised by a guest.
  // NOTE: pending confirmation from the backend team.
  supportTicketCustomerLink: (ticket_id: number) =>
    createAPIUrl(`/support/tickets/${ticket_id}/customer/`, "django"),
  // PATCH — the same for a live chat thread a guest started. A separate
  // route because a thread is not a ticket; the two are different objects
  // with different owners.
  // NOTE: pending confirmation from the backend team.
  threadCustomerLink: (threadId: string) =>
    createAPIUrl(`/chat/threads/${threadId}/customer/`, "django"),
  supportTicketStaffAssign: (ticket_id: number) =>
    createAPIUrl(`/support/tickets/${ticket_id}/assignee/`, "django"),
  supportTicketAgentDraftSave: (ticket_id: number) =>
    createAPIUrl(
      `/support/tickets/${ticket_id}/draft-messages/agent/`,
      "django",
    ),
  supportTicketTagAssign: (ticket_id: number, tag_id: number) =>
    createAPIUrl(
      `/support/tickets/${ticket_id}/tags/${tag_id}/assign/`,
      "django",
    ),
  supportTicketTagRemove: (ticket_id: number, tag_id: number) =>
    createAPIUrl(
      `/support/tickets/${ticket_id}/tags/${tag_id}/remove/`,
      "django",
    ),
  supportMessageImprove: (ticket_id: number) =>
    createAPIUrl(`/support/tickets/${ticket_id}/message/improve/`, "django"),
  supportTicketSnooze: (ticket_id: number) =>
    createAPIUrl(`/support/tickets/${ticket_id}/snooze/`, "django"),
  supportTicketMarkRead: (ticket_id: number) =>
    createAPIUrl(`/support/tickets/${ticket_id}/mark/read/`, "django"),
  ticketTagCreate: () => createAPIUrl("/support/ticket-tags/", "django"),
  ticketTagUpdate: (tag_id: number) =>
    createAPIUrl(`/support/ticket-tags/${tag_id}/`, "django"),
  ticketTagDelete: (tag_id: number) =>
    createAPIUrl(`/support/ticket-tags/${tag_id}/delete/`, "django"),
  supportTicketAIMessageDraftGenerate: (ticket_id: number) =>
    createAPIUrl(`/support/tickets/${ticket_id}/draft-messages/ai/`, "django"),
  supportTicketStatusUpdate: (ticket_id: number) =>
    createAPIUrl(`/support/tickets/${ticket_id}/status/`, "django"),
  supportTicketPriorityUpdate: (ticket_id: number) =>
    createAPIUrl(`/support/tickets/${ticket_id}/priority/`, "django"),
  supportTicketMessagesTranslate: (ticket_id: number) =>
    createAPIUrl(`/support/tickets/${ticket_id}/messages/translate/`, "django"),

  // Helpdesk support ticket websocket (Django)
  supportSocket: (store_code: string, token: string) =>
    createWebSocketUrl(`/support/${store_code}/?token=${token}`),

  // Social AI (Django via useBackend — keep trailing slash). Nested by
  // resource so a response can only carry the relevant scope's data:
  // pages/posts are addressed by their EXTERNAL Graph id; users, comments
  // and messages by their DB id (all come from the parent list responses).
  // `store_code` is a required query param on every call.
  createMetaOAuthUrl: () => `/social/meta/oauth/`,
  fetchSocialAccountsSubscriptions: () =>
    `/social/subscriptions/connected-accounts/`,
  // PATCH — per-account settings (currently the AI auto-reply toggle).
  updateConnectedAccount: ({ accountId }: { accountId: string }) =>
    `/social/subscriptions/connected-accounts/${accountId}/`,
  fetchSocialPosts: ({ accountId }: { accountId: string }) =>
    `/social/meta/pages/${accountId}/posts/`,
  fetchPostComments: ({ postId }: { postId: string }) =>
    `/social/meta/posts/${postId}/comments/`,
  fetchCommentTopics: ({ postId }: { postId: string }) =>
    `/social/meta/posts/${postId}/comments/topics/`,
  fetchSocialUsers: ({ accountId }: { accountId: string }) =>
    `/social/meta/pages/${accountId}/users/`,
  fetchSocialDms: ({
    accountId,
    userId,
  }: {
    accountId: string;
    userId: number;
  }) => `/social/meta/pages/${accountId}/users/${userId}/messages/`,
  // One route, the method is the verb: POST likes, DELETE unlikes — the
  // same shape as hide/unhide.
  likeComment: ({ postId, commentId }: { postId: string; commentId: number }) =>
    `/social/meta/posts/${postId}/comments/${commentId}/like/`,
  hideComment: ({ postId, commentId }: { postId: string; commentId: number }) =>
    `/social/meta/posts/${postId}/comments/${commentId}/hide/`,
  deleteComment: ({
    postId,
    commentId,
  }: {
    postId: string;
    commentId: number;
  }) => `/social/meta/posts/${postId}/comments/${commentId}/delete/`,
  replyComment: ({
    postId,
    commentId,
  }: {
    postId: string;
    commentId: number;
  }) => `/social/meta/posts/${postId}/comments/${commentId}/reply/`,
  replyMessage: ({
    userId,
    messageId,
  }: {
    userId: number;
    messageId: number;
  }) => `/social/meta/users/${userId}/messages/${messageId}/reply/`,
  reactMessage: ({
    userId,
    messageId,
  }: {
    userId: number;
    messageId: number;
  }) => `/social/meta/users/${userId}/messages/${messageId}/react/`,
  // POST — raise a help desk ticket for a DM contact. Addressed by the
  // SocialUser rather than a chat thread: a Messenger conversation has no
  // Thread behind it, which is why the ticket's own thread stays null.
  metaCreateSupportTicket: (userId: number) =>
    `/social/meta/users/${userId}/create-support-ticket/`,
  // The social counterpart of threadSupportTicketDraft. Contacts are
  // page-scoped, so the same shopper on Facebook and on Instagram drafts
  // from two separate conversations.
  metaSupportTicketDraft: (userId: number) =>
    `/social/meta/users/${userId}/support-ticket/draft/`,
};

// Default page size, mirroring DRF's PageNumberPagination.page_size.
export const DEFAULT_API_PAGE_SIZE = 15;

// Chatbot feedback rating choices, mirroring the backend RATING_CHOICES.
export const FEEDBACK_RATINGS = [
  { value: "very_bad", label: "😞 Very Bad" },
  { value: "bad", label: "😕 Bad" },
  { value: "neutral", label: "😐 Neutral" },
  { value: "good", label: "😊 Good" },
  { value: "excellent", label: "😄 Excellent" },
] as const;

export type FeedbackRatingValue = (typeof FEEDBACK_RATINGS)[number]["value"];

export const FEEDBACK_RATING_VALUES: readonly FeedbackRatingValue[] =
  FEEDBACK_RATINGS.map((r) => r.value);

// Define a type for paginated API responses
export type PaginationResponse = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results?: object[];
};

export type ErrorResponse = {
  error: string;
};

// Define a common type for API responses
export type APIResponse = {
  success: boolean;
  message?: string;
  data?: object | object[] | PaginationResponse | ErrorResponse | null;
};

export const SELF_REFERENCE_OPTIONS = [
  {
    value: "i",
    label: '"I"',
    description: "I can help with that",
  },
  {
    value: "we",
    label: '"We"',
    description: "We can help with that",
  },
] as const;

export type ToneSliderDef = {
  key: "warmth" | "formality" | "energy" | "playfulness" | "directness";
  label: string;
  minLabel: string;
  maxLabel: string;
  info: string;
};

export const TONE_SLIDERS: ToneSliderDef[] = [
  {
    key: "warmth",
    label: "Warmth",
    minLabel: "Reserved",
    maxLabel: "Warm",
    info: "How emotionally friendly replies feel. Low keeps it businesslike and neutral; high adds empathy and personal touches.",
  },
  {
    key: "formality",
    label: "Formality",
    minLabel: "Casual",
    maxLabel: "Formal",
    info: "The register of the language. Low sounds like a friend texting; high reads like professional correspondence.",
  },
  {
    key: "energy",
    label: "Energy",
    minLabel: "Calm",
    maxLabel: "Energetic",
    info: "How lively the writing is. Low is calm and measured; high is upbeat with more enthusiasm and momentum.",
  },
  {
    key: "playfulness",
    label: "Playfulness",
    minLabel: "Serious",
    maxLabel: "Playful",
    info: "Room for humor and lightness. Low stays strictly on-task; high allows jokes and playful asides.",
  },
  {
    key: "directness",
    label: "Directness",
    minLabel: "Gentle",
    maxLabel: "Direct",
    info: "How quickly the assistant gets to the point. Low cushions messages softly; high answers first and skips the padding.",
  },
];

export type SelectOption = { value: string; label: string };

/** Option with a one-line explanation of what picking it changes. */
export type DescribedOption = SelectOption & { description: string };

export const ANSWER_LENGTH_CHOICES: readonly DescribedOption[] = [
  {
    value: "concise",
    label: "Concise",
    description: "One or two sentences.",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Balanced, key details.",
  },
  {
    value: "thorough",
    label: "Thorough",
    description: "Full, detailed explanations.",
  },
];

export const EMOJI_POLICY_CHOICES: readonly DescribedOption[] = [
  { value: "none", label: "None", description: "Avoids emojis." },
  {
    value: "sparing",
    label: "Sparing",
    description: "Rare, only when fitting.",
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "Occasional, adds warmth.",
  },
  {
    value: "liberal",
    label: "Liberal",
    description: "In most replies.",
  },
  {
    value: "free",
    label: "Free",
    description: "Whenever natural.",
  },
];

export const EXCLAMATION_POLICY_CHOICES: readonly DescribedOption[] = [
  {
    value: "none",
    label: "None",
    description: "Avoids exclamation marks.",
  },
  {
    value: "sparing",
    label: "Sparing",
    description: "Big moments only.",
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "Occasional friendly emphasis.",
  },
  {
    value: "liberal",
    label: "Liberal",
    description: "Frequent excitement!",
  },
  {
    value: "free",
    label: "Free",
    description: "Unrestricted!",
  },
];

export const REGIONAL_SPELLING_CHOICES: readonly DescribedOption[] = [
  {
    value: "uk",
    label: "UK",
    description: "“Colour”, “organise”.",
  },
  {
    value: "us",
    label: "US",
    description: "“Color”, “organize”.",
  },
  {
    value: "auto",
    label: "Auto",
    description: "Matches each customer.",
  },
];

export const SocialAIPlatformOptions: {
  readonly [key: string]: { label: string; icon: Icon; color: string };
} = {
  facebook: {
    label: "Facebook",
    icon: IconBrandFacebook,
    color: "text-[#1877F2]",
  },
  instagram: {
    label: "Instagram",
    icon: IconBrandInstagram,
    color: "text-[#E4405F]",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: IconBrandWhatsapp,
    color: "text-[#25D366]",
  },
};

export const StatusBadges: {
  readonly [key: string]: { label: string; bg: string; text: string };
} = {
  active: {
    label: "Active",
    bg: "bg-green-100",
    text: "text-green-800",
  },
};
