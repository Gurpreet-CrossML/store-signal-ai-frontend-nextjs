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

/** Usage and consumption totals for a single calendar date. */
export type DailyUsagePoint = {
  date: string;
  usage: number;
  consumption: number;
};

/** Cost attributed to a workflow. */
export type WorkflowCostPoint = { workflow: string; cost: number };

/** Number of calls attributed to an agent. */
export type AgentCallPoint = { agent: string; calls: number };

/** Input, output, and combined token totals for a model. */
export type ModelTokenPoint = {
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
};

/** Average request latency for a single calendar date. */
export type LatencyPoint = { date: string; latency: number };

/** AI usage data stored in Redux for summary cards and charts. */
export type AIUsageResponse = {
  summary: AIUsageSummary;
  charts: {
    daily_usage: DailyUsagePoint[];
    workflow_costs: WorkflowCostPoint[];
    agent_calls: AgentCallPoint[];
    agent_workflows: string[];
    model_tokens: ModelTokenPoint[];
    latency_trend: LatencyPoint[];
  };
};

/** Filters accepted by every AI usage endpoint. */
export type AIUsageFilters = {
  storeCode: string;
  workflowId?: string;
  agentId?: string;
  model?: string;
  from?: string;
  to?: string;
};

/** Token totals returned by the token split endpoint. */
type TokenSplitData = Pick<
  AIUsageSummary,
  "input_tokens" | "output_tokens" | "total_tokens"
>;

/** Agent call chart points and workflow filter options from the backend. */
type AgentCallsData = {
  workflows: string[];
  results: AgentCallPoint[];
};

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
  if (filters.workflowId) params.set("workflow_id", filters.workflowId);
  if (filters.agentId) params.set("agent_id", filters.agentId);
  if (filters.model) params.set("model", filters.model);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return params;
}

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

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch AI usage summary, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
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

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch daily AI usage, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
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

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch AI token split, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
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

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch AI workflow costs, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

/** Fetches agent call totals and the workflows available for agent filtering. */
export const fetchAIUsageAgentCalls = createAsyncThunk(
  "aiUsage/fetchAgentCalls",
  async (filters: AIUsageFilters, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchAIUsageAgentCalls()}?${paramsFor(filters).toString()}`,
        { useBackend: true },
      );
      return response.data.data as AgentCallsData;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch AI agent calls, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

/** Fetches model token chart data without modifying the backend response. */
export const fetchAIUsageModelTokens = createAsyncThunk(
  "aiUsage/fetchModelTokens",
  async (filters: AIUsageFilters, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchAIUsageModelTokens()}?${paramsFor(filters).toString()}`,
        { useBackend: true },
      );
      return response.data.data as ModelTokenPoint[];
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch AI model tokens, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
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

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch AI latency trend, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const AIUsageSlice = createSlice({
  name: "AIUsage",
  initialState: {
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
    FetchAIUsageAgentCallsState: {
      FetchAIUsageAgentCallsIsLoading: false,
      FetchAIUsageAgentCallsIsSuccess: false,
      FetchAIUsageAgentCallsIsError: null as null | string | object,
      FetchAIUsageAgentCallsData: {
        workflows: [],
        results: [],
      } as AgentCallsData,
    },
    FetchAIUsageModelTokensState: {
      FetchAIUsageModelTokensIsLoading: false,
      FetchAIUsageModelTokensIsSuccess: false,
      FetchAIUsageModelTokensIsError: null as null | string | object,
      FetchAIUsageModelTokensData: [] as ModelTokenPoint[],
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
      // Agent calls
      .addCase(fetchAIUsageAgentCalls.pending, (state) => {
        state.FetchAIUsageAgentCallsState.FetchAIUsageAgentCallsIsLoading = true;
        state.FetchAIUsageAgentCallsState.FetchAIUsageAgentCallsIsSuccess = false;
        state.FetchAIUsageAgentCallsState.FetchAIUsageAgentCallsIsError = null;
      })
      .addCase(fetchAIUsageAgentCalls.fulfilled, (state, action) => {
        state.FetchAIUsageAgentCallsState.FetchAIUsageAgentCallsIsLoading = false;
        state.FetchAIUsageAgentCallsState.FetchAIUsageAgentCallsIsSuccess = true;
        state.FetchAIUsageAgentCallsState.FetchAIUsageAgentCallsData =
          action.payload;
      })
      .addCase(fetchAIUsageAgentCalls.rejected, (state, action) => {
        state.FetchAIUsageAgentCallsState.FetchAIUsageAgentCallsIsLoading = false;
        state.FetchAIUsageAgentCallsState.FetchAIUsageAgentCallsIsSuccess = false;
        state.FetchAIUsageAgentCallsState.FetchAIUsageAgentCallsIsError =
          action.payload as string | object;
      })
      // Model tokens
      .addCase(fetchAIUsageModelTokens.pending, (state) => {
        state.FetchAIUsageModelTokensState.FetchAIUsageModelTokensIsLoading = true;
        state.FetchAIUsageModelTokensState.FetchAIUsageModelTokensIsSuccess = false;
        state.FetchAIUsageModelTokensState.FetchAIUsageModelTokensIsError =
          null;
      })
      .addCase(fetchAIUsageModelTokens.fulfilled, (state, action) => {
        state.FetchAIUsageModelTokensState.FetchAIUsageModelTokensIsLoading = false;
        state.FetchAIUsageModelTokensState.FetchAIUsageModelTokensIsSuccess = true;
        state.FetchAIUsageModelTokensState.FetchAIUsageModelTokensData =
          action.payload;
      })
      .addCase(fetchAIUsageModelTokens.rejected, (state, action) => {
        state.FetchAIUsageModelTokensState.FetchAIUsageModelTokensIsLoading = false;
        state.FetchAIUsageModelTokensState.FetchAIUsageModelTokensIsSuccess = false;
        state.FetchAIUsageModelTokensState.FetchAIUsageModelTokensIsError =
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
