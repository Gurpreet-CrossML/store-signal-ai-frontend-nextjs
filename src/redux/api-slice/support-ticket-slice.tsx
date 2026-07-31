import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "@/redux/axios-config";
import { ENDPOINTS } from "@/lib/config";
import { toast } from "sonner";
import { isAxiosError } from "axios";

export type SupportTicketStatus = "open" | "pending" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";
export type SupportTicketChannel =
  | "web"
  | "email"
  | "whatsapp"
  | "facebook"
  | "instagram";
export type SupportTicketMessageType = "external" | "internal";
export type SupportTicketMessageSenderType = "customer" | "agent";
export type SupportTicketMessageDirection = "incoming" | "outgoing";
export type SupportTicketPlatfrom =
  | "internal"
  | "zendesk"
  | "freshdesk"
  | "zoho_desk"
  | "gorgias"
  | "intercom";
export type SupportTicketMessageContentType = "text/plain" | "multipart";
export type SupportTicketMessageAttachment = "text/plain" | "multipart";
export type SupportTicketDraftType = "manual" | "ai";

export type SupportTicketFilters = {
  status?: SupportTicketStatus;
  search?: string;
  channel?: SupportTicketChannel[];
  tags?: string[];
  from_date?: string;
  to_date?: string;
  priority?: SupportTicketPriority[];
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
  id?: number;
  name: string;
  color: string;
  description: string;
};

export type SupportTicketTagsListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: SupportTicketTagsResponse[];
};

export type SupportMessageImproveResponse = {
  message: string;
  action: string;
};

export type SupportTicketSnoozeResponse = {
  snoozed_until: string | null;
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
};

export type SupportTicketDraftMessage = {
  id: number;
  ticket: number;
  agent: number;
  message: string;
  draft_type: SupportTicketDraftType;
};

export type SupportTicket = {
  id: number;
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

  is_snoozed: boolean;
  snoozed_until: string;
};

export type SupportTicketsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: SupportTicket[];
};

type SupportTicketStaffAssignData = {
  internal_assignee: number | null;
};

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
      const queryParams = new URLSearchParams({
        store_code,
        page: String(page),
        page_size: String(limit),
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.set(key, Array.isArray(value) ? value.join(",") : value);
        }
      });

      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchSupportTickets()}?${queryParams.toString()}`,
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
    {
      storeCode,
      ticketId,
      formData,
    }: { storeCode: string; ticketId: number; formData: FormData },
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
          data?.message || "Unable to send message, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const FetchSupportTicketTags = createAsyncThunk<
  SupportTicketTagsListResponse,
  { storeCode: string; search?: string; page?: number; limit?: number }
>(
  "SupportTicketTags",
  async ({ storeCode, search = "", page = 1, limit = 20 }, thunkAPI) => {
    try {
      const queryParams = new URLSearchParams({
        store_code: storeCode,
        page: String(page),
        page_size: String(limit),
      });
      if (search) queryParams.set("search", search);

      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchSupportTicketTags()}?${queryParams.toString()}`,
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
    {
      storeCode,
      ticketId,
      payload,
    }: {
      storeCode: string;
      ticketId: number;
      payload: SupportTicketStaffAssignData;
    },
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
    {
      storeCode,
      ticketId,
      payload,
    }: { storeCode: string; ticketId: number; payload: { message: string } },
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

export const SupportTicketTagAssign = createAsyncThunk(
  "SupportTicketTagAssign",
  async (
    {
      storeCode,
      ticketId,
      tagId,
    }: { storeCode: string; ticketId: number; tagId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.put(
        `${ENDPOINTS.supportTicketTagAssign(ticketId, tagId)}?store_code=${storeCode}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to assign this tag to ticket, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const SupportTicketTagRemove = createAsyncThunk(
  "SupportTicketTagRemove",
  async (
    {
      storeCode,
      ticketId,
      tagId,
    }: { storeCode: string; ticketId: number; tagId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.put(
        `${ENDPOINTS.supportTicketTagRemove(ticketId, tagId)}?store_code=${storeCode}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to remove this tag to ticket, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const SupportMessageImprove = createAsyncThunk(
  "SupportMessageImprove",
  async (
    {
      storeCode,
      ticketId,
      payload,
    }: {
      storeCode: string;
      ticketId: number;
      payload: SupportMessageImproveResponse;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.supportMessageImprove(ticketId)}?store_code=${storeCode}`,
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
          "Unable to improve the message, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const SupportTicketSnooze = createAsyncThunk(
  "SupportTicketSnooze",
  async (
    {
      storeCode,
      ticketId,
      payload,
    }: {
      storeCode: string;
      ticketId: number;
      payload: SupportTicketSnoozeResponse;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.put(
        `${ENDPOINTS.supportTicketSnooze(ticketId)}?store_code=${storeCode}`,
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
          "Unable to snooze this ticket, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const SupportTicketMarkRead = createAsyncThunk(
  "SupportTicketMarkRead",
  async (
    { storeCode, ticketId }: { storeCode: string; ticketId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.put(
        `${ENDPOINTS.supportTicketMarkRead(ticketId)}?store_code=${storeCode}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to mark read, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const TicketTagDelete = createAsyncThunk(
  "TicketTagDelete",
  async (
    { storeCode, tagId }: { storeCode: string; tagId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.delete(
        `${ENDPOINTS.ticketTagDelete(tagId)}?store_code=${storeCode}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to delete this tag, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const TicketTagCreate = createAsyncThunk(
  "TicketTagCreate",
  async (
    {
      storeCode,
      payload,
    }: { storeCode: string; payload: SupportTicketTagsResponse },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.ticketTagCreate()}?store_code=${storeCode}`,
        payload,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to create a tag, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const TicketTagUpdate = createAsyncThunk(
  "TicketTagUpdate",
  async (
    {
      storeCode,
      tagId,
      payload,
    }: { storeCode: string; tagId: number; payload: SupportTicketTagsResponse },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.ticketTagUpdate(tagId)}?store_code=${storeCode}`,
        payload,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to update this tag, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const SupportTicketAIMessageDraftGenerate = createAsyncThunk(
  "SupportTicketAIMessageDraftGenerate",
  async (
    { storeCode, ticketId }: { storeCode: string; ticketId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.supportTicketAIMessageDraftGenerate(ticketId)}?store_code=${storeCode}`,
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to generate ai draft, please try again later.",
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
    FetchSupportTicketDetailsState: {
      FetchSupportTicketDetailsIsLoading: false,
      FetchSupportTicketDetailsIsSuccess: false,
      FetchSupportTicketDetailsIsError: null as
        | null
        | string
        | object
        | unknown,
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
      FetchSupportTicketTagsNext: null as string | null,
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
      SupportTicketAgentDraftSaveIsError: null as
        | null
        | string
        | object
        | unknown,
      SupportTicketAgentDraftSaveData: {} as SupportTicketDraftMessage,
    },
    SupportTicketTagAssignState: {
      SupportTicketTagAssignIsLoading: false,
      SupportTicketTagAssignIsSuccess: false,
      SupportTicketTagAssignIsError: null as null | string | object | unknown,
      SupportTicketTagAssignData: {} as SupportTicketTagsResponse,
    },
    SupportTicketTagRemoveState: {
      SupportTicketTagRemoveIsLoading: false,
      SupportTicketTagRemoveIsSuccess: false,
      SupportTicketTagRemoveIsError: null as null | string | object | unknown,
      SupportTicketTagRemoveData: {} as SupportTicketTagsResponse,
    },
    SupportMessageImproveState: {
      SupportMessageImproveIsLoading: false,
      SupportMessageImproveIsSuccess: false,
      SupportMessageImproveIsError: null as null | string | object | unknown,
      SupportMessageImproveData: {} as SupportMessageImproveResponse,
    },
    SupportTicketSnoozeState: {
      SupportTicketSnoozeIsLoading: false,
      SupportTicketSnoozeIsSuccess: false,
      SupportTicketSnoozeIsError: null as null | string | object | unknown,
      SupportTicketSnoozeData: {} as SupportTicketSnoozeResponse,
    },
    SupportTicketMarkReadState: {
      SupportTicketMarkReadIsLoading: false,
      SupportTicketMarkReadIsSuccess: false,
      SupportTicketMarkReadIsError: null as null | string | object | unknown,
      SupportTicketMarkReadData: {} as SupportTicketSnoozeResponse,
    },
    TicketTagDeleteState: {
      TicketTagDeleteIsLoading: false,
      TicketTagDeleteIsSuccess: false,
      TicketTagDeleteIsError: null as null | string | object | unknown,
      TicketTagDeleteData: {} as SupportTicketTagsResponse,
    },
    TicketTagCreateState: {
      TicketTagCreateIsLoading: false,
      TicketTagCreateIsSuccess: false,
      TicketTagCreateIsError: null as null | string | object | unknown,
      TicketTagCreateData: {} as SupportTicketTagsResponse,
    },
    TicketTagUpdateState: {
      TicketTagUpdateIsLoading: false,
      TicketTagUpdateIsSuccess: false,
      TicketTagUpdateIsError: null as null | string | object | unknown,
      TicketTagUpdateData: {} as SupportTicketTagsResponse,
    },
    SupportTicketAIMessageDraftGenerateState: {
      SupportTicketAIMessageDraftGenerateIsLoading: false,
      SupportTicketAIMessageDraftGenerateIsSuccess: false,
      SupportTicketAIMessageDraftGenerateIsError: null as
        | null
        | string
        | object
        | unknown,
      SupportTicketAIMessageDraftGenerateData: {} as SupportTicketDraftMessage,
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
        state.FetchSupportTicketDetailsState.FetchSupportTicketDetailsIsError =
          null;
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
        state.SupportTicketMessageSendState.SupportTicketMessageSendIsError =
          null;
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
      .addCase(FetchSupportTicketTags.pending, (state, action) => {
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsLoading = true;
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsError = null;
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsSuccess = false;
        if ((action.meta.arg.page ?? 1) === 1) {
          state.FetchSupportTicketTagsState.FetchSupportTicketTagsData = [];
          state.FetchSupportTicketTagsState.FetchSupportTicketTagsNext = null;
        }
      })
      .addCase(FetchSupportTicketTags.fulfilled, (state, action) => {
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsIsLoading = false;
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsData =
          (action.meta.arg.page ?? 1) > 1
            ? [
                ...state.FetchSupportTicketTagsState.FetchSupportTicketTagsData,
                ...action.payload.results.filter(
                  (tag) =>
                    !state.FetchSupportTicketTagsState.FetchSupportTicketTagsData.some(
                      (existing) => existing.name === tag.name,
                    ),
                ),
              ]
            : action.payload.results;
        state.FetchSupportTicketTagsState.FetchSupportTicketTagsNext =
          action.payload.next;
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
        state.SupportTicketStaffAssignState.SupportTicketStaffAssignIsError =
          null;
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
        state.SupportTicketAgentDraftSaveState.SupportTicketAgentDraftSaveIsError =
          null;
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
      .addCase(SupportTicketTagAssign.pending, (state) => {
        state.SupportTicketTagAssignState.SupportTicketTagAssignIsLoading = true;
        state.SupportTicketTagAssignState.SupportTicketTagAssignIsError = null;
        state.SupportTicketTagAssignState.SupportTicketTagAssignIsSuccess = false;
      })
      .addCase(SupportTicketTagAssign.fulfilled, (state, action) => {
        state.SupportTicketTagAssignState.SupportTicketTagAssignIsLoading = false;
        state.SupportTicketTagAssignState.SupportTicketTagAssignData =
          action.payload;
        state.SupportTicketTagAssignState.SupportTicketTagAssignIsSuccess = true;
      })
      .addCase(SupportTicketTagAssign.rejected, (state, action) => {
        state.SupportTicketTagAssignState.SupportTicketTagAssignIsLoading = false;
        state.SupportTicketTagAssignState.SupportTicketTagAssignIsError =
          action.payload;
        state.SupportTicketTagAssignState.SupportTicketTagAssignIsSuccess = false;
      })
      .addCase(SupportTicketTagRemove.pending, (state) => {
        state.SupportTicketTagRemoveState.SupportTicketTagRemoveIsLoading = true;
        state.SupportTicketTagRemoveState.SupportTicketTagRemoveIsError = null;
        state.SupportTicketTagRemoveState.SupportTicketTagRemoveIsSuccess = false;
      })
      .addCase(SupportTicketTagRemove.fulfilled, (state, action) => {
        state.SupportTicketTagRemoveState.SupportTicketTagRemoveIsLoading = false;
        state.SupportTicketTagRemoveState.SupportTicketTagRemoveData =
          action.payload;
        state.SupportTicketTagRemoveState.SupportTicketTagRemoveIsSuccess = true;
      })
      .addCase(SupportTicketTagRemove.rejected, (state, action) => {
        state.SupportTicketTagRemoveState.SupportTicketTagRemoveIsLoading = false;
        state.SupportTicketTagRemoveState.SupportTicketTagRemoveIsError =
          action.payload;
        state.SupportTicketTagRemoveState.SupportTicketTagRemoveIsSuccess = false;
      })
      .addCase(SupportMessageImprove.pending, (state) => {
        state.SupportMessageImproveState.SupportMessageImproveIsLoading = true;
        state.SupportMessageImproveState.SupportMessageImproveIsError = null;
        state.SupportMessageImproveState.SupportMessageImproveIsSuccess = false;
      })
      .addCase(SupportMessageImprove.fulfilled, (state, action) => {
        state.SupportMessageImproveState.SupportMessageImproveIsLoading = false;
        state.SupportMessageImproveState.SupportMessageImproveData =
          action.payload;
        state.SupportMessageImproveState.SupportMessageImproveIsSuccess = true;
      })
      .addCase(SupportMessageImprove.rejected, (state, action) => {
        state.SupportMessageImproveState.SupportMessageImproveIsLoading = false;
        state.SupportMessageImproveState.SupportMessageImproveIsError =
          action.payload;
        state.SupportMessageImproveState.SupportMessageImproveIsSuccess = false;
      })
      .addCase(SupportTicketSnooze.pending, (state) => {
        state.SupportTicketSnoozeState.SupportTicketSnoozeIsLoading = true;
        state.SupportTicketSnoozeState.SupportTicketSnoozeIsError = null;
        state.SupportTicketSnoozeState.SupportTicketSnoozeIsSuccess = false;
      })
      .addCase(SupportTicketSnooze.fulfilled, (state, action) => {
        state.SupportTicketSnoozeState.SupportTicketSnoozeIsLoading = false;
        state.SupportTicketSnoozeState.SupportTicketSnoozeData = action.payload;
        state.SupportTicketSnoozeState.SupportTicketSnoozeIsSuccess = true;
      })
      .addCase(SupportTicketSnooze.rejected, (state, action) => {
        state.SupportTicketSnoozeState.SupportTicketSnoozeIsLoading = false;
        state.SupportTicketSnoozeState.SupportTicketSnoozeIsError =
          action.payload;
        state.SupportTicketSnoozeState.SupportTicketSnoozeIsSuccess = false;
      })
      .addCase(SupportTicketMarkRead.pending, (state) => {
        state.SupportTicketMarkReadState.SupportTicketMarkReadIsLoading = true;
        state.SupportTicketMarkReadState.SupportTicketMarkReadIsError = null;
        state.SupportTicketMarkReadState.SupportTicketMarkReadIsSuccess = false;
      })
      .addCase(SupportTicketMarkRead.fulfilled, (state, action) => {
        state.SupportTicketMarkReadState.SupportTicketMarkReadIsLoading = false;
        state.SupportTicketMarkReadState.SupportTicketMarkReadData =
          action.payload;
        state.SupportTicketMarkReadState.SupportTicketMarkReadIsSuccess = true;
      })
      .addCase(SupportTicketMarkRead.rejected, (state, action) => {
        state.SupportTicketMarkReadState.SupportTicketMarkReadIsLoading = false;
        state.SupportTicketMarkReadState.SupportTicketMarkReadIsError =
          action.payload;
        state.SupportTicketMarkReadState.SupportTicketMarkReadIsSuccess = false;
      })
      .addCase(TicketTagDelete.pending, (state) => {
        state.TicketTagDeleteState.TicketTagDeleteIsLoading = true;
        state.TicketTagDeleteState.TicketTagDeleteIsError = null;
        state.TicketTagDeleteState.TicketTagDeleteIsSuccess = false;
      })
      .addCase(TicketTagDelete.fulfilled, (state, action) => {
        state.TicketTagDeleteState.TicketTagDeleteIsLoading = false;
        state.TicketTagDeleteState.TicketTagDeleteData = action.payload;
        state.TicketTagDeleteState.TicketTagDeleteIsSuccess = true;
      })
      .addCase(TicketTagDelete.rejected, (state, action) => {
        state.TicketTagDeleteState.TicketTagDeleteIsLoading = false;
        state.TicketTagDeleteState.TicketTagDeleteIsError = action.payload;
        state.TicketTagDeleteState.TicketTagDeleteIsSuccess = false;
      })
      .addCase(TicketTagCreate.pending, (state) => {
        state.TicketTagCreateState.TicketTagCreateIsLoading = true;
        state.TicketTagCreateState.TicketTagCreateIsError = null;
        state.TicketTagCreateState.TicketTagCreateIsSuccess = false;
      })
      .addCase(TicketTagCreate.fulfilled, (state, action) => {
        state.TicketTagCreateState.TicketTagCreateIsLoading = false;
        state.TicketTagCreateState.TicketTagCreateData = action.payload;
        state.TicketTagCreateState.TicketTagCreateIsSuccess = true;
      })
      .addCase(TicketTagCreate.rejected, (state, action) => {
        state.TicketTagCreateState.TicketTagCreateIsLoading = false;
        state.TicketTagCreateState.TicketTagCreateIsError = action.payload;
        state.TicketTagCreateState.TicketTagCreateIsSuccess = false;
      })
      .addCase(TicketTagUpdate.pending, (state) => {
        state.TicketTagUpdateState.TicketTagUpdateIsLoading = true;
        state.TicketTagUpdateState.TicketTagUpdateIsError = null;
        state.TicketTagUpdateState.TicketTagUpdateIsSuccess = false;
      })
      .addCase(TicketTagUpdate.fulfilled, (state, action) => {
        state.TicketTagUpdateState.TicketTagUpdateIsLoading = false;
        state.TicketTagUpdateState.TicketTagUpdateData = action.payload;
        state.TicketTagUpdateState.TicketTagUpdateIsSuccess = true;
      })
      .addCase(TicketTagUpdate.rejected, (state, action) => {
        state.TicketTagUpdateState.TicketTagUpdateIsLoading = false;
        state.TicketTagUpdateState.TicketTagUpdateIsError = action.payload;
        state.TicketTagUpdateState.TicketTagUpdateIsSuccess = false;
      })
      .addCase(SupportTicketAIMessageDraftGenerate.pending, (state) => {
        state.SupportTicketAIMessageDraftGenerateState.SupportTicketAIMessageDraftGenerateIsLoading = true;
        state.SupportTicketAIMessageDraftGenerateState.SupportTicketAIMessageDraftGenerateIsError =
          null;
        state.SupportTicketAIMessageDraftGenerateState.SupportTicketAIMessageDraftGenerateIsSuccess = false;
      })
      .addCase(
        SupportTicketAIMessageDraftGenerate.fulfilled,
        (state, action) => {
          state.SupportTicketAIMessageDraftGenerateState.SupportTicketAIMessageDraftGenerateIsLoading = false;
          state.SupportTicketAIMessageDraftGenerateState.SupportTicketAIMessageDraftGenerateData =
            action.payload;
          state.SupportTicketAIMessageDraftGenerateState.SupportTicketAIMessageDraftGenerateIsSuccess = true;
        },
      )
      .addCase(
        SupportTicketAIMessageDraftGenerate.rejected,
        (state, action) => {
          state.SupportTicketAIMessageDraftGenerateState.SupportTicketAIMessageDraftGenerateIsLoading = false;
          state.SupportTicketAIMessageDraftGenerateState.SupportTicketAIMessageDraftGenerateIsError =
            action.payload;
          state.SupportTicketAIMessageDraftGenerateState.SupportTicketAIMessageDraftGenerateIsSuccess = false;
        },
      );
  },
});

export default SupportTicketsSlice.reducer;
