const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000";

export function createAPIUrl(path?: string) {
    const baseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
    const formattedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
    return `${baseUrl}/api${formattedPath}`;
}

export const ENDPOINTS = {
    login: () => createAPIUrl("/auth/login/"),

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
    fetchUserMetadata: (threadId: string) => `/analytics/threads/${threadId}/user-metadata/`,
    fetchConversationSummary: (threadId: string) => `/analytics/threads/${threadId}/summary/`,
    fetchFeedbackSequence: (threadId: string) => `/analytics/threads/${threadId}/feedback-sequence/`,
    fetchTags: (threadId: string) => `/analytics/threads/${threadId}/tags/`,
    fetchAIInsight: (threadId: string) => `/analytics/threads/${threadId}/ai-insights/`,
    fetchCartData: (threadId: string) => `/analytics/threads/${threadId}/cart-data/`,
    fetchFreshdeskTicketId: (threadId: string) => `/support/threads/${threadId}/tickets/`,

    // Chatbot Customization
    widgetCustomization: (storeId: number) => `/store/widget-customization/${storeId}/`,

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
}