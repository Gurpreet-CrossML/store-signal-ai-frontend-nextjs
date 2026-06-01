import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../axios-config";
import { ENDPOINTS } from "@/lib/config";
import { toast } from "sonner";
import { isAxiosError } from "axios";

type GetStoreFaqsArgs = {
    store_code?: string;
    page?: number;
    limit?: number;
};

export type StoreFaq = {
    id: number;
    store: string;
    question: string;
    answer: string;
    created_at: string;
    updated_at: string;
};

export type FetchStoreFaqsResponse = {
    count: number;
    next: string | null;
    previous: string | null;
    results: StoreFaq[];
}


export const FetchStoreFaqs = createAsyncThunk(
    "FetchStoreFaqs",
    async ({ store_code = "", page = 1, limit = 10 }: GetStoreFaqsArgs = {}, thunkAPI) => {
        try {
            const response = await axiosInstance.get(
                `${ENDPOINTS.fetchStoreFaqs()}?store_code=${store_code}&page=${page}&page_size=${limit}`
            );
            const data = response.data.data;

            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

            toast.error("Uh oh! Something went wrong.", {
                description:
                    data?.message || "Unable to fetch the FAQs, please try again later.",
            });

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    }
);

export const CreateStoreFaq = createAsyncThunk(
    "CreateStoreFaq",
    async ({ store_code, question, answer }: { store_code: string; question: string; answer: string }, thunkAPI) => {
        try {
            const response = await axiosInstance.post(ENDPOINTS.createStoreFaq(), {
                store: store_code,
                question,
                answer,
            });
            const data = response.data.data;

            toast.success(response?.data?.message || "FAQ created successfully!");

            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

            toast.error("Uh oh! Something went wrong.", {
                description:
                    data?.message || "Unable to create the FAQ, please try again later.",
            });

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    }
);

export const UpdateStoreFaq = createAsyncThunk(
    "UpdateStoreFaq",
    async ({ store_code, id, question, answer }: { store_code: string; id: number; question: string; answer: string }, thunkAPI) => {
        try {
            const response = await axiosInstance.put(`${ENDPOINTS.updateStoreFaq(id)}?store_code=${store_code}`, {
                question,
                answer,
                store: store_code,
            });
            const data = response.data.data;

            toast.success(response?.data?.message || "FAQ updated successfully!");

            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

            toast.error("Uh oh! Something went wrong.", {
                description:
                    data?.message || "Unable to update the FAQ, please try again later.",
            });

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    }
);

export const DeleteStoreFaq = createAsyncThunk(
    "DeleteStoreFaq",
    async ({ store_code, id }: { store_code: string; id: number }, thunkAPI) => {
        try {
            const response = await axiosInstance.delete(`${ENDPOINTS.deleteStoreFaq(id)}?store_code=${store_code}`);
            const data = response.data.data;

            toast.success(response?.data?.message || "FAQ deleted successfully!");

            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

            toast.error("Uh oh! Something went wrong.", {
                description:
                    data?.message || "Unable to delete the FAQ, please try again later.",
            });

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    }
);

const KnowledgeSlice = createSlice({
    name: "Knowledge",
    initialState: {
        FetchStoreFaqsState: {
            FetchStoreFaqsIsLoading: false,
            FetchStoreFaqsIsSuccess: false,
            FetchStoreFaqsIsError: null as null | string | object,
            FetchStoreFaqsListData: {} as FetchStoreFaqsResponse,
        },
        CreateStoreFaqState: {
            CreateStoreFaqIsLoading: false,
            CreateStoreFaqIsSuccess: false,
            CreateStoreFaqIsError: null as null | string | object,
        },
        UpdateStoreFaqState: {
            UpdateStoreFaqIsLoading: false,
            UpdateStoreFaqIsSuccess: false,
            UpdateStoreFaqIsError: null as null | string | object,
        },
        DeleteStoreFaqState: {
            DeleteStoreFaqIsLoading: false,
            DeleteStoreFaqIsSuccess: false,
            DeleteStoreFaqIsError: null as null | string | object,
        },
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // FetchStoreFaqs
            .addCase(FetchStoreFaqs.pending, (state) => {
                state.FetchStoreFaqsState.FetchStoreFaqsIsLoading = true;
                state.FetchStoreFaqsState.FetchStoreFaqsIsSuccess = false;
                state.FetchStoreFaqsState.FetchStoreFaqsIsError = null;
            })
            .addCase(FetchStoreFaqs.fulfilled, (state, action) => {
                state.FetchStoreFaqsState.FetchStoreFaqsIsLoading = false;
                state.FetchStoreFaqsState.FetchStoreFaqsIsSuccess = true;
                state.FetchStoreFaqsState.FetchStoreFaqsListData = action.payload;
            })
            .addCase(FetchStoreFaqs.rejected, (state, action) => {
                state.FetchStoreFaqsState.FetchStoreFaqsIsLoading = false;
                state.FetchStoreFaqsState.FetchStoreFaqsIsSuccess = false;
                state.FetchStoreFaqsState.FetchStoreFaqsIsError = action.payload || "Something went wrong";
            })
            // CreateStoreFaq
            .addCase(CreateStoreFaq.pending, (state) => {
                state.CreateStoreFaqState.CreateStoreFaqIsLoading = true;
                state.CreateStoreFaqState.CreateStoreFaqIsSuccess = false;
                state.CreateStoreFaqState.CreateStoreFaqIsError = null;
            })
            .addCase(CreateStoreFaq.fulfilled, (state) => {
                state.CreateStoreFaqState.CreateStoreFaqIsLoading = false;
                state.CreateStoreFaqState.CreateStoreFaqIsSuccess = true;
            })
            .addCase(CreateStoreFaq.rejected, (state, action) => {
                state.CreateStoreFaqState.CreateStoreFaqIsLoading = false;
                state.CreateStoreFaqState.CreateStoreFaqIsSuccess = false;
                state.CreateStoreFaqState.CreateStoreFaqIsError = action.payload || "Something went wrong";
            })
            // UpdateStoreFaq
            .addCase(UpdateStoreFaq.pending, (state) => {
                state.UpdateStoreFaqState.UpdateStoreFaqIsLoading = true;
                state.UpdateStoreFaqState.UpdateStoreFaqIsSuccess = false;
                state.UpdateStoreFaqState.UpdateStoreFaqIsError = null;
            })
            .addCase(UpdateStoreFaq.fulfilled, (state) => {
                state.UpdateStoreFaqState.UpdateStoreFaqIsLoading = false;
                state.UpdateStoreFaqState.UpdateStoreFaqIsSuccess = true;
            })
            .addCase(UpdateStoreFaq.rejected, (state, action) => {
                state.UpdateStoreFaqState.UpdateStoreFaqIsLoading = false;
                state.UpdateStoreFaqState.UpdateStoreFaqIsSuccess = false;
                state.UpdateStoreFaqState.UpdateStoreFaqIsError = action.payload || "Something went wrong";
            })
            // DeleteStoreFaq
            .addCase(DeleteStoreFaq.pending, (state) => {
                state.DeleteStoreFaqState.DeleteStoreFaqIsLoading = true;
                state.DeleteStoreFaqState.DeleteStoreFaqIsSuccess = false;
                state.DeleteStoreFaqState.DeleteStoreFaqIsError = null;
            })
            .addCase(DeleteStoreFaq.fulfilled, (state) => {
                state.DeleteStoreFaqState.DeleteStoreFaqIsLoading = false;
                state.DeleteStoreFaqState.DeleteStoreFaqIsSuccess = true;
            })
            .addCase(DeleteStoreFaq.rejected, (state, action) => {
                state.DeleteStoreFaqState.DeleteStoreFaqIsLoading = false;
                state.DeleteStoreFaqState.DeleteStoreFaqIsSuccess = false;
                state.DeleteStoreFaqState.DeleteStoreFaqIsError = action.payload || "Something went wrong";
            });
    },
});

export default KnowledgeSlice.reducer;