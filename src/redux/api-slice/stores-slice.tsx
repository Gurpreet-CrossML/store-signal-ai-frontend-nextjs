import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { axiosInstance } from "@/redux/axios-config";
import { toast } from "sonner";
import { ENDPOINTS } from "@/lib/config";

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

      toast.success(response?.data?.message || "Stores fetched successfully!");

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

const StoresSlice = createSlice({
  name: "Stores",
  initialState: {
    GetStoresState: {
      GetStoresIsLoading: false,
      GetStoresIsSuccess: false,
      GetStoresIsError: null as null | string | object,
      GetStoresListData: [] as Store[],
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
      });
  },
});

export const { setSelectedStore } = StoresSlice.actions;

export default StoresSlice.reducer;
