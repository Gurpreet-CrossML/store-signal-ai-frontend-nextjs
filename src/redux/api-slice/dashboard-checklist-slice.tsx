import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";

import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "../axios-config";

export type ChecklistStepKey =
  | "connected"
  | "widget_live"
  | "brand_voice"
  | "social";

export type ChecklistStep = {
  done: boolean;
  skipped?: boolean;
  /** brand_voice's two halves — the Agent Name and the tone preset. */
  persona_done?: boolean;
  tone_done?: boolean;
};

export type ChecklistStore = {
  code: string;
  name: string;
  platform: string;
  widget_key: string;
};

export type DashboardChecklist = {
  store: ChecklistStore;
  steps: Record<ChecklistStepKey, ChecklistStep>;
  pending: ChecklistStepKey[];
  total: number;
  completed: number;
};

export const FetchDashboardChecklist = createAsyncThunk(
  "FetchDashboardChecklist",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.dashboardChecklist()}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as DashboardChecklist;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      return thunkAPI.rejectWithValue(
        response?.data || "Couldn't load your setup checklist.",
      );
    }
  },
);

const DashboardChecklistSlice = createSlice({
  name: "DashboardChecklist",
  initialState: {
    FetchDashboardChecklistState: {
      FetchDashboardChecklistIsLoading: false,
      FetchDashboardChecklistIsSuccess: false,
      FetchDashboardChecklistIsError: null as null | string | object,
      FetchDashboardChecklistData: null as DashboardChecklist | null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchDashboardChecklist.pending, (state) => {
        state.FetchDashboardChecklistState.FetchDashboardChecklistIsLoading = true;
        state.FetchDashboardChecklistState.FetchDashboardChecklistIsError =
          null;
      })
      .addCase(FetchDashboardChecklist.fulfilled, (state, action) => {
        state.FetchDashboardChecklistState.FetchDashboardChecklistIsLoading = false;
        state.FetchDashboardChecklistState.FetchDashboardChecklistIsSuccess = true;
        state.FetchDashboardChecklistState.FetchDashboardChecklistData =
          action.payload;
      })
      .addCase(FetchDashboardChecklist.rejected, (state, action) => {
        state.FetchDashboardChecklistState.FetchDashboardChecklistIsLoading = false;
        state.FetchDashboardChecklistState.FetchDashboardChecklistIsError =
          action.payload as string | object;
      });
  },
});

export default DashboardChecklistSlice.reducer;
