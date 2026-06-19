import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "@/redux/axios-config";
import { ENDPOINTS } from "@/lib/config";
import { toast } from "sonner";
import { isAxiosError } from "axios";

type TicketFilters = {
  store_code?: string;
  search?: string;
  status?: string;
  platform?: string;
  priority?: string;
};

type GetTicketsArgs = {
  store_code?: string;
  page?: number;
  limit?: number;
  filters?: TicketFilters;
};

export type Ticket = {
  id: number;
  ticket_id: number;
  platform: string;
  status: string;
  priority: string;
  subject: string;
  description: string;
  thread: string;
  created_at: string;
  updated_at: string;
  agent_email: string | null;
  agent_name: string | null;
  ticket_url: string | null;
  customer: number | null;
  store: number;
};

export type TicketDetails = Ticket & {
  external_details: Record<string, unknown> | null;
};

export type TicketsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Ticket[];
};

export const FetchTickets = createAsyncThunk<TicketsResponse, GetTicketsArgs>(
  "Tickets",
  async (
    {
      store_code = "",
      page = 1,
      limit = 10,
      filters = {},
    }: GetTicketsArgs = {},
    thunkAPI,
  ) => {
    try {
      const filteration =
        "&" +
        Object.entries(filters)
          .map(([key, value]) => `${key}=${value}`)
          .join("&");

      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchTickets()}?store_code=${store_code}&page=${page}&page_size=${limit}${filteration !== "&" ? filteration : ""}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to fetch the tickets, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const FetchTicketDetails = createAsyncThunk<
  TicketDetails,
  number
>(
  "TicketDetails",
  async (ticketId: number, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        ENDPOINTS.fetchTicketDetails(ticketId),
      );
      const data: TicketDetails = response.data.data;
      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch the ticket details, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const TicketSlice = createSlice({
  name: "Ticket",
  initialState: {
    FetchTicketsState: {
      FetchTicketsIsLoading: false,
      FetchTicketsIsSuccess: false,
      FetchTicketsIsError: null as null | string | object | unknown,
      FetchTicketsListData: {
        count: 0,
        next: null,
        previous: null,
        results: [] as Ticket[],
      } as TicketsResponse,
    },
    FetchTicketDetailsState: {
      FetchTicketDetailsIsLoading: false,
      FetchTicketDetailsIsSuccess: false,
      FetchTicketDetailsIsError: null as null | string | object | unknown,
      FetchTicketDetailsData: null as TicketDetails | null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchTickets.pending, (state) => {
        state.FetchTicketsState.FetchTicketsIsLoading = true;
        state.FetchTicketsState.FetchTicketsIsSuccess = false;
        state.FetchTicketsState.FetchTicketsIsError = null;
      })
      .addCase(FetchTickets.fulfilled, (state, action) => {
        state.FetchTicketsState.FetchTicketsIsLoading = false;
        state.FetchTicketsState.FetchTicketsIsSuccess = true;
        state.FetchTicketsState.FetchTicketsListData = action.payload;
      })
      .addCase(FetchTickets.rejected, (state, action) => {
        state.FetchTicketsState.FetchTicketsIsLoading = false;
        state.FetchTicketsState.FetchTicketsIsSuccess = false;
        state.FetchTicketsState.FetchTicketsIsError =
          action.payload || "Something went wrong";
      })
      .addCase(FetchTicketDetails.pending, (state) => {
        state.FetchTicketDetailsState.FetchTicketDetailsIsLoading = true;
        state.FetchTicketDetailsState.FetchTicketDetailsIsSuccess = false;
        state.FetchTicketDetailsState.FetchTicketDetailsIsError = null;
      })
      .addCase(FetchTicketDetails.fulfilled, (state, action) => {
        state.FetchTicketDetailsState.FetchTicketDetailsIsLoading = false;
        state.FetchTicketDetailsState.FetchTicketDetailsIsSuccess = true;
        state.FetchTicketDetailsState.FetchTicketDetailsData = action.payload;
      })
      .addCase(FetchTicketDetails.rejected, (state, action) => {
        state.FetchTicketDetailsState.FetchTicketDetailsIsLoading = false;
        state.FetchTicketDetailsState.FetchTicketDetailsIsSuccess = false;
        state.FetchTicketDetailsState.FetchTicketDetailsIsError =
          action.payload || "Something went wrong";
      });
  },
});

export default TicketSlice.reducer;
