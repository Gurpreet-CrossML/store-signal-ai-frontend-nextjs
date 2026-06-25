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

export const ENDPOINTS = {
  login: () => createAPIUrl("/auth/login/", "django"),

  // Auth/session (Django) — token lifecycle + identity.
  refreshToken: () => createAPIUrl("/auth/token/refresh/", "django"),
  verifyToken: () => createAPIUrl("/auth/token/verify/", "django"),
  logout: () => createAPIUrl("/auth/logout/", "django"),
  profile: () => createAPIUrl("/auth/profile/", "django"),

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

  // Chatbot Customization (Django via useBackend — keep trailing slash).
  widgetCustomization: (storeId: number) =>
    `/store/widget-customization/${storeId}/`,

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
