import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { ENDPOINTS } from "@/lib/config";
import { toPaginatedList } from "@/lib/helpers";
import type { ViewedProduct } from "@/redux/api-slice/thread-slice";
import { axiosInstance } from "../axios-config";

/**
 * The customer a guest became, once one of their chats was linked. Such a
 * guest is left out of the list (it shows under Customers); only its own page
 * still says who it became.
 */
export type GuestCustomer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
};

/** Location and device of the guest's newest chat that recorded them. */
export type GuestDevice = {
  location: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
};

/**
 * One browser that opened the chat widget. The key and the visit count come
 * from the browser, so they are analytics only.
 */
export type GuestRecord = {
  id: number;
  visitor_key: string;
  visit_count: number;
  chats_count: number;
  /** Different product pages they opened, as the store theme recorded them. */
  viewed_count: number;
  customer: GuestCustomer | null;
  device: GuestDevice | null;
  /** When the browser was first seen. */
  created_at: string;
  last_visit_at: string;
};

export type GuestChat = {
  id: string;
  name: string | null;
  is_active: boolean;
  messages_count: number;
  customer_id: number | null;
  created_at: string;
};

export type GuestEventType =
  | "view_product"
  | "add_to_cart"
  | "checkout_link"
  | "view_cart"
  | "view_order";

export type GuestActivity = {
  id: number;
  event_type: GuestEventType;
  product_id: string | null;
  product_name: string | null;
  thread_id: string;
  created_at: string;
};

export type GuestOrder = {
  id: number;
  order_number: string;
  name: string;
  /** DecimalField — serialised as a string. */
  total_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  created_at: string;
};

/** A product as the guest page shows it (catalog, else the name it was seen with). */
export type GuestProduct = {
  id: string;
  name: string;
  url: string | null;
  image: string | null;
  /** DecimalField — serialised as a string. */
  price: string | null;
  currency: string | null;
};

/** How often and when the guest opened one product page. */
export type GuestProductView = {
  product: GuestProduct;
  view_count: number;
  first_viewed_at: string;
  last_viewed_at: string;
  /** The newest view times, newest first (older ones still count). */
  viewed_at: string[];
};

export type GuestVisit = { number: number; started_at: string };

/** One dated thing on the guest's timeline; the fields depend on `type`. */
export type GuestTimelineEvent =
  | {
      type: "product_view";
      at: string;
      product: GuestProduct;
      /** Which view of this product it was (1 = first). */
      view_number: number;
    }
  | {
      type: GuestEventType;
      at: string;
      product: GuestProduct | null;
      chat_id: string;
    }
  | {
      type: "chat";
      at: string;
      chat: Pick<GuestChat, "id" | "name" | "messages_count" | "is_active">;
    }
  | {
      type: "order";
      at: string;
      order: Pick<GuestOrder, "id" | "name" | "total_price" | "currency">;
    };

/** The events of one visit; `number` is null for activity before visits were recorded. */
export type GuestTimelineVisit = {
  number: number | null;
  started_at: string | null;
  ended_at: string | null;
  events: GuestTimelineEvent[];
};

/** A product the guest likely wants: a 0-100 score from fixed rules, with its reasons. */
export type GuestInterest = {
  product: GuestProduct;
  score: number;
  views: number;
  /** Different days it was viewed on. */
  days: number;
  in_cart: boolean;
  shown_in_chat: boolean;
  last_at: string | null;
};

export type GuestStage = "ordered" | "checkout" | "cart" | "browsing";

/** Everything about the guest's browsing over time, built by the backend. */
export type GuestJourney = {
  product_views: GuestProductView[];
  visits: GuestVisit[];
  timeline: GuestTimelineVisit[];
  interests: GuestInterest[];
  stage: GuestStage;
  top_category: string | null;
  price_range: { min: string; max: string; currency: string } | null;
};

export type GuestDetail = GuestRecord & {
  chats: GuestChat[];
  /** Product pages they opened, matched to the store's catalog. */
  viewed_products: ViewedProduct[];
  activity: GuestActivity[];
  orders: GuestOrder[];
  journey: GuestJourney;
};

export type GuestListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: GuestRecord[];
};

/** Everything the list can narrow by; all resolved server-side. */
export type GuestFilters = {
  /** True for more than one visit, false for first-time guests. */
  returning?: boolean;
  ordering?: GuestOrdering;
};

export type GuestOrdering =
  | "-last_visit_at"
  | "-visit_count"
  | "-chats_count"
  | "-first_seen"
  | "first_seen";

/** Drop empty values so an untouched filter never reaches the query string. */
function toQueryParams(
  storeCode: string,
  page: number,
  limit: number,
  filters: GuestFilters,
) {
  const params = new URLSearchParams({
    store_code: storeCode,
    page: String(page),
    limit: String(limit),
  });

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }

  return params.toString();
}

export const FetchGuests = createAsyncThunk(
  "FetchGuests",
  async (
    {
      storeCode,
      page = 1,
      limit = 25,
      filters = {},
    }: {
      storeCode: string;
      page?: number;
      limit?: number;
      filters?: GuestFilters;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchGuests()}?${toQueryParams(storeCode, page, limit, filters)}`,
        { useBackend: true },
      );
      return toPaginatedList<GuestRecord>(response.data?.data ?? response.data);
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load guests.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't load guests.");
    }
  },
);

export const FetchGuestDetails = createAsyncThunk(
  "FetchGuestDetails",
  async (
    { storeCode, guestId }: { storeCode: string; guestId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchGuestDetails(guestId)}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as GuestDetail;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load this guest.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't load this guest.");
    }
  },
);

const emptyList: GuestListResponse = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

const GuestSlice = createSlice({
  name: "Guest",
  initialState: {
    FetchGuestsState: {
      FetchGuestsIsLoading: false,
      FetchGuestsIsError: null as null | string | object,
      FetchGuestsData: emptyList,
    },
    FetchGuestDetailsState: {
      FetchGuestDetailsIsLoading: false,
      FetchGuestDetailsIsError: null as null | string | object,
      FetchGuestDetailsData: null as GuestDetail | null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchGuests.pending, (state) => {
        state.FetchGuestsState.FetchGuestsIsLoading = true;
        state.FetchGuestsState.FetchGuestsIsError = null;
      })
      .addCase(FetchGuests.fulfilled, (state, action) => {
        state.FetchGuestsState.FetchGuestsIsLoading = false;
        state.FetchGuestsState.FetchGuestsData = action.payload ?? emptyList;
      })
      .addCase(FetchGuests.rejected, (state, action) => {
        state.FetchGuestsState.FetchGuestsIsLoading = false;
        state.FetchGuestsState.FetchGuestsIsError = action.payload as
          | string
          | object;
      })
      .addCase(FetchGuestDetails.pending, (state) => {
        state.FetchGuestDetailsState.FetchGuestDetailsIsLoading = true;
        state.FetchGuestDetailsState.FetchGuestDetailsIsError = null;
      })
      .addCase(FetchGuestDetails.fulfilled, (state, action) => {
        state.FetchGuestDetailsState.FetchGuestDetailsIsLoading = false;
        state.FetchGuestDetailsState.FetchGuestDetailsData =
          action.payload ?? null;
      })
      .addCase(FetchGuestDetails.rejected, (state, action) => {
        state.FetchGuestDetailsState.FetchGuestDetailsIsLoading = false;
        state.FetchGuestDetailsState.FetchGuestDetailsIsError =
          action.payload as string | object;
      });
  },
});

export default GuestSlice.reducer;
