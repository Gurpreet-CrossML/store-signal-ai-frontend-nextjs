import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "@/redux/axios-config";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ENDPOINTS } from "@/lib/config";

type GetArgs = {
    storeCode: string;
};

export const FetchFeedbackInsights = createAsyncThunk(
    "FetchFeedbackInsights", 
    async (args: { storeCode: string }, thunkAPI) => {
    try {
        const response = await axiosInstance.get(`${ENDPOINTS.fetchFeedbackInsights()}?store_code=${args.storeCode}`);
        const data = response.data.data;

        toast.success(response?.data?.message || "Feedback insights fetched successfully!");

        return data;
    } catch (error) {
        const response = isAxiosError(error) ? error.response : undefined;
        const data = response?.data;

        toast.error("Uh oh! Something went wrong.", {
            description:
                data?.message || "Unable to fetch feedback insights, please try again later.",
        });

        return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
});

export const FetchConversation = createAsyncThunk(
    "FetchConversation", 
    async (args: { storeCode: string }, thunkAPI) => {
    try {
        const response = await axiosInstance.get(`${ENDPOINTS.fetchConversationData()}?store_code=${args.storeCode}`);
        const data = response.data.data;

        toast.success(response?.data?.message || "Conversation data fetched successfully!");

        return data;
    } catch (error) {
        const response = isAxiosError(error) ? error.response : undefined;
        const data = response?.data;

        toast.error("Uh oh! Something went wrong.", {
            description:
                data?.message || "Unable to fetch conversation data, please try again later.",
        });

        return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
});

export const FetchEngagement = createAsyncThunk(
    "FetchEngagement", 
    async (args: { storeCode: string }, thunkAPI) => {
    try {
        const response = await axiosInstance.get(`${ENDPOINTS.fetchEngagementData()}?store_code=${args.storeCode}`);
        const data = response.data.data;

        toast.success(response?.data?.message || "Engagement data fetched successfully!");

        return data;
    } catch (error) {
        const response = isAxiosError(error) ? error.response : undefined;
        const data = response?.data;

        toast.error("Uh oh! Something went wrong.", {
            description:
                data?.message || "Unable to fetch engagement data, please try again later.",
        });

        return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
});

export const FetchOperationalEfficiency = createAsyncThunk(
    "FetchOperationalEfficiency", 
    async (args: { storeCode: string }, thunkAPI) => {
    try {
        const response = await axiosInstance.get(`${ENDPOINTS.fetchOperationalEfficiencyData()}?store_code=${args.storeCode}`);
        const data = response.data.data;

        toast.success(response?.data?.message || "Operational efficiency data fetched successfully!");

        return data;
    } catch (error) {
        const response = isAxiosError(error) ? error.response : undefined;
        const data = response?.data;

        toast.error("Uh oh! Something went wrong.", {
            description:
                data?.message || "Unable to fetch operational efficiency data, please try again later.",
        });

        return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
});

export const FetchUserMatrix = createAsyncThunk(
    "FetchUserMatrix", 
    async (args: { storeCode: string }, thunkAPI) => {
    try {
        const response = await axiosInstance.get(`${ENDPOINTS.fetchUserMatrix()}?store_code=${args.storeCode}`);
        const data = response.data.data;

        toast.success(response?.data?.message || "User matrix data fetched successfully!");

        return data;
    } catch (error) {
        const response = isAxiosError(error) ? error.response : undefined;
        const data = response?.data;

        toast.error("Uh oh! Something went wrong.", {
            description:
                data?.message || "Unable to fetch user matrix data, please try again later.",
        });

        return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
});

export const FetchConversionRate = createAsyncThunk(
    "FetchConversionRate", 
    async (args: { storeCode: string }, thunkAPI) => {
    try {
        const response = await axiosInstance.get(`${ENDPOINTS.fetchConversaionRateData()}?store_code=${args.storeCode}`);
        const data = response.data.data;

        toast.success(response?.data?.message || "Conversion rate data fetched successfully!");

        return data;
    } catch (error) {
        const response = isAxiosError(error) ? error.response : undefined;
        const data = response?.data;

        toast.error("Uh oh! Something went wrong.", {
            description:
                data?.message || "Unable to fetch conversion rate data, please try again later.",
        });

        return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
});

export const FetchQueryCategoryInsights = createAsyncThunk(
    "FetchQueryCategoryInsights", 
    async (args: { storeCode: string }, thunkAPI) => {
    try {
        const response = await axiosInstance.get(`${ENDPOINTS.fetchQueryCategoryInsights()}?store_code=${args.storeCode}`);
        const data = response.data.data;

        toast.success(response?.data?.message || "Query category insights fetched successfully!");

        return data;
    } catch (error) {
        const response = isAxiosError(error) ? error.response : undefined;
        const data = response?.data;

        toast.error("Uh oh! Something went wrong.", {
            description:
                data?.message || "Unable to fetch query category insights, please try again later.",
        });

        return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
});

const DashboardSlice = createSlice({
    name: "Dashboard",
    initialState: {
        FetchFeedbackInsightsState: {
            FetchFeedbackInsightsIsLoading: false,
            FetchFeedbackInsightsIsSuccess: false,
            FetchFeedbackInsightsIsError: null as null | string | object,
            FetchFeedbackInsightsData: null as null | object,
        },
        FetchConversationDataState: {
            FetchConversationDataIsLoading: false,
            FetchConversationDataIsSuccess: false,
            FetchConversationDataIsError: null as null | string | object,
            FetchConversationData: null as null | object,
        },
        FetchEngagementDataState: {
            FetchEngagementDataIsLoading: false,
            FetchEngagementDataIsSuccess: false,
            FetchEngagementDataIsError: null as null | string | object,
            FetchEngagementData: null as null | object,
        },
        FetchOperationalEfficiencyDataState: {
            FetchOperationalEfficiencyDataIsLoading: false,
            FetchOperationalEfficiencyDataIsSuccess: false,
            FetchOperationalEfficiencyDataIsError: null as null | string | object,
            FetchOperationalEfficiencyData: null as null | object,
        },
        FetchUserMatrixState: {
            FetchUserMatrixIsLoading: false,
            FetchUserMatrixIsSuccess: false,
            FetchUserMatrixIsError: null as null | string | object,
            FetchUserMatrixData: null as null | object,
        },
        FetchConversionRateDataState: {
            FetchConversionRateDataIsLoading: false,
            FetchConversionRateDataIsSuccess: false,
            FetchConversionRateDataIsError: null as null | string | object,
            FetchConversionRateData: null as null | object,
        },
        FetchQueryCategoryInsightsState: {
            FetchQueryCategoryInsightsIsLoading: false,
            FetchQueryCategoryInsightsIsSuccess: false,
            FetchQueryCategoryInsightsIsError: null as null | string | object,
            FetchQueryCategoryInsightsData: null as null | object,
        },
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Feedback Insights
            .addCase(FetchFeedbackInsights.pending, (state) => {
                state.FetchFeedbackInsightsState.FetchFeedbackInsightsIsLoading = true;
                state.FetchFeedbackInsightsState.FetchFeedbackInsightsIsSuccess = false;
                state.FetchFeedbackInsightsState.FetchFeedbackInsightsIsError = null;
            })
            .addCase(FetchFeedbackInsights.fulfilled, (state, action) => {
                state.FetchFeedbackInsightsState.FetchFeedbackInsightsIsLoading = false;
                state.FetchFeedbackInsightsState.FetchFeedbackInsightsIsSuccess = true;
                state.FetchFeedbackInsightsState.FetchFeedbackInsightsData = action.payload;
            })
            .addCase(FetchFeedbackInsights.rejected, (state, action) => {
                state.FetchFeedbackInsightsState.FetchFeedbackInsightsIsLoading = false;
                state.FetchFeedbackInsightsState.FetchFeedbackInsightsIsSuccess = false;
                state.FetchFeedbackInsightsState.FetchFeedbackInsightsIsError = action.payload || "Something went wrong";
            })
            // Conversation Data
            .addCase(FetchConversation.pending, (state) => {
                state.FetchConversationDataState.FetchConversationDataIsLoading = true;
                state.FetchConversationDataState.FetchConversationDataIsSuccess = false;
                state.FetchConversationDataState.FetchConversationDataIsError = null;
            })
            .addCase(FetchConversation.fulfilled, (state, action) => {
                state.FetchConversationDataState.FetchConversationDataIsLoading = false;
                state.FetchConversationDataState.FetchConversationDataIsSuccess = true;
                state.FetchConversationDataState.FetchConversationData = action.payload;
            })
            .addCase(FetchConversation.rejected, (state, action) => {
                state.FetchConversationDataState.FetchConversationDataIsLoading = false;
                state.FetchConversationDataState.FetchConversationDataIsSuccess = false;
                state.FetchConversationDataState.FetchConversationDataIsError = action.payload || "Something went wrong";
            })
            // Engagement Data
            .addCase(FetchEngagement.pending, (state) => {
                state.FetchEngagementDataState.FetchEngagementDataIsLoading = true;
                state.FetchEngagementDataState.FetchEngagementDataIsSuccess = false;
                state.FetchEngagementDataState.FetchEngagementDataIsError = null;
            })
            .addCase(FetchEngagement.fulfilled, (state, action) => {
                state.FetchEngagementDataState.FetchEngagementDataIsLoading = false;
                state.FetchEngagementDataState.FetchEngagementDataIsSuccess = true;
                state.FetchEngagementDataState.FetchEngagementData = action.payload;
            })
            .addCase(FetchEngagement.rejected, (state, action) => {
                state.FetchEngagementDataState.FetchEngagementDataIsLoading = false;
                state.FetchEngagementDataState.FetchEngagementDataIsSuccess = false;
                state.FetchEngagementDataState.FetchEngagementDataIsError = action.payload || "Something went wrong";
            })
            // Operational Efficiency Data
            .addCase(FetchOperationalEfficiency.pending, (state) => {
                state.FetchOperationalEfficiencyDataState.FetchOperationalEfficiencyDataIsLoading = true;
                state.FetchOperationalEfficiencyDataState.FetchOperationalEfficiencyDataIsSuccess = false;
                state.FetchOperationalEfficiencyDataState.FetchOperationalEfficiencyDataIsError = null;
            })
            .addCase(FetchOperationalEfficiency.fulfilled, (state, action) => {
                state.FetchOperationalEfficiencyDataState.FetchOperationalEfficiencyDataIsLoading = false;
                state.FetchOperationalEfficiencyDataState.FetchOperationalEfficiencyDataIsSuccess = true;
                state.FetchOperationalEfficiencyDataState.FetchOperationalEfficiencyData = action.payload;
            })
            .addCase(FetchOperationalEfficiency.rejected, (state, action) => {
                state.FetchOperationalEfficiencyDataState.FetchOperationalEfficiencyDataIsLoading = false;
                state.FetchOperationalEfficiencyDataState.FetchOperationalEfficiencyDataIsSuccess = false;
                state.FetchOperationalEfficiencyDataState.FetchOperationalEfficiencyDataIsError = action.payload || "Something went wrong";
            })
            // User Matrix
            .addCase(FetchUserMatrix.pending, (state) => {
                state.FetchUserMatrixState.FetchUserMatrixIsLoading = true;
                state.FetchUserMatrixState.FetchUserMatrixIsSuccess = false;
                state.FetchUserMatrixState.FetchUserMatrixIsError = null;
            })
            .addCase(FetchUserMatrix.fulfilled, (state, action) => {
                state.FetchUserMatrixState.FetchUserMatrixIsLoading = false;
                state.FetchUserMatrixState.FetchUserMatrixIsSuccess = true;
                state.FetchUserMatrixState.FetchUserMatrixData = action.payload;
            })
            .addCase(FetchUserMatrix.rejected, (state, action) => {
                state.FetchUserMatrixState.FetchUserMatrixIsLoading = false;
                state.FetchUserMatrixState.FetchUserMatrixIsSuccess = false;
                state.FetchUserMatrixState.FetchUserMatrixIsError = action.payload || "Something went wrong";
            })
            // Conversion Rate Data
            .addCase(FetchConversionRate.pending, (state) => {
                state.FetchConversionRateDataState.FetchConversionRateDataIsLoading = true;
                state.FetchConversionRateDataState.FetchConversionRateDataIsSuccess = false;
                state.FetchConversionRateDataState.FetchConversionRateDataIsError = null;
            })
            .addCase(FetchConversionRate.fulfilled, (state, action) => {
                state.FetchConversionRateDataState.FetchConversionRateDataIsLoading = false;
                state.FetchConversionRateDataState.FetchConversionRateDataIsSuccess = true;
                state.FetchConversionRateDataState.FetchConversionRateData = action.payload;
            })
            .addCase(FetchConversionRate.rejected, (state, action) => {
                state.FetchConversionRateDataState.FetchConversionRateDataIsLoading = false;
                state.FetchConversionRateDataState.FetchConversionRateDataIsSuccess = false;
                state.FetchConversionRateDataState.FetchConversionRateDataIsError = action.payload || "Something went wrong";
            })
            // Query Category Insights
            .addCase(FetchQueryCategoryInsights.pending, (state) => {
                state.FetchQueryCategoryInsightsState.FetchQueryCategoryInsightsIsLoading = true;
                state.FetchQueryCategoryInsightsState.FetchQueryCategoryInsightsIsSuccess = false;
                state.FetchQueryCategoryInsightsState.FetchQueryCategoryInsightsIsError = null;
            })
            .addCase(FetchQueryCategoryInsights.fulfilled, (state, action) => {
                state.FetchQueryCategoryInsightsState.FetchQueryCategoryInsightsIsLoading = false;
                state.FetchQueryCategoryInsightsState.FetchQueryCategoryInsightsIsSuccess = true;
                state.FetchQueryCategoryInsightsState.FetchQueryCategoryInsightsData = action.payload;
            })
            .addCase(FetchQueryCategoryInsights.rejected, (state, action) => {
                state.FetchQueryCategoryInsightsState.FetchQueryCategoryInsightsIsLoading = false;
                state.FetchQueryCategoryInsightsState.FetchQueryCategoryInsightsIsSuccess = false;
                state.FetchQueryCategoryInsightsState.FetchQueryCategoryInsightsIsError = action.payload || "Something went wrong";
            });
    },
});

export default DashboardSlice.reducer;