import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";

import {
  createKnowledgeItem as mockCreateKnowledgeItem,
  deleteKnowledgeItem as mockDeleteKnowledgeItem,
  delay,
  getAIKnowledgeScope as mockGetAIKnowledgeScope,
  getRagSettings as mockGetRagSettings,
  listCategoryOptions,
  listKnowledgeItems,
  listProductOptions,
  retryKnowledgeItemProcessing as mockRetryKnowledgeItemProcessing,
  runTestQuery as mockRunTestQuery,
  saveAIKnowledgeScope as mockSaveAIKnowledgeScope,
  saveRagSettings as mockSaveRagSettings,
  setKnowledgeItemStatus as mockSetKnowledgeItemStatus,
  updateKnowledgeItem as mockUpdateKnowledgeItem,
} from "@/mock/knowledge-rag.mock";

// --- Types ------------------------------------------------------------
// Kept flat (rather than a discriminated union) because the Add/Edit form
// switches across all 8 types dynamically and shares most trailing fields
// (AI scope, tags, status) — a union would force per-type form components
// for little benefit here. Colocated with the thunks, matching every other
// slice in this codebase (no separate `types/` folder exists anywhere).

export type KnowledgeType =
  | "general"
  | "product";
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

export type KnowledgeStatus =
  | "active"
  | "processing"
  | "failed"
  | "disabled"
  | "syncing";

export type AIScope = "sales" | "support" | "social" | "internal";

export type PolicyType =
  | "return"
  | "refund"
  | "shipping"
  | "cancellation"
  | "warranty"
  | "privacy"
  | "terms"
  | "other";

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

export type ProductOption = { id: string; name: string; sku?: string };
export type CategoryOption = { id: string; name: string };

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

// --- Thunks -------------------------------------------------------------
// Bodies call the in-memory mock layer instead of axiosInstance/ENDPOINTS.
// Swapping to the real backend later only touches the body of each thunk.

export const FetchKnowledgeItems = createAsyncThunk(
  "FetchKnowledgeItems",
  async () => {
    const data = await delay(listKnowledgeItems());
    return data;
  },
);

export const CreateKnowledgeItem = createAsyncThunk(
  "CreateKnowledgeItem",
  async (input: Omit<KnowledgeItem, "id" | "createdAt" | "updatedAt">) => {
    const data = await delay(mockCreateKnowledgeItem(input));
    toast.success("Knowledge added successfully!");
    return data;
  },
);

export const UpdateKnowledgeItem = createAsyncThunk(
  "UpdateKnowledgeItem",
  async ({
    id,
    patch,
  }: {
    id: string;
    patch: Partial<Omit<KnowledgeItem, "id" | "createdAt">>;
  }) => {
    const data = await delay(mockUpdateKnowledgeItem(id, patch));
    toast.success("Knowledge updated successfully!");
    return data;
  },
);

export const DeleteKnowledgeItem = createAsyncThunk(
  "DeleteKnowledgeItem",
  async ({ id }: { id: string }) => {
    await delay(mockDeleteKnowledgeItem(id));
    toast.success("Knowledge deleted successfully!");
    return { id };
  },
);

export const ToggleKnowledgeItemStatus = createAsyncThunk(
  "ToggleKnowledgeItemStatus",
  async ({ id, status }: { id: string; status: KnowledgeStatus }) => {
    const data = await delay(mockSetKnowledgeItemStatus(id, status));
    toast.success(
      status === "disabled" ? "Knowledge disabled." : "Knowledge enabled.",
    );
    return data;
  },
);

export const RetryKnowledgeItemProcessing = createAsyncThunk(
  "RetryKnowledgeItemProcessing",
  async ({ id }: { id: string }) => {
    const data = await delay(mockRetryKnowledgeItemProcessing(id));
    toast.success("Reprocessing complete.");
    return data;
  },
);

export const FetchProductOptions = createAsyncThunk(
  "FetchProductOptions",
  async (query: string = "") => {
    const data = await delay(listProductOptions(query), 250);
    return data;
  },
);

export const FetchCategoryOptions = createAsyncThunk(
  "FetchCategoryOptions",
  async (query: string = "") => {
    const data = await delay(listCategoryOptions(query), 250);
    return data;
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
    toast.success("AI knowledge scope saved!");
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
      FetchKnowledgeItemsListData: [] as KnowledgeItem[],
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
    ToggleKnowledgeItemStatusState: {
      ToggleKnowledgeItemStatusIsLoading: false,
      ToggleKnowledgeItemStatusIsSuccess: false,
      ToggleKnowledgeItemStatusIsError: null as null | string | object,
    },
    RetryKnowledgeItemProcessingState: {
      RetryKnowledgeItemProcessingIsLoading: false,
      RetryKnowledgeItemProcessingIsSuccess: false,
      RetryKnowledgeItemProcessingIsError: null as null | string | object,
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
      FetchCategoryOptionsListData: [] as CategoryOption[],
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
      // ToggleKnowledgeItemStatus
      .addCase(ToggleKnowledgeItemStatus.pending, (state) => {
        state.ToggleKnowledgeItemStatusState.ToggleKnowledgeItemStatusIsLoading =
          true;
        state.ToggleKnowledgeItemStatusState.ToggleKnowledgeItemStatusIsSuccess =
          false;
        state.ToggleKnowledgeItemStatusState.ToggleKnowledgeItemStatusIsError =
          null;
      })
      .addCase(ToggleKnowledgeItemStatus.fulfilled, (state) => {
        state.ToggleKnowledgeItemStatusState.ToggleKnowledgeItemStatusIsLoading =
          false;
        state.ToggleKnowledgeItemStatusState.ToggleKnowledgeItemStatusIsSuccess =
          true;
      })
      .addCase(ToggleKnowledgeItemStatus.rejected, (state) => {
        state.ToggleKnowledgeItemStatusState.ToggleKnowledgeItemStatusIsLoading =
          false;
        state.ToggleKnowledgeItemStatusState.ToggleKnowledgeItemStatusIsSuccess =
          false;
        state.ToggleKnowledgeItemStatusState.ToggleKnowledgeItemStatusIsError =
          "Something went wrong";
      })
      // RetryKnowledgeItemProcessing
      .addCase(RetryKnowledgeItemProcessing.pending, (state) => {
        state.RetryKnowledgeItemProcessingState.RetryKnowledgeItemProcessingIsLoading =
          true;
        state.RetryKnowledgeItemProcessingState.RetryKnowledgeItemProcessingIsSuccess =
          false;
        state.RetryKnowledgeItemProcessingState.RetryKnowledgeItemProcessingIsError =
          null;
      })
      .addCase(RetryKnowledgeItemProcessing.fulfilled, (state) => {
        state.RetryKnowledgeItemProcessingState.RetryKnowledgeItemProcessingIsLoading =
          false;
        state.RetryKnowledgeItemProcessingState.RetryKnowledgeItemProcessingIsSuccess =
          true;
      })
      .addCase(RetryKnowledgeItemProcessing.rejected, (state) => {
        state.RetryKnowledgeItemProcessingState.RetryKnowledgeItemProcessingIsLoading =
          false;
        state.RetryKnowledgeItemProcessingState.RetryKnowledgeItemProcessingIsSuccess =
          false;
        state.RetryKnowledgeItemProcessingState.RetryKnowledgeItemProcessingIsError =
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
          "Something went wrong";
      })
      // FetchRetrievalSettings
      .addCase(FetchRetrievalSettings.pending, (state) => {
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsIsLoading =
          true;
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsIsSuccess =
          false;
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsIsError =
          null;
      })
      .addCase(FetchRetrievalSettings.fulfilled, (state, action) => {
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsIsLoading =
          false;
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsIsSuccess =
          true;
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsData =
          action.payload;
      })
      .addCase(FetchRetrievalSettings.rejected, (state) => {
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsIsLoading =
          false;
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsIsSuccess =
          false;
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsIsError =
          "Something went wrong";
      })
      // SaveRetrievalSettings
      .addCase(SaveRetrievalSettings.pending, (state) => {
        state.SaveRetrievalSettingsState.SaveRetrievalSettingsIsLoading = true;
        state.SaveRetrievalSettingsState.SaveRetrievalSettingsIsSuccess =
          false;
        state.SaveRetrievalSettingsState.SaveRetrievalSettingsIsError = null;
      })
      .addCase(SaveRetrievalSettings.fulfilled, (state, action) => {
        state.SaveRetrievalSettingsState.SaveRetrievalSettingsIsLoading =
          false;
        state.SaveRetrievalSettingsState.SaveRetrievalSettingsIsSuccess = true;
        state.FetchRetrievalSettingsState.FetchRetrievalSettingsData =
          action.payload;
      })
      .addCase(SaveRetrievalSettings.rejected, (state) => {
        state.SaveRetrievalSettingsState.SaveRetrievalSettingsIsLoading =
          false;
        state.SaveRetrievalSettingsState.SaveRetrievalSettingsIsSuccess =
          false;
        state.SaveRetrievalSettingsState.SaveRetrievalSettingsIsError =
          "Something went wrong";
      })
      // FetchAIKnowledgeScope
      .addCase(FetchAIKnowledgeScope.pending, (state) => {
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeIsLoading =
          true;
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeIsSuccess =
          false;
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeIsError = null;
      })
      .addCase(FetchAIKnowledgeScope.fulfilled, (state, action) => {
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeIsLoading =
          false;
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeIsSuccess =
          true;
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeData =
          action.payload;
      })
      .addCase(FetchAIKnowledgeScope.rejected, (state) => {
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeIsLoading =
          false;
        state.FetchAIKnowledgeScopeState.FetchAIKnowledgeScopeIsSuccess =
          false;
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
