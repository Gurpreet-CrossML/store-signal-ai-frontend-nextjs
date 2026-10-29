import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "@/redux/axios-config";

/** Aggregate AI usage metrics returned by the summary endpoint. */
export type AIUsageSummary = {
  total_cost: number;
  total_records: number;
  average_latency: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
};

/** Usage and token totals for a single calendar date. */
export type DailyUsagePoint = {
  date: string;
  usage: number;
  input_tokens: number;
  output_tokens: number;
};

/** Cost attributed to a workflow. */
export type WorkflowCostPoint = { workflow: string; cost: number };

/** Average request latency for a single calendar date. */
export type LatencyPoint = { date: string; latency: number };

/** AI usage data stored in Redux for summary cards and charts. */
export type AIUsageResponse = {
  summary: AIUsageSummary;
  charts: {
    daily_usage: DailyUsagePoint[];
    workflow_costs: WorkflowCostPoint[];
    latency_trend: LatencyPoint[];
  };
};

/** Filters accepted by every AI usage endpoint. */
export type AIUsageFilters = {
  storeCode: string;
  threadIds?: string[];
  from?: string;
  to?: string;
};

/** Token totals returned by the token split endpoint. */
type TokenSplitData = Pick<
  AIUsageSummary,
  "input_tokens" | "output_tokens" | "total_tokens"
>;

const emptySummary: AIUsageSummary = {
  total_cost: 0,
  total_records: 0,
  average_latency: 0,
  total_tokens: 0,
  input_tokens: 0,
  output_tokens: 0,
};

const emptyTokenSplit: TokenSplitData = {
  input_tokens: 0,
  output_tokens: 0,
  total_tokens: 0,
};

/**
 * Converts UI filter names to the query parameter names expected by the backend.
 */
function paramsFor(filters: AIUsageFilters) {
  const params = new URLSearchParams({ store_code: filters.storeCode });
  filters.threadIds?.forEach((threadId) =>
    params.append("thread_id", threadId),
  );
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return params;
}

/** The company's credit position and current plan month. */
export type CreditStatus = {
  balance: number;
  has_quota: boolean;
  plan: { code: string; name: string } | null;
  monthly_credits: number | null;
  billing_cycle: string | null;
  start_date: string | null;
  end_date: string | null;
};

/** Credits charged over the selected range. */
export type CreditSummary = { total_calls: number; credits_charged: number };

/** Credits charged on one calendar date. */
export type DailyCreditPoint = { date: string; credits_charged: number };

/** Credits charged by one feature. */
export type FeatureUsage = {
  feature: string;
  calls: number;
  credits_charged: number;
};

const emptyCreditSummary: CreditSummary = {
  total_calls: 0,
  credits_charged: 0,
};

/** Fetches the company's credit balance and current plan month. */
export const fetchCreditStatus = createAsyncThunk(
  "aiUsage/fetchCreditStatus",
  async (filters: AIUsageFilters, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchCreditStatus()}?${paramsFor(filters).toString()}`,
        { useBackend: true },
      );
      return response.data.data as CreditStatus;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Couldn't fetch AI credit status.", {
        description: data?.message || "Please try again later.",
      });

      return thunkAPI.rejectWithValue(
        data || "Couldn't fetch AI credit status.",
      );
    }
  },
);

/** Fetches the credits charged over the selected range. */
export const fetchAIUsageCreditSummary = createAsyncThunk(
  "aiUsage/fetchAIUsageCreditSummary",
  async (filters: AIUsageFilters, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchAIUsageCreditSummary()}?${paramsFor(filters).toString()}`,
        { useBackend: true },
      );
      return response.data.data as CreditSummary;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Couldn't fetch AI credits used.", {
        description: data?.message || "Please try again later.",
      });

      return thunkAPI.rejectWithValue(
        data || "Couldn't fetch AI credits used.",
      );
    }
  },
);

/** Fetches the credits charged per day for the day-by-day chart. */
export const fetchAIUsageCreditDaily = createAsyncThunk(
  "aiUsage/fetchAIUsageCreditDaily",
  async (filters: AIUsageFilters, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchAIUsageCreditDaily()}?${paramsFor(filters).toString()}`,
        { useBackend: true },
      );
      return response.data.data as DailyCreditPoint[];
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Couldn't fetch daily AI credits.", {
        description: data?.message || "Please try again later.",
      });

      return thunkAPI.rejectWithValue(
        data || "Couldn't fetch daily AI credits.",
      );
    }
  },
);

/** Fetches billed credits per feature for "Where the credits went". */
export const fetchAIUsageByFeature = createAsyncThunk(
  "aiUsage/fetchAIUsageByFeature",
  async (filters: AIUsageFilters, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchAIUsageByFeature()}?${paramsFor(filters).toString()}&customer_facing=true`,
        { useBackend: true },
      );
      return response.data.data as FeatureUsage[];
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Couldn't fetch AI credits by feature.", {
        description: data?.message || "Please try again later.",
      });

      return thunkAPI.rejectWithValue(
        data || "Couldn't fetch AI credits by feature.",
      );
    }
  },
);

/** Fetches aggregate metrics for the AI usage summary cards. */
export const fetchAIUsageSummary = createAsyncThunk(
  "aiUsage/fetchSummary",
  async (filters: AIUsageFilters, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchAIUsageSummary()}?${paramsFor(filters).toString()}`,
        { useBackend: true },
      );
      return response.data.data as AIUsageSummary;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Couldn't fetch AI usage summary.", {
        description: data?.message || "Please try again later.",
      });

      return thunkAPI.rejectWithValue(
        data || "Couldn't fetch AI usage summary.",
      );
    }
  },
);

/** Fetches daily usage chart data without modifying the backend response. */
export const fetchAIUsageDaily = createAsyncThunk(
  "aiUsage/fetchDaily",
  async (filters: AIUsageFilters, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchAIUsageDaily()}?${paramsFor(filters).toString()}`,
        { useBackend: true },
      );
      return response.data.data as DailyUsagePoint[];
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Couldn't fetch AI daily usage.", {
        description: data?.message || "Please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Couldn't fetch AI daily usage.");
    }
  },
);

/** Fetches the input/output token distribution shown in the token split chart. */
export const fetchAIUsageTokenSplit = createAsyncThunk(
  "aiUsage/fetchTokenSplit",
  async (filters: AIUsageFilters, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchAIUsageTokenSplit()}?${paramsFor(filters).toString()}`,
        { useBackend: true },
      );
      return response.data.data as TokenSplitData;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Couldn't fetch AI token split.", {
        description: data?.message || "Please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Couldn't fetch AI token split.");
    }
  },
);

/** Fetches workflow cost chart data without modifying the backend response. */
export const fetchAIUsageWorkflowCosts = createAsyncThunk(
  "aiUsage/fetchWorkflowCosts",
  async (filters: AIUsageFilters, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchAIUsageWorkflowCosts()}?${paramsFor(filters).toString()}`,
        { useBackend: true },
      );
      return response.data.data as WorkflowCostPoint[];
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Couldn't fetch AI workflow costs.", {
        description: data?.message || "Please try again later.",
      });

      return thunkAPI.rejectWithValue(
        data || "Couldn't fetch AI workflow costs.",
      );
    }
  },
);

/** Fetches latency trend chart data without modifying the backend response. */
export const fetchAIUsageLatencyTrend = createAsyncThunk(
  "aiUsage/fetchLatencyTrend",
  async (filters: AIUsageFilters, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchAIUsageLatencyTrend()}?${paramsFor(filters).toString()}`,
        { useBackend: true },
      );
      return response.data.data as LatencyPoint[];
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Couldn't fetch AI latency trend.", {
        description: data?.message || "Please try again later.",
      });

      return thunkAPI.rejectWithValue(
        data || "Couldn't fetch AI latency trend.",
      );
    }
  },
);

const AIUsageSlice = createSlice({
  name: "AIUsage",
  initialState: {
    FetchCreditStatusState: {
      FetchCreditStatusIsLoading: false,
      FetchCreditStatusIsSuccess: false,
      FetchCreditStatusIsError: null as null | string | object,
      FetchCreditStatusData: null as CreditStatus | null,
    },
    FetchAIUsageCreditSummaryState: {
      FetchAIUsageCreditSummaryIsLoading: false,
      FetchAIUsageCreditSummaryIsSuccess: false,
      FetchAIUsageCreditSummaryIsError: null as null | string | object,
      FetchAIUsageCreditSummaryData: emptyCreditSummary,
    },
    FetchAIUsageCreditDailyState: {
      FetchAIUsageCreditDailyIsLoading: false,
      FetchAIUsageCreditDailyIsSuccess: false,
      FetchAIUsageCreditDailyIsError: null as null | string | object,
      FetchAIUsageCreditDailyData: [] as DailyCreditPoint[],
    },
    FetchAIUsageByFeatureState: {
      FetchAIUsageByFeatureIsLoading: false,
      FetchAIUsageByFeatureIsSuccess: false,
      FetchAIUsageByFeatureIsError: null as null | string | object,
      FetchAIUsageByFeatureData: [] as FeatureUsage[],
    },
    FetchAIUsageSummaryState: {
      FetchAIUsageSummaryIsLoading: false,
      FetchAIUsageSummaryIsSuccess: false,
      FetchAIUsageSummaryIsError: null as null | string | object,
      FetchAIUsageSummaryData: emptySummary,
    },
    FetchAIUsageDailyState: {
      FetchAIUsageDailyIsLoading: false,
      FetchAIUsageDailyIsSuccess: false,
      FetchAIUsageDailyIsError: null as null | string | object,
      FetchAIUsageDailyData: [] as DailyUsagePoint[],
    },
    FetchAIUsageTokenSplitState: {
      FetchAIUsageTokenSplitIsLoading: false,
      FetchAIUsageTokenSplitIsSuccess: false,
      FetchAIUsageTokenSplitIsError: null as null | string | object,
      FetchAIUsageTokenSplitData: emptyTokenSplit,
    },
    FetchAIUsageWorkflowCostsState: {
      FetchAIUsageWorkflowCostsIsLoading: false,
      FetchAIUsageWorkflowCostsIsSuccess: false,
      FetchAIUsageWorkflowCostsIsError: null as null | string | object,
      FetchAIUsageWorkflowCostsData: [] as WorkflowCostPoint[],
    },
    FetchAIUsageLatencyTrendState: {
      FetchAIUsageLatencyTrendIsLoading: false,
      FetchAIUsageLatencyTrendIsSuccess: false,
      FetchAIUsageLatencyTrendIsError: null as null | string | object,
      FetchAIUsageLatencyTrendData: [] as LatencyPoint[],
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // CreditStatus
      .addCase(fetchCreditStatus.pending, (state) => {
        state.FetchCreditStatusState.FetchCreditStatusIsLoading = true;
        state.FetchCreditStatusState.FetchCreditStatusIsSuccess = false;
        state.FetchCreditStatusState.FetchCreditStatusIsError = null;
      })
      .addCase(fetchCreditStatus.fulfilled, (state, action) => {
        state.FetchCreditStatusState.FetchCreditStatusIsLoading = false;
        state.FetchCreditStatusState.FetchCreditStatusIsSuccess = true;
        state.FetchCreditStatusState.FetchCreditStatusData = action.payload;
      })
      .addCase(fetchCreditStatus.rejected, (state, action) => {
        state.FetchCreditStatusState.FetchCreditStatusIsLoading = false;
        state.FetchCreditStatusState.FetchCreditStatusIsSuccess = false;
        state.FetchCreditStatusState.FetchCreditStatusIsError =
          action.payload as string | object;
      })
      // AIUsageCreditSummary
      .addCase(fetchAIUsageCreditSummary.pending, (state) => {
        state.FetchAIUsageCreditSummaryState.FetchAIUsageCreditSummaryIsLoading = true;
        state.FetchAIUsageCreditSummaryState.FetchAIUsageCreditSummaryIsSuccess = false;
        state.FetchAIUsageCreditSummaryState.FetchAIUsageCreditSummaryIsError =
          null;
      })
      .addCase(fetchAIUsageCreditSummary.fulfilled, (state, action) => {
        state.FetchAIUsageCreditSummaryState.FetchAIUsageCreditSummaryIsLoading = false;
        state.FetchAIUsageCreditSummaryState.FetchAIUsageCreditSummaryIsSuccess = true;
        state.FetchAIUsageCreditSummaryState.FetchAIUsageCreditSummaryData =
          action.payload;
      })
      .addCase(fetchAIUsageCreditSummary.rejected, (state, action) => {
        state.FetchAIUsageCreditSummaryState.FetchAIUsageCreditSummaryIsLoading = false;
        state.FetchAIUsageCreditSummaryState.FetchAIUsageCreditSummaryIsSuccess = false;
        state.FetchAIUsageCreditSummaryState.FetchAIUsageCreditSummaryIsError =
          action.payload as string | object;
      })
      // AIUsageCreditDaily
      .addCase(fetchAIUsageCreditDaily.pending, (state) => {
        state.FetchAIUsageCreditDailyState.FetchAIUsageCreditDailyIsLoading = true;
        state.FetchAIUsageCreditDailyState.FetchAIUsageCreditDailyIsSuccess = false;
        state.FetchAIUsageCreditDailyState.FetchAIUsageCreditDailyIsError =
          null;
      })
      .addCase(fetchAIUsageCreditDaily.fulfilled, (state, action) => {
        state.FetchAIUsageCreditDailyState.FetchAIUsageCreditDailyIsLoading = false;
        state.FetchAIUsageCreditDailyState.FetchAIUsageCreditDailyIsSuccess = true;
        state.FetchAIUsageCreditDailyState.FetchAIUsageCreditDailyData =
          action.payload;
      })
      .addCase(fetchAIUsageCreditDaily.rejected, (state, action) => {
        state.FetchAIUsageCreditDailyState.FetchAIUsageCreditDailyIsLoading = false;
        state.FetchAIUsageCreditDailyState.FetchAIUsageCreditDailyIsSuccess = false;
        state.FetchAIUsageCreditDailyState.FetchAIUsageCreditDailyIsError =
          action.payload as string | object;
      })
      // AIUsageByFeature
      .addCase(fetchAIUsageByFeature.pending, (state) => {
        state.FetchAIUsageByFeatureState.FetchAIUsageByFeatureIsLoading = true;
        state.FetchAIUsageByFeatureState.FetchAIUsageByFeatureIsSuccess = false;
        state.FetchAIUsageByFeatureState.FetchAIUsageByFeatureIsError = null;
      })
      .addCase(fetchAIUsageByFeature.fulfilled, (state, action) => {
        state.FetchAIUsageByFeatureState.FetchAIUsageByFeatureIsLoading = false;
        state.FetchAIUsageByFeatureState.FetchAIUsageByFeatureIsSuccess = true;
        state.FetchAIUsageByFeatureState.FetchAIUsageByFeatureData =
          action.payload;
      })
      .addCase(fetchAIUsageByFeature.rejected, (state, action) => {
        state.FetchAIUsageByFeatureState.FetchAIUsageByFeatureIsLoading = false;
        state.FetchAIUsageByFeatureState.FetchAIUsageByFeatureIsSuccess = false;
        state.FetchAIUsageByFeatureState.FetchAIUsageByFeatureIsError =
          action.payload as string | object;
      })
      // AI usage summary
      .addCase(fetchAIUsageSummary.pending, (state) => {
        state.FetchAIUsageSummaryState.FetchAIUsageSummaryIsLoading = true;
        state.FetchAIUsageSummaryState.FetchAIUsageSummaryIsSuccess = false;
        state.FetchAIUsageSummaryState.FetchAIUsageSummaryIsError = null;
      })
      .addCase(fetchAIUsageSummary.fulfilled, (state, action) => {
        state.FetchAIUsageSummaryState.FetchAIUsageSummaryIsLoading = false;
        state.FetchAIUsageSummaryState.FetchAIUsageSummaryIsSuccess = true;
        state.FetchAIUsageSummaryState.FetchAIUsageSummaryData = action.payload;
      })
      .addCase(fetchAIUsageSummary.rejected, (state, action) => {
        state.FetchAIUsageSummaryState.FetchAIUsageSummaryIsLoading = false;
        state.FetchAIUsageSummaryState.FetchAIUsageSummaryIsSuccess = false;
        state.FetchAIUsageSummaryState.FetchAIUsageSummaryIsError =
          action.payload as string | object;
      })
      // Daily usage
      .addCase(fetchAIUsageDaily.pending, (state) => {
        state.FetchAIUsageDailyState.FetchAIUsageDailyIsLoading = true;
        state.FetchAIUsageDailyState.FetchAIUsageDailyIsSuccess = false;
        state.FetchAIUsageDailyState.FetchAIUsageDailyIsError = null;
      })
      .addCase(fetchAIUsageDaily.fulfilled, (state, action) => {
        state.FetchAIUsageDailyState.FetchAIUsageDailyIsLoading = false;
        state.FetchAIUsageDailyState.FetchAIUsageDailyIsSuccess = true;
        state.FetchAIUsageDailyState.FetchAIUsageDailyData = action.payload;
      })
      .addCase(fetchAIUsageDaily.rejected, (state, action) => {
        state.FetchAIUsageDailyState.FetchAIUsageDailyIsLoading = false;
        state.FetchAIUsageDailyState.FetchAIUsageDailyIsSuccess = false;
        state.FetchAIUsageDailyState.FetchAIUsageDailyIsError =
          action.payload as string | object;
      })
      // Token split
      .addCase(fetchAIUsageTokenSplit.pending, (state) => {
        state.FetchAIUsageTokenSplitState.FetchAIUsageTokenSplitIsLoading = true;
        state.FetchAIUsageTokenSplitState.FetchAIUsageTokenSplitIsSuccess = false;
        state.FetchAIUsageTokenSplitState.FetchAIUsageTokenSplitIsError = null;
      })
      .addCase(fetchAIUsageTokenSplit.fulfilled, (state, action) => {
        state.FetchAIUsageTokenSplitState.FetchAIUsageTokenSplitIsLoading = false;
        state.FetchAIUsageTokenSplitState.FetchAIUsageTokenSplitIsSuccess = true;
        state.FetchAIUsageTokenSplitState.FetchAIUsageTokenSplitData =
          action.payload;
      })
      .addCase(fetchAIUsageTokenSplit.rejected, (state, action) => {
        state.FetchAIUsageTokenSplitState.FetchAIUsageTokenSplitIsLoading = false;
        state.FetchAIUsageTokenSplitState.FetchAIUsageTokenSplitIsSuccess = false;
        state.FetchAIUsageTokenSplitState.FetchAIUsageTokenSplitIsError =
          action.payload as string | object;
      })
      // Workflow costs
      .addCase(fetchAIUsageWorkflowCosts.pending, (state) => {
        state.FetchAIUsageWorkflowCostsState.FetchAIUsageWorkflowCostsIsLoading = true;
        state.FetchAIUsageWorkflowCostsState.FetchAIUsageWorkflowCostsIsSuccess = false;
        state.FetchAIUsageWorkflowCostsState.FetchAIUsageWorkflowCostsIsError =
          null;
      })
      .addCase(fetchAIUsageWorkflowCosts.fulfilled, (state, action) => {
        state.FetchAIUsageWorkflowCostsState.FetchAIUsageWorkflowCostsIsLoading = false;
        state.FetchAIUsageWorkflowCostsState.FetchAIUsageWorkflowCostsIsSuccess = true;
        state.FetchAIUsageWorkflowCostsState.FetchAIUsageWorkflowCostsData =
          action.payload;
      })
      .addCase(fetchAIUsageWorkflowCosts.rejected, (state, action) => {
        state.FetchAIUsageWorkflowCostsState.FetchAIUsageWorkflowCostsIsLoading = false;
        state.FetchAIUsageWorkflowCostsState.FetchAIUsageWorkflowCostsIsSuccess = false;
        state.FetchAIUsageWorkflowCostsState.FetchAIUsageWorkflowCostsIsError =
          action.payload as string | object;
      })
      // Latency trend
      .addCase(fetchAIUsageLatencyTrend.pending, (state) => {
        state.FetchAIUsageLatencyTrendState.FetchAIUsageLatencyTrendIsLoading = true;
        state.FetchAIUsageLatencyTrendState.FetchAIUsageLatencyTrendIsSuccess = false;
        state.FetchAIUsageLatencyTrendState.FetchAIUsageLatencyTrendIsError =
          null;
      })
      .addCase(fetchAIUsageLatencyTrend.fulfilled, (state, action) => {
        state.FetchAIUsageLatencyTrendState.FetchAIUsageLatencyTrendIsLoading = false;
        state.FetchAIUsageLatencyTrendState.FetchAIUsageLatencyTrendIsSuccess = true;
        state.FetchAIUsageLatencyTrendState.FetchAIUsageLatencyTrendData =
          action.payload;
      })
      .addCase(fetchAIUsageLatencyTrend.rejected, (state, action) => {
        state.FetchAIUsageLatencyTrendState.FetchAIUsageLatencyTrendIsLoading = false;
        state.FetchAIUsageLatencyTrendState.FetchAIUsageLatencyTrendIsSuccess = false;
        state.FetchAIUsageLatencyTrendState.FetchAIUsageLatencyTrendIsError =
          action.payload as string | object;
      });
  },
});

export default AIUsageSlice.reducer;
