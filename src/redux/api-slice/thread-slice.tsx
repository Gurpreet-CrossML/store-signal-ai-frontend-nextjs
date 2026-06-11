import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../axios-config";
import { ENDPOINTS } from "@/lib/config";
import { toast } from "sonner";
import { isAxiosError } from "axios";

type ThreadFilters = {
    from?: string;
    to?: string;
    search?: string;
    is_active?: boolean;
    user_type?: string;
    has_ticket?: boolean;
    has_feedback?: boolean;
}

type GetThreadsArgs = {
    store_code?: string;
    page?: number;
    limit?: number;
    filters?: ThreadFilters;
};

export type Customer = {
    name: string;
    email: string;
}

export type Thread = {
    id: string;
    name: string | null;
    customer: Customer | null;
    is_active: boolean;
    total_messages: number;
    created_at: string;
    ended_at: string | null;
    tags?: string[];
    last_message?: string | null;
};

export type OrderItem = {
    line_item_id: string;
    name: string;
    price: string;
    product_id: number;
    quantity: number;
    variant_id: number;
}
export type OrderDetail = {
    order_id: string | number;
    order_url: string;
    financial_status: string;
    fulfillment_status: string;
    is_cancelable: boolean;
    is_returnable: boolean;
    cancel_reason: string | null;
    cancel_message: string | null;
    cancelled_at: string | null;
    return_message: string | null;
    discount: string;
    discount_codes: string[];
    subtotal: string;
    tax: string;
    total: string;
    email: string;
    note: string | null;
    payment_gateways: string[];
    items: OrderItem[];
}

export type ThreadJsonContent = {
    products?: ProductData[];
    order_details?: OrderDetail;
    order_id?: string;
    order_verification_step?: string;
    suggestions?: string[];
}

export type ThreadMessage = {
    role: string,
    message: string,
    json_content?: ThreadJsonContent;
    created_at: string;
}

export type ProductVariant = {
    variant_id: string;
    title: string;
    price: {
        amount: string;
        currency: string;
    };
    options: { name: string; value: string }[];
    available_for_sale: boolean;
    compare_at_price: string | null;
    discount: string | null;
};

export type ProductData = {
    id: string;
    name: string;
    image: string;
    description: string;
    price: string;
    product_url: string;
    available_for_sale: boolean;
    variants?: ProductVariant[];
}

export type ThreadVerdict = {
    confidence: number;
    created_at: string;
    query_summaries: string[];
    reason: string;
    resolved_count: number;
    total_queries: number;
    unresolved_count: number;
    verdict: string;
}

export type ThreadDetails = {
    id: string;
    name: string | null;
    store: number;
    customer_name: string | null;
    customer_email: string | null;
    is_active: boolean;
    total_messages: number;
    created_at: string;
    ended_at: string | null;
    messages: ThreadMessage[];
    verdict: ThreadVerdict;
    followup_level: number;
};

export type ThreadSummary = {
    conversation_summary: string;
}

// DRF-style paginated envelope.
export type ThreadsResponse = {
    count: number;
    next: string | null;
    previous: string | null;
    results: Thread[];
};

export type AIInsightResponse = {
    underperforming_cases: string[];
    overperforming_cases: string[];
    resolution_success_rate: string;
    reason_for_score: string;
    tags: string[];
    ai_insight_required: boolean;
    next_actionable_items: string[];
}

export type CartDataResponse = {
    thread_id: string;
    initial_cart_data: {
        qty: number;
        sku: string;
        name: string;
        price: string;
        currency: string;
        product_id: number;
        product_url: string;
        product_image: string;
    }[];
    updated_cart_data: {
        qty: number;
        sku: string;
        name: string;
        price: string;
        currency: string;
        product_id: number;
        product_url: string;
        product_image: string;
    }[];
}

export type UserMetadata = {
    thread_id: string;
    customer_name: string;
    geo_location: string;
    ip_address: string;
    device_type: string;
    browser: string;
    os: string;
}


export const FetchThreads = createAsyncThunk<ThreadsResponse, GetThreadsArgs>(
    "Threads",
    async ({ store_code = "", page = 1, limit = 10, filters = {} }: GetThreadsArgs = {}, thunkAPI) => {
        try {
            const filteration = "&" + Object.entries(filters)
                .map(([key, value]) => `${key}=${value}`)
                .join("&");

            const response = await axiosInstance.get(
                `${ENDPOINTS.fetchThreads()}?store_code=${store_code}&page=${page}&page_size=${limit}${filteration !== "&" ? filteration : ""}`
            );
            const data = response.data.data;

            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

            toast.error("Uh oh! Something went wrong.", {
                description:
                    data?.message || "Unable to fetch the threads, please try again later.",
            });

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    }
);

export const FetchThreadDetails = createAsyncThunk(
    "ThreadDetails",
    async (threadId: string, thunkAPI) => {
        try {
            const response = await axiosInstance.get(
                ENDPOINTS.fetchThreadDetails(threadId)
            );
            const data = response.data.data;

            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

            toast.error("Uh oh! Something went wrong.", {
                description:
                    data?.message || "Unable to fetch the thread details, please try again later.",
            });

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    }
);

export const FetchUserMetadata = createAsyncThunk(
    "UserMetadata",
    async (threadId: string, thunkAPI) => {
        try {
            const response = await axiosInstance.get(
                ENDPOINTS.fetchUserMetadata(threadId)
            );
            const data = response.data.data;

            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

            toast.error("Uh oh! Something went wrong.", {
                description:
                    data?.message || "Unable to fetch the user metadata, please try again later.",
            });

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    }
);

export const FetchConversationSummary = createAsyncThunk(
    "ConversationSummary",
    async (threadId: string, thunkAPI) => {
        try {
            const response = await axiosInstance.get(
                ENDPOINTS.fetchConversationSummary(threadId)
            );
            const data = response.data.data;

            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

            toast.error("Uh oh! Something went wrong.", {
                description:
                    data?.message || "Unable to fetch the conversation summary, please try again later.",
            });

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    }
);

export const FetchFeedbackSequence = createAsyncThunk(
    "FeedbackSequence",
    async (threadId: string, thunkAPI) => {
        try {
            const response = await axiosInstance.get(
                ENDPOINTS.fetchFeedbackSequence(threadId)
            );
            const data = response.data.data;

            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

            toast.error("Uh oh! Something went wrong.", {
                description:
                    data?.message || "Unable to fetch the feedback sequence, please try again later.",
            });

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    }
);

export const FetchTags = createAsyncThunk(
    "Tags",
    async (threadId: string, thunkAPI) => {
        try {
            const response = await axiosInstance.get(
                ENDPOINTS.fetchTags(threadId)
            );
            const data = response.data.data;

            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

            toast.error("Uh oh! Something went wrong.", {
                description:
                    data?.message || "Unable to fetch the tags, please try again later.",
            });

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    }
);

export const FetchAIInsight = createAsyncThunk(
    "AIInsight",
    async (threadId: string, thunkAPI) => {
        try {
            const response = await axiosInstance.get(
                ENDPOINTS.fetchAIInsight(threadId)
            );
            const data = response.data.data;

            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

            toast.error("Uh oh! Something went wrong.", {
                description:
                    data?.message || "Unable to fetch the AI insights, please try again later.",
            });

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    }
);

export const FetchCart = createAsyncThunk(
    "CartData",
    async (threadId: string, thunkAPI) => {
        try {
            const response = await axiosInstance.get(
                ENDPOINTS.fetchCartData(threadId)
            );
            const data = response.data.data;

            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

            // A 404 simply means no cart data exists for this thread — not an error worth surfacing.
            if (response?.status !== 404) {
                toast.error("Uh oh! Something went wrong.", {
                    description:
                        data?.message || "Unable to fetch the cart data, please try again later.",
                });
            }

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    }
);

export const FetchFreshdeskTicketId = createAsyncThunk(
    "FreshdeskTicketId",
    async (threadId: string, thunkAPI) => {
        try {
            const response = await axiosInstance.get(
                ENDPOINTS.fetchFreshdeskTicketId(threadId)
            );
            const data = response.data.data;

            return data;
        } catch (error) {
            const response = isAxiosError(error) ? error.response : undefined;
            const data = response?.data;

            toast.error("Uh oh! Something went wrong.", {
                description:
                    data?.message || "Unable to fetch the Freshdesk ticket ID, please try again later.",
            });

            return thunkAPI.rejectWithValue(data || "Something went wrong");
        }
    }
);

const ThreadSlice = createSlice({
    name: "Thread",
    initialState: {
        FetchThreadsState: {
            FetchThreadsIsLoading: false,
            FetchThreadsIsSuccess: false,
            FetchThreadsIsError: null as null | string | object | unknown,
            FetchThreadsListData: {
                count: 0,
                next: null,
                previous: null,
                results: [],
            } as ThreadsResponse,
        },
        FetchThreadDetailsState: {
            FetchThreadDetailsIsLoading: false,
            FetchThreadDetailsIsSuccess: false,
            FetchThreadDetailsIsError: null as null | string | object | unknown,
            FetchThreadDetailsData: {} as ThreadDetails,
        },
        FetchUserMetadataState: {
            FetchUserMetadataIsLoading: false,
            FetchUserMetadataIsSuccess: false,
            FetchUserMetadataIsError: null as null | string | object | unknown,
            FetchUserMetadataData: {} as UserMetadata,
        },
        FetchConversationSummaryState: {
            FetchConversationSummaryIsLoading: false,
            FetchConversationSummaryIsSuccess: false,
            FetchConversationSummaryIsError: null as null | string | object | unknown,
            FetchConversationSummaryData: {} as ThreadSummary,
        },
        FetchFeedbackSequenceState: {
            FetchFeedbackSequenceIsLoading: false,
            FetchFeedbackSequenceIsSuccess: false,
            FetchFeedbackSequenceIsError: null as null | string | object | unknown,
            FetchFeedbackSequence: {} as Record<string, unknown>,
        },
        FetchTagsState: {
            FetchTagsIsLoading: false,
            FetchTagsIsSuccess: false,
            FetchTagsIsError: null as null | string | object | unknown,
            FetchTags: [] as string[],
        },
        FetchAIInsightState: {
            FetchAIInsightIsLoading: false,
            FetchAIInsightIsSuccess: false,
            FetchAIInsightIsError: null as null | string | object | unknown,
            FetchAIInsightData: {} as AIInsightResponse,
        },
        FetchCartDataState: {
            FetchCartDataIsLoading: false,
            FetchCartDataIsSuccess: false,
            FetchCartDataIsError: null as null | string | object | unknown,
            FetchCartData: {} as CartDataResponse,
        },
        FetchFreshdeskTicketIdState: {
            FetchFreshdeskTicketIdIsLoading: false,
            FetchFreshdeskTicketIdIsSuccess: false,
            FetchFreshdeskTicketIdIsError: null as null | string | object | unknown,
            FetchFreshdeskTicketId: {} as Record<string, unknown>,
        },

    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(FetchThreads.pending, (state) => {
                state.FetchThreadsState.FetchThreadsIsLoading = true;
                state.FetchThreadsState.FetchThreadsIsError = null;
                state.FetchThreadsState.FetchThreadsIsSuccess = false;
            })
            .addCase(FetchThreads.fulfilled, (state, action) => {
                state.FetchThreadsState.FetchThreadsIsLoading = false;
                state.FetchThreadsState.FetchThreadsListData = action.payload;
                state.FetchThreadsState.FetchThreadsIsSuccess = true;
            })
            .addCase(FetchThreads.rejected, (state, action) => {
                state.FetchThreadsState.FetchThreadsIsLoading = false;
                state.FetchThreadsState.FetchThreadsIsError = action.payload;
                state.FetchThreadsState.FetchThreadsIsSuccess = false;
            })
            .addCase(FetchThreadDetails.pending, (state) => {
                state.FetchThreadDetailsState.FetchThreadDetailsIsLoading = true;
                state.FetchThreadDetailsState.FetchThreadDetailsIsError = null;
                state.FetchThreadDetailsState.FetchThreadDetailsIsSuccess = false;
            })
            .addCase(FetchThreadDetails.fulfilled, (state, action) => {
                state.FetchThreadDetailsState.FetchThreadDetailsIsLoading = false;
                state.FetchThreadDetailsState.FetchThreadDetailsData = action.payload;
                state.FetchThreadDetailsState.FetchThreadDetailsIsSuccess = true;
            })
            .addCase(FetchThreadDetails.rejected, (state, action) => {
                state.FetchThreadDetailsState.FetchThreadDetailsIsLoading = false;
                state.FetchThreadDetailsState.FetchThreadDetailsIsError = action.payload;
                state.FetchThreadDetailsState.FetchThreadDetailsIsSuccess = false;
            })
            .addCase(FetchUserMetadata.pending, (state) => {
                state.FetchUserMetadataState.FetchUserMetadataIsLoading = true;
                state.FetchUserMetadataState.FetchUserMetadataIsError = null;
                state.FetchUserMetadataState.FetchUserMetadataIsSuccess = false;
            })
            .addCase(FetchUserMetadata.fulfilled, (state, action) => {
                state.FetchUserMetadataState.FetchUserMetadataIsLoading = false;
                state.FetchUserMetadataState.FetchUserMetadataData = action.payload;
                state.FetchUserMetadataState.FetchUserMetadataIsSuccess = true;
            })
            .addCase(FetchUserMetadata.rejected, (state, action) => {
                state.FetchUserMetadataState.FetchUserMetadataIsLoading = false;
                state.FetchUserMetadataState.FetchUserMetadataIsError = action.payload;
                state.FetchUserMetadataState.FetchUserMetadataIsSuccess = false;
            })
            .addCase(FetchConversationSummary.pending, (state) => {
                state.FetchConversationSummaryState.FetchConversationSummaryIsLoading = true;
                state.FetchConversationSummaryState.FetchConversationSummaryIsError = null;
                state.FetchConversationSummaryState.FetchConversationSummaryIsSuccess = false;
            })
            .addCase(FetchConversationSummary.fulfilled, (state, action) => {
                state.FetchConversationSummaryState.FetchConversationSummaryIsLoading = false;
                state.FetchConversationSummaryState.FetchConversationSummaryData = action.payload;
                state.FetchConversationSummaryState.FetchConversationSummaryIsSuccess = true;
            })
            .addCase(FetchConversationSummary.rejected, (state, action) => {
                state.FetchConversationSummaryState.FetchConversationSummaryIsLoading = false;
                state.FetchConversationSummaryState.FetchConversationSummaryIsError = action.payload;
                state.FetchConversationSummaryState.FetchConversationSummaryIsSuccess = false;
            })
            .addCase(FetchFeedbackSequence.pending, (state) => {
                state.FetchFeedbackSequenceState.FetchFeedbackSequenceIsLoading = true;
                state.FetchFeedbackSequenceState.FetchFeedbackSequenceIsError = null;
                state.FetchFeedbackSequenceState.FetchFeedbackSequenceIsSuccess = false;
            })
            .addCase(FetchFeedbackSequence.fulfilled, (state, action) => {
                state.FetchFeedbackSequenceState.FetchFeedbackSequenceIsLoading = false;
                state.FetchFeedbackSequenceState.FetchFeedbackSequence = action.payload;
                state.FetchFeedbackSequenceState.FetchFeedbackSequenceIsSuccess = true;
            })
            .addCase(FetchFeedbackSequence.rejected, (state, action) => {
                state.FetchFeedbackSequenceState.FetchFeedbackSequenceIsLoading = false;
                state.FetchFeedbackSequenceState.FetchFeedbackSequenceIsError = action.payload;
                state.FetchFeedbackSequenceState.FetchFeedbackSequenceIsSuccess = false;
            })
            .addCase(FetchTags.pending, (state) => {
                state.FetchTagsState.FetchTagsIsLoading = true;
                state.FetchTagsState.FetchTagsIsError = null;
                state.FetchTagsState.FetchTagsIsSuccess = false;
            })
            .addCase(FetchTags.fulfilled, (state, action) => {
                state.FetchTagsState.FetchTagsIsLoading = false;
                state.FetchTagsState.FetchTags = action.payload;
                state.FetchTagsState.FetchTagsIsSuccess = true;
            })
            .addCase(FetchTags.rejected, (state, action) => {
                state.FetchTagsState.FetchTagsIsLoading = false;
                state.FetchTagsState.FetchTagsIsError = action.payload;
                state.FetchTagsState.FetchTagsIsSuccess = false;
            })
            .addCase(FetchAIInsight.pending, (state) => {
                state.FetchAIInsightState.FetchAIInsightIsLoading = true;
                state.FetchAIInsightState.FetchAIInsightIsError = null;
                state.FetchAIInsightState.FetchAIInsightIsSuccess = false;
            })
            .addCase(FetchAIInsight.fulfilled, (state, action) => {
                state.FetchAIInsightState.FetchAIInsightIsLoading = false;
                state.FetchAIInsightState.FetchAIInsightData = action.payload;
                state.FetchAIInsightState.FetchAIInsightIsSuccess = true;
            })
            .addCase(FetchAIInsight.rejected, (state, action) => {
                state.FetchAIInsightState.FetchAIInsightIsLoading = false;
                state.FetchAIInsightState.FetchAIInsightIsError = action.payload;
                state.FetchAIInsightState.FetchAIInsightIsSuccess = false;
            })
            .addCase(FetchCart.pending, (state) => {
                state.FetchCartDataState.FetchCartDataIsLoading = true;
                state.FetchCartDataState.FetchCartDataIsError = null;
                state.FetchCartDataState.FetchCartDataIsSuccess = false;
            })
            .addCase(FetchCart.fulfilled, (state, action) => {
                state.FetchCartDataState.FetchCartDataIsLoading = false;
                state.FetchCartDataState.FetchCartData = action.payload;
                state.FetchCartDataState.FetchCartDataIsSuccess = true;
            })
            .addCase(FetchCart.rejected, (state, action) => {
                state.FetchCartDataState.FetchCartDataIsLoading = false;
                state.FetchCartDataState.FetchCartDataIsError = action.payload;
                state.FetchCartDataState.FetchCartDataIsSuccess = false;
            })
            .addCase(FetchFreshdeskTicketId.pending, (state) => {
                state.FetchFreshdeskTicketIdState.FetchFreshdeskTicketIdIsLoading = true;
                state.FetchFreshdeskTicketIdState.FetchFreshdeskTicketIdIsError = null;
                state.FetchFreshdeskTicketIdState.FetchFreshdeskTicketIdIsSuccess = false;
            })
            .addCase(FetchFreshdeskTicketId.fulfilled, (state, action) => {
                state.FetchFreshdeskTicketIdState.FetchFreshdeskTicketIdIsLoading = false;
                state.FetchFreshdeskTicketIdState.FetchFreshdeskTicketId = action.payload;
                state.FetchFreshdeskTicketIdState.FetchFreshdeskTicketIdIsSuccess = true;
            })
            .addCase(FetchFreshdeskTicketId.rejected, (state, action) => {
                state.FetchFreshdeskTicketIdState.FetchFreshdeskTicketIdIsLoading = false;
                state.FetchFreshdeskTicketIdState.FetchFreshdeskTicketIdIsError = action.payload;
                state.FetchFreshdeskTicketIdState.FetchFreshdeskTicketIdIsSuccess = false;
            });
    },
});

export default ThreadSlice.reducer;