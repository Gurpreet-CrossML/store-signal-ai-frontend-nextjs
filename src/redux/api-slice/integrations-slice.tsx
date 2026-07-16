import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../axios-config";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ENDPOINTS } from "@/lib/config";

export type IntegrationCategory = {
  id: number;
  name: string;
  description: string;
};

export type Integration = {
  id: number;
  name: string;
  description: string;
  category: IntegrationCategory;
  logo: string;
  is_active: boolean;
  steps_for_creds: string;
  scope: string[];
  attributes: IntegrationAttribute[];
};

export type IntegrationAttribute = {
  name: string;
  code: string;
  display_name: string;
  type: "text" | "password" | "select" | "url";
  is_required: boolean;
  options?: string[];
  order?: number;
  placeholder?: string;
};

export const FetchIntegrations = createAsyncThunk(
  "fetchIntegrations",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchIntegrations()}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch the integrations, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

// A single saved credential/attribute for a store's integration connection.
export type StoreIntegrationAttribute = {
  key: string;
  value: string;
};

// Payload sent to the (in-progress) backend when a store connects an
// integration. The `attribute` list is built dynamically from whatever
// attributes the selected integration defines.
export type ConnectStoreIntegrationPayload = {
  store_code: string;
  integration: number;
  attribute: StoreIntegrationAttribute[];
};

export const ConnectStoreIntegration = createAsyncThunk(
  "connectStoreIntegration",
  async (
    { store_code, integration, attribute }: ConnectStoreIntegrationPayload,
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.connectStoreIntegration()}?store_code=${store_code}`,
        {
          integration,
          // Backend serializer expects the nested list under `attributes`.
          attributes: attribute,
        },
      );
      const data = response.data.data;

      toast.success(
        response?.data?.message || "Integration connected successfully!",
      );

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      if (data?.data?.integration) {
        toast.error("Uh oh! Something went wrong.", {
          description:
            data?.data?.integration[0] ||
            "Unable to connect the integration, please try again later.",
        });
      } else {
        toast.error("Uh oh! Something went wrong.", {
          description:
            data?.message ||
            "Unable to connect the integration, please try again later.",
        });
      }

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export type ConnectedStoreIntegration = {
  id: number;
  integration: number;
  attribute: StoreIntegrationAttribute[];
};

export const FetchStoreIntegrations = createAsyncThunk(
  "fetchStoreIntegrations",
  async (store_code: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.connectStoreIntegration()}?store_code=${store_code}`,
        {
          useBackend: true,
        },
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch the store integrations, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const DisconnectStoreIntegration = createAsyncThunk(
  "disconnectStoreIntegration",
  async (
    // `id` is the StoreIntegration object id (from the connected list), NOT
    // the integration catalog id — the backend deletes by its own pk.
    { store_code, id }: { store_code: string; id: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.delete(
        `${ENDPOINTS.storeIntegrationDetail(id)}?store_code=${store_code}`,
      );
      const data = response.data.data;

      toast.success(
        response?.data?.message || "Integration disconnected successfully!",
      );

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to disconnect the integration, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const IntegrationSlice = createSlice({
  name: "Integration",
  initialState: {
    FetchIntegrationsState: {
      FetchIntegrationsIsLoading: false,
      FetchIntegrationsIsSuccess: false,
      FetchIntegrationsIsError: null as null | string | object,
      FetchIntegrationsListData: [] as Integration[],
    },
    ConnectStoreIntegrationState: {
      ConnectStoreIntegrationIsLoading: false,
      ConnectStoreIntegrationIsSuccess: false,
      ConnectStoreIntegrationIsError: null as null | string | object,
    },
    FetchStoreIntegrationsState: {
      FetchStoreIntegrationsIsLoading: false,
      FetchStoreIntegrationsIsSuccess: false,
      FetchStoreIntegrationsIsError: null as null | string | object,
      FetchStoreIntegrationsListData: [] as ConnectedStoreIntegration[],
    },
    DisconnectStoreIntegrationState: {
      DisconnectStoreIntegrationIsLoading: false,
      DisconnectStoreIntegrationIsSuccess: false,
      DisconnectStoreIntegrationIsError: null as null | string | object,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchIntegrations.pending, (state) => {
        state.FetchIntegrationsState.FetchIntegrationsIsLoading = true;
        state.FetchIntegrationsState.FetchIntegrationsIsSuccess = false;
        state.FetchIntegrationsState.FetchIntegrationsIsError = null;
      })
      .addCase(FetchIntegrations.fulfilled, (state, action) => {
        state.FetchIntegrationsState.FetchIntegrationsIsLoading = false;
        state.FetchIntegrationsState.FetchIntegrationsIsSuccess = true;
        state.FetchIntegrationsState.FetchIntegrationsListData =
          action.payload as Integration[];
      })
      .addCase(FetchIntegrations.rejected, (state, action) => {
        state.FetchIntegrationsState.FetchIntegrationsIsLoading = false;
        state.FetchIntegrationsState.FetchIntegrationsIsSuccess = false;
        state.FetchIntegrationsState.FetchIntegrationsIsError =
          action.payload as string | object;
      })
      .addCase(ConnectStoreIntegration.pending, (state) => {
        state.ConnectStoreIntegrationState.ConnectStoreIntegrationIsLoading = true;
        state.ConnectStoreIntegrationState.ConnectStoreIntegrationIsSuccess = false;
        state.ConnectStoreIntegrationState.ConnectStoreIntegrationIsError =
          null;
      })
      .addCase(ConnectStoreIntegration.fulfilled, (state) => {
        state.ConnectStoreIntegrationState.ConnectStoreIntegrationIsLoading = false;
        state.ConnectStoreIntegrationState.ConnectStoreIntegrationIsSuccess = true;
      })
      .addCase(ConnectStoreIntegration.rejected, (state, action) => {
        state.ConnectStoreIntegrationState.ConnectStoreIntegrationIsLoading = false;
        state.ConnectStoreIntegrationState.ConnectStoreIntegrationIsSuccess = false;
        state.ConnectStoreIntegrationState.ConnectStoreIntegrationIsError =
          action.payload as string | object;
      })
      .addCase(FetchStoreIntegrations.pending, (state) => {
        state.FetchStoreIntegrationsState.FetchStoreIntegrationsIsLoading = true;
        state.FetchStoreIntegrationsState.FetchStoreIntegrationsIsSuccess = false;
        state.FetchStoreIntegrationsState.FetchStoreIntegrationsIsError = null;
      })
      .addCase(FetchStoreIntegrations.fulfilled, (state, action) => {
        state.FetchStoreIntegrationsState.FetchStoreIntegrationsIsLoading = false;
        state.FetchStoreIntegrationsState.FetchStoreIntegrationsIsSuccess = true;
        state.FetchStoreIntegrationsState.FetchStoreIntegrationsListData =
          action.payload as ConnectedStoreIntegration[];
      })
      .addCase(FetchStoreIntegrations.rejected, (state, action) => {
        state.FetchStoreIntegrationsState.FetchStoreIntegrationsIsLoading = false;
        state.FetchStoreIntegrationsState.FetchStoreIntegrationsIsSuccess = false;
        state.FetchStoreIntegrationsState.FetchStoreIntegrationsIsError =
          action.payload as string | object;
      })
      .addCase(DisconnectStoreIntegration.pending, (state) => {
        state.DisconnectStoreIntegrationState.DisconnectStoreIntegrationIsLoading = true;
        state.DisconnectStoreIntegrationState.DisconnectStoreIntegrationIsSuccess = false;
        state.DisconnectStoreIntegrationState.DisconnectStoreIntegrationIsError =
          null;
      })
      .addCase(DisconnectStoreIntegration.fulfilled, (state) => {
        state.DisconnectStoreIntegrationState.DisconnectStoreIntegrationIsLoading = false;
        state.DisconnectStoreIntegrationState.DisconnectStoreIntegrationIsSuccess = true;
      })
      .addCase(DisconnectStoreIntegration.rejected, (state, action) => {
        state.DisconnectStoreIntegrationState.DisconnectStoreIntegrationIsLoading = false;
        state.DisconnectStoreIntegrationState.DisconnectStoreIntegrationIsSuccess = false;
        state.DisconnectStoreIntegrationState.DisconnectStoreIntegrationIsError =
          action.payload as string | object;
      });
  },
});

export default IntegrationSlice.reducer;
