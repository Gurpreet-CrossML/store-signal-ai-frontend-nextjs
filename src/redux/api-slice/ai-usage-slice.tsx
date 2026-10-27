import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "@/redux/axios-config";

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

/** Credit and call totals over the selected range. */
export type AIUsageSummary = { total_calls: number; credits_charged: number };

/** Credits charged on one calendar date. */
export type DailyUsagePoint = { date: string; credits_charged: number };

/** Credits charged by one feature. */
export type FeatureUsage = {
  feature: string;
  calls: number;
  credits_charged: number;
};

export type AIUsageData = {
  credits: CreditStatus | null;
  summary: AIUsageSummary;
  daily: DailyUsagePoint[];
  byFeature: FeatureUsage[];
};

/** Filters accepted by every AI usage report. */
export type AIUsageFilters = { storeCode: string; from: string; to: string };

const emptyData: AIUsageData = {
  credits: null,
  summary: { total_calls: 0, credits_charged: 0 },
  daily: [],
  byFeature: [],
};

/** Fetches the credit status and every usage report for the selected range. */
export const fetchAIUsage = createAsyncThunk(
  "aiUsage/fetch",
  async ({ storeCode, from, to }: AIUsageFilters, thunkAPI) => {
    const params = new URLSearchParams({ store_code: storeCode, from, to });
    const get = async (url: string, extra = "") =>
      (
        await axiosInstance.get(`${url}?${params}${extra}`, {
          useBackend: true,
        })
      ).data.data;
    try {
      const [credits, summary, daily, byFeature] = await Promise.all([
        get(ENDPOINTS.fetchCreditStatus()),
        get(ENDPOINTS.fetchAIUsageSummary()),
        get(ENDPOINTS.fetchAIUsageDaily()),
        get(ENDPOINTS.fetchAIUsageByFeature(), "&customer_facing=true"),
      ]);
      return { credits, summary, daily, byFeature } as AIUsageData;
    } catch (error) {
      const data = isAxiosError(error) ? error.response?.data : undefined;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to fetch AI usage, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const AIUsageSlice = createSlice({
  name: "AIUsage",
  initialState: {
    FetchAIUsageState: {
      FetchAIUsageIsLoading: false,
      FetchAIUsageIsSuccess: false,
      FetchAIUsageIsError: null as null | string | object,
      FetchAIUsageData: emptyData,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAIUsage.pending, (state) => {
        state.FetchAIUsageState.FetchAIUsageIsLoading = true;
        state.FetchAIUsageState.FetchAIUsageIsSuccess = false;
        state.FetchAIUsageState.FetchAIUsageIsError = null;
      })
      .addCase(fetchAIUsage.fulfilled, (state, action) => {
        state.FetchAIUsageState.FetchAIUsageIsLoading = false;
        state.FetchAIUsageState.FetchAIUsageIsSuccess = true;
        state.FetchAIUsageState.FetchAIUsageData = action.payload;
      })
      .addCase(fetchAIUsage.rejected, (state, action) => {
        state.FetchAIUsageState.FetchAIUsageIsLoading = false;
        state.FetchAIUsageState.FetchAIUsageIsSuccess = false;
        state.FetchAIUsageState.FetchAIUsageIsError = action.payload as
          | string
          | object;
      });
  },
});

export default AIUsageSlice.reducer;
