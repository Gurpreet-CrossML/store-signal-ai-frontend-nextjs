import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { axiosInstance } from "@/redux/axios-config";
import { toast } from "sonner";
import { ENDPOINTS } from "@/lib/config";
import { toPaginatedList } from "@/lib/helpers";

type GetStoresArgs = {
  searchvalue?: string;
  page?: number;
  limit?: number;
};

export type Store = {
  id: string;
  name: string;
  code: string;
};

export const SELECTED_STORE_KEY = "selectedStore";

export const GetStores = createAsyncThunk<Store[], GetStoresArgs>(
  "Store",
  async (
    { searchvalue = "", page = 1, limit = 15 }: GetStoresArgs = {},
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchStoresList()}?search=${searchvalue}&page=${page}&limit=${limit}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to fetch the Store, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

/** A row on Settings → Stores, straight from Django's store list. */
export type StoreListItem = {
  id: number | string;
  name: string;
  code: string;
  default_language: string;
  is_follow_ups_allowed: boolean;
  /** 0 means no restriction — the widget shows for every visitor. */
  allowed_ips_count: number;
  created_at: string;
  updated_at: string;
  platform?: string;
  is_active?: boolean;
};

type FetchStoresListArgs = {
  searchvalue?: string;
  page?: number;
  limit?: number;
};

export const FetchStoresList = createAsyncThunk(
  "FetchStoresList",
  async (
    { searchvalue = "", page = 1, limit = 15 }: FetchStoresListArgs,
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchStoresDirectory()}?search=${searchvalue}&page=${page}&limit=${limit}`,
        { useBackend: true },
      );
      return toPaginatedList<StoreListItem>(response.data.data);
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to load the stores, please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const FetchWidgetScript = createAsyncThunk(
  "FetchWidgetScript",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.storeWidgetInit()}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as { widget_key: string };
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to load the widget script. Try again.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const DeactivateStore = createAsyncThunk(
  "DeactivateStore",
  async ({ code, name }: { code: string; name: string }, thunkAPI) => {
    try {
      await axiosInstance.patch(ENDPOINTS.storeDetail(code), {
        is_active: false,
      });
      toast.success("Store deactivated", {
        description: `StoreSignal has stopped working on ${name}.`,
      });
      return { code };
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't deactivate the store", {
        description: data?.message || "Try again in a moment.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const StoresSlice = createSlice({
  name: "Stores",
  initialState: {
    GetStoresState: {
      GetStoresIsLoading: false,
      GetStoresIsSuccess: false,
      GetStoresIsError: null as null | string | object,
      GetStoresListData: [] as Store[],
    },
    FetchStoresListState: {
      FetchStoresListIsLoading: false,
      FetchStoresListIsSuccess: false,
      FetchStoresListIsError: null as null | string | object,
      FetchStoresListData: toPaginatedList<StoreListItem>(null),
    },
    FetchWidgetScriptState: {
      FetchWidgetScriptIsLoading: false,
      FetchWidgetScriptIsSuccess: false,
      FetchWidgetScriptIsError: null as null | string | object,
      FetchWidgetScriptData: null as { widget_key: string } | null,
    },
    DeactivateStoreState: {
      DeactivateStoreIsLoading: false,
      DeactivateStoreIsSuccess: false,
      DeactivateStoreIsError: null as null | string | object,
    },
    // Single source of truth for the currently selected store code.
    // Kept empty on the server so SSR and the first client render match;
    // it is hydrated from localStorage after mount (see NavMain).
    selectedStore: "" as string,
  },
  reducers: {
    setSelectedStore: (state, action: PayloadAction<string>) => {
      state.selectedStore = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem(SELECTED_STORE_KEY, action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(GetStores.pending, (state) => {
        state.GetStoresState.GetStoresIsLoading = true;
        state.GetStoresState.GetStoresIsSuccess = false;
        state.GetStoresState.GetStoresIsError = null;
      })
      .addCase(GetStores.fulfilled, (state, action) => {
        state.GetStoresState.GetStoresIsLoading = false;
        state.GetStoresState.GetStoresIsSuccess = true;
        state.GetStoresState.GetStoresListData = action.payload;
      })
      .addCase(GetStores.rejected, (state, action) => {
        state.GetStoresState.GetStoresIsLoading = false;
        state.GetStoresState.GetStoresIsSuccess = false;
        state.GetStoresState.GetStoresIsError =
          action.payload || "Something went wrong";
      })
      .addCase(FetchStoresList.pending, (state) => {
        state.FetchStoresListState.FetchStoresListIsLoading = true;
        state.FetchStoresListState.FetchStoresListIsSuccess = false;
        state.FetchStoresListState.FetchStoresListIsError = null;
      })
      .addCase(FetchStoresList.fulfilled, (state, action) => {
        state.FetchStoresListState.FetchStoresListIsLoading = false;
        state.FetchStoresListState.FetchStoresListIsSuccess = true;
        state.FetchStoresListState.FetchStoresListData = action.payload;
      })
      .addCase(FetchStoresList.rejected, (state, action) => {
        state.FetchStoresListState.FetchStoresListIsLoading = false;
        state.FetchStoresListState.FetchStoresListIsError = action.payload as
          | string
          | object;
      })
      .addCase(FetchWidgetScript.pending, (state) => {
        state.FetchWidgetScriptState.FetchWidgetScriptIsLoading = true;
        state.FetchWidgetScriptState.FetchWidgetScriptIsSuccess = false;
        state.FetchWidgetScriptState.FetchWidgetScriptIsError = null;
        // Clear the previous store's key so a slow request can't show it.
        state.FetchWidgetScriptState.FetchWidgetScriptData = null;
      })
      .addCase(FetchWidgetScript.fulfilled, (state, action) => {
        state.FetchWidgetScriptState.FetchWidgetScriptIsLoading = false;
        state.FetchWidgetScriptState.FetchWidgetScriptIsSuccess = true;
        state.FetchWidgetScriptState.FetchWidgetScriptData = action.payload;
      })
      .addCase(FetchWidgetScript.rejected, (state, action) => {
        state.FetchWidgetScriptState.FetchWidgetScriptIsLoading = false;
        state.FetchWidgetScriptState.FetchWidgetScriptIsError =
          action.payload as string | object;
      })
      .addCase(DeactivateStore.pending, (state) => {
        state.DeactivateStoreState.DeactivateStoreIsLoading = true;
        state.DeactivateStoreState.DeactivateStoreIsSuccess = false;
        state.DeactivateStoreState.DeactivateStoreIsError = null;
      })
      .addCase(DeactivateStore.fulfilled, (state) => {
        state.DeactivateStoreState.DeactivateStoreIsLoading = false;
        state.DeactivateStoreState.DeactivateStoreIsSuccess = true;
      })
      .addCase(DeactivateStore.rejected, (state, action) => {
        state.DeactivateStoreState.DeactivateStoreIsLoading = false;
        state.DeactivateStoreState.DeactivateStoreIsError = action.payload as
          | string
          | object;
      });
  },
});

export const { setSelectedStore } = StoresSlice.actions;

export default StoresSlice.reducer;
