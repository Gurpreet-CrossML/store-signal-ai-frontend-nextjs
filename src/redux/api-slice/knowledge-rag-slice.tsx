import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { axiosInstance } from "@/redux/axios-config";
import { ENDPOINTS } from "@/lib/config";
import { toPaginatedList } from "@/lib/helpers";
import {
  getAIKnowledgeScope as mockGetAIKnowledgeScope,
  getRagSettings as mockGetRagSettings,
  runTestQuery as mockRunTestQuery,
  saveAIKnowledgeScope as mockSaveAIKnowledgeScope,
  saveRagSettings as mockSaveRagSettings,
  delay,
} from "@/mock/knowledge-rag.mock";

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
  | "text"
  | "file"
  | "url"
  | "google_drive"
  | "product"
  | "category"
  | "faq"
  | "offer";

// Mirrors the backend's KnowledgeStatus choices exactly (knowledge/models.py).
// There is no "active"/"disabled" status on the backend — "completed" is the
// terminal success state, and status is read-only (not settable via the API).
export type KnowledgeStatus = "completed" | "pending" | "processing" | "failed";

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

  // General knowledge
  content?: string;
  category?: string;

  // Product knowledge
  productId?: string;
  productName?: string;

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

export type KnowledgeItemListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: KnowledgeItem[];
};

export type RetrievalSettings = {
  similarityThreshold: number;
  topK: number;
  minMatchingScore: number;
  hybridSearchEnabled: boolean;
  rerankingEnabled: boolean;
  rerankingThreshold: number;
};

export type GroundingMode = "strict" | "balanced" | "flexible";
export type UnsupportedAnswerPolicy =
  | "never_guess"
  | "limited_inference"
  | "allow_inference";

export type GroundingSettings = {
  mode: GroundingMode;
  unsupportedAnswerPolicy: UnsupportedAnswerPolicy;
};

export type RagSettings = {
  retrieval: RetrievalSettings;
  grounding: GroundingSettings;
};

export type AIKnowledgeScopeConfig = Record<AIScope, KnowledgeType[]>;

export type RetrievedSource = {
  knowledgeItemId: string;
  title: string;
  type: KnowledgeType;
  similarityScore: number;
  matchingScore: number;
  rerankingScore?: number;
  excerpt: string;
};

export type TestConsoleResult = {
  query: string;
  aiScope: AIScope;
  knowledgeScope: KnowledgeType[];
  retrievedSources: RetrievedSource[];
  finalContext: string;
  generatedAnswer: string;
  grounded: boolean;
  fallbackReason?: string;
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
  product_name: string | null;
  url: string;
  file: string | null;
  file_type: string;
  file_size: number | null;
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
    content: api.content || undefined,
    category: api.category || undefined,
    productName: api.product_name || undefined,
    question: api.question || undefined,
    answer: api.answer || undefined,
    url: api.url || undefined,
    fileUrl: api.file || undefined,
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
  /** Product id (a UUID string, per `ProductOption`) — sent as the `product` FK. */
  productId?: string;
  productName?: string;
  question?: string;
  answer?: string;
  url?: string;
  /** The raw file being uploaded — only present for `source: "file"`. */
  file?: File;
};

/** Builds a multipart body when a file is attached, otherwise a plain JSON body.
 *
 * Only sends fields the backend's per-source serializers actually accept
 * (knowledge/serializers.py): product/type/source/title/ai_scope always,
 * plus url|file|content|question+answer depending on `source`. `tags` isn't
 * writable on any of them, so it's never sent.
 */
function buildKnowledgeItemPayload(
  input: KnowledgeItemWritableInput,
): FormData | Record<string, unknown> {
  // Product.id is a UUID (products/models.py) — keep it as the string it
  // already is; Number()'ing it here previously turned every product
  // knowledge create into `product: NaN` (serialized as null), which is
  // why the product was silently missing from the request.
  const product = input.productId || undefined;

  if (input.file) {
    const formData = new FormData();
    formData.append("type", input.type);
    formData.append("source", input.source);
    if (input.title) formData.append("title", input.title);
    input.aiScope.forEach((scope) => formData.append("ai_scope", scope));
    if (product) formData.append("product", product);
    formData.append("file", input.file);
    return formData;
  }

  return {
    type: input.type,
    source: input.source,
    title: input.title,
    ai_scope: input.aiScope,
    product,
    content: input.content,
    question: input.question,
    answer: input.answer,
    url: input.url,
  };
}

// --- Thunks -------------------------------------------------------------
// Knowledge items are backed by the real Django `/api/knowledge/knowledge-items/`
// endpoints. Reads go through `useBackend: true` (not ported to a local API
// route); writes hit Django by axios-config's default routing. The other
// thunks below (products/categories/retrieval/grounding/scope/test query)
// stay on the in-memory mock layer — see the comment above each one.

export const FetchKnowledgeItems = createAsyncThunk(
  "FetchKnowledgeItems",
  async (
    {
      storeCode,
      page = 1,
      pageSize = 25,
      search = "",
      type,
      source,
      status,
    }: {
      storeCode: string;
      page?: number;
      pageSize?: number;
      search?: string;
      type?: KnowledgeType;
      source?: KnowledgeSource;
      status?: KnowledgeStatus;
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
      if (type) params.set("type", type);
      if (source) params.set("source", source);
      if (status) params.set("status", status);

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
      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to load knowledge items, please try again.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const CreateKnowledgeItem = createAsyncThunk(
  "CreateKnowledgeItem",
  async (
    input: KnowledgeItemWritableInput & { storeCode: string },
    thunkAPI,
  ) => {
    try {
      const { storeCode, ...rest } = input;
      const payload = buildKnowledgeItemPayload(rest);
      const response = await axiosInstance.post(
        `${ENDPOINTS.createKnowledgeItem()}?store_code=${storeCode}`,
        payload,
        payload instanceof FormData
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : undefined,
      );
      const data: ApiKnowledgeItem = response.data.data;
      toast.success(response?.data?.message || "Knowledge added successfully!");
      return mapApiKnowledgeItem(data);
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to add knowledge, please try again.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
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
    }: {
      id: string;
      storeCode: string;
      patch: Partial<KnowledgeItemWritableInput>;
    },
    thunkAPI,
  ) => {
    try {
      const payload = buildKnowledgeItemPayload(
        patch as KnowledgeItemWritableInput,
      );
      const response = await axiosInstance.patch(
        `${ENDPOINTS.knowledgeItemDetail(Number(id))}?store_code=${storeCode}`,
        payload,
        payload instanceof FormData
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : undefined,
      );
      const data: ApiKnowledgeItem = response.data.data;
      toast.success(
        response?.data?.message || "Knowledge updated successfully!",
      );
      return mapApiKnowledgeItem(data);
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to update knowledge, please try again.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
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
      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to delete knowledge, please try again.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
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
      return thunkAPI.rejectWithValue(response?.data || "Something went wrong");
    }
  },
);

export const FetchRetrievalSettings = createAsyncThunk(
  "FetchRetrievalSettings",
  async () => {
    const data = await delay(mockGetRagSettings());
    return data;
  },
);

export const SaveRetrievalSettings = createAsyncThunk(
  "SaveRetrievalSettings",
  async (settings: RagSettings) => {
    const data = await delay(mockSaveRagSettings(settings));
    toast.success("Retrieval & matching settings saved!");
    return data;
  },
);

export const FetchAIKnowledgeScope = createAsyncThunk(
  "FetchAIKnowledgeScope",
  async () => {
    const data = await delay(mockGetAIKnowledgeScope());
    return data;
  },
);

export const SaveAIKnowledgeScope = createAsyncThunk(
  "SaveAIKnowledgeScope",
  async (config: AIKnowledgeScopeConfig) => {
    const data = await delay(mockSaveAIKnowledgeScope(config));
    // toast.success("AI knowledge scope saved!");
    return data;
  },
);

export const RunTestQuery = createAsyncThunk(
  "RunTestQuery",
  async (input: {
    query: string;
    aiScope: AIScope;
    knowledgeScope: KnowledgeType[];
  }) => {
    const data = await delay(mockRunTestQuery(input), 700);
    return data;
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
    },
    CreateKnowledgeItemState: {
      CreateKnowledgeItemIsLoading: false,
      CreateKnowledgeItemIsSuccess: false,
      CreateKnowledgeItemIsError: null as null | string | object,
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
    FetchProductOptionsState: {
      FetchProductOptionsIsLoading: false,
      FetchProductOptionsIsSuccess: false,
      FetchProductOptionsIsError: null as null | string | object,
      FetchProductOptionsListData: [] as ProductOption[],
    },
    FetchRetrievalSettingsState: {
      FetchRetrievalSettingsIsLoading: false,
      FetchRetrievalSettingsIsSuccess: false,
      FetchRetrievalSettingsIsError: null as null | string | object,
      FetchRetrievalSettingsData: null as RagSettings | null,
    },
    SaveRetrievalSettingsState: {
      SaveRetrievalSettingsIsLoading: false,
      SaveRetrievalSettingsIsSuccess: false,
      SaveRetrievalSettingsIsError: null as null | string | object,
    },
    FetchAIKnowledgeScopeState: {
      FetchAIKnowledgeScopeIsLoading: false,
      FetchAIKnowledgeScopeIsSuccess: false,
      FetchAIKnowledgeScopeIsError: null as null | string | object,
      FetchAIKnowledgeScopeData: null as AIKnowledgeScopeConfig | null,
    },
    SaveAIKnowledgeScopeState: {
      SaveAIKnowledgeScopeIsLoading: false,
      SaveAIKnowledgeScopeIsSuccess: false,
      SaveAIKnowledgeScopeIsError: null as null | string | object,
    },
    RunTestQueryState: {
      RunTestQueryIsLoading: false,
      RunTestQueryIsSuccess: false,
      RunTestQueryIsError: null as null | string | object,
      RunTestQueryData: null as TestConsoleResult | null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FetchKnowledgeItems
      .addCase(FetchKnowledgeItems.pending, (state) => {
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsIsLoading = true;
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsIsSuccess = false;
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsIsError = null;
      })
      .addCase(FetchKnowledgeItems.fulfilled, (state, action) => {
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsIsLoading = false;
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsIsSuccess = true;
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsListData =
          action.payload;
      })
      .addCase(FetchKnowledgeItems.rejected, (state) => {
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsIsLoading = false;
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsIsSuccess = false;
        state.FetchKnowledgeItemsState.FetchKnowledgeItemsIsError =
          "Something went wrong";
      })
      // CreateKnowledgeItem
      .addCase(CreateKnowledgeItem.pending, (state) => {
        state.CreateKnowledgeItemState.CreateKnowledgeItemIsLoading = true;
        state.CreateKnowledgeItemState.CreateKnowledgeItemIsSuccess = false;
        state.CreateKnowledgeItemState.CreateKnowledgeItemIsError = null;
      })
      .addCase(CreateKnowledgeItem.fulfilled, (state) => {
        state.CreateKnowledgeItemState.CreateKnowledgeItemIsLoading = false;
        state.CreateKnowledgeItemState.CreateKnowledgeItemIsSuccess = true;
      })
      .addCase(CreateKnowledgeItem.rejected, (state) => {
        state.CreateKnowledgeItemState.CreateKnowledgeItemIsLoading = false;
        state.CreateKnowledgeItemState.CreateKnowledgeItemIsSuccess = false;
        state.CreateKnowledgeItemState.CreateKnowledgeItemIsError =
          "Something went wrong";
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
          "Something went wrong";
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
          "Something went wrong";
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
          "Something went wrong";
      })
      // FetchRetrievalSettings
      .addCase(FetchRetrievalSettings.pending, (state) => {
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsIsLoading = true;
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsIsSuccess = false;
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsIsError = null;
      })
      .addCase(FetchRetrievalSettings.fulfilled, (state, action) => {
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsIsLoading = false;
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsIsSuccess = true;
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsData =
          action.payload;
      })
      .addCase(FetchRetrievalSettings.rejected, (state) => {
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsIsLoading = false;
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsIsSuccess = false;
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsIsError =
          "Something went wrong";
      })
      // SaveRetrievalSettings
      .addCase(SaveRetrievalSettings.pending, (state) => {
        state.SaveRetrievalSettingsState.SaveRetrievalSettingsIsLoading = true;
        state.SaveRetrievalSettingsState.SaveRetrievalSettingsIsSuccess = false;
        state.SaveRetrievalSettingsState.SaveRetrievalSettingsIsError = null;
      })
      .addCase(SaveRetrievalSettings.fulfilled, (state, action) => {
        state.SaveRetrievalSettingsState.SaveRetrievalSettingsIsLoading = false;
        state.SaveRetrievalSettingsState.SaveRetrievalSettingsIsSuccess = true;
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsData =
          action.payload;
      })
      .addCase(SaveRetrievalSettings.rejected, (state) => {
        state.SaveRetrievalSettingsState.SaveRetrievalSettingsIsLoading = false;
        state.SaveRetrievalSettingsState.SaveRetrievalSettingsIsSuccess = false;
        state.SaveRetrievalSettingsState.SaveRetrievalSettingsIsError =
          "Something went wrong";
      })
      // FetchAIKnowledgeScope
      .addCase(FetchAIKnowledgeScope.pending, (state) => {
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeIsLoading = true;
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeIsSuccess = false;
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeIsError = null;
      })
      .addCase(FetchAIKnowledgeScope.fulfilled, (state, action) => {
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeIsLoading = false;
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeIsSuccess = true;
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeData =
          action.payload;
      })
      .addCase(FetchAIKnowledgeScope.rejected, (state) => {
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeIsLoading = false;
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeIsSuccess = false;
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeIsError =
          "Something went wrong";
      })
      // SaveAIKnowledgeScope
      .addCase(SaveAIKnowledgeScope.pending, (state) => {
        state.SaveAIKnowledgeScopeState.SaveAIKnowledgeScopeIsLoading = true;
        state.SaveAIKnowledgeScopeState.SaveAIKnowledgeScopeIsSuccess = false;
        state.SaveAIKnowledgeScopeState.SaveAIKnowledgeScopeIsError = null;
      })
      .addCase(SaveAIKnowledgeScope.fulfilled, (state, action) => {
        state.SaveAIKnowledgeScopeState.SaveAIKnowledgeScopeIsLoading = false;
        state.SaveAIKnowledgeScopeState.SaveAIKnowledgeScopeIsSuccess = true;
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeData =
          action.payload;
      })
      .addCase(SaveAIKnowledgeScope.rejected, (state) => {
        state.SaveAIKnowledgeScopeState.SaveAIKnowledgeScopeIsLoading = false;
        state.SaveAIKnowledgeScopeState.SaveAIKnowledgeScopeIsSuccess = false;
        state.SaveAIKnowledgeScopeState.SaveAIKnowledgeScopeIsError =
          "Something went wrong";
      })
      // RunTestQuery
      .addCase(RunTestQuery.pending, (state) => {
        state.RunTestQueryState.RunTestQueryIsLoading = true;
        state.RunTestQueryState.RunTestQueryIsSuccess = false;
        state.RunTestQueryState.RunTestQueryIsError = null;
      })
      .addCase(RunTestQuery.fulfilled, (state, action) => {
        state.RunTestQueryState.RunTestQueryIsLoading = false;
        state.RunTestQueryState.RunTestQueryIsSuccess = true;
        state.RunTestQueryState.RunTestQueryData = action.payload;
      })
      .addCase(RunTestQuery.rejected, (state) => {
        state.RunTestQueryState.RunTestQueryIsLoading = false;
        state.RunTestQueryState.RunTestQueryIsSuccess = false;
        state.RunTestQueryState.RunTestQueryIsError = "Something went wrong";
      });
  },
});

export default KnowledgeRagSlice.reducer;
