import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "../axios-config";

export type StoreSettings = {
  /**
   * Public IPs allowed to load the chatbot widget. Empty means no
   * restriction — the widget renders for everyone.
   */
  allowed_ips: string[];
};

export const FetchStoreAllowedIpsSettings = createAsyncThunk(
  "FetchStoreAllowedIpsSettings",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.storeAllowedIPsSettings()}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as StoreSettings;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to load store settings.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const UpdateStoreAllowedIpsSettings = createAsyncThunk(
  "UpdateStoreAllowedIpsSettings",
  async (
    { storeCode, allowedIps }: { storeCode: string; allowedIps: string[] },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.patch(
        `${ENDPOINTS.storeAllowedIPsSettings()}?store_code=${storeCode}`,
        { allowed_ips: allowedIps },
        { useBackend: true },
      );
      toast.success("Store settings saved.");
      return response.data.data as StoreSettings;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to save store settings.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const StoreSettingsSlice = createSlice({
  name: "StoreSettings",
  initialState: {
    FetchStoreAllowedIpsSettingsState: {
      FetchStoreAllowedIpsSettingsIsLoading: false,
      FetchStoreAllowedIpsSettingsIsSuccess: false,
      FetchStoreAllowedIpsSettingsIsError: null as null | string | object,
      FetchStoreAllowedIpsSettingsData: { allowed_ips: [] } as StoreSettings,
    },
    UpdateStoreAllowedIpsSettingsState: {
      UpdateStoreAllowedIpsSettingsIsLoading: false,
      UpdateStoreAllowedIpsSettingsIsSuccess: false,
      UpdateStoreAllowedIpsSettingsIsError: null as null | string | object,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchStoreAllowedIpsSettings.pending, (state) => {
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsIsLoading = true;
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsIsSuccess = false;
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsIsError =
          null;
      })
      .addCase(FetchStoreAllowedIpsSettings.fulfilled, (state, action) => {
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsIsLoading = false;
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsIsSuccess = true;
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsData =
          {
            allowed_ips: action.payload?.allowed_ips ?? [],
          };
      })
      .addCase(FetchStoreAllowedIpsSettings.rejected, (state, action) => {
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsIsLoading = false;
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsIsError =
          action.payload as string | object;
      })
      .addCase(UpdateStoreAllowedIpsSettings.pending, (state) => {
        state.UpdateStoreAllowedIpsSettingsState.UpdateStoreAllowedIpsSettingsIsLoading = true;
        state.UpdateStoreAllowedIpsSettingsState.UpdateStoreAllowedIpsSettingsIsSuccess = false;
        state.UpdateStoreAllowedIpsSettingsState.UpdateStoreAllowedIpsSettingsIsError =
          null;
      })
      .addCase(UpdateStoreAllowedIpsSettings.fulfilled, (state, action) => {
        state.UpdateStoreAllowedIpsSettingsState.UpdateStoreAllowedIpsSettingsIsLoading = false;
        state.UpdateStoreAllowedIpsSettingsState.UpdateStoreAllowedIpsSettingsIsSuccess = true;
        // Keep the read slot in step so leaving and returning shows the
        // saved list without a refetch.
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsData =
          {
            allowed_ips: action.payload?.allowed_ips ?? [],
          };
      })
      .addCase(UpdateStoreAllowedIpsSettings.rejected, (state, action) => {
        state.UpdateStoreAllowedIpsSettingsState.UpdateStoreAllowedIpsSettingsIsLoading = false;
        state.UpdateStoreAllowedIpsSettingsState.UpdateStoreAllowedIpsSettingsIsError =
          action.payload as string | object;
      });
  },
});

export default StoreSettingsSlice.reducer;
