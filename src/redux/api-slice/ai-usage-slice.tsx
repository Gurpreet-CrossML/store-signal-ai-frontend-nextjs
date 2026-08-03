import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "@/redux/axios-config";

export type AIUsageRow = {
  id: number;
  workflow_id: string;
  agent_id: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: string;
  latency: number;
  model: string;
  created_at: string;
};

export type AIUsageSummary = {
  total_cost: number;
  total_records: number;
  average_latency: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
};

export type AIUsageResponse = {
  count: number;
  results: AIUsageRow[];
  summary: AIUsageSummary;
  charts: {
    workflow_costs: { workflow: string; cost: number }[];
    agent_calls: { agent: string; calls: number }[];
    model_tokens: {
      model: string;
      input_tokens: number;
      output_tokens: number;
    }[];
    latency_trend: { date: string; latency: number }[];
  };
};

type FetchArgs = {
  storeCode: string;
  page: number;
  pageSize: number;
  workflowId?: string;
  agentId?: string;
  model?: string;
  from?: string;
  to?: string;
};

export const fetchAIUsage = createAsyncThunk(
  "aiUsage/fetch",
  async (args: FetchArgs, thunkAPI) => {
    try {
      const params = new URLSearchParams({
        store_code: args.storeCode,
        page: String(args.page),
        page_size: String(args.pageSize),
      });
      if (args.workflowId) params.set("workflow_id", args.workflowId);
      if (args.agentId) params.set("agent_id", args.agentId);
      if (args.model) params.set("model", args.model);
      if (args.from) params.set("from", args.from);
      if (args.to) params.set("to", args.to);
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchAIUsage()}?${params.toString()}`,
      );
      return response.data.data as AIUsageResponse;
    } catch (error) {
      const data = isAxiosError(error) ? error.response?.data : undefined;
      toast.error("Unable to load AI usage", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const emptySummary: AIUsageSummary = {
  total_cost: 0,
  total_records: 0,
  average_latency: 0,
  total_tokens: 0,
  input_tokens: 0,
  output_tokens: 0,
};

const slice = createSlice({
  name: "aiUsage",
  initialState: {
    data: {
      count: 0,
      results: [],
      summary: emptySummary,
      charts: {
        workflow_costs: [],
        agent_calls: [],
        model_tokens: [],
        latency_trend: [],
      },
    } as AIUsageResponse,
    isLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAIUsage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAIUsage.fulfilled, (state, action) => {
        state.data = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchAIUsage.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export default slice.reducer;
