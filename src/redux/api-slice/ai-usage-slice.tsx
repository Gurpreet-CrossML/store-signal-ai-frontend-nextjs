import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";

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

type LoadingState = {
  summary: boolean;
  dailyUsage: boolean;
  tokenSplit: boolean;
  workflowCosts: boolean;
  agentCalls: boolean;
  modelTokens: boolean;
  latencyTrend: boolean;
};

const emptySummary: AIUsageSummary = {
  total_cost: 0,
  total_records: 0,
  average_latency: 0,
  total_tokens: 0,
  input_tokens: 0,
  output_tokens: 0,
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
      const message = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unable to fetch AI usage summary.";
      return thunkAPI.rejectWithValue(message);
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
      const message = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unable to fetch daily AI usage.";
      return thunkAPI.rejectWithValue(message);
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
      return response.data.data as Pick<
        AIUsageSummary,
        "input_tokens" | "output_tokens" | "total_tokens"
      >;
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unable to fetch AI token split.";
      return thunkAPI.rejectWithValue(message);
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
      const message = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unable to fetch AI workflow costs.";
      return thunkAPI.rejectWithValue(message);
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
      return response.data.data as {
        workflows: string[];
        results: AgentCallPoint[];
      };
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unable to fetch AI agent calls.";
      return thunkAPI.rejectWithValue(message);
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
      const message = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unable to fetch AI model tokens.";
      return thunkAPI.rejectWithValue(message);
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
      const message = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unable to fetch AI latency trend.";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const initialLoading: LoadingState = {
  summary: false,
  dailyUsage: false,
  tokenSplit: false,
  workflowCosts: false,
  agentCalls: false,
  modelTokens: false,
  latencyTrend: false,
};

const slice = createSlice({
  name: "aiUsage",
  initialState: {
    data: {
      summary: emptySummary,
      charts: {
        daily_usage: [],
        workflow_costs: [],
        agent_calls: [],
        agent_workflows: [],
        model_tokens: [],
        latency_trend: [],
      },
    } as AIUsageResponse,
    loading: initialLoading,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAIUsageSummary.pending, (state) => {
        state.loading.summary = true;
      })
      .addCase(fetchAIUsageSummary.fulfilled, (state, action) => {
        state.data.summary = action.payload;
        state.loading.summary = false;
      })
      .addCase(fetchAIUsageSummary.rejected, (state) => {
        state.loading.summary = false;
      })
      .addCase(fetchAIUsageDaily.pending, (state) => {
        state.loading.dailyUsage = true;
      })
      .addCase(fetchAIUsageDaily.fulfilled, (state, action) => {
        state.data.charts.daily_usage = action.payload;
        state.loading.dailyUsage = false;
      })
      .addCase(fetchAIUsageDaily.rejected, (state) => {
        state.loading.dailyUsage = false;
      })
      .addCase(fetchAIUsageTokenSplit.pending, (state) => {
        state.loading.tokenSplit = true;
      })
      .addCase(fetchAIUsageTokenSplit.fulfilled, (state, action) => {
        // Token split is displayed as a chart but belongs to the summary payload.
        state.data.summary.input_tokens = action.payload.input_tokens;
        state.data.summary.output_tokens = action.payload.output_tokens;
        state.data.summary.total_tokens = action.payload.total_tokens;
        state.loading.tokenSplit = false;
      })
      .addCase(fetchAIUsageTokenSplit.rejected, (state) => {
        state.loading.tokenSplit = false;
      })
      .addCase(fetchAIUsageWorkflowCosts.pending, (state) => {
        state.loading.workflowCosts = true;
      })
      .addCase(fetchAIUsageWorkflowCosts.fulfilled, (state, action) => {
        state.data.charts.workflow_costs = action.payload;
        state.loading.workflowCosts = false;
      })
      .addCase(fetchAIUsageWorkflowCosts.rejected, (state) => {
        state.loading.workflowCosts = false;
      })
      .addCase(fetchAIUsageAgentCalls.pending, (state) => {
        state.loading.agentCalls = true;
      })
      .addCase(fetchAIUsageAgentCalls.fulfilled, (state, action) => {
        // This endpoint supplies both chart points and workflow filter options.
        state.data.charts.agent_calls = action.payload.results;
        state.data.charts.agent_workflows = action.payload.workflows;
        state.loading.agentCalls = false;
      })
      .addCase(fetchAIUsageAgentCalls.rejected, (state) => {
        state.loading.agentCalls = false;
      })
      .addCase(fetchAIUsageModelTokens.pending, (state) => {
        state.loading.modelTokens = true;
      })
      .addCase(fetchAIUsageModelTokens.fulfilled, (state, action) => {
        state.data.charts.model_tokens = action.payload;
        state.loading.modelTokens = false;
      })
      .addCase(fetchAIUsageModelTokens.rejected, (state) => {
        state.loading.modelTokens = false;
      })
      .addCase(fetchAIUsageLatencyTrend.pending, (state) => {
        state.loading.latencyTrend = true;
      })
      .addCase(fetchAIUsageLatencyTrend.fulfilled, (state, action) => {
        state.data.charts.latency_trend = action.payload;
        state.loading.latencyTrend = false;
      })
      .addCase(fetchAIUsageLatencyTrend.rejected, (state) => {
        state.loading.latencyTrend = false;
      });
  },
});

export default slice.reducer;
