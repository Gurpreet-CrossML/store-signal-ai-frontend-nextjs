import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { ENDPOINTS } from "@/lib/config";
import { toPaginatedList } from "@/lib/helpers";
import type { OrderData } from "@/redux/api-slice/thread-slice";
import { axiosInstance } from "../axios-config";

/** The shopper as the order endpoints nest them — an identity, not a full record. */
export type OrderCustomerSummary = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
};

/**
 * One row of the orders list.
 *
 * Deliberately narrower than the detail response: the list serializer
 * returns identity, status, money and tracking, and leaves out line items,
 * addresses, the price breakdown and merchant notes. Typing the list as
 * the full order would let a column read a field that is never sent and
 * render a confident zero.
 */
export type OrderListRow = {
  id: number;
  /** Nested object in practice; a bare id is tolerated. Read via `orderCustomer`. */
  customer: OrderCustomerSummary | number | null;
  order_id: string;
  order_number: string;
  /** Display label from the platform, e.g. "#1001". */
  name: string;
  customer_email: string;
  customer_phone: string;
  /** Arrives capitalised ("Paid"); the badges normalise it. */
  financial_status: string | null;
  /** Null means nothing has shipped — the platform has no "unfulfilled" string. */
  fulfillment_status: string | null;
  currency: string;
  total_price: string | number;
  total_paid: string | number;
  total_refunded: string | number;
  tracking_number: string | null;
  cancelled_at: string | null;
  created_at: string;
};

/**
 * A whole order, as the detail endpoint returns it.
 *
 * Built on OrderData — the shape the thread panels already render — so the
 * shared OrderDetails component works here unchanged and the two can't
 * drift. The rest are the fields a support agent asks for that a thread
 * never needed: what is still owed, what came back, where the parcel is.
 */
export type OrderRecord = OrderListRow &
  OrderData & {
    confirmation_number: string | null;
    confirmed: boolean;
    cancel_reason: string;
    total_outstanding: string | number;
    total_price_usd: string | number | null;
    discount_codes: { code: string; amount: string; type?: string }[] | null;
    payment_details: Record<string, unknown> | null;
    billing_address: OrderData["shipping_address"] | null;
    tracking_company: string | null;
    tracking_url: string | null;
    order_status_url: string;
    tags: string;
    note: string;
    processed_at: string | null;
    closed_at: string | null;
    updated_at: string | null;
  };

export type OrderListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: OrderListRow[];
};

/**
 * Everything the list screen can narrow by. All of it resolves server-side:
 * the client holds one page, so filtering here would search a fraction of
 * the store and quietly report it as the whole.
 */
export type OrderFilters = {
  /**
   * Matches order number, display name, platform order id, the email and
   * phone captured on the order, the confirmation number and the carrier
   * tracking number.
   */
  search?: string;
  /** e.g. ["paid", "pending"] — repeated param or comma-joined. */
  financial_status?: string[];
  /** "unfulfilled" stands for the platform's null/blank state. */
  fulfillment_status?: string[];
  /** ISO instants bounding the platform's `created_at`. */
  created_from?: string;
  created_to?: string;
  /** Inclusive bounds on `total_price`, in the order's own currency. */
  total_min?: number;
  total_max?: number;
  /** True keeps only orders with a non-zero `total_outstanding`. */
  has_outstanding?: boolean;
  /** True keeps only orders with a non-zero `total_refunded`. */
  has_refund?: boolean;
  /** True keeps only cancelled orders; false excludes them. */
  cancelled?: boolean;
  /** Narrow to one shopper — how the customer screen drills through. */
  customer?: number;
  /** Sort key, e.g. "-created_at" — leading "-" is descending. */
  ordering?: string;
};

export type OrderOrdering =
  | "-created_at"
  | "created_at"
  | "-total_price"
  | "total_price"
  | "order_number"
  | "-order_number";

/**
 * The shopper on an order, from whichever shape the serializer used.
 *
 * The email and phone captured at checkout win over the account's: the
 * model notes they can differ, and what the customer typed at the till is
 * what an agent should reply to.
 */
export function orderCustomer(order: OrderListRow) {
  const nested = typeof order.customer === "object" ? order.customer : null;

  return {
    id:
      typeof order.customer === "number"
        ? order.customer
        : (nested?.id ?? null),
    name: nested
      ? [nested.first_name, nested.last_name].filter(Boolean).join(" ")
      : "",
    email: order.customer_email || nested?.email || "",
    // Only the order carries a phone; the nested customer summary is
    // identity only.
    phone: order.customer_phone || "",
  };
}

/** Drop empty values so an untouched filter never reaches the query string. */
function toQueryParams(
  storeCode: string,
  page: number,
  limit: number,
  filters: OrderFilters,
) {
  const params = new URLSearchParams({
    store_code: storeCode,
    page: String(page),
    limit: String(limit),
  });

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    // Multi-value filters go out as repeated params, which DRF reads back
    // with getlist() — a comma-joined string would break on any value
    // containing one.
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      for (const entry of value) params.append(key, String(entry));
      continue;
    }
    params.set(key, String(value));
  }

  return params.toString();
}

export const FetchOrders = createAsyncThunk(
  "FetchOrders",
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
      filters?: OrderFilters;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchOrders()}?${toQueryParams(storeCode, page, limit, filters)}`,
        { useBackend: true },
      );
      // Accepts the payload wrapped in `data` or returned bare, so a
      // change on the backend shows an empty table rather than crashing.
      return toPaginatedList<OrderListRow>(
        response.data?.data ?? response.data,
      );
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to load orders.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const FetchOrderDetails = createAsyncThunk(
  "FetchOrderDetails",
  async (
    { storeCode, orderId }: { storeCode: string; orderId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchOrderDetails(orderId)}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as OrderRecord;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to load this order.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const emptyList: OrderListResponse = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

const OrderSlice = createSlice({
  name: "Order",
  initialState: {
    FetchOrdersState: {
      FetchOrdersIsLoading: false,
      FetchOrdersIsSuccess: false,
      FetchOrdersIsError: null as null | string | object,
      FetchOrdersData: emptyList,
    },
    FetchOrderDetailsState: {
      FetchOrderDetailsIsLoading: false,
      FetchOrderDetailsIsSuccess: false,
      FetchOrderDetailsIsError: null as null | string | object,
      FetchOrderDetailsData: null as OrderRecord | null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchOrders.pending, (state) => {
        state.FetchOrdersState.FetchOrdersIsLoading = true;
        state.FetchOrdersState.FetchOrdersIsSuccess = false;
        state.FetchOrdersState.FetchOrdersIsError = null;
      })
      .addCase(FetchOrders.fulfilled, (state, action) => {
        state.FetchOrdersState.FetchOrdersIsLoading = false;
        state.FetchOrdersState.FetchOrdersIsSuccess = true;
        state.FetchOrdersState.FetchOrdersData = action.payload ?? emptyList;
      })
      .addCase(FetchOrders.rejected, (state, action) => {
        state.FetchOrdersState.FetchOrdersIsLoading = false;
        state.FetchOrdersState.FetchOrdersIsError = action.payload as
          | string
          | object;
      })
      .addCase(FetchOrderDetails.pending, (state) => {
        state.FetchOrderDetailsState.FetchOrderDetailsIsLoading = true;
        state.FetchOrderDetailsState.FetchOrderDetailsIsSuccess = false;
        state.FetchOrderDetailsState.FetchOrderDetailsIsError = null;
      })
      .addCase(FetchOrderDetails.fulfilled, (state, action) => {
        state.FetchOrderDetailsState.FetchOrderDetailsIsLoading = false;
        state.FetchOrderDetailsState.FetchOrderDetailsIsSuccess = true;
        state.FetchOrderDetailsState.FetchOrderDetailsData =
          action.payload ?? null;
      })
      .addCase(FetchOrderDetails.rejected, (state, action) => {
        state.FetchOrderDetailsState.FetchOrderDetailsIsLoading = false;
        state.FetchOrderDetailsState.FetchOrderDetailsIsError =
          action.payload as string | object;
      });
  },
});

export default OrderSlice.reducer;
