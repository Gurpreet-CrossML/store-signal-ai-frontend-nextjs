import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
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
  counts: NotificationCounts;
};

const TABS: NotificationTab[] = ["all", "unread", "tickets", "messages"];

// The list API's filter for each tab.
const TAB_FILTERS: Record<NotificationTab, Record<string, string>> = {
  all: {},
  unread: { is_read: "false" },
  tickets: { ticket__isnull: "false" },
  messages: { thread__isnull: "false" },
};

/** Whether a notification belongs in a tab — the same rule as TAB_FILTERS. */
function isInTab(notification: AgentNotification, tab: NotificationTab) {
  if (tab === "unread") return !notification.is_read;
  if (tab === "tickets") return notification.ticket !== null;
  if (tab === "messages") return notification.thread !== null;
  return true;
}

function emptyNotificationList(): NotificationListResponse {
  return {
    count: 0,
    next: null,
    previous: null,
    results: [],
    counts: { all: 0, unread: 0, tickets: 0, messages: 0 },
  };
}

// --- Thunks -------------------------------------------------------------
// Notifications are store-scoped: every call names the store with
// `?store_code=`, and the backend returns only the logged-in agent's own
// notifications whose ticket or live chat belongs to that store.

export const FetchNotifications = createAsyncThunk(
  "FetchNotifications",
  async (
    {
      storeCode,
      tab = "all",
      page = 1,
    }: {
      storeCode: string;
      tab?: NotificationTab;
      page?: number;
    },
    thunkAPI,
  ) => {
    try {
      const params = new URLSearchParams({
        store_code: storeCode,
        page: String(page),
        ...TAB_FILTERS[tab],
      });

      const response = await axiosInstance.get(
        `${ENDPOINTS.notifications()}?${params.toString()}`,
        { useBackend: true },
      );
      const data: NotificationListResponse = response.data.data;
      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message || "Unable to load notifications, please try again.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

// No error toast: this runs in the background for the bell's badge.
export const FetchNotificationUnreadCount = createAsyncThunk(
  "FetchNotificationUnreadCount",
  async ({ storeCode }: { storeCode: string }, thunkAPI) => {
    try {
      const params = new URLSearchParams({ store_code: storeCode });

      const response = await axiosInstance.get(
        `${ENDPOINTS.notificationUnreadCount()}?${params.toString()}`,
        { useBackend: true },
      );
      const data: number = response.data.data.unread_count;
      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      return thunkAPI.rejectWithValue(response?.data || "Something went wrong");
    }
  },
);

// Takes the whole notification: whether it was unread decides if the
// counts drop, and that is applied as soon as the agent clicks. The store
// is the notification's own, which may not be the one on screen.
export const MarkNotificationRead = createAsyncThunk(
  "MarkNotificationRead",
  async (
    {
      storeCode,
      notification,
    }: {
      storeCode: string;
      notification: AgentNotification;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.put(
        `${ENDPOINTS.notificationMarkRead(notification.id)}?store_code=${storeCode}`,
      );
      const data: AgentNotification = response.data.data;
      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to mark the notification as read, please try again.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
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
      FetchNotificationsListData: emptyNotificationList(),
      FetchNotificationsLatestRequestId: null as string | null,
      // Which list is loaded: its store and tab, and the last page fetched
      // (0 while nothing is).
      FetchNotificationsStoreCode: "",
      FetchNotificationsTab: "all" as NotificationTab,
      FetchNotificationsPage: 0,
    },
    FetchNotificationUnreadCountState: {
      FetchNotificationUnreadCountIsLoading: false,
      FetchNotificationUnreadCountIsSuccess: false,
      FetchNotificationUnreadCountIsError: null as null | string | object,
      FetchNotificationUnreadCountData: 0,
      // The store the badge's count belongs to.
      FetchNotificationUnreadCountStoreCode: "",
    },
    MarkNotificationReadState: {
      MarkNotificationReadIsLoading: false,
      MarkNotificationReadIsSuccess: false,
      MarkNotificationReadIsError: null as null | string | object,
    },
  },
  reducers: {
    // A notification pushed over the dashboard socket. Pushes arrive for
    // every store, so the count and list change only for their own store.
    notificationReceived: (state, action: PayloadAction<AgentNotification>) => {
      const list = state.FetchNotificationsState;
      const unread = state.FetchNotificationUnreadCountState;
      const notification = action.payload;
      const data = list.FetchNotificationsListData;

      // Already counted: a refetch returned it before the socket did.
      if (data.results.some((item) => item.id === notification.id)) return;

      if (
        notification.store_code === unread.FetchNotificationUnreadCountStoreCode
      ) {
        unread.FetchNotificationUnreadCountData += 1;
      }
      if (notification.store_code !== list.FetchNotificationsStoreCode) return;

      TABS.forEach((tab) => {
        if (isInTab(notification, tab)) data.counts[tab] += 1;
      });
      if (
        list.FetchNotificationsPage > 0 &&
        isInTab(notification, list.FetchNotificationsTab)
      ) {
        data.results.unshift(notification);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // FetchNotifications
      .addCase(FetchNotifications.pending, (state, action) => {
        const list = state.FetchNotificationsState;
        const { storeCode, tab = "all" } = action.meta.arg;

        list.FetchNotificationsIsLoading = true;
        list.FetchNotificationsIsSuccess = false;
        list.FetchNotificationsIsError = null;
        list.FetchNotificationsLatestRequestId = action.meta.requestId;

        // Another store or tab is another list: drop the old one at once.
        if (
          storeCode !== list.FetchNotificationsStoreCode ||
          tab !== list.FetchNotificationsTab
        ) {
          list.FetchNotificationsStoreCode = storeCode;
          list.FetchNotificationsTab = tab;
          list.FetchNotificationsPage = 0;
          list.FetchNotificationsListData = emptyNotificationList();
        }
      })
      .addCase(FetchNotifications.fulfilled, (state, action) => {
        const list = state.FetchNotificationsState;
        const unread = state.FetchNotificationUnreadCountState;
        if (action.meta.requestId !== list.FetchNotificationsLatestRequestId) {
          return;
        }

        const page = action.meta.arg.page ?? 1;
        const loaded = new Set(
          list.FetchNotificationsListData.results.map((item) => item.id),
        );

        list.FetchNotificationsIsLoading = false;
        list.FetchNotificationsIsSuccess = true;
        // A later page can repeat rows that slid down when new ones arrived
        // at the top in between, so those are skipped.
        list.FetchNotificationsListData = {
          ...action.payload,
          results:
            page === 1
              ? action.payload.results
              : [
                  ...list.FetchNotificationsListData.results,
                  ...action.payload.results.filter(
                    (item) => !loaded.has(item.id),
                  ),
                ],
        };
        list.FetchNotificationsPage = page;

        if (
          action.meta.arg.storeCode ===
          unread.FetchNotificationUnreadCountStoreCode
        ) {
          unread.FetchNotificationUnreadCountData =
            action.payload.counts.unread;
        }
      })
      .addCase(FetchNotifications.rejected, (state, action) => {
        const list = state.FetchNotificationsState;
        if (action.meta.requestId !== list.FetchNotificationsLatestRequestId) {
          return;
        }
        list.FetchNotificationsIsLoading = false;
        list.FetchNotificationsIsSuccess = false;
        list.FetchNotificationsIsError = "Something went wrong";
      })
      // FetchNotificationUnreadCount
      .addCase(FetchNotificationUnreadCount.pending, (state, action) => {
        const unread = state.FetchNotificationUnreadCountState;
        unread.FetchNotificationUnreadCountIsLoading = true;
        unread.FetchNotificationUnreadCountIsSuccess = false;
        unread.FetchNotificationUnreadCountIsError = null;
        unread.FetchNotificationUnreadCountStoreCode =
          action.meta.arg.storeCode;
      })
      .addCase(FetchNotificationUnreadCount.fulfilled, (state, action) => {
        const unread = state.FetchNotificationUnreadCountState;
        // A slow answer for a store the agent already left is dropped.
        if (
          action.meta.arg.storeCode !==
          unread.FetchNotificationUnreadCountStoreCode
        ) {
          return;
        }
        unread.FetchNotificationUnreadCountIsLoading = false;
        unread.FetchNotificationUnreadCountIsSuccess = true;
        unread.FetchNotificationUnreadCountData = action.payload;
      })
      .addCase(FetchNotificationUnreadCount.rejected, (state) => {
        const unread = state.FetchNotificationUnreadCountState;
        unread.FetchNotificationUnreadCountIsLoading = false;
        unread.FetchNotificationUnreadCountIsSuccess = false;
        unread.FetchNotificationUnreadCountIsError = "Something went wrong";
      })
      // MarkNotificationRead
      .addCase(MarkNotificationRead.pending, (state, action) => {
        const list = state.FetchNotificationsState;
        const unread = state.FetchNotificationUnreadCountState;
        const { notification } = action.meta.arg;

        state.MarkNotificationReadState.MarkNotificationReadIsLoading = true;
        state.MarkNotificationReadState.MarkNotificationReadIsSuccess = false;
        state.MarkNotificationReadState.MarkNotificationReadIsError = null;

        if (notification.is_read) return;

        const item = list.FetchNotificationsListData.results.find(
          (row) => row.id === notification.id,
        );
        if (item) item.is_read = true;
        if (
          notification.store_code ===
          unread.FetchNotificationUnreadCountStoreCode
        ) {
          unread.FetchNotificationUnreadCountData = Math.max(
            0,
            unread.FetchNotificationUnreadCountData - 1,
          );
        }
        if (notification.store_code === list.FetchNotificationsStoreCode) {
          const counts = list.FetchNotificationsListData.counts;
          counts.unread = Math.max(0, counts.unread - 1);
        }
      })
      .addCase(MarkNotificationRead.fulfilled, (state) => {
        state.MarkNotificationReadState.MarkNotificationReadIsLoading = false;
        state.MarkNotificationReadState.MarkNotificationReadIsSuccess = true;
      })
      .addCase(MarkNotificationRead.rejected, (state, action) => {
        const list = state.FetchNotificationsState;
        const unread = state.FetchNotificationUnreadCountState;
        const { notification } = action.meta.arg;

        state.MarkNotificationReadState.MarkNotificationReadIsLoading = false;
        state.MarkNotificationReadState.MarkNotificationReadIsSuccess = false;
        state.MarkNotificationReadState.MarkNotificationReadIsError =
          "Something went wrong";

        if (notification.is_read) return;

        // Undo the optimistic update made when the request started.
        const item = list.FetchNotificationsListData.results.find(
          (row) => row.id === notification.id,
        );
        if (item) item.is_read = false;
        if (
          notification.store_code ===
          unread.FetchNotificationUnreadCountStoreCode
        ) {
          unread.FetchNotificationUnreadCountData += 1;
        }
        if (notification.store_code === list.FetchNotificationsStoreCode) {
          list.FetchNotificationsListData.counts.unread += 1;
        }
      });
  },
});

export const { notificationReceived } = NotificationSlice.actions;

export default NotificationSlice.reducer;
