import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { axiosInstance } from "@/redux/axios-config";
import { ENDPOINTS } from "@/lib/config";

// --- Types ------------------------------------------------------------
// Kept in the API's snake_case: the socket pushes the same serializer
// output as the list API returns, so one shape serves both.

export type NotificationType =
  | "ticket_assigned"
  | "ticket_message"
  | "chat_assigned"
  | "chat_message";

export type AgentNotification = {
  id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  /** Set for ticket notifications; opens `/helpdesk?ticket=<id>`. */
  ticket: number | null;
  /** Set for live chat notifications; opens `/support?chat=<id>`. */
  thread: string | null;
  store_code: string;
  is_read: boolean;
  created_at: string;
};

/** The notification drawer's tabs. */
export type NotificationTab = "all" | "unread" | "tickets" | "messages";

export type NotificationCounts = Record<NotificationTab, number>;

export type NotificationListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AgentNotification[];
};

// The list API's filter for each tab.
const TAB_FILTERS: Record<NotificationTab, Record<string, string>> = {
  all: {},
  unread: { is_read: "false" },
  tickets: { ticket__isnull: "false" },
  messages: { thread__isnull: "false" },
};

/** One page of the store's notifications in a tab. */
async function getNotificationPage(
  storeCode: string,
  tab: NotificationTab,
  page: number,
): Promise<NotificationListResponse> {
  const params = new URLSearchParams({
    store_code: storeCode,
    page: String(page),
    ...TAB_FILTERS[tab],
  });

  const response = await axiosInstance.get(
    `${ENDPOINTS.notifications()}?${params.toString()}`,
    { useBackend: true },
  );
  return response.data.data;
}

// --- Thunks -------------------------------------------------------------
// Notifications are store-scoped: every call names the store with
// `?store_code=`, and the backend returns only the logged-in agent's own
// notifications of that store.

/** The first page of a tab; replaces the list. */
export const FetchNotifications = createAsyncThunk(
  "FetchNotifications",
  async (
    { storeCode, tab = "all" }: { storeCode: string; tab?: NotificationTab },
    thunkAPI,
  ) => {
    try {
      return await getNotificationPage(storeCode, tab, 1);
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load notifications.", {
        description:
          data?.message || "Unable to load notifications, please try again.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't load notifications.");
    }
  },
);

/** A later page of a tab, as the agent scrolls; added to the list. */
export const FetchMoreNotifications = createAsyncThunk(
  "FetchMoreNotifications",
  async (
    {
      storeCode,
      tab = "all",
      page,
    }: { storeCode: string; tab?: NotificationTab; page: number },
    thunkAPI,
  ) => {
    try {
      return await getNotificationPage(storeCode, tab, page);
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load more notifications.", {
        description:
          data?.message ||
          "Unable to load more notifications, please try again.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't load more notifications.");
    }
  },
);

// The bell's badge (`unread`) and the drawer's tab sizes, in one request.
// No error toast: this runs in the background.
export const FetchNotificationCounts = createAsyncThunk(
  "FetchNotificationCounts",
  async ({ storeCode }: { storeCode: string }, thunkAPI) => {
    try {
      const params = new URLSearchParams({ store_code: storeCode });

      const response = await axiosInstance.get(
        `${ENDPOINTS.notificationCounts()}?${params.toString()}`,
        { useBackend: true },
      );
      const data: NotificationCounts = response.data.data;
      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      return thunkAPI.rejectWithValue(response?.data || "Couldn't fetch notification counts.");
    }
  },
);

export const MarkNotificationRead = createAsyncThunk(
  "MarkNotificationRead",
  async ({ storeCode, id }: { storeCode: string; id: number }, thunkAPI) => {
    try {
      const response = await axiosInstance.put(
        `${ENDPOINTS.notificationMarkRead(id)}?store_code=${storeCode}`,
      );
      const data: AgentNotification = response.data.data;
      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't mark the notification as read.", {
        description:
          data?.message ||
          "Unable to mark the notification as read, please try again.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't mark the notification as read.");
    }
  },
);

// --- Slice ----------------------------------------------------------------

const NotificationSlice = createSlice({
  name: "Notification",
  initialState: {
    FetchNotificationsState: {
      FetchNotificationsIsLoading: false,
      FetchNotificationsIsSuccess: false,
      FetchNotificationsIsError: null as null | string | object,
      FetchNotificationsListData: {
        count: 0,
        next: null,
        previous: null,
        results: [],
      } as NotificationListResponse,
    },
    FetchMoreNotificationsState: {
      FetchMoreNotificationsIsLoading: false,
      FetchMoreNotificationsIsSuccess: false,
      FetchMoreNotificationsIsError: null as null | string | object,
    },
    FetchNotificationCountsState: {
      FetchNotificationCountsIsLoading: false,
      FetchNotificationCountsIsSuccess: false,
      FetchNotificationCountsIsError: null as null | string | object,
      FetchNotificationCountsData: {
        all: 0,
        unread: 0,
        tickets: 0,
        messages: 0,
      } as NotificationCounts,
    },
    MarkNotificationReadState: {
      MarkNotificationReadIsLoading: false,
      MarkNotificationReadIsSuccess: false,
      MarkNotificationReadIsError: null as null | string | object,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchNotifications.pending, (state) => {
        state.FetchNotificationsState.FetchNotificationsIsLoading = true;
        state.FetchNotificationsState.FetchNotificationsIsSuccess = false;
        state.FetchNotificationsState.FetchNotificationsIsError = null;
      })
      .addCase(FetchNotifications.fulfilled, (state, action) => {
        state.FetchNotificationsState.FetchNotificationsIsLoading = false;
        state.FetchNotificationsState.FetchNotificationsIsSuccess = true;
        state.FetchNotificationsState.FetchNotificationsListData =
          action.payload;
      })
      .addCase(FetchNotifications.rejected, (state, action) => {
        state.FetchNotificationsState.FetchNotificationsIsLoading = false;
        state.FetchNotificationsState.FetchNotificationsIsSuccess = false;
        state.FetchNotificationsState.FetchNotificationsIsError =
          action.payload || "Couldn't load notifications.";
      })
      .addCase(FetchMoreNotifications.pending, (state) => {
        state.FetchMoreNotificationsState.FetchMoreNotificationsIsLoading = true;
        state.FetchMoreNotificationsState.FetchMoreNotificationsIsSuccess = false;
        state.FetchMoreNotificationsState.FetchMoreNotificationsIsError = null;
      })
      .addCase(FetchMoreNotifications.fulfilled, (state, action) => {
        state.FetchMoreNotificationsState.FetchMoreNotificationsIsLoading = false;
        state.FetchMoreNotificationsState.FetchMoreNotificationsIsSuccess = true;
        state.FetchNotificationsState.FetchNotificationsListData = {
          ...action.payload,
          results: [
            ...state.FetchNotificationsState.FetchNotificationsListData.results,
            ...action.payload.results,
          ],
        };
      })
      .addCase(FetchMoreNotifications.rejected, (state, action) => {
        state.FetchMoreNotificationsState.FetchMoreNotificationsIsLoading = false;
        state.FetchMoreNotificationsState.FetchMoreNotificationsIsSuccess = false;
        state.FetchMoreNotificationsState.FetchMoreNotificationsIsError =
          action.payload || "Couldn't load more notifications.";
      })
      .addCase(FetchNotificationCounts.pending, (state) => {
        state.FetchNotificationCountsState.FetchNotificationCountsIsLoading = true;
        state.FetchNotificationCountsState.FetchNotificationCountsIsSuccess = false;
        state.FetchNotificationCountsState.FetchNotificationCountsIsError =
          null;
      })
      .addCase(FetchNotificationCounts.fulfilled, (state, action) => {
        state.FetchNotificationCountsState.FetchNotificationCountsIsLoading = false;
        state.FetchNotificationCountsState.FetchNotificationCountsIsSuccess = true;
        state.FetchNotificationCountsState.FetchNotificationCountsData =
          action.payload;
      })
      .addCase(FetchNotificationCounts.rejected, (state, action) => {
        state.FetchNotificationCountsState.FetchNotificationCountsIsLoading = false;
        state.FetchNotificationCountsState.FetchNotificationCountsIsSuccess = false;
        state.FetchNotificationCountsState.FetchNotificationCountsIsError =
          action.payload || "Couldn't fetch notification counts.";
      })
      .addCase(MarkNotificationRead.pending, (state) => {
        state.MarkNotificationReadState.MarkNotificationReadIsLoading = true;
        state.MarkNotificationReadState.MarkNotificationReadIsSuccess = false;
        state.MarkNotificationReadState.MarkNotificationReadIsError = null;
      })
      .addCase(MarkNotificationRead.fulfilled, (state) => {
        state.MarkNotificationReadState.MarkNotificationReadIsLoading = false;
        state.MarkNotificationReadState.MarkNotificationReadIsSuccess = true;
      })
      .addCase(MarkNotificationRead.rejected, (state, action) => {
        state.MarkNotificationReadState.MarkNotificationReadIsLoading = false;
        state.MarkNotificationReadState.MarkNotificationReadIsSuccess = false;
        state.MarkNotificationReadState.MarkNotificationReadIsError =
          action.payload || "Couldn't mark the notification as read.";
      });
  },
});

export default NotificationSlice.reducer;
