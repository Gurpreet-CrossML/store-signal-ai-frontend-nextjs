import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { axiosInstance } from "@/redux/axios-config";
import { toast } from "sonner";

type GetStoresArgs = {
    searchvalue?: string;
    page?: number;
    limit?: number;
};

export type Store = {
    id: string;
    name: string;
};

export const GetStores = createAsyncThunk<Store[], GetStoresArgs>(
    "Store",
    async ({ searchvalue = "", page = 1, limit = 15 }: GetStoresArgs = {}, thunkAPI) => {
        try {
            const response = await axiosInstance.get(
                `/store/list/?search=${searchvalue}&page=${page}&limit=${limit}`
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
    }
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
    },
    reducers: {},
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
                state.GetStoresState.GetStoresIsError = action.payload || "Something went wrong";
            });
    },
});

export default StoresSlice.reducer;