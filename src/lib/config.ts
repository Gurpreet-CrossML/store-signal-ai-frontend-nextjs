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

  // Image upload (Django) — POST multipart/form-data to this endpoint, then
  // use the returned URL in a message payload.
  uploadAttachments: () =>
    createAPIUrl("/support/attachments/upload/", "django"),

  // Customer Orders Sync (Django) — POST
  syncOrders: (threadId: string) =>
    createAPIUrl(`/chat/threads/${threadId}/orders/sync/`, "django"),

  // Company & staff management (Django /api/tenancy/). These are Django-owned;
  // GET calls must pass `useBackend: true` (writes auto-route to Django).
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
  fetchAIUsage: () => "/analytics/ai-usage",

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
  fetchAIInsight: (threadId: string) =>
    `/analytics/threads/${threadId}/ai-insights`,
  fetchCartData: (threadId: string) =>
    `/analytics/threads/${threadId}/cart-data`,
  fetchFreshdeskTicketId: (threadId: string) =>
    `/support/threads/${threadId}/tickets`,
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

  // Helpdesk(Support) apis
  fetchSupportTickets: () => createAPIUrl("/support/tickets", "django"),
  fetchSupportTicketDeatils: (ticket_id: number) =>
    createAPIUrl(`/support/tickets/${ticket_id}/`, "django"),
  supportTicketMessageSend: (ticket_id: number) =>
    createAPIUrl(`/support/tickets/${ticket_id}/messages/`, "django"),
  fetchSupportTicketTags: () => createAPIUrl("/support/ticket-tags", "django"),
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
  supportTicketCustomerOrderSync: (ticket_id: number) =>
    createAPIUrl(
      `/support/tickets/${ticket_id}/customer/order-sync/`,
      "django",
    ),
  supportTicketStatusUpdate: (ticket_id: number) =>
    createAPIUrl(`/support/tickets/${ticket_id}/status/`, "django"),
  supportTicketPriorityUpdate: (ticket_id: number) =>
    createAPIUrl(`/support/tickets/${ticket_id}/priority/`, "django"),
  supportTicketMessagesTranslate: (ticket_id: number) =>
    createAPIUrl(`/support/tickets/${ticket_id}/messages/translate/`, "django"),

  // Helpdesk support ticket websocket (Django)
  supportSocket: (store_code: string, token: string) =>
    createWebSocketUrl(`/support/${store_code}/?token=${token}`),
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
};

export const TONE_SLIDERS: ToneSliderDef[] = [
  { key: "warmth", label: "Warmth", minLabel: "Reserved", maxLabel: "Warm" },
  {
    key: "formality",
    label: "Formality",
    minLabel: "Casual",
    maxLabel: "Formal",
  },
  { key: "energy", label: "Energy", minLabel: "Calm", maxLabel: "Energetic" },
  {
    key: "playfulness",
    label: "Playfulness",
    minLabel: "Serious",
    maxLabel: "Playful",
  },
  {
    key: "directness",
    label: "Directness",
    minLabel: "Gentle",
    maxLabel: "Direct",
  },
];

export type SelectOption = { value: string; label: string };

export const ANSWER_LENGTH_OPTIONS: readonly SelectOption[] = [
  { value: "concise", label: "Concise" },
  { value: "standard", label: "Standard" },
  { value: "thorough", label: "Thorough" },
];

export const FREQUENCY_OPTIONS: readonly SelectOption[] = [
  { value: "none", label: "None" },
  { value: "sparing", label: "Sparing" },
  { value: "moderate", label: "Moderate" },
  { value: "liberal", label: "Liberal" },
  { value: "free", label: "Free" },
];

export const SPELLING_OPTIONS: readonly SelectOption[] = [
  { value: "uk", label: "UK" },
  { value: "us", label: "US" },
  { value: "auto", label: "Auto" },
];
