import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "@/redux/axios-config";

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

type NotificationsResponse = {
  next: string | null;
  results: AgentNotification[];
  counts: NotificationCounts;
};

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

export const FetchNotifications = createAsyncThunk<
  NotificationsResponse,
  { tab: NotificationTab; page: number }
>("FetchNotifications", async ({ tab, page }, thunkAPI) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.notifications(), {
      params: { page, ...TAB_FILTERS[tab] },
    });
    return response.data.data;
  } catch (error) {
    const data = isAxiosError(error) ? error.response?.data : undefined;

    toast.error("Uh oh! Something went wrong.", {
      description:
        data?.message ||
        "Unable to fetch notifications, please try again later.",
    });

    return thunkAPI.rejectWithValue(data || "Something went wrong");
  }
});

// No error toast: this runs in the background for the bell's badge.
export const FetchNotificationUnreadCount = createAsyncThunk<number>(
  "FetchNotificationUnreadCount",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        ENDPOINTS.notificationUnreadCount(),
      );
      return response.data.data.unread_count;
    } catch (error) {
      const data = isAxiosError(error) ? error.response?.data : undefined;
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

// Takes the whole notification: whether it was unread decides if the
// counts drop, and that is applied as soon as the agent clicks.
export const MarkNotificationRead = createAsyncThunk<
  AgentNotification,
  AgentNotification
>("MarkNotificationRead", async (notification, thunkAPI) => {
  try {
    const response = await axiosInstance.put(
      ENDPOINTS.notificationMarkRead(notification.id),
    );
    return response.data.data;
  } catch (error) {
    const data = isAxiosError(error) ? error.response?.data : undefined;

    toast.error("Uh oh! Something went wrong.", {
      description:
        data?.message ||
        "Unable to mark the notification as read, please try again later.",
    });

    return thunkAPI.rejectWithValue(data || "Something went wrong");
  }
});

const TABS: NotificationTab[] = ["all", "unread", "tickets", "messages"];

const NotificationSlice = createSlice({
  name: "NotificationSlice",
  initialState: {
    FetchNotificationsState: {
      FetchNotificationsLoading: false,
      // Only the latest request may write the list, so a slow response for
      // a tab the agent already left cannot overwrite the open one.
      requestId: null as string | null,
      tab: "all" as NotificationTab,
      // Last page loaded; 0 while nothing is loaded.
      page: 0,
      next: null as string | null,
      results: [] as AgentNotification[],
      counts: {
        all: 0,
        unread: 0,
        tickets: 0,
        messages: 0,
      } as NotificationCounts,
    },
    unreadCount: 0,
  },
  reducers: {
    // A notification pushed over the dashboard socket.
    notificationReceived: (state, action: PayloadAction<AgentNotification>) => {
      const list = state.FetchNotificationsState;
      const notification = action.payload;

      // Already counted: a refetch returned it before the socket did.
      if (list.results.some((item) => item.id === notification.id)) return;

      state.unreadCount += 1;
      TABS.forEach((tab) => {
        if (isInTab(notification, tab)) list.counts[tab] += 1;
      });
      if (list.page > 0 && isInTab(notification, list.tab)) {
        list.results.unshift(notification);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(FetchNotifications.pending, (state, action) => {
        const list = state.FetchNotificationsState;
        list.FetchNotificationsLoading = true;
        list.requestId = action.meta.requestId;

        if (action.meta.arg.tab !== list.tab) {
          list.tab = action.meta.arg.tab;
          list.results = [];
          list.page = 0;
          list.next = null;
        }
      })
      .addCase(FetchNotifications.fulfilled, (state, action) => {
        const list = state.FetchNotificationsState;
        if (action.meta.requestId !== list.requestId) return;

        const { page } = action.meta.arg;
        const loaded = new Set(list.results.map((item) => item.id));

        list.FetchNotificationsLoading = false;
        // A later page can repeat rows that slid down when new ones arrived
        // at the top in between, so those are skipped.
        list.results =
          page === 1
            ? action.payload.results
            : [
                ...list.results,
                ...action.payload.results.filter(
                  (item) => !loaded.has(item.id),
                ),
              ];
        list.page = page;
        list.next = action.payload.next;
        list.counts = action.payload.counts;
        state.unreadCount = action.payload.counts.unread;
      })
      .addCase(FetchNotifications.rejected, (state, action) => {
        const list = state.FetchNotificationsState;
        if (action.meta.requestId !== list.requestId) return;

        list.FetchNotificationsLoading = false;
      })
      .addCase(FetchNotificationUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(MarkNotificationRead.pending, (state, action) => {
        if (action.meta.arg.is_read) return;

        const list = state.FetchNotificationsState;
        const item = list.results.find((row) => row.id === action.meta.arg.id);
        if (item) item.is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        list.counts.unread = Math.max(0, list.counts.unread - 1);
      })
      .addCase(MarkNotificationRead.rejected, (state, action) => {
        if (action.meta.arg.is_read) return;

        const list = state.FetchNotificationsState;
        const item = list.results.find((row) => row.id === action.meta.arg.id);
        if (item) item.is_read = false;
        state.unreadCount += 1;
        list.counts.unread += 1;
      });
  },
});

export const { notificationReceived } = NotificationSlice.actions;

export default NotificationSlice.reducer;
