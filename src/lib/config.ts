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

  // Store Management
  fetchStoresList: () => "/store/list/",

  // Dashboard Analytics
  fetchFeedbackInsights: () => "/analytics/feedback-insights/",
  fetchConversationData: () => "/analytics/conversion/",
  fetchEngagementData: () => "/analytics/engagements/",
  fetchOperationalEfficiencyData: () => "/analytics/operational-efficiency/",
  fetchUserMatrix: () => "/analytics/user-matrix/",
  fetchConversaionRateData: () => "/analytics/conversion-rate/",
  fetchQueryCategoryInsights: () => "/analytics/query-category-insights/",
  fetchConversationHistory: () => "/analytics/chat-history/",

  // Thread-level Analytics
  fetchThreads: () => "/analytics/threads/",
  fetchThreadDetails: (threadId: string) => `/analytics/threads/${threadId}/`,
  fetchUserMetadata: (threadId: string) =>
    `/analytics/threads/${threadId}/user-metadata/`,
  fetchConversationSummary: (threadId: string) =>
    `/analytics/threads/${threadId}/summary/`,
  fetchFeedbackSequence: (threadId: string) =>
    `/analytics/threads/${threadId}/feedback-sequence/`,
  fetchTags: (threadId: string) => `/analytics/threads/${threadId}/tags/`,
  fetchAIInsight: (threadId: string) =>
    `/analytics/threads/${threadId}/ai-insights/`,
  fetchCartData: (threadId: string) =>
    `/analytics/threads/${threadId}/cart-data/`,
  fetchFreshdeskTicketId: (threadId: string) =>
    `/support/threads/${threadId}/tickets/`,

  // Chatbot Customization
  widgetCustomization: (storeId: number) =>
    `/store/widget-customization/${storeId}/`,

  // Knowledge Base Management
  fetchLibraryDocuments: () => `/knowledge/library-documents/`,
  uploadLibraryDocument: () => `/knowledge/library-documents/`,
  fetchStoreFaqs: () => `/knowledge/store-faqs/`,
  createStoreFaq: () => `/knowledge/store-faqs/`,
  updateStoreFaq: (id: number) => `/knowledge/store-faqs/${id}/`,
  deleteStoreFaq: (id: number) => `/knowledge/store-faqs/${id}/`,
  fetchScrapeLinkTypes: () => `/knowledge/scrape-links/types`,
  createScrapeLink: () => `/knowledge/scrape-links/`,
  fetchScrapeLink: () => `/knowledge/scrape-links/`,
};

// Default page size, mirroring DRF's PageNumberPagination.page_size.
export const DEFAULT_API_PAGE_SIZE = 15;

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
