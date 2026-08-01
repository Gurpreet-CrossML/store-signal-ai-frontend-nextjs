import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../axios-config";
import { ENDPOINTS } from "@/lib/config";
import { isAxiosError } from "axios";
import { toast } from "sonner";

type MetaOAuthUrlResponse = {
    authorize_url: string;
};

export type ConnectedAccount = {
    id: string;
    channel_type: string;
    external_id: string;
    name: string;
    username: string;
    profile_picture_url: string;
    webhook_status: string;
    is_active: boolean;
    last_event_at: string | null;
    created_at: string;
    updated_at: string;
};

export type SocialAccountsSubscriptionsResponse = {
    results: ConnectedAccount[];
    count: number;
    next?: string | null;
    previous?: string | null;
};

export const fetchSocialAccountsSubscriptions = createAsyncThunk(
    "fetchSocialAccountsSubscriptions",
    async (storeCode: string, thunkAPI) => {
        try {
            const response = await axiosInstance.get(
                `${ENDPOINTS.fetchSocialAccountsSubscriptions()}?store_code=${storeCode}`,
                {
                    useBackend: true,
                }
            );
            const data = response.data.data;
            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

            toast.error("Uh oh! Something went wrong.", {
                description:
                    data?.message ||
                    "Unable to fetch social subscriptions, please try again later.",
            });

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    },
);

export const createMetaOAuthUrl = createAsyncThunk(
    "createMetaOAuthUrl",
    async (storeCode: string, thunkAPI) => {
        try {
            const response = await axiosInstance.get(
                `${ENDPOINTS.createMetaOAuthUrl()}?store_code=${storeCode}`,
                {
                    useBackend: true,
                }
            );
            const data = response.data.data;
            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

            toast.error("Uh oh! Something went wrong.", {
                description:
                    data?.message ||
                    "Unable to fetch Meta OAuth URL, please try again later.",
            });

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    },
);

const SocialAISlice = createSlice({
    name: "SocialAI",
    initialState: {
        FetchMetaOauthURLState: {
            FetchMetaOauthURLIsLoading: false,
            FetchMetaOauthURLIsSuccess: false,
            FetchMetaOauthURLIsError: null as null | string | object,
            FetchMetaOauthURLData: {} as MetaOAuthUrlResponse,
        },
        FetchSocialAccountSubscriptionsState: {
            FetchSocialAccountsSubscriptionsIsLoading: false,
            FetchSocialAccountsSubscriptionsIsSuccess: false,
            FetchSocialAccountsSubscriptionsIsError: null as null | string | object,
            FetchSocialAccountsSubscriptionsData: {} as SocialAccountsSubscriptionsResponse,
        },
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createMetaOAuthUrl.pending, (state) => {
                state.FetchMetaOauthURLState.FetchMetaOauthURLIsLoading = true;
                state.FetchMetaOauthURLState.FetchMetaOauthURLIsSuccess = false;
                state.FetchMetaOauthURLState.FetchMetaOauthURLIsError = null;
            })
            .addCase(createMetaOAuthUrl.fulfilled, (state, action) => {
                state.FetchMetaOauthURLState.FetchMetaOauthURLIsLoading = false;
                state.FetchMetaOauthURLState.FetchMetaOauthURLIsSuccess = true;
                state.FetchMetaOauthURLState.FetchMetaOauthURLData = action.payload;
            })
            .addCase(createMetaOAuthUrl.rejected, (state, action) => {
                state.FetchMetaOauthURLState.FetchMetaOauthURLIsLoading = false;
                state.FetchMetaOauthURLState.FetchMetaOauthURLIsSuccess = false;
                state.FetchMetaOauthURLState.FetchMetaOauthURLIsError = action.payload as string | object;
            })
            .addCase(fetchSocialAccountsSubscriptions.pending, (state) => {
                state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsIsLoading = true;
                state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsIsSuccess = false;
                state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsIsError = null;
            })
            .addCase(fetchSocialAccountsSubscriptions.fulfilled, (state, action) => {
                state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsIsLoading = false;
                state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsIsSuccess = true;
                state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsData = action.payload;
            })
            .addCase(fetchSocialAccountsSubscriptions.rejected, (state, action) => {
                state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsIsLoading = false;
                state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsIsSuccess = false;
                state.FetchSocialAccountSubscriptionsState.FetchSocialAccountsSubscriptionsIsError = action.payload as string | object;
            });
    }
});

export default SocialAISlice.reducer;