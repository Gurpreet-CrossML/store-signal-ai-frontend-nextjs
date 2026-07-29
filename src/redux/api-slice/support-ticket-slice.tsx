import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "@/redux/axios-config";
import { ENDPOINTS } from "@/lib/config";
import { toast } from "sonner";
import { isAxiosError } from "axios";


export type SupportTicketStatus = "open" | "pending" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";
export type SupportTicketChannel = "web" | "email" | "whatsapp" | "instagram";

type SupportTicketFilters = {
  status?: SupportTicketStatus;
};

type GetSupportTicketsArgs = {
  store_code?: string;
  page?: number;
  limit?: number;
  filters?: SupportTicketFilters;
};

export type SupportTicketCustomer = {
  id: number;
  addresses: any[];
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  store: number | null;
  customer_id: string;
  created_at: string;
  updated_at: string;
  thread_id: string;
};

export type SupportTicketTagsResponse = {
  id: number;
  name: string;
  color: string;
  description: string;
  store: number | null;
  created_at: string;
  updated_at: string;
};

type SupportTicketAssignee = {
    id: number;
    name: string;
    email: string;
}

export type SupportTicket = {
  id: number;
  customer: SupportTicketCustomer | null;
  internal_assignee: SupportTicketAssignee | null;

  subject: string;
  description: string;
  last_message: string | null;

  status: SupportTicketStatus;
  priority: SupportTicketPriority;

  tags: SupportTicketTagsResponse[];

  is_read: boolean;
  channel: SupportTicketChannel;

  resolved_source: string | null;
  resolved_by: number | null;
  resolved_at: string | null;

  closed_source: string | null;
  closed_by: number | null;
  closed_at: string | null;

  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

export type SupportTicketsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: SupportTicket[];
};

export const FetchSupportTickets = createAsyncThunk<SupportTicketsResponse, GetSupportTicketsArgs>(
  "Threads",
  async (
    {
      store_code = "",
      page = 1,
      limit = 10,
      filters = {},
    }: GetSupportTicketsArgs = {},
    thunkAPI,
  ) => {
    try {
      const filteration =
        "&" +
        Object.entries(filters)
          .map(([key, value]) => `${key}=${value}`)
          .join("&");

      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchSupportTickets()}?store_code=${store_code}&page=${page}&page_size=${limit}${filteration !== "&" ? filteration : ""}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch the threads, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const FetchSupportTicketTags = createAsyncThunk(
  "SupportTicketTags",
  async (store_code: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchSupportTicketTags()}?store_code=${store_code}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch support ticket tags, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const SupportTicketsSlice = createSlice({
  name: "SupportTicketsSlice",
  initialState: {
    FetchSupportTicketsState: {
      FetchSupportTicketsLoading: false,
      FetchSupportTicketsIsSuccess: false,
      FetchSupportTicketsIsError: null as null | string | object | unknown,
      FetchSupportTicketsListData: {
        count: 0,
        next: null,
        previous: null,
        results: [],
      } as SupportTicketsResponse,
    },
    FetchSupportTicketTagsState: {
      FetchSupportTicketTagsIsLoading: false,
      FetchSupportTicketTagsIsSuccess: false,
      FetchSupportTicketTagsIsError: null as null | string | object | unknown,
      FetchSupportTicketTagsData: [] as SupportTicketTagsResponse[],
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchSupportTickets.pending, (state, action) => {
        state.FetchSupportTicketsState.FetchSupportTicketsLoading = true;
        state.FetchSupportTicketsState.FetchSupportTicketsIsError = null;
        state.FetchSupportTicketsState.FetchSupportTicketsIsSuccess = false;

        if (action.meta.arg.page === 1) {
          state.FetchSupportTicketsState.FetchSupportTicketsListData = {
            count: 0,
            next: null,
            previous: null,
            results: [],
          };
        }
      })
      .addCase(FetchSupportTickets.fulfilled, (state, action) => {
        state.FetchSupportTicketsState.FetchSupportTicketsLoading = false;
        state.FetchSupportTicketsState.FetchSupportTicketsIsSuccess = true;

        if ((action.meta.arg.page ?? 1) > 1) {
          state.FetchSupportTicketsState.FetchSupportTicketsListData = {
            ...action.payload,
            results: [
              ...state.FetchSupportTicketsState.FetchSupportTicketsListData.results,
              ...action.payload.results,
            ],
          };
        } else {
          state.FetchSupportTicketsState.FetchSupportTicketsListData = action.payload;
        }
      })
      .addCase(FetchSupportTickets.rejected, (state, action) => {
        state.FetchSupportTicketsState.FetchSupportTicketsLoading = false;
        state.FetchSupportTicketsState.FetchSupportTicketsIsError = action.payload;
        state.FetchSupportTicketsState.FetchSupportTicketsIsSuccess = false;
      })
       .addCase(FetchSupportTicketTags.pending, (state) => {
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsLoading = true;
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsError = null;
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsSuccess = false;
      })
      .addCase(FetchSupportTicketTags.fulfilled, (state, action) => {
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsLoading = false;
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsData = action.payload;
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsSuccess = true;
      })
      .addCase(FetchSupportTicketTags.rejected, (state, action) => {
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsLoading = false;
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsError =
          action.payload;
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsSuccess = false;
      });
  },
});

export default SupportTicketsSlice.reducer;
