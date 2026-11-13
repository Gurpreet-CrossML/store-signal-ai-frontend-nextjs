import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { axiosInstance } from "@/redux/axios-config";
import { ENDPOINTS } from "@/lib/config";
import { toPaginatedList } from "@/lib/helpers";

// --- Types ------------------------------------------------------------
// Kept flat (rather than a discriminated union) because the Add/Edit form
// switches across all 8 types dynamically and shares most trailing fields
// (AI scope, tags, status) — a union would force per-type form components
// for little benefit here. Colocated with the thunks, matching every other
// slice in this codebase (no separate `types/` folder exists anywhere).

export type KnowledgeType = "general" | "product";
// | "category"
// | "faq"
// | "policy"
// | "document"
// | "google_drive"
// | "offer";

export type KnowledgeSource =
  | "article"
  | "file"
  | "url"
  | "google_drive"
  | "product"
  | "category"
  | "faq"
  | "offer";

// Mirrors the backend's KnowledgeStatus choices exactly (knowledge/models.py).
// There is no "active"/"disabled" status on the backend. A new item is a
// "draft" (never processed); publishing it queues it ("pending" ->
// "processing") and "published" is the terminal success state. Status is
// terminal success state, and status is read-only (not settable via the API).
export type KnowledgeStatus =
  | "draft"
  | "published"
  | "pending"
  | "processing"
  | "failed";

export type AIScope = "sales" | "support" | "social" | "internal";

export type PolicyType =
  | "privacy_policy"
  | "terms_conditions"
  | "return_policy"
  | "shipping_policy"
  | "cookie_policy"
  | "contact_us"
  | "about_us"
  | "faq"
  | "blog"
  | "careers"
  | "size_guide"
  | "generic_link"
  | "cancellation_policy"
  | "terms_of_service"
  | "refund_policy"
  | "data_protection_policy";

export type SyncFrequency = "daily" | "weekly" | "manual";

export type KnowledgeItem = {
  id: string;
  type: KnowledgeType;
  source: KnowledgeSource;
  title: string;
  status: KnowledgeStatus;
  aiScope: AIScope[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  /** Name of the user who last edited the item; unset if never edited by a user. */
  updatedBy?: string;
  /** Name of the user who added the item; unset for items that predate tracking. */
  createdBy?: string;
  /** A published article was edited after it went live; the assistant still
   * uses the version that was published, until the changes are published. */
  hasUnpublishedChanges?: boolean;

  // General knowledge
  content?: string;
  category?: string;

  // Product/category/collection associations (many-to-many; an item can
  // hold any number of each, independent of the legacy `productId` shape
  // this replaced).
  products?: ProductOption[];
  categories?: ProductOption[];
  collections?: ProductOption[];

  // Category knowledge
  categoryIds?: string[];
  categoryNames?: string[];

  // FAQ
  question?: string;
  answer?: string;

  // Policy / URL
  url?: string;
  policyType?: PolicyType;
  syncFrequency?: SyncFrequency;
  lastSyncedAt?: string | null;
  nextSyncAt?: string | null;

  // Uploaded document / Google Drive
  fileName?: string;
  /** The stored file's URL — its original filename isn't exposed by the API. */
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  processingError?: string | null;
  lastProcessedAt?: string | null;

  // Google Drive
  driveUrl?: string;

  // Offer / coupon
  offerName?: string;
  couponCode?: string;
  startDate?: string;
  endDate?: string;
  conditions?: string;
};

export type ProductOption = {
  id: string;
  name: string;
};

/** Vector storage in bytes: what a store uses in total, its plan's limit, and the split by kind. */
export type KnowledgeVectorStorage = {
  total: number;
  limit: number;
  remaining: number;
  products: number;
  documents: number;
  urls: number;
  faqs: number;
  articles: number;
};

export type KnowledgeCounts = {
  products: number;
  knowledge_items: number;
  documents: number;
  urls: number;
  faqs: number;
  articles: number;
  /** Items that failed to process and need attention. */
  failed: number;
};

/** A user who has added knowledge, for the "Added by" filter. */
export type KnowledgeCreator = {
  id: number;
  name: string;
};

export type KnowledgeStats = {
  vector_storage: KnowledgeVectorStorage;
  counts: KnowledgeCounts;
  creators: KnowledgeCreator[];
};

export type KnowledgeItemListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: KnowledgeItem[];
};

// --- Knowledge item API mapping -----------------------------------------
// The Django serializer speaks snake_case and never returns a `store` field
// (it's resolved server-side from `?store_code=`, never part of the
// payload). These helpers are the only place that translates between that
// wire shape and the camelCase `KnowledgeItem` domain type used everywhere
// else in this feature.

// Matches KnowledgeItemSerializer.Meta.fields exactly (knowledge/serializers.py).
// Note: `file_name` is on the model and accepted on create (source=file), but
// the read serializer doesn't return it, so a file item's original filename
// can't be read back — only `file` (the stored file's URL), `file_type`, and
// `file_size` are. `product` is the product's name string (or null), not its
// id — the id isn't exposed on read either.
type ApiKnowledgeItem = {
  id: number;
  type: KnowledgeType;
  source: KnowledgeSource;
  title: string;
  status: KnowledgeStatus;
  ai_scope: AIScope[];
  tags: string[];
  category: string;
  content: string;
  question: string;
  answer: string;
  products: ProductOption[];
  categories: ProductOption[];
  collections: ProductOption[];
  url: string;
  file: string | null;
  file_name: string;
  file_type: string;
  file_size: number | null;
  /** Who last edited the item, from the backend's audit metadata. */
  updated_by: { name: string; username: string } | null;
  created_by: { name: string; username: string } | null;
  has_unpublished_changes?: boolean;
  created_at: string;
  updated_at: string;
};

function mapApiKnowledgeItem(api: ApiKnowledgeItem): KnowledgeItem {
  return {
    id: String(api.id),
    type: api.type,
    source: api.source,
    title: api.title,
    status: api.status,
    aiScope: api.ai_scope ?? [],
    tags: api.tags ?? [],
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    updatedBy: api.updated_by?.name || api.updated_by?.username || undefined,
    createdBy: api.created_by?.name || api.created_by?.username || undefined,
    hasUnpublishedChanges: api.has_unpublished_changes || undefined,
    content: api.content || undefined,
    category: api.category || undefined,
    products: api.products ?? [],
    categories: api.categories ?? [],
    collections: api.collections ?? [],
    question: api.question || undefined,
    answer: api.answer || undefined,
    url: api.url || undefined,
    fileUrl: api.file || undefined,
    fileName: api.file_name || undefined,
    fileType: api.file_type || undefined,
    fileSize: api.file_size ?? undefined,
  };
}

type KnowledgeItemWritableInput = {
  type: KnowledgeType;
  source: KnowledgeSource;
  title?: string;
  aiScope: AIScope[];
  content?: string;
  question?: string;
  answer?: string;
  url?: string;
  /** The raw file being uploaded — only present for `source: "file"`. */
  file?: File;
  /** The products, categories and collections an item applies to. Left out
   * of the request when unset, so an edit that doesn't touch them keeps them. */
  productIds?: string[];
  categoryIds?: string[];
  collectionIds?: string[];
};

/** Builds a multipart body when a file is attached, otherwise a plain JSON body.
 *
 * Only sends fields the backend's per-source serializers actually accept
 * (knowledge/serializers.py): type/source/title/ai_scope always, plus
 * url|file|content|question+answer depending on `source`. `tags` isn't
 * writable on any of them, so it's never sent. Used only by
 * `UpdateKnowledgeItem` (the AI-scope/FAQ-only Edit flow) — product/
 * category/collection associations aren't editable there, so this never
 * needs to send them.
 */
function buildKnowledgeItemPayload(
  input: KnowledgeItemWritableInput,
): FormData | Record<string, unknown> {
  if (input.file) {
    const formData = new FormData();
    formData.append("type", input.type);
    formData.append("source", input.source);
    if (input.title) formData.append("title", input.title);
    input.aiScope.forEach((scope) => formData.append("ai_scope", scope));
    formData.append("file", input.file);
    return formData;
  }

  return {
    type: input.type,
    source: input.source,
    title: input.title,
    ai_scope: input.aiScope,
    content: input.content,
    question: input.question,
    answer: input.answer,
    url: input.url,
    products: input.productIds,
    categories: input.categoryIds,
    collections: input.collectionIds,
  };
}

// --- Thunks -------------------------------------------------------------
// Knowledge items are backed by the real Django `/api/knowledge/knowledge-items/`
// endpoints. Reads go through `useBackend: true` (not ported to a local API
// route); writes hit Django by axios-config's default routing.

export const FetchKnowledgeItems = createAsyncThunk(
  "FetchKnowledgeItems",
  async (
    {
      storeCode,
      page = 1,
      pageSize = 25,
      search = "",
      type = [],
      source,
      status = [],
      aiScope = [],
      createdBy = [],
    }: {
      storeCode: string;
      page?: number;
      pageSize?: number;
      search?: string;
      /** Each filter keeps an item that matches any of its values. */
      type?: KnowledgeType[];
      source?: KnowledgeSource;
      status?: KnowledgeStatus[];
      aiScope?: AIScope[];
      /** Ids of the users who added the items. */
      createdBy?: string[];
    },
    thunkAPI,
  ) => {
    try {
      const params = new URLSearchParams({
        store_code: storeCode,
        page: String(page),
        page_size: String(pageSize),
      });
      if (search.trim()) params.set("search", search.trim());
      if (source) params.set("source", source);
      // The API takes several values for one filter, comma-separated.
      if (type.length) params.set("type", type.join(","));
      if (status.length) params.set("status", status.join(","));
      if (aiScope.length) params.set("ai_scope", aiScope.join(","));
      if (createdBy.length) params.set("created_by", createdBy.join(","));

      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchKnowledgeItems()}?${params.toString()}`,
        { useBackend: true },
      );
      const paginated = toPaginatedList<ApiKnowledgeItem>(response.data?.data);
      return {
        ...paginated,
        results: paginated.results.map(mapApiKnowledgeItem),
      };
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load knowledge items.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't load knowledge items.");
    }
  },
);

export const FetchKnowledgeStats = createAsyncThunk(
  "FetchKnowledgeStats",
  async ({ storeCode }: { storeCode: string }, thunkAPI) => {
    try {
      const params = new URLSearchParams({ store_code: storeCode });
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchKnowledgeStats()}?${params.toString()}`,
        { useBackend: true },
      );
      return response.data?.data as KnowledgeStats;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      return thunkAPI.rejectWithValue(
        response?.data || "Couldn't load knowledge statistics.",
      );
    }
  },
);

/** One element of a bulk request's `items` array — pure content only.
 * `type`/`source`/`ai_scope`/`products`/`categories`/`collections` are
 * shared across the whole request (see `CreateKnowledgeItemsBulk`), not
 * repeated per item. */
export type BulkKnowledgeItemContent = {
  question?: string;
  answer?: string;
  url?: string;
  title?: string;
  /** An article's HTML body. */
  content?: string;
};

/** How long the bulk create may take before the browser gives up. */
const BULK_CREATE_TIMEOUT_MS = 120_000;

/** Bulk-create knowledge items of one `source` in one request
 * (`knowledge/views.py` `KnowledgeItemAPIView.post`). Shared fields
 * (`type`/`ai_scope`/`products`/`categories`/`collections`) are sent once;
 * `items` carries each item's own content only. The batch is atomic on
 * the backend — every item is created together, or (on validation
 * failure) none are, and the rejected payload's `data` is either an
 * array of per-index field-error objects (one entry per submitted item,
 * `{}` for items that were individually fine) or a plain object for a
 * whole-request error (e.g. the shared fields themselves were invalid).
 *
 * `source: "file"` is always multipart, with the files themselves as
 * repeated `files` fields and no `items` at all (file items carry no
 * content field of their own once title is dropped from this form).
 * Every other source is a plain JSON body with a real `items` array. */
export const CreateKnowledgeItemsBulk = createAsyncThunk(
  "CreateKnowledgeItemsBulk",
  async (
    input: {
      storeCode: string;
      type: KnowledgeType;
      source: KnowledgeSource;
      aiScope: AIScope[];
      productIds?: string[];
      categoryIds?: string[];
      collectionIds?: string[];
      items?: BulkKnowledgeItemContent[];
      files?: File[];
      /** Send the batch for processing now instead of saving it as drafts. */
      publish?: boolean;
      /** Skip the success toast, for a save the user didn't ask for by name. */
      silent?: boolean;
    },
    thunkAPI,
  ) => {
    try {
      const {
        storeCode,
        type,
        source,
        aiScope,
        productIds,
        categoryIds,
        collectionIds,
        publish = false,
      } = input;

      let payload: FormData | Record<string, unknown>;
      // The shared axios instance gives up after 30s, but a big batch (up to
      // 100 pages, each re-checked and queued for indexing) can take longer.
      // Giving up early is worse than waiting: the backend still saves
      // everything, so the user sees an error for items that were added.
      let requestConfig: {
        timeout: number;
        headers?: { "Content-Type": string };
      } = { timeout: BULK_CREATE_TIMEOUT_MS };

      if (source === "file") {
        const formData = new FormData();
        formData.append("type", type);
        formData.append("source", source);
        formData.append("publish", String(publish));
        aiScope.forEach((scope) => formData.append("ai_scope", scope));
        (productIds ?? []).forEach((id) => formData.append("products", id));
        (categoryIds ?? []).forEach((id) => formData.append("categories", id));
        (collectionIds ?? []).forEach((id) =>
          formData.append("collections", id),
        );
        (input.files ?? []).forEach((file) => formData.append("files", file));
        payload = formData;
        requestConfig = {
          ...requestConfig,
          headers: { "Content-Type": "multipart/form-data" },
        };
      } else {
        payload = {
          type,
          source,
          ai_scope: aiScope,
          products: productIds ?? [],
          categories: categoryIds ?? [],
          collections: collectionIds ?? [],
          publish,
          items: input.items ?? [],
        };
      }

      const response = await axiosInstance.post(
        `${ENDPOINTS.createKnowledgeItem()}?store_code=${storeCode}`,
        payload,
        requestConfig,
      );
      const data: ApiKnowledgeItem[] = response.data?.data ?? [];
      if (!input.silent)
        toast.success(response?.data?.message || "Knowledge items created.");
      return data.map(mapApiKnowledgeItem);
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't add knowledge.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't add knowledge.");
    }
  },
);

/** One page found while scanning a website. `title` and `wordCount` are
 * best-effort — the crawler may not be able to read either. */
export type DiscoveredPage = {
  url: string;
  title: string;
  wordCount: number | null;
  /** The store already has a URL knowledge item for this page. */
  alreadyAdded: boolean;
  /** False when the page has too few words to be worth indexing. */
  hasEnoughContent: boolean;
};

type ApiDiscoveredPage = {
  url: string;
  title?: string | null;
  word_count?: number | null;
  already_added?: boolean;
  has_enough_content?: boolean;
};

/** The most specific message in a failed scan response: the `url` field error
 * (e.g. "can't be scanned" / "couldn't reach this website"), else the
 * envelope's `message`. */
function discoveryErrorMessage(payload: unknown): string | undefined {
  const body = payload as
    | { message?: string; data?: { url?: unknown } }
    | undefined;
  const urlError = body?.data?.url;
  return (
    (Array.isArray(urlError) ? String(urlError[0]) : undefined) ||
    body?.message ||
    undefined
  );
}

/** Scans a website and lists the pages found on it, so the user can choose
 * which ones to index (`knowledge/views.py` `KnowledgeURLDiscoveryAPIView`).
 * Resolves `{ data: { pages: [{ url, title, word_count, already_added }],
 * truncated } }`; `truncated` means the site had more pages than the scan
 * limit. Validation failures come back as `{ data: { url: ["..."] } }`. */
export const DiscoverWebsiteUrls = createAsyncThunk(
  "DiscoverWebsiteUrls",
  async (
    { storeCode, websiteUrl }: { storeCode: string; websiteUrl: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.discoverKnowledgeUrls()}?store_code=${storeCode}`,
        { url: websiteUrl },
        // Lets the caller cancel the scan (`promise.abort()`), e.g. when the
        // user leaves the scan view while it is still running.
        { signal: thunkAPI.signal },
      );
      const pages: ApiDiscoveredPage[] = response.data?.data?.pages ?? [];
      return {
        pages: pages.map(
          (page): DiscoveredPage => ({
            url: page.url,
            title: page.title?.trim() ?? "",
            wordCount: page.word_count ?? null,
            alreadyAdded: Boolean(page.already_added),
            hasEnoughContent: page.has_enough_content !== false,
          }),
        ),
        truncated: Boolean(response.data?.data?.truncated),
        throttled: Boolean(response.data?.data?.throttled),
        websiteUrl: String(response.data?.data?.website_url ?? websiteUrl),
        minWords: Number(response.data?.data?.min_words) || 0,
      };
    } catch (error) {
      // A cancelled scan isn't a failure — don't toast about it.
      if (thunkAPI.signal.aborted) return thunkAPI.rejectWithValue(undefined);

      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't scan the website.", {
        description: discoveryErrorMessage(data) || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't scan the website.");
    }
  },
);

/** Reads the title/word count of pages a scan listed without details. A scan
 * can't read every page of a large site in one go — sites rate-limit bursts
 * (HTTP 429, for roughly 30s) — so the scan view asks for the rest in small
 * batches (`KnowledgeURLDiscoveryDetailsAPIView`). Resolves `{ pages, throttled }`;
 * `throttled` means the site limited this batch too, so retry later. A
 * requested page missing from `pages` no longer exists (or isn't HTML). Failures
 * are silent: this runs in the background and the page just stays "unknown". */
export const FetchDiscoveredPageDetails = createAsyncThunk(
  "FetchDiscoveredPageDetails",
  async (
    {
      storeCode,
      websiteUrl,
      urls,
    }: { storeCode: string; websiteUrl: string; urls: string[] },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.discoverKnowledgeUrlDetails()}?store_code=${storeCode}`,
        { website_url: websiteUrl, urls },
        { signal: thunkAPI.signal },
      );
      const pages: (ApiDiscoveredPage & { url: string })[] =
        response.data?.data?.pages ?? [];
      return {
        requested: urls,
        pages: pages.map((page) => ({
          url: page.url,
          title: page.title?.trim() ?? "",
          wordCount: page.word_count ?? null,
          hasEnoughContent: page.has_enough_content !== false,
        })),
        throttled: Boolean(response.data?.data?.throttled),
      };
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      return thunkAPI.rejectWithValue(response?.data);
    }
  },
);

/** Loads one knowledge item, e.g. an article being opened in the editor. */
export const FetchKnowledgeItem = createAsyncThunk(
  "FetchKnowledgeItem",
  async ({ id, storeCode }: { id: string; storeCode: string }, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.knowledgeItemDetail(Number(id))}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return mapApiKnowledgeItem(response.data?.data as ApiKnowledgeItem);
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      return thunkAPI.rejectWithValue(
        response?.data || "Couldn't load this knowledge item.",
      );
    }
  },
);

export const UpdateKnowledgeItem = createAsyncThunk(
  "UpdateKnowledgeItem",
  async (
    {
      id,
      storeCode,
      patch,
      silent = false,
    }: {
      id: string;
      storeCode: string;
      patch: KnowledgeItemWritableInput;
      /** Skip the success toast, e.g. for an autosave. */
      silent?: boolean;
    },
    thunkAPI,
  ) => {
    try {
      const payload = buildKnowledgeItemPayload(patch);
      const response = await axiosInstance.patch(
        `${ENDPOINTS.knowledgeItemDetail(Number(id))}?store_code=${storeCode}`,
        payload,
        payload instanceof FormData
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : undefined,
      );
      const data: ApiKnowledgeItem = response.data.data;
      if (!silent)
        toast.success(
          response?.data?.message || "Knowledge updated successfully!",
        );
      return mapApiKnowledgeItem(data);
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't update knowledge.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't update knowledge.");
    }
  },
);

export const DeleteKnowledgeItem = createAsyncThunk(
  "DeleteKnowledgeItem",
  async ({ id, storeCode }: { id: string; storeCode: string }, thunkAPI) => {
    try {
      const response = await axiosInstance.delete(
        `${ENDPOINTS.knowledgeItemDetail(Number(id))}?store_code=${storeCode}`,
      );
      toast.success(
        response?.data?.message || "Knowledge deleted successfully!",
      );
      return { id };
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't delete knowledge.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't delete knowledge.");
    }
  },
);

/**
 * Deletes several knowledge items one after another (there is no bulk
 * endpoint) and reports once, rather than one toast per item. Items that
 * fail stay in `failedIds` so the caller can keep them selected.
 */
export const DeleteKnowledgeItems = createAsyncThunk(
  "DeleteKnowledgeItems",
  async ({ ids, storeCode }: { ids: string[]; storeCode: string }) => {
    const deletedIds: string[] = [];
    const failedIds: string[] = [];

    for (const id of ids) {
      try {
        await axiosInstance.delete(
          `${ENDPOINTS.knowledgeItemDetail(Number(id))}?store_code=${storeCode}`,
        );
        deletedIds.push(id);
      } catch {
        failedIds.push(id);
      }
    }

    if (deletedIds.length > 0) {
      toast.success(
        `Deleted ${deletedIds.length} knowledge ${deletedIds.length === 1 ? "item" : "items"}.`,
      );
    }
    if (failedIds.length > 0) {
      toast.error(
        `Couldn't delete ${failedIds.length} ${failedIds.length === 1 ? "item" : "items"}.`,
        { description: "Please try again later." },
      );
    }

    return { deletedIds, failedIds };
  },
);

/**
 * Publishes draft knowledge items one after another (there is no bulk
 * endpoint), which queues each for processing; they become "published" once
 * that finishes. Reports once rather than per item. It stops at the first
 * "storage limit reached" answer, since every item after it would get the
 * same one; items it did not publish come back in `failedIds`.
 */
export const PublishKnowledgeItems = createAsyncThunk(
  "PublishKnowledgeItems",
  async ({ ids, storeCode }: { ids: string[]; storeCode: string }) => {
    const publishedIds: string[] = [];
    const failedIds: string[] = [];
    let errorMessage = "";

    for (const [index, id] of ids.entries()) {
      try {
        await axiosInstance.post(
          `${ENDPOINTS.knowledgeItemPublish(Number(id))}?store_code=${storeCode}`,
        );
        publishedIds.push(id);
      } catch (error) {
        const response = isAxiosError(error) ? error.response : undefined;
        errorMessage ||= response?.data?.message || "";
        failedIds.push(id);

        if (response?.status === 403) {
          failedIds.push(...ids.slice(index + 1));
          break;
        }
      }
    }

    if (publishedIds.length > 0) {
      toast.success(
        `Publishing ${publishedIds.length} knowledge ${publishedIds.length === 1 ? "item" : "items"}.`,
        { description: "They go live once processing finishes." },
      );
    }
    if (failedIds.length > 0) {
      toast.error(
        `Couldn't publish ${failedIds.length} ${failedIds.length === 1 ? "item" : "items"}.`,
        { description: errorMessage || "Please try again later." },
      );
    }

    return { publishedIds, failedIds };
  },
);

/**
 * Replaces which AI features use each of several knowledge items, in one
 * request. It takes effect at once and nothing is processed again. Only draft
 * and published items change; the rest come back counted in `skipped`.
 */
export const UpdateKnowledgeItemsScope = createAsyncThunk(
  "UpdateKnowledgeItemsScope",
  async (
    {
      ids,
      aiScope,
      storeCode,
      silent = false,
    }: {
      ids: string[];
      aiScope: AIScope[];
      storeCode: string;
      /** Skip the success toast, e.g. for a change saved as it is made. */
      silent?: boolean;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.knowledgeItemsBulkScope()}?store_code=${storeCode}`,
        { ids: ids.map(Number), ai_scope: aiScope },
      );
      const { updated, skipped } = response.data?.data as {
        updated: number;
        skipped: number;
      };
      if (!silent || skipped > 0) {
        toast.success(
          `Updated ${updated} knowledge ${updated === 1 ? "item" : "items"}.`,
          skipped > 0
            ? {
                description: `${skipped} couldn't be changed because they are still being processed or failed.`,
              }
            : undefined,
        );
      }
      return { updated, skipped };
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't change the AI scope.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't change the AI scope.");
    }
  },
);

// Product.id is a UUID (products/models.py), not an integer — do not
// Number() it when building the write payload below.
type ApiProductOption = { id: string; name: string };

/** Type-ahead product picker for Product Knowledge. `search` is optional on
 * the backend — omitted or blank, it returns any `PRODUCT_SEARCH_RESULT_LIMIT`
 * (5) products for the store, so this is called on mount too, not just once
 * the user types. */
export const FetchProductOptions = createAsyncThunk(
  "FetchProductOptions",
  async (
    { storeCode, search = "" }: { storeCode: string; search?: string },
    thunkAPI,
  ) => {
    try {
      const params = new URLSearchParams({ store_code: storeCode });
      if (search.trim()) params.set("search", search.trim());

      const response = await axiosInstance.get(
        `${ENDPOINTS.searchProducts()}?${params.toString()}`,
        { useBackend: true },
      );
      const data: ApiProductOption[] = response.data?.data ?? [];
      return data.map((product) => ({
        id: String(product.id),
        name: product.name,
      }));
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      return thunkAPI.rejectWithValue(
        response?.data || "Couldn't load product options.",
      );
    }
  },
);

/** Type-ahead category picker. Same shape/behavior as `FetchProductOptions`
 * against `/products/categories/search/` (`CATEGORY_SEARCH_RESULT_LIMIT`,
 * 5, results). */
export const FetchCategoryOptions = createAsyncThunk(
  "FetchCategoryOptions",
  async (
    { storeCode, search = "" }: { storeCode: string; search?: string },
    thunkAPI,
  ) => {
    try {
      const params = new URLSearchParams({ store_code: storeCode });
      if (search.trim()) params.set("search", search.trim());

      const response = await axiosInstance.get(
        `${ENDPOINTS.searchCategories()}?${params.toString()}`,
        { useBackend: true },
      );
      const data: ApiProductOption[] = response.data?.data ?? [];
      return data.map((category) => ({
        id: String(category.id),
        name: category.name,
      }));
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      return thunkAPI.rejectWithValue(
        response?.data || "Couldn't load category options.",
      );
    }
  },
);

/** Type-ahead collection picker. Same shape/behavior as
 * `FetchProductOptions` against `/products/collections/search/`
 * (`COLLECTION_SEARCH_RESULT_LIMIT`, 5, results). */
export const FetchCollectionOptions = createAsyncThunk(
  "FetchCollectionOptions",
  async (
    { storeCode, search = "" }: { storeCode: string; search?: string },
    thunkAPI,
  ) => {
    try {
      const params = new URLSearchParams({ store_code: storeCode });
      if (search.trim()) params.set("search", search.trim());

      const response = await axiosInstance.get(
        `${ENDPOINTS.searchCollections()}?${params.toString()}`,
        { useBackend: true },
      );
      const data: ApiProductOption[] = response.data?.data ?? [];
      return data.map((collection) => ({
        id: String(collection.id),
        name: collection.name,
      }));
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      return thunkAPI.rejectWithValue(
        response?.data || "Couldn't load collection options.",
      );
    }
  },
);

// --- Slice ----------------------------------------------------------------

const KnowledgeRagSlice = createSlice({
  name: "KnowledgeRag",
  initialState: {
    FetchKnowledgeItemsState: {
      FetchKnowledgeItemsIsLoading: false,
      FetchKnowledgeItemsIsSuccess: false,
      FetchKnowledgeItemsIsError: null as null | string | object,
      FetchKnowledgeItemsListData: {
        count: 0,
        next: null,
        previous: null,
        results: [],
      } as KnowledgeItemListResponse,
      FetchKnowledgeItemsLatestRequestId: null as string | null,
    },
    CreateKnowledgeItemsBulkState: {
      CreateKnowledgeItemsBulkIsLoading: false,
      CreateKnowledgeItemsBulkIsSuccess: false,
      CreateKnowledgeItemsBulkIsError: null as null | string | object,
    },
    DiscoverWebsiteUrlsState: {
      DiscoverWebsiteUrlsIsLoading: false,
      DiscoverWebsiteUrlsIsSuccess: false,
      DiscoverWebsiteUrlsIsError: null as null | string,
      DiscoverWebsiteUrlsListData: [] as DiscoveredPage[],
      DiscoverWebsiteUrlsTruncated: false,
      DiscoverWebsiteUrlsMinWords: 0,
      /** The address that was scanned, as the backend saw it. */
      DiscoverWebsiteUrlsWebsiteUrl: "",
      /** The scan was rate-limited, so some pages still lack details. */
      DiscoverWebsiteUrlsThrottled: false,
      DiscoverWebsiteUrlsDetailsIsLoading: false,
    },
    UpdateKnowledgeItemState: {
      UpdateKnowledgeItemIsLoading: false,
      UpdateKnowledgeItemIsSuccess: false,
      UpdateKnowledgeItemIsError: null as null | string | object,
    },
    DeleteKnowledgeItemState: {
      DeleteKnowledgeItemIsLoading: false,
      DeleteKnowledgeItemIsSuccess: false,
      DeleteKnowledgeItemIsError: null as null | string | object,
    },
    FetchKnowledgeStatsState: {
      FetchKnowledgeStatsIsLoading: false,
      FetchKnowledgeStatsIsSuccess: false,
      FetchKnowledgeStatsIsError: null as null | string | object,
      FetchKnowledgeStatsData: null as KnowledgeStats | null,
    },
    FetchProductOptionsState: {
      FetchProductOptionsIsLoading: false,
      FetchProductOptionsIsSuccess: false,
      FetchProductOptionsIsError: null as null | string | object,
      FetchProductOptionsListData: [] as ProductOption[],
    },
    FetchCategoryOptionsState: {
      FetchCategoryOptionsIsLoading: false,
      FetchCategoryOptionsIsSuccess: false,
      FetchCategoryOptionsIsError: null as null | string | object,
      FetchCategoryOptionsListData: [] as ProductOption[],
    },
    FetchCollectionOptionsState: {
      FetchCollectionOptionsIsLoading: false,
      FetchCollectionOptionsIsSuccess: false,
      FetchCollectionOptionsIsError: null as null | string | object,
      FetchCollectionOptionsListData: [] as ProductOption[],
    },
  },
  reducers: {
    /** Clears the website-scan results (list, flags, errors). */
    ResetDiscoverWebsiteUrls: (state) => {
      state.DiscoverWebsiteUrlsState = {
        DiscoverWebsiteUrlsIsLoading: false,
        DiscoverWebsiteUrlsIsSuccess: false,
        DiscoverWebsiteUrlsIsError: null,
        DiscoverWebsiteUrlsListData: [],
        DiscoverWebsiteUrlsTruncated: false,
        DiscoverWebsiteUrlsMinWords: 0,
        DiscoverWebsiteUrlsWebsiteUrl: "",
        DiscoverWebsiteUrlsThrottled: false,
        DiscoverWebsiteUrlsDetailsIsLoading: false,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // FetchKnowledgeItems
      .addCase(FetchKnowledgeItems.pending, (state, action) => {
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsIsLoading = true;
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsIsSuccess = false;
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsIsError = null;
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsLatestRequestId =
          action.meta.requestId;
      })
      .addCase(FetchKnowledgeItems.fulfilled, (state, action) => {
        if (
          action.meta.requestId !==
          state.FetchKnowledgeItemsState.FetchKnowledgeItemsLatestRequestId
        ) {
          return;
        }
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsIsLoading = false;
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsIsSuccess = true;
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsListData =
          action.payload;
      })
      .addCase(FetchKnowledgeItems.rejected, (state, action) => {
        if (
          action.meta.requestId !==
          state.FetchKnowledgeItemsState.FetchKnowledgeItemsLatestRequestId
        ) {
          return;
        }
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsIsLoading = false;
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsIsSuccess = false;
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsIsError =
          "Couldn't load knowledge items.";
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsListData = {
          count: 0,
          next: null,
          previous: null,
          results: [],
        };
      })
      // CreateKnowledgeItemsBulk
      .addCase(CreateKnowledgeItemsBulk.pending, (state) => {
        state.CreateKnowledgeItemsBulkState.CreateKnowledgeItemsBulkIsLoading = true;
        state.CreateKnowledgeItemsBulkState.CreateKnowledgeItemsBulkIsSuccess = false;
        state.CreateKnowledgeItemsBulkState.CreateKnowledgeItemsBulkIsError =
          null;
      })
      .addCase(CreateKnowledgeItemsBulk.fulfilled, (state) => {
        state.CreateKnowledgeItemsBulkState.CreateKnowledgeItemsBulkIsLoading = false;
        state.CreateKnowledgeItemsBulkState.CreateKnowledgeItemsBulkIsSuccess = true;
      })
      .addCase(CreateKnowledgeItemsBulk.rejected, (state) => {
        state.CreateKnowledgeItemsBulkState.CreateKnowledgeItemsBulkIsLoading = false;
        state.CreateKnowledgeItemsBulkState.CreateKnowledgeItemsBulkIsSuccess = false;
        state.CreateKnowledgeItemsBulkState.CreateKnowledgeItemsBulkIsError =
          "Couldn't add knowledge.";
      })
      // UpdateKnowledgeItem
      .addCase(UpdateKnowledgeItem.pending, (state) => {
        state.UpdateKnowledgeItemState.UpdateKnowledgeItemIsLoading = true;
        state.UpdateKnowledgeItemState.UpdateKnowledgeItemIsSuccess = false;
        state.UpdateKnowledgeItemState.UpdateKnowledgeItemIsError = null;
      })
      .addCase(UpdateKnowledgeItem.fulfilled, (state) => {
        state.UpdateKnowledgeItemState.UpdateKnowledgeItemIsLoading = false;
        state.UpdateKnowledgeItemState.UpdateKnowledgeItemIsSuccess = true;
      })
      .addCase(UpdateKnowledgeItem.rejected, (state) => {
        state.UpdateKnowledgeItemState.UpdateKnowledgeItemIsLoading = false;
        state.UpdateKnowledgeItemState.UpdateKnowledgeItemIsSuccess = false;
        state.UpdateKnowledgeItemState.UpdateKnowledgeItemIsError =
          "Couldn't update knowledge.";
      })
      // DeleteKnowledgeItem
      .addCase(DeleteKnowledgeItem.pending, (state) => {
        state.DeleteKnowledgeItemState.DeleteKnowledgeItemIsLoading = true;
        state.DeleteKnowledgeItemState.DeleteKnowledgeItemIsSuccess = false;
        state.DeleteKnowledgeItemState.DeleteKnowledgeItemIsError = null;
      })
      .addCase(DeleteKnowledgeItem.fulfilled, (state) => {
        state.DeleteKnowledgeItemState.DeleteKnowledgeItemIsLoading = false;
        state.DeleteKnowledgeItemState.DeleteKnowledgeItemIsSuccess = true;
      })
      .addCase(DeleteKnowledgeItem.rejected, (state) => {
        state.DeleteKnowledgeItemState.DeleteKnowledgeItemIsLoading = false;
        state.DeleteKnowledgeItemState.DeleteKnowledgeItemIsSuccess = false;
        state.DeleteKnowledgeItemState.DeleteKnowledgeItemIsError =
          "Couldn't delete knowledge.";
      })
      // DiscoverWebsiteUrls
      .addCase(DiscoverWebsiteUrls.pending, (state) => {
        const s = state.DiscoverWebsiteUrlsState;
        s.DiscoverWebsiteUrlsIsLoading = true;
        s.DiscoverWebsiteUrlsIsSuccess = false;
        s.DiscoverWebsiteUrlsIsError = null;
        s.DiscoverWebsiteUrlsListData = [];
        s.DiscoverWebsiteUrlsTruncated = false;
        s.DiscoverWebsiteUrlsMinWords = 0;
        s.DiscoverWebsiteUrlsWebsiteUrl = "";
        s.DiscoverWebsiteUrlsThrottled = false;
        s.DiscoverWebsiteUrlsDetailsIsLoading = false;
      })
      .addCase(DiscoverWebsiteUrls.fulfilled, (state, action) => {
        const s = state.DiscoverWebsiteUrlsState;
        s.DiscoverWebsiteUrlsIsLoading = false;
        s.DiscoverWebsiteUrlsIsSuccess = true;
        s.DiscoverWebsiteUrlsListData = action.payload.pages;
        s.DiscoverWebsiteUrlsTruncated = action.payload.truncated;
        s.DiscoverWebsiteUrlsMinWords = action.payload.minWords;
        s.DiscoverWebsiteUrlsWebsiteUrl = action.payload.websiteUrl;
        s.DiscoverWebsiteUrlsThrottled = action.payload.throttled;
      })
      .addCase(DiscoverWebsiteUrls.rejected, (state, action) => {
        const s = state.DiscoverWebsiteUrlsState;
        s.DiscoverWebsiteUrlsIsLoading = false;
        // Cancelled by the user: back to idle, no error to show.
        if (action.meta.aborted) return;
        s.DiscoverWebsiteUrlsIsError =
          discoveryErrorMessage(action.payload) || "Couldn't scan the website.";
      })
      // FetchDiscoveredPageDetails
      .addCase(FetchDiscoveredPageDetails.pending, (state) => {
        state.DiscoverWebsiteUrlsState.DiscoverWebsiteUrlsDetailsIsLoading = true;
      })
      .addCase(FetchDiscoveredPageDetails.fulfilled, (state, action) => {
        const s = state.DiscoverWebsiteUrlsState;
        s.DiscoverWebsiteUrlsDetailsIsLoading = false;
        s.DiscoverWebsiteUrlsThrottled = action.payload.throttled;

        const requested = new Set(action.payload.requested);
        const found = new Map(
          action.payload.pages.map((page) => [page.url, page]),
        );
        s.DiscoverWebsiteUrlsListData = s.DiscoverWebsiteUrlsListData.flatMap(
          (page) => {
            if (!requested.has(page.url)) return [page];
            const details = found.get(page.url);
            // Asked for but not returned: the page is gone or isn't HTML.
            if (!details) return [];
            return [
              {
                ...page,
                title: details.title || page.title,
                wordCount: details.wordCount,
                hasEnoughContent: details.hasEnoughContent,
              },
            ];
          },
        );
      })
      .addCase(FetchDiscoveredPageDetails.rejected, (state, action) => {
        state.DiscoverWebsiteUrlsState.DiscoverWebsiteUrlsDetailsIsLoading = false;
        // Treat a failed batch like a throttled one: wait before trying again.
        if (!action.meta.aborted)
          state.DiscoverWebsiteUrlsState.DiscoverWebsiteUrlsThrottled = true;
      })
      // FetchKnowledgeStats
      .addCase(FetchKnowledgeStats.pending, (state) => {
        state.FetchKnowledgeStatsState.FetchKnowledgeStatsIsLoading = true;
        state.FetchKnowledgeStatsState.FetchKnowledgeStatsIsError = null;
      })
      .addCase(FetchKnowledgeStats.fulfilled, (state, action) => {
        state.FetchKnowledgeStatsState.FetchKnowledgeStatsIsLoading = false;
        state.FetchKnowledgeStatsState.FetchKnowledgeStatsIsSuccess = true;
        state.FetchKnowledgeStatsState.FetchKnowledgeStatsData = action.payload;
      })
      .addCase(FetchKnowledgeStats.rejected, (state) => {
        state.FetchKnowledgeStatsState.FetchKnowledgeStatsIsLoading = false;
        state.FetchKnowledgeStatsState.FetchKnowledgeStatsIsSuccess = false;
        state.FetchKnowledgeStatsState.FetchKnowledgeStatsIsError =
          "Couldn't load knowledge statistics.";
      })
      // FetchProductOptions
      .addCase(FetchProductOptions.pending, (state) => {
        state.FetchProductOptionsState.FetchProductOptionsIsLoading = true;
        state.FetchProductOptionsState.FetchProductOptionsIsError = null;
      })
      .addCase(FetchProductOptions.fulfilled, (state, action) => {
        state.FetchProductOptionsState.FetchProductOptionsIsLoading = false;
        state.FetchProductOptionsState.FetchProductOptionsIsSuccess = true;
        state.FetchProductOptionsState.FetchProductOptionsListData =
          action.payload;
      })
      .addCase(FetchProductOptions.rejected, (state) => {
        state.FetchProductOptionsState.FetchProductOptionsIsLoading = false;
        state.FetchProductOptionsState.FetchProductOptionsIsError =
          "Couldn't load product options.";
      })
      // FetchCategoryOptions
      .addCase(FetchCategoryOptions.pending, (state) => {
        state.FetchCategoryOptionsState.FetchCategoryOptionsIsLoading = true;
        state.FetchCategoryOptionsState.FetchCategoryOptionsIsError = null;
      })
      .addCase(FetchCategoryOptions.fulfilled, (state, action) => {
        state.FetchCategoryOptionsState.FetchCategoryOptionsIsLoading = false;
        state.FetchCategoryOptionsState.FetchCategoryOptionsIsSuccess = true;
        state.FetchCategoryOptionsState.FetchCategoryOptionsListData =
          action.payload;
      })
      .addCase(FetchCategoryOptions.rejected, (state) => {
        state.FetchCategoryOptionsState.FetchCategoryOptionsIsLoading = false;
        state.FetchCategoryOptionsState.FetchCategoryOptionsIsError =
          "Couldn't load category options.";
      })
      // FetchCollectionOptions
      .addCase(FetchCollectionOptions.pending, (state) => {
        state.FetchCollectionOptionsState.FetchCollectionOptionsIsLoading = true;
        state.FetchCollectionOptionsState.FetchCollectionOptionsIsError = null;
      })
      .addCase(FetchCollectionOptions.fulfilled, (state, action) => {
        state.FetchCollectionOptionsState.FetchCollectionOptionsIsLoading = false;
        state.FetchCollectionOptionsState.FetchCollectionOptionsIsSuccess = true;
        state.FetchCollectionOptionsState.FetchCollectionOptionsListData =
          action.payload;
      })
      .addCase(FetchCollectionOptions.rejected, (state) => {
        state.FetchCollectionOptionsState.FetchCollectionOptionsIsLoading = false;
        state.FetchCollectionOptionsState.FetchCollectionOptionsIsError =
          "Couldn't load collection options.";
      });
  },
});

export const { ResetDiscoverWebsiteUrls } = KnowledgeRagSlice.actions;

export default KnowledgeRagSlice.reducer;
