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
      toast.error("Couldn't load store settings.", {
        description: data?.message || "Unable to load store settings.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't load store settings.");
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
      toast.error("Couldn't save store settings.", {
        description: data?.message || "Unable to save store settings.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't save store settings.");
    }
  },
);

/** One platform workflow as the selected store sees it. */
export type StoreWorkflow = {
  code: string;
  name: string;
  description: string;
  /** Temporary download URL of the workflow's icon, or null for none. */
  icon: string | null;
  /** Short grouping labels, e.g. ["sales", "offers"]. */
  tags: string[];
  /** Whether the workflow needs a Shopify / Magento connection to work. */
  shopify_supported: boolean;
  magento_supported: boolean;
  /** Whether the workflow needs the store's knowledge base. */
  kb_supported: boolean;
  /** Position in the list; the API already returns workflows in this order. */
  order: number;
  /** False when the platform has locked the workflow on. */
  can_disable: boolean;
  is_enabled: boolean;
};

export const FetchStoreWorkflows = createAsyncThunk(
  "FetchStoreWorkflows",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.storeWorkflows()}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as StoreWorkflow[];
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load workflows.", {
        description: data?.message || "Unable to load workflows.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't load workflows.");
    }
  },
);

export const UpdateStoreWorkflow = createAsyncThunk(
  "UpdateStoreWorkflow",
  async (
    {
      storeCode,
      code,
      isEnabled,
    }: { storeCode: string; code: string; isEnabled: boolean },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.storeWorkflows()}?store_code=${storeCode}`,
        { workflow: code, is_enabled: isEnabled },
        { useBackend: true },
      );
      return response.data.data as { workflow: string; is_enabled: boolean };
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't update this workflow.", {
        description: data?.message || "Unable to update this workflow.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't update this workflow.");
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
    FetchStoreWorkflowsState: {
      FetchStoreWorkflowsIsLoading: false,
      FetchStoreWorkflowsIsSuccess: false,
      FetchStoreWorkflowsIsError: null as null | string | object,
      FetchStoreWorkflowsData: [] as StoreWorkflow[],
    },
    UpdateStoreWorkflowState: {
      // Code of the workflow being saved, so only its switch waits.
      UpdateStoreWorkflowPendingCode: null as null | string,
      UpdateStoreWorkflowIsError: null as null | string | object,
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
      })
      .addCase(FetchStoreWorkflows.pending, (state) => {
        state.FetchStoreWorkflowsState.FetchStoreWorkflowsIsLoading = true;
        state.FetchStoreWorkflowsState.FetchStoreWorkflowsIsSuccess = false;
        state.FetchStoreWorkflowsState.FetchStoreWorkflowsIsError = null;
      })
      .addCase(FetchStoreWorkflows.fulfilled, (state, action) => {
        state.FetchStoreWorkflowsState.FetchStoreWorkflowsIsLoading = false;
        state.FetchStoreWorkflowsState.FetchStoreWorkflowsIsSuccess = true;
        state.FetchStoreWorkflowsState.FetchStoreWorkflowsData =
          action.payload ?? [];
      })
      .addCase(FetchStoreWorkflows.rejected, (state, action) => {
        state.FetchStoreWorkflowsState.FetchStoreWorkflowsIsLoading = false;
        state.FetchStoreWorkflowsState.FetchStoreWorkflowsIsError =
          action.payload as string | object;
      })
      .addCase(UpdateStoreWorkflow.pending, (state, action) => {
        state.UpdateStoreWorkflowState.UpdateStoreWorkflowPendingCode =
          action.meta.arg.code;
        state.UpdateStoreWorkflowState.UpdateStoreWorkflowIsError = null;
      })
      .addCase(UpdateStoreWorkflow.fulfilled, (state, action) => {
        state.UpdateStoreWorkflowState.UpdateStoreWorkflowPendingCode = null;
        // Keep the list in step with what was saved, without a refetch.
        const saved =
          state.FetchStoreWorkflowsState.FetchStoreWorkflowsData.find(
            (workflow) => workflow.code === action.payload.workflow,
          );
        if (saved) saved.is_enabled = action.payload.is_enabled;
      })
      .addCase(UpdateStoreWorkflow.rejected, (state, action) => {
        state.UpdateStoreWorkflowState.UpdateStoreWorkflowPendingCode = null;
        state.UpdateStoreWorkflowState.UpdateStoreWorkflowIsError =
          action.payload as string | object;
      });
  },
});

export default StoreSettingsSlice.reducer;
