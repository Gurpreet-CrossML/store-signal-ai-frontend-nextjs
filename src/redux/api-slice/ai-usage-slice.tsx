import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "@/redux/axios-config";

export type AIUsageSummary = {
  total_cost: number;
  total_records: number;
  average_latency: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
};

export type DailyUsagePoint = {
  date: string;
  usage: number;
  consumption: number;
};
export type WorkflowCostPoint = { workflow: string; cost: number };
export type AgentCallPoint = { agent: string; calls: number };
export type ModelTokenPoint = {
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
};
export type LatencyPoint = { date: string; latency: number };

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

function number(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function paramsFor(filters: AIUsageFilters) {
  const params = new URLSearchParams({ store_code: filters.storeCode });
  if (filters.workflowId) params.set("workflow_id", filters.workflowId);
  if (filters.agentId) params.set("agent_id", filters.agentId);
  if (filters.model) params.set("model", filters.model);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return params;
}

async function getAIUsageData<T>(endpoint: string, filters: AIUsageFilters) {
  const response = await axiosInstance.get(
    `${endpoint}?${paramsFor(filters).toString()}`,
    { useBackend: true },
  );
  return response.data.data as T;
}

export const fetchAIUsageSummary = createAsyncThunk(
  "aiUsage/fetchSummary",
  async (filters: AIUsageFilters) => {
    const data = await getAIUsageData<Record<string, unknown>>(
      ENDPOINTS.fetchAIUsageSummary(),
      filters,
    );
    return {
      total_cost: number(data.total_cost),
      total_records: number(data.total_records),
      average_latency: number(data.average_latency),
      total_tokens: number(data.total_tokens),
      input_tokens: number(data.input_tokens),
      output_tokens: number(data.output_tokens),
    } satisfies AIUsageSummary;
  },
);

export const fetchAIUsageDaily = createAsyncThunk(
  "aiUsage/fetchDaily",
  async (filters: AIUsageFilters) => {
    const data = await getAIUsageData<Record<string, unknown>[]>(
      ENDPOINTS.fetchAIUsageDaily(),
      filters,
    );
    return data.map((item) => ({
      date: String(item.date),
      usage: number(item.usage),
      consumption: number(item.consumption),
    }));
  },
);

export const fetchAIUsageTokenSplit = createAsyncThunk(
  "aiUsage/fetchTokenSplit",
  async (filters: AIUsageFilters) => {
    const data = await getAIUsageData<Record<string, unknown>>(
      ENDPOINTS.fetchAIUsageTokenSplit(),
      filters,
    );
    return {
      input_tokens: number(data.input_tokens),
      output_tokens: number(data.output_tokens),
      total_tokens: number(data.total_tokens),
    };
  },
);

export const fetchAIUsageWorkflowCosts = createAsyncThunk(
  "aiUsage/fetchWorkflowCosts",
  async (filters: AIUsageFilters) => {
    const data = await getAIUsageData<Record<string, unknown>[]>(
      ENDPOINTS.fetchAIUsageWorkflowCosts(),
      filters,
    );
    return data.map((item) => ({
      workflow: String(item.workflow),
      cost: number(item.cost),
    }));
  },
);

export const fetchAIUsageAgentCalls = createAsyncThunk(
  "aiUsage/fetchAgentCalls",
  async (filters: AIUsageFilters) => {
    const data = await getAIUsageData<{
      workflows?: unknown[];
      results?: Record<string, unknown>[];
    }>(ENDPOINTS.fetchAIUsageAgentCalls(), filters);
    return {
      workflows: (data.workflows ?? []).map(String),
      results: (data.results ?? []).map((item) => ({
        agent: String(item.agent),
        calls: number(item.calls),
      })),
    };
  },
);

export const fetchAIUsageModelTokens = createAsyncThunk(
  "aiUsage/fetchModelTokens",
  async (filters: AIUsageFilters) => {
    const data = await getAIUsageData<Record<string, unknown>[]>(
      ENDPOINTS.fetchAIUsageModelTokens(),
      filters,
    );
    return data.map((item) => ({
      model: String(item.model),
      input_tokens: number(item.input_tokens),
      output_tokens: number(item.output_tokens),
      total_tokens: number(item.total_tokens),
    }));
  },
);

export const fetchAIUsageLatencyTrend = createAsyncThunk(
  "aiUsage/fetchLatencyTrend",
  async (filters: AIUsageFilters) => {
    const data = await getAIUsageData<Record<string, unknown>[]>(
      ENDPOINTS.fetchAIUsageLatencyTrend(),
      filters,
    );
    return data.map((item) => ({
      date: String(item.date),
      latency: number(item.latency),
    }));
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
