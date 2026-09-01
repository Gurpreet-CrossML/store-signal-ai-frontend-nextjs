import type {
  AIKnowledgeScopeConfig,
  GroundingSettings,
  KnowledgeItem,
  RagSettings,
  RetrievalSettings,
  TestConsoleResult,
} from "@/redux/api-slice/knowledge-rag-slice";

/**
 * In-memory stand-in for the future RAG backend. Every "write" here mutates
 * these module-level arrays so the UI behaves like a real session (add an
 * item, see it in the list; toggle status, see it flip) without a server.
 * Swapping a thunk in knowledge-rag-slice.tsx from calling these functions
 * to calling axiosInstance is the entire migration — components never know
 * the difference.
 */

export function delay<T>(value: T, ms = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number): string {
  return hoursAgo(days * 24);
}

function daysFromNow(days: number): string {
  return hoursAgo(-days * 24);
}

let itemIdCounter = 100;
function generateId(prefix: string): string {
  itemIdCounter += 1;
  return `${prefix}-${itemIdCounter}`;
}

export const MOCK_KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    id: "k1",
    type: "general",
    source: "text",
    title: "Store Hours & Contact Information",
    status: "completed",
    aiScope: ["sales", "support", "social", "internal"],
    tags: ["store-info"],
    content:
      "Our store is open Monday–Saturday, 10am–8pm IST. Customer support is reachable at support@example-store.com or via live chat during business hours.",
    createdAt: daysAgo(60),
    updatedAt: hoursAgo(2),
  },
  {
    id: "k2",
    type: "general",
    source: "text",
    title: "About Our Brand",
    status: "completed",
    aiScope: ["sales", "social"],
    tags: ["brand"],
    content:
      "Founded in 2015, we design everyday essentials with a focus on sustainable materials and honest pricing. Every product is tested in-house before it ships.",
    createdAt: daysAgo(120),
    updatedAt: daysAgo(14),
  },
  {
    id: "k3",
    type: "product",
    source: "file",
    title: "Nike Air Max 270 Care Guide",
    status: "processing",
    aiScope: ["sales", "support"],
    tags: ["care", "pdf"],
    productId: "p1",
    productName: "Nike Air Max 270",
    fileName: "air-max-270-care-guide.pdf",
    fileType: "pdf",
    fileSize: 482_000,
    createdAt: hoursAgo(1),
    updatedAt: hoursAgo(1),
  },
  {
    id: "k4",
    type: "product",
    source: "text",
    title: "Wireless Headphones — Pairing Instructions",
    status: "completed",
    aiScope: ["sales", "support"],
    tags: ["setup"],
    productId: "p4",
    productName: "Wireless Noise-Cancelling Headphones",
    content:
      "Hold the power button for 3 seconds until the LED flashes blue, then select the headphones from your device's Bluetooth menu. Pairing mode stays active for 60 seconds.",
    createdAt: daysAgo(30),
    updatedAt: daysAgo(5),
  },
  {
    id: "k5",
    type: "product",
    source: "text",
    title: "Merino Wool Socks — Warranty Information",
    status: "completed",
    aiScope: ["support"],
    tags: ["warranty"],
    productId: "p7",
    productName: "Merino Wool Crew Socks (3-Pack)",
    content:
      "Covered against manufacturing defects for 6 months from delivery. Normal wear, pilling, and damage from improper washing are not covered.",
    createdAt: daysAgo(45),
    updatedAt: daysAgo(45),
  },
  // {
  //   id: "k6",
  //   type: "category",
  //   source: "text",
  //   title: "Running Shoe Buying Guide",
  //   status: "active",
  //   aiScope: ["sales", "social"],
  //   tags: ["guide"],
  //   categoryIds: ["c1"],
  //   categoryNames: ["Running Shoes"],
  //   content:
  //     "Neutral runners suit most people; overpronators should look for stability shoes. Measure feet in the evening, when they're at their largest, and leave a thumb's width at the toe.",
  //   createdAt: daysAgo(90),
  //   updatedAt: daysAgo(20),
  // },
  // {
  //   id: "k7",
  //   type: "category",
  //   source: "file",
  //   title: "Kitchenware Care & Cleaning Guide",
  //   status: "failed",
  //   aiScope: ["support"],
  //   tags: ["care"],
  //   categoryIds: ["c6"],
  //   categoryNames: ["Kitchenware"],
  //   fileName: "kitchenware-care.docx",
  //   fileType: "docx",
  //   fileSize: 156_000,
  //   processingError:
  //     "Could not extract text from page 4 — the file may be corrupted or password protected.",
  //   createdAt: daysAgo(3),
  //   updatedAt: daysAgo(3),
  // },
  // {
  //   id: "k8",
  //   type: "faq",
  //   source: "faq",
  //   title: "Do you offer free shipping?",
  //   status: "active",
  //   aiScope: ["sales", "support", "social"],
  //   tags: ["shipping"],
  //   question: "Do you offer free shipping?",
  //   answer: "Yes, orders above ₹999 qualify for free standard shipping.",
  //   createdAt: daysAgo(75),
  //   updatedAt: daysAgo(10),
  // },
  // {
  //   id: "k9",
  //   type: "faq",
  //   source: "faq",
  //   title: "How do I track my order?",
  //   status: "active",
  //   aiScope: ["support"],
  //   tags: ["orders"],
  //   question: "How do I track my order?",
  //   answer:
  //     "You'll receive a tracking link by email once your order ships. You can also find it under Account > Orders.",
  //   createdAt: daysAgo(75),
  //   updatedAt: daysAgo(10),
  // },
  // {
  //   id: "k10",
  //   type: "faq",
  //   source: "faq",
  //   title: "Can I change my shipping address after placing an order?",
  //   status: "disabled",
  //   aiScope: ["support"],
  //   tags: ["orders"],
  //   question: "Can I change my shipping address after placing an order?",
  //   answer:
  //     "Address changes are only possible before an order ships — contact support immediately if you need to update it.",
  //   createdAt: daysAgo(75),
  //   updatedAt: daysAgo(40),
  // },
  // {
  //   id: "k11",
  //   type: "policy",
  //   source: "url",
  //   title: "Return Policy",
  //   status: "active",
  //   aiScope: ["sales", "support"],
  //   tags: ["policy"],
  //   url: "https://example-store.com/policies/returns",
  //   policyType: "return",
  //   syncFrequency: "weekly",
  //   lastSyncedAt: daysAgo(2),
  //   nextSyncAt: daysFromNow(5),
  //   createdAt: daysAgo(150),
  //   updatedAt: daysAgo(2),
  // },
  // {
  //   id: "k12",
  //   type: "policy",
  //   source: "url",
  //   title: "Shipping Policy",
  //   status: "syncing",
  //   aiScope: ["support"],
  //   tags: ["policy"],
  //   url: "https://example-store.com/policies/shipping",
  //   policyType: "shipping",
  //   syncFrequency: "daily",
  //   lastSyncedAt: hoursAgo(20),
  //   nextSyncAt: hoursAgo(-4),
  //   createdAt: daysAgo(150),
  //   updatedAt: hoursAgo(20),
  // },
  // {
  //   id: "k13",
  //   type: "policy",
  //   source: "url",
  //   title: "Privacy Policy",
  //   status: "active",
  //   aiScope: ["internal"],
  //   tags: ["policy", "legal"],
  //   url: "https://example-store.com/policies/privacy",
  //   policyType: "privacy",
  //   syncFrequency: "manual",
  //   lastSyncedAt: daysAgo(30),
  //   nextSyncAt: null,
  //   createdAt: daysAgo(150),
  //   updatedAt: daysAgo(30),
  // },
  // {
  //   id: "k14",
  //   type: "document",
  //   source: "file",
  //   title: "Escalation & Exception SOP",
  //   status: "active",
  //   aiScope: ["internal"],
  //   tags: ["sop", "internal"],
  //   fileName: "escalation-sop.pdf",
  //   fileType: "pdf",
  //   fileSize: 210_000,
  //   lastProcessedAt: daysAgo(14),
  //   createdAt: daysAgo(14),
  //   updatedAt: daysAgo(14),
  // },
  // {
  //   id: "k15",
  //   type: "google_drive",
  //   source: "google_drive",
  //   title: "Vendor Compliance Checklist",
  //   status: "active",
  //   aiScope: ["internal"],
  //   tags: ["vendor"],
  //   driveUrl: "https://drive.google.com/file/d/1a2b3c4d5e6f/view",
  //   fileName: "vendor-compliance-checklist.docx",
  //   fileType: "docx",
  //   lastSyncedAt: daysAgo(7),
  //   createdAt: daysAgo(60),
  //   updatedAt: daysAgo(7),
  // },
  // {
  //   id: "k16",
  //   type: "offer",
  //   source: "offer",
  //   title: "Festive Season Sale",
  //   status: "active",
  //   aiScope: ["sales", "social"],
  //   tags: ["promo"],
  //   offerName: "Festive Season Sale",
  //   couponCode: "FESTIVE20",
  //   startDate: daysAgo(5),
  //   endDate: daysFromNow(25),
  //   conditions: "20% off storewide. Cannot be combined with other offers.",
  //   createdAt: daysAgo(5),
  //   updatedAt: daysAgo(5),
  // },
  // {
  //   id: "k17",
  //   type: "offer",
  //   source: "offer",
  //   title: "New Customer Welcome Discount",
  //   status: "disabled",
  //   aiScope: ["sales"],
  //   tags: ["promo"],
  //   offerName: "Welcome10",
  //   couponCode: "WELCOME10",
  //   startDate: daysAgo(200),
  //   endDate: daysAgo(1),
  //   conditions: "10% off a customer's first order. One use per customer.",
  //   createdAt: daysAgo(200),
  //   updatedAt: daysAgo(1),
  // },
];

export const DEFAULT_RETRIEVAL_SETTINGS: RetrievalSettings = {
  similarityThreshold: 0.75,
  topK: 5,
  minMatchingScore: 0.6,
  hybridSearchEnabled: true,
  rerankingEnabled: true,
  rerankingThreshold: 0.5,
};

export const DEFAULT_GROUNDING_SETTINGS: GroundingSettings = {
  mode: "balanced",
  unsupportedAnswerPolicy: "limited_inference",
};

export const DEFAULT_AI_KNOWLEDGE_SCOPE: AIKnowledgeScopeConfig = {
  sales: ["general", "product"],
  support: ["general", "product"],
  social: ["general", "product"],
  internal: ["general"],
};

let ragSettingsState: RagSettings = {
  retrieval: { ...DEFAULT_RETRIEVAL_SETTINGS },
  grounding: { ...DEFAULT_GROUNDING_SETTINGS },
};

let aiKnowledgeScopeState: AIKnowledgeScopeConfig = {
  sales: [...DEFAULT_AI_KNOWLEDGE_SCOPE.sales],
  support: [...DEFAULT_AI_KNOWLEDGE_SCOPE.support],
  social: [...DEFAULT_AI_KNOWLEDGE_SCOPE.social],
  internal: [...DEFAULT_AI_KNOWLEDGE_SCOPE.internal],
};

// --- Knowledge items -------------------------------------------------

export function listKnowledgeItems(): KnowledgeItem[] {
  return [...MOCK_KNOWLEDGE_ITEMS].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function createKnowledgeItem(
  input: Omit<KnowledgeItem, "id" | "createdAt" | "updatedAt">,
): KnowledgeItem {
  const now = new Date().toISOString();
  const item: KnowledgeItem = {
    ...input,
    id: generateId("k"),
    createdAt: now,
    updatedAt: now,
  };
  MOCK_KNOWLEDGE_ITEMS.unshift(item);
  return item;
}

export function updateKnowledgeItem(
  id: string,
  patch: Partial<Omit<KnowledgeItem, "id" | "createdAt">>,
): KnowledgeItem {
  const index = MOCK_KNOWLEDGE_ITEMS.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Knowledge item not found");
  const updated: KnowledgeItem = {
    ...MOCK_KNOWLEDGE_ITEMS[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  MOCK_KNOWLEDGE_ITEMS[index] = updated;
  return updated;
}

export function deleteKnowledgeItem(id: string): void {
  const index = MOCK_KNOWLEDGE_ITEMS.findIndex((item) => item.id === id);
  if (index !== -1) MOCK_KNOWLEDGE_ITEMS.splice(index, 1);
}

export function setKnowledgeItemStatus(
  id: string,
  status: KnowledgeItem["status"],
): KnowledgeItem {
  return updateKnowledgeItem(id, { status });
}

export function retryKnowledgeItemProcessing(id: string): KnowledgeItem {
  return updateKnowledgeItem(id, {
    status: "completed",
    processingError: null,
  });
}

// --- Retrieval, grounding & AI knowledge scope settings -------------

export function getRagSettings(): RagSettings {
  return {
    retrieval: { ...ragSettingsState.retrieval },
    grounding: { ...ragSettingsState.grounding },
  };
}

export function saveRagSettings(next: RagSettings): RagSettings {
  ragSettingsState = {
    retrieval: { ...next.retrieval },
    grounding: { ...next.grounding },
  };
  return getRagSettings();
}

export function getAIKnowledgeScope(): AIKnowledgeScopeConfig {
  return {
    sales: [...aiKnowledgeScopeState.sales],
    support: [...aiKnowledgeScopeState.support],
    social: [...aiKnowledgeScopeState.social],
    internal: [...aiKnowledgeScopeState.internal],
  };
}

export function saveAIKnowledgeScope(
  next: AIKnowledgeScopeConfig,
): AIKnowledgeScopeConfig {
  aiKnowledgeScopeState = {
    sales: [...next.sales],
    support: [...next.support],
    social: [...next.social],
    internal: [...next.internal],
  };
  return getAIKnowledgeScope();
}

// --- Test Console -----------------------------------------------------

type TestScenario = {
  keywords: string[];
  itemIds: string[];
  scores: Record<
    string,
    { similarity: number; matching: number; reranking: number }
  >;
  excerpts: Record<string, string>;
  answer: string;
};

const TEST_SCENARIOS: TestScenario[] = [
  {
    keywords: ["return", "refund", "30 days", "send back"],
    itemIds: ["k11", "k9"],
    scores: {
      k11: { similarity: 0.91, matching: 0.89, reranking: 0.93 },
      k9: { similarity: 0.58, matching: 0.52, reranking: 0.49 },
    },
    excerpts: {
      k11: "Items can be returned within 30 days of delivery in their original condition for a full refund.",
      k9: "You'll receive a tracking link by email once your order ships.",
    },
    answer:
      "Yes — you can return a product within 30 days of delivery as long as it's in its original condition. Refunds are issued to your original payment method once the return is received and inspected.",
  },
  {
    keywords: ["shipping", "free shipping", "delivery cost"],
    itemIds: ["k8", "k12"],
    scores: {
      k8: { similarity: 0.95, matching: 0.94, reranking: 0.96 },
      k12: { similarity: 0.63, matching: 0.6, reranking: 0.58 },
    },
    excerpts: {
      k8: "Yes, orders above ₹999 qualify for free standard shipping.",
      k12: "Standard shipping takes 3–5 business days after your order ships.",
    },
    answer:
      "Orders above ₹999 ship for free. Below that, standard shipping charges apply at checkout based on your delivery address.",
  },
  {
    keywords: ["headphone", "pair", "bluetooth", "connect"],
    itemIds: ["k4"],
    scores: {
      k4: { similarity: 0.88, matching: 0.85, reranking: 0.87 },
    },
    excerpts: {
      k4: "Hold the power button for 3 seconds until the LED flashes blue, then select the headphones from your device's Bluetooth menu.",
    },
    answer:
      "Hold the power button on the headphones for 3 seconds until the LED flashes blue, then choose them from your device's Bluetooth settings. Pairing mode stays open for 60 seconds.",
  },
  {
    keywords: ["running shoe", "size", "fit"],
    itemIds: ["k6"],
    scores: {
      k6: { similarity: 0.86, matching: 0.82, reranking: 0.84 },
    },
    excerpts: {
      k6: "Measure feet in the evening, when they're at their largest, and leave a thumb's width at the toe.",
    },
    answer:
      "For the best fit, measure your feet in the evening (when they're largest) and leave about a thumb's width of space at the toe. Neutral runners suit most people; if your shoes wear unevenly, a stability shoe may fit better.",
  },
];

function scoreAboveThreshold(
  score: { similarity: number },
  minMatchingScore: number,
): boolean {
  return score.similarity >= minMatchingScore;
}

export function runTestQuery(input: {
  query: string;
  aiScope: TestConsoleResult["aiScope"];
  knowledgeScope: TestConsoleResult["knowledgeScope"];
}): TestConsoleResult {
  const settings = getRagSettings();
  const q = input.query.trim().toLowerCase();

  const scenario = TEST_SCENARIOS.find((candidate) =>
    candidate.keywords.some((keyword) => q.includes(keyword)),
  );

  if (!scenario) {
    return {
      query: input.query,
      aiScope: input.aiScope,
      knowledgeScope: input.knowledgeScope,
      retrievedSources: [],
      finalContext: "",
      generatedAnswer: "",
      grounded: false,
      fallbackReason:
        "No knowledge source cleared the minimum matching score threshold. This question would escalate to a human — consider adding a source for it in the Knowledge Library.",
    };
  }

  const retrievedSources = scenario.itemIds
    .map((itemId) => {
      const item = MOCK_KNOWLEDGE_ITEMS.find((entry) => entry.id === itemId);
      const score = scenario.scores[itemId];
      if (!item || !score) return null;
      return {
        knowledgeItemId: item.id,
        title: item.title,
        type: item.type,
        similarityScore: score.similarity,
        matchingScore: score.matching,
        rerankingScore: settings.retrieval.rerankingEnabled
          ? score.reranking
          : undefined,
        excerpt: scenario.excerpts[itemId] ?? "",
      };
    })
    .filter((source): source is NonNullable<typeof source> => source !== null)
    .filter((source) =>
      scoreAboveThreshold(
        { similarity: source.similarityScore },
        settings.retrieval.minMatchingScore,
      ),
    )
    .slice(0, settings.retrieval.topK);

  if (retrievedSources.length === 0) {
    return {
      query: input.query,
      aiScope: input.aiScope,
      knowledgeScope: input.knowledgeScope,
      retrievedSources: [],
      finalContext: "",
      generatedAnswer: "",
      grounded: false,
      fallbackReason:
        "Matching sources were found, but none cleared the current minimum matching score threshold. Try lowering the threshold in Retrieval & Matching, or add a stronger source.",
    };
  }

  return {
    query: input.query,
    aiScope: input.aiScope,
    knowledgeScope: input.knowledgeScope,
    retrievedSources,
    finalContext: retrievedSources.map((source) => source.excerpt).join("\n\n"),
    generatedAnswer: scenario.answer,
    grounded: true,
  };
}
