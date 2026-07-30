import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "@/redux/axios-config";
import { ENDPOINTS } from "@/lib/config";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import type { OrderData } from "./thread-slice";

export type SupportTicketStatus = "open" | "pending" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";
export type SupportTicketChannel = "web" | "email" | "whatsapp" | "instagram";
export type SupportTicketMessageType = "external" | "internal";
export type SupportTicketMessageSenderType = "customer" | "agent";
export type SupportTicketMessageDirection = "incoming" | "outgoing";
export type SupportTicketPlatfrom = "internal" | "zendesk" | "freshdesk" | "zoho_desk" | "gorgias" | "intercom";
export type SupportTicketMessageContentType = "text/plain" | "multipart";
export type SupportTicketMessageAttachment = "text/plain" | "multipart";
export type SupportTicketDraftType = "manual" | "ai";

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
  addresses: unknown[];
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
};

type SupportTicketAssignee = {
  id: number;
  name: string;
  email: string;
};

type SupportTicketMessageAttachments = {
  id: number;
  file: string;
  file_url: string;
  content_type: string;
  created_at: string;
};

export type SupportTicketMessage = {
  id: number;
  message: string;
  message_type: SupportTicketMessageType;
  agent: number;
  sender_type: SupportTicketMessageSenderType;
  message_direction: SupportTicketMessageDirection;
  platform: SupportTicketPlatfrom;
  channel: SupportTicketChannel;
  content_type: SupportTicketMessageContentType;
  created_at: string;
  metadata: object;
  attachments: SupportTicketMessageAttachments[];
}

export type SupportTicketDraftMessage = {
  id: number;
  ticket: number;
  agent: number;
  message: string;
  draft_type: SupportTicketDraftType;
};

export type SupportTicket = {
  id: number;
  thread_id: string;
  customer: string | SupportTicketCustomer | null;
  internal_assignee: SupportTicketAssignee | null;

  subject: string;
  description: string;
  last_message?: string | null;

  status: SupportTicketStatus;
  priority: SupportTicketPriority;

  tags: SupportTicketTagsResponse[];

  is_read: boolean;
  channel: SupportTicketChannel;

  resolved_source?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  closed_source?: string | null;
  closed_at?: string | null;
  closed_by?: string | null;

  created_at: string;
  updated_at?: string;
  last_message_at?: string | null;

  messages?: SupportTicketMessage[];
  drafts?: SupportTicketDraftMessage[];
};

export type SupportTicketsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: SupportTicket[];
};

type SupportTicketStaffAssignData = {
  internal_assignee: number | null;
}

export const FetchSupportTickets = createAsyncThunk<
  SupportTicketsResponse,
  GetSupportTicketsArgs
>(
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

export const FetchSupportTicketDetails = createAsyncThunk(
  "FetchSupportTicketDetails",
  async (
    { storeCode, ticketId }: { storeCode: string; ticketId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchSupportTicketDeatils(ticketId)}?store_code=${storeCode}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch ticket details, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const SupportTicketMessageSend = createAsyncThunk(
  "SupportTicketMessageSend",
  async (
    { storeCode, ticketId, formData }: { storeCode: string; ticketId: number, formData: FormData },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.supportTicketMessageSend(ticketId)}?store_code=${storeCode}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
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
          "Unable to send message, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const FetchSupportTicketTags = createAsyncThunk(
  "SupportTicketTags",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchSupportTicketTags()}?store_code=${storeCode}`,
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

export const SupportTicketStaffAssign = createAsyncThunk(
  "SupportTicketStaffAssign",
  async (
    { storeCode, ticketId, payload }: { storeCode: string; ticketId: number; payload: SupportTicketStaffAssignData },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.put(
        `${ENDPOINTS.supportTicketStaffAssign(ticketId)}?store_code=${storeCode}`,
        payload,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to assign a staff to ticket, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const SupportTicketAgentDraftSave = createAsyncThunk(
  "SupportTicketAgentDraftSave",
  async (
    { storeCode, ticketId, payload }: { storeCode: string; ticketId: number; payload: {message: string} },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.supportTicketAgentDraftSave(ticketId)}?store_code=${storeCode}`,
        payload,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to save draft message, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const FetchTicketCustomerOrders = createAsyncThunk(
  "TicketCustomerOrders",
  async (
    { ticketId, storeCode }: { ticketId: number; storeCode: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchTicketCustomerOrders(ticketId)}?store_code=${storeCode}`,
        { useBackend: true },
      );
      const data = response.data.data;

      return data as OrderData[];
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      if (response?.status !== 404) {
        toast.error("Uh oh! Something went wrong.", {
          description:
            data?.message ||
            "Unable to fetch customer orders, please try again later.",
        });
      }

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
    FetchSupportTicketDetailsState: {
      FetchSupportTicketDetailsIsLoading: false,
      FetchSupportTicketDetailsIsSuccess: false,
      FetchSupportTicketDetailsIsError: null as null | string | object | unknown,
      FetchSupportTicketDetailsData: {} as SupportTicket,
    },
    SupportTicketMessageSendState: {
      SupportTicketMessageSendIsLoading: false,
      SupportTicketMessageSendIsSuccess: false,
      SupportTicketMessageSendIsError: null as null | string | object | unknown,
      SupportTicketMessageSendData: {} as SupportTicketMessage,
    },
    FetchSupportTicketTagsState: {
      FetchSupportTicketTagsIsLoading: false,
      FetchSupportTicketTagsIsSuccess: false,
      FetchSupportTicketTagsIsError: null as null | string | object | unknown,
      FetchSupportTicketTagsData: [] as SupportTicketTagsResponse[],
    },
    SupportTicketStaffAssignState: {
      SupportTicketStaffAssignIsLoading: false,
      SupportTicketStaffAssignIsSuccess: false,
      SupportTicketStaffAssignIsError: null as null | string | object | unknown,
      SupportTicketStaffAssignData: [] as SupportTicketStaffAssignData[],
    },
    SupportTicketAgentDraftSaveState: {
      SupportTicketAgentDraftSaveIsLoading: false,
      SupportTicketAgentDraftSaveIsSuccess: false,
      SupportTicketAgentDraftSaveIsError: null as null | string | object | unknown,
      SupportTicketAgentDraftSaveData: {} as SupportTicketDraftMessage,
    },
    FetchTicketCustomerOrdersState: {
      FetchTicketCustomerOrdersIsLoading: false,
      FetchTicketCustomerOrdersIsSuccess: false,
      FetchTicketCustomerOrdersIsError: null as null | string | object | unknown,
      FetchTicketCustomerOrdersData: [] as OrderData[],
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
              ...state.FetchSupportTicketsState.FetchSupportTicketsListData
                .results,
              ...action.payload.results,
            ],
          };
        } else {
          state.FetchSupportTicketsState.FetchSupportTicketsListData =
            action.payload;
        }
      })
      .addCase(FetchSupportTickets.rejected, (state, action) => {
        state.FetchSupportTicketsState.FetchSupportTicketsLoading = false;
        state.FetchSupportTicketsState.FetchSupportTicketsIsError =
          action.payload;
        state.FetchSupportTicketsState.FetchSupportTicketsIsSuccess = false;
      })
      .addCase(FetchSupportTicketDetails.pending, (state) => {
        state.FetchSupportTicketDetailsState.FetchSupportTicketDetailsIsLoading = true;
        state.FetchSupportTicketDetailsState.FetchSupportTicketDetailsIsError = null;
        state.FetchSupportTicketDetailsState.FetchSupportTicketDetailsIsSuccess = false;
      })
      .addCase(FetchSupportTicketDetails.fulfilled, (state, action) => {
        state.FetchSupportTicketDetailsState.FetchSupportTicketDetailsIsLoading = false;
        state.FetchSupportTicketDetailsState.FetchSupportTicketDetailsData =
          action.payload;
        state.FetchSupportTicketDetailsState.FetchSupportTicketDetailsIsSuccess = true;
      })
      .addCase(FetchSupportTicketDetails.rejected, (state, action) => {
        state.FetchSupportTicketDetailsState.FetchSupportTicketDetailsIsLoading = false;
        state.FetchSupportTicketDetailsState.FetchSupportTicketDetailsIsError =
          action.payload;
        state.FetchSupportTicketDetailsState.FetchSupportTicketDetailsIsSuccess = false;
      })
      .addCase(SupportTicketMessageSend.pending, (state) => {
        state.SupportTicketMessageSendState.SupportTicketMessageSendIsLoading = true;
        state.SupportTicketMessageSendState.SupportTicketMessageSendIsError = null;
        state.SupportTicketMessageSendState.SupportTicketMessageSendIsSuccess = false;
      })
      .addCase(SupportTicketMessageSend.fulfilled, (state, action) => {
        state.SupportTicketMessageSendState.SupportTicketMessageSendIsLoading = false;
        state.SupportTicketMessageSendState.SupportTicketMessageSendData =
          action.payload;
        state.SupportTicketMessageSendState.SupportTicketMessageSendIsSuccess = true;
      })
      .addCase(SupportTicketMessageSend.rejected, (state, action) => {
        state.SupportTicketMessageSendState.SupportTicketMessageSendIsLoading = false;
        state.SupportTicketMessageSendState.SupportTicketMessageSendIsError =
          action.payload;
        state.SupportTicketMessageSendState.SupportTicketMessageSendIsSuccess = false;
      })
      .addCase(FetchSupportTicketTags.pending, (state) => {
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsLoading = true;
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsError = null;
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsSuccess = false;
      })
      .addCase(FetchSupportTicketTags.fulfilled, (state, action) => {
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsLoading = false;
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsData =
          action.payload;
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsSuccess = true;
      })
      .addCase(FetchSupportTicketTags.rejected, (state, action) => {
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsLoading = false;
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsError =
          action.payload;
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsSuccess = false;
      })
      .addCase(SupportTicketStaffAssign.pending, (state) => {
        state.SupportTicketStaffAssignState.SupportTicketStaffAssignIsLoading = true;
        state.SupportTicketStaffAssignState.SupportTicketStaffAssignIsError = null;
        state.SupportTicketStaffAssignState.SupportTicketStaffAssignIsSuccess = false;
      })
      .addCase(SupportTicketStaffAssign.fulfilled, (state, action) => {
        state.SupportTicketStaffAssignState.SupportTicketStaffAssignIsLoading = false;
        state.SupportTicketStaffAssignState.SupportTicketStaffAssignData =
          action.payload;
        state.SupportTicketStaffAssignState.SupportTicketStaffAssignIsSuccess = true;
      })
      .addCase(SupportTicketStaffAssign.rejected, (state, action) => {
        state.SupportTicketStaffAssignState.SupportTicketStaffAssignIsLoading = false;
        state.SupportTicketStaffAssignState.SupportTicketStaffAssignIsError =
          action.payload;
        state.SupportTicketStaffAssignState.SupportTicketStaffAssignIsSuccess = false;
      })
      .addCase(SupportTicketAgentDraftSave.pending, (state) => {
        state.SupportTicketAgentDraftSaveState.SupportTicketAgentDraftSaveIsLoading = true;
        state.SupportTicketAgentDraftSaveState.SupportTicketAgentDraftSaveIsError = null;
        state.SupportTicketAgentDraftSaveState.SupportTicketAgentDraftSaveIsSuccess = false;
      })
      .addCase(SupportTicketAgentDraftSave.fulfilled, (state, action) => {
        state.SupportTicketAgentDraftSaveState.SupportTicketAgentDraftSaveIsLoading = false;
        state.SupportTicketAgentDraftSaveState.SupportTicketAgentDraftSaveData =
          action.payload;
        state.SupportTicketAgentDraftSaveState.SupportTicketAgentDraftSaveIsSuccess = true;
      })
      .addCase(SupportTicketAgentDraftSave.rejected, (state, action) => {
        state.SupportTicketAgentDraftSaveState.SupportTicketAgentDraftSaveIsLoading = false;
        state.SupportTicketAgentDraftSaveState.SupportTicketAgentDraftSaveIsError =
          action.payload;
        state.SupportTicketAgentDraftSaveState.SupportTicketAgentDraftSaveIsSuccess = false;
      })
      .addCase(FetchTicketCustomerOrders.pending, (state) => {
        state.FetchTicketCustomerOrdersState.FetchTicketCustomerOrdersIsLoading = true;
        state.FetchTicketCustomerOrdersState.FetchTicketCustomerOrdersIsError = null;
        state.FetchTicketCustomerOrdersState.FetchTicketCustomerOrdersIsSuccess = false;
      })
      .addCase(FetchTicketCustomerOrders.fulfilled, (state, action) => {
        state.FetchTicketCustomerOrdersState.FetchTicketCustomerOrdersIsLoading = false;
        state.FetchTicketCustomerOrdersState.FetchTicketCustomerOrdersData =
          action.payload;
        state.FetchTicketCustomerOrdersState.FetchTicketCustomerOrdersIsSuccess = true;
      })
      .addCase(FetchTicketCustomerOrders.rejected, (state, action) => {
        state.FetchTicketCustomerOrdersState.FetchTicketCustomerOrdersIsLoading = false;
        state.FetchTicketCustomerOrdersState.FetchTicketCustomerOrdersIsError =
          action.payload;
        state.FetchTicketCustomerOrdersState.FetchTicketCustomerOrdersIsSuccess = false;
      });
  },
});

export default SupportTicketsSlice.reducer;
