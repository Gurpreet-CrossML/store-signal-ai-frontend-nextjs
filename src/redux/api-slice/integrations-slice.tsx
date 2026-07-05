"use client";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { axiosInstance } from "@/redux/axios-config";
import { toast } from "sonner";
import { ENDPOINTS } from "@/lib/config";
import type { IntegrationCatalogItem } from "@/lib/integration-types";

export type StoreIntegrationRecord = {
  id: number;
  integration: number;
};

export const fetchIntegrationsCatalog = createAsyncThunk<
  IntegrationCatalogItem[]
>("Integrations/fetchCatalog", async (_, thunkAPI) => {
  try {
    const response = await axiosInstance.get(
      ENDPOINTS.fetchIntegrationsCatalog(),
    );
    return response.data.data || response.data;
  } catch (error) {
    const response = isAxiosError(error) ? error.response : undefined;
    return thunkAPI.rejectWithValue(response?.data || "Something went wrong");
  }
});

export const fetchStoreIntegrations = createAsyncThunk<
  StoreIntegrationRecord[],
  number
>("Integrations/fetchStoreIntegrations", async (storeId, thunkAPI) => {
  try {
    const response = await axiosInstance.get(
      ENDPOINTS.storeIntegrations(storeId),
      {
        useBackend: true,
      },
    );
    return response.data.data || response.data;
  } catch (error) {
    const response = isAxiosError(error) ? error.response : undefined;
    return thunkAPI.rejectWithValue(response?.data || "Something went wrong");
  }
});

export const connectStoreIntegration = createAsyncThunk<
  { id: number; integrationId: number },
  {
    storeId: number;
    integrationId: number;
    attributeValues?: Record<string, string>;
  }
>(
  "Integrations/connectStoreIntegration",
  async ({ storeId, integrationId, attributeValues }, thunkAPI) => {
    try {
      const payload: Record<string, unknown> = {
        integration_id: integrationId,
        store: storeId,
      };
      if (attributeValues) {
        payload.attribute_values = attributeValues;
      }

      const response = await axiosInstance.post(
        ENDPOINTS.storeIntegrations(storeId),
        payload,
        {
          useBackend: true,
        },
      );
      toast.success("Integration enabled");
      const data = response.data.data || response.data;
      return { id: data.id, integrationId };
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data as
        | { message?: string; detail?: string; error?: string }
        | undefined;
      toast.error(
        data?.message ||
          data?.detail ||
          data?.error ||
          (error instanceof Error ? error.message : "") ||
          "Something went wrong.",
      );
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const deleteStoreIntegration = createAsyncThunk<
  { integrationId: number },
  { storeId: number; integrationId: number }
>(
  "Integrations/deleteStoreIntegration",
  async ({ storeId, integrationId }, thunkAPI) => {
    try {
      await axiosInstance.delete(
        ENDPOINTS.deleteStoreIntegration(storeId, integrationId),
        {
          useBackend: true,
        },
      );
      toast.success("Integration disabled");
      return { integrationId };
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data as
        | { message?: string; detail?: string; error?: string }
        | undefined;
      toast.error(
        data?.message ||
          data?.detail ||
          data?.error ||
          (error instanceof Error ? error.message : "") ||
          "Something went wrong.",
      );
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const testStoreIntegrationConnection = createAsyncThunk<
  { message?: string; detail?: string },
  {
    storeId: number;
    integrationId: number;
    attributeValues: Record<string, string>;
  }
>(
  "Integrations/testConnection",
  async ({ storeId, integrationId, attributeValues }, thunkAPI) => {
    try {
      const response = await axiosInstance.post(
        ENDPOINTS.testStoreIntegrationConnection(storeId),
        {
          integration_id: integrationId,
          attribute_values: attributeValues,
        },
        {
          useBackend: true,
        },
      );
      return response.data.data || response.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      return thunkAPI.rejectWithValue(response?.data || "Something went wrong");
    }
  },
);

export const fetchStoreIntegrationDetail = createAsyncThunk<
  { id: number; stored_attributes: { code: string; value: string }[] },
  { storeId: number; storeIntegrationRowId: number }
>(
  "Integrations/fetchDetail",
  async ({ storeId, storeIntegrationRowId }, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        ENDPOINTS.updateStoreIntegration(storeId, storeIntegrationRowId),
        {
          useBackend: true,
        },
      );
      return response.data.data || response.data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      return thunkAPI.rejectWithValue(response?.data || "Something went wrong");
    }
  },
);

const IntegrationsSlice = createSlice({
  name: "Integrations",
  initialState: {
    IntegrationsState: {
      catalogIsLoading: false,
      catalog: [] as IntegrationCatalogItem[],
      storeIntegrationsIsLoading: false,
      storeIntegrations: [] as StoreIntegrationRecord[],
      enabledIds: {} as Record<number, boolean>,
      savedIds: {} as Record<number, boolean>,
      storeIntegrationIds: {} as Record<number, number>,
    },
  },
  reducers: {
    setEnabledId: (
      state,
      action: PayloadAction<{ id: number; enabled: boolean }>,
    ) => {
      state.IntegrationsState.enabledIds[action.payload.id] =
        action.payload.enabled;
    },
    resetIntegrationsState: (state) => {
      state.IntegrationsState.storeIntegrations = [];
      state.IntegrationsState.enabledIds = {};
      state.IntegrationsState.savedIds = {};
      state.IntegrationsState.storeIntegrationIds = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIntegrationsCatalog.pending, (state) => {
        state.IntegrationsState.catalogIsLoading = true;
      })
      .addCase(fetchIntegrationsCatalog.fulfilled, (state, action) => {
        state.IntegrationsState.catalogIsLoading = false;
        state.IntegrationsState.catalog = action.payload || [];
      })
      .addCase(fetchIntegrationsCatalog.rejected, (state) => {
        state.IntegrationsState.catalogIsLoading = false;
        state.IntegrationsState.catalog = [];
      })
      .addCase(fetchStoreIntegrations.pending, (state) => {
        state.IntegrationsState.storeIntegrationsIsLoading = true;
      })
      .addCase(fetchStoreIntegrations.fulfilled, (state, action) => {
        state.IntegrationsState.storeIntegrationsIsLoading = false;
        const data = action.payload || [];
        state.IntegrationsState.storeIntegrations = data;
        const ids: Record<number, boolean> = {};
        const rowIds: Record<number, number> = {};
        for (const row of data) {
          ids[row.integration] = true;
          rowIds[row.integration] = row.id;
        }
        state.IntegrationsState.savedIds = ids;
        state.IntegrationsState.enabledIds = ids;
        state.IntegrationsState.storeIntegrationIds = rowIds;
      })
      .addCase(fetchStoreIntegrations.rejected, (state) => {
        state.IntegrationsState.storeIntegrationsIsLoading = false;
      })
      .addCase(connectStoreIntegration.fulfilled, (state, action) => {
        const { integrationId, id } = action.payload;
        state.IntegrationsState.enabledIds[integrationId] = true;
        state.IntegrationsState.savedIds[integrationId] = true;
        state.IntegrationsState.storeIntegrationIds[integrationId] = id;
      })
      .addCase(deleteStoreIntegration.fulfilled, (state, action) => {
        const { integrationId } = action.payload;
        state.IntegrationsState.enabledIds[integrationId] = false;
        state.IntegrationsState.savedIds[integrationId] = false;
        delete state.IntegrationsState.storeIntegrationIds[integrationId];
      });
  },
});

export const { setEnabledId, resetIntegrationsState } =
  IntegrationsSlice.actions;

export default IntegrationsSlice.reducer;
