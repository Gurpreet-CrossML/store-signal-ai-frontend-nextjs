import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { ENDPOINTS } from "@/lib/config";
import { toPaginatedList } from "@/lib/helpers";
import type { OrderData } from "@/redux/api-slice/thread-slice";
import { axiosInstance } from "../axios-config";

/** A billing/shipping address belonging to a customer. */
export type CustomerAddress = {
  id: number;
  external_id: string;
  first_name: string;
  last_name: string;
  company: string;
  /** Street lines as the platform returns them — Magento sends a list. */
  street: string[];
  country_id: string | null;
  region: string | null;
  city: string | null;
  postcode: string | null;
  telephone: string | null;
  default_billing: boolean;
  default_shipping: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/**
 * The segment the customer analysis pipeline gives a customer every day
 * ("regular" until then). A chat or ticket copies it when it gets the
 * customer, and is "" for a guest. Mirrors the backend's
 * `chat.models.Customer.Segment`.
 */
export type CustomerSegment =
  | "vip"
  | "at_risk_vip"
  | "new"
  | "high_potential"
  | "loyal"
  | "at_risk_loyal"
  | "lapsed"
  | "regular"
  | "inactive"
  | "";

export type CustomerRecord = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  /** Canonical form, e.g. "+919876543210". Empty when unknown. */
  phone: string;
  store: string | null;
  /** The shopper's id on the commerce platform. */
  customer_id: string;
  /** When the shopper's account was created on the platform. */
  registered_at: string | null;
  modified_at: string | null;
  orders_count: number;
  /** DecimalField — DRF serialises it as a string. */
  total_spent: string | number;
  accepts_email_marketing: boolean;
  accepts_sms_marketing: boolean;
  is_email_verified: boolean;
  /** The customer's current segment. */
  segment?: CustomerSegment;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  /** Present on the detail response; the list may omit it. */
  addresses?: CustomerAddress[];
  /** The customer's orders, sent whole on the detail response. */
  orders?: OrderData[];
  /** The conversation this customer was first identified in, if any. */
  thread_id?: string | null;
};

/** The one group badge a list row shows; the backend picks it. */
/** Only the daily analysis's segments get a badge. */
export type CustomerBadge = "at_risk" | "vip";

/**
 * How the customer buys, worked out by the backend. `days` is the usual gap
 * (every, and lapsed when known), how overdue, or for never_ordered how long
 * ago they signed up; otherwise null.
 */
export type BuyingRhythm = {
  kind:
    | "never_ordered"
    | "unknown"
    | "waiting"
    | "lapsed"
    | "first_order"
    | "overdue"
    | "every";
  days: number | null;
};

/** One row of the Customers page table (GET /chat/customers/table/). */
export type CustomerListRow = Pick<
  CustomerRecord,
  "id" | "first_name" | "last_name" | "email"
> & {
  badge: CustomerBadge | null;
  order_count: number;
  /** Decimal strings, in the store's currency. */
  lifetime_value: string;
  average_order: string | null;
  last_order_at: string | null;
  buying_rhythm: BuyingRhythm;
};

export type CustomerListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: CustomerListRow[];
};

export type CustomerGroup =
  | "vip"
  | "repeat"
  | "at_risk"
  | "lapsed"
  | "never_ordered";
/**
 * Everything the list screen can narrow by. All of it resolves server-side —
 * the client only ever holds one page, so filtering here would silently
 * search a fraction of the store. The filters narrow together.
 */
export type CustomerFilters = {
  /** Matches name, email, phone and platform customer id. */
  search?: string;
  group?: CustomerGroup[];
  /** ISO instants bounding the last order date. */
  last_order_from?: string;
  last_order_to?: string;
  /** Sort key, e.g. "-lifetime_value" — leading "-" is descending. */
  ordering?: string;
};

export type CustomerOrdering =
  | "-lifetime_value"
  | "-orders_count"
  | "-last_order_at"
  | "-registered_at"
  | "first_name";

/** How shipping went for one order; `hours` is null when not known. */
export type OrderShipping = {
  kind: "cancelled" | "shipped" | "waiting";
  hours: number | null;
};

/** One activity feed event; the extra fields depend on `kind`. */
export type CustomerActivity =
  | { kind: "chat"; id: string; title: string; handler: string; at: string }
  | {
      kind: "ticket";
      id: number;
      ticket_id: string;
      title: string;
      status: string;
      channel: string;
      at: string;
    };

/** One customer's page numbers (GET /chat/customers/<id>/profile/). */
export type CustomerProfile = CustomerListRow & {
  usual_gap_days: number | null;
  /** Help Desk tickets still being worked on. */
  open_tickets: number;
  platform: string;
  currency: string;
  admin_url: string | null;
  recent_orders: {
    id: number;
    label: string;
    created_at: string;
    items: number;
    total_price: string;
    fulfillment_status: string | null;
    shipping: OrderShipping;
    chat_assisted: boolean;
  }[];
  top_products: {
    title: string;
    units: number;
    usual_variant: string | null;
    image: string | null;
  }[];
  activity: CustomerActivity[];
  median_reply_minutes: number | null;
  /** A thread source ("native" is the web chat), or null with no chats. */
  preferred_channel: string | null;
};

/** Tab and filter counts (GET /chat/customers/summary/). */
export type CustomerSummary = {
  total: number;
  currency: string;
  groups: Record<CustomerGroup, number>;
  /** Days without an order before a customer counts as lapsed. */
  lapsed_days: number;
};

/** Drop empty values so an untouched filter never reaches the query string. */
function toQueryParams(
  storeCode: string,
  page: number,
  limit: number,
  filters: CustomerFilters,
) {
  const params = new URLSearchParams({
    store_code: storeCode,
    page: String(page),
    limit: String(limit),
  });

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    // A list is sent as the key repeated once per value.
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
    } else {
      params.set(key, String(value));
    }
  }

  return params.toString();
}

export const FetchCustomers = createAsyncThunk(
  "FetchCustomers",
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
      filters?: CustomerFilters;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchCustomerTable()}?${toQueryParams(storeCode, page, limit, filters)}`,
        { useBackend: true },
      );
      // Accepts the payload wrapped in `data` or returned bare, so a
      // change on the backend shows an empty table rather than crashing.
      return toPaginatedList<CustomerListRow>(
        response.data?.data ?? response.data,
      );
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load customers.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't load customers.");
    }
  },
);

export const FetchCustomerSummary = createAsyncThunk(
  "FetchCustomerSummary",
  async ({ storeCode }: { storeCode: string }, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchCustomerSummary()}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return (response.data?.data ?? null) as CustomerSummary | null;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      // The list still works without the counts, so no toast here.
      return thunkAPI.rejectWithValue(
        response?.data || "Couldn't load customer counts.",
      );
    }
  },
);

export const FetchCustomerProfile = createAsyncThunk(
  "FetchCustomerProfile",
  async (
    { storeCode, customerId }: { storeCode: string; customerId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchCustomerProfile(customerId)}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return (response.data?.data ?? null) as CustomerProfile | null;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      // The page still shows the customer without these numbers.
      return thunkAPI.rejectWithValue(
        response?.data || "Couldn't load this customer's numbers.",
      );
    }
  },
);

export const FetchCustomerDetails = createAsyncThunk(
  "FetchCustomerDetails",
  async (
    { storeCode, customerId }: { storeCode: string; customerId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchCustomerDetails(customerId)}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as CustomerRecord;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load this customer.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't load this customer.");
    }
  },
);

/**
 * Type-ahead lookup for attaching a customer to something — kept apart
 * from FetchCustomers so searching in a dialog does not overwrite the Catalog
 * list behind it.
 */
export const SearchCustomers = createAsyncThunk(
  "SearchCustomers",
  async (
    { storeCode, search }: { storeCode: string; search: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchCustomerList()}?store_code=${storeCode}&limit=10&search=${encodeURIComponent(search)}`,
        { useBackend: true },
      );
      return toPaginatedList<CustomerRecord>(
        response.data?.data ?? response.data,
      ).results;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      return thunkAPI.rejectWithValue(
        response?.data || "Couldn't search customers.",
      );
    }
  },
);

export const CreateCustomer = createAsyncThunk(
  "CreateCustomer",
  async (
    {
      storeCode,
      email,
      firstName,
      lastName,
    }: {
      storeCode: string;
      email: string;
      firstName?: string;
      lastName?: string;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.createCustomer()}?store_code=${storeCode}`,
        {
          email,
          first_name: firstName ?? "",
          last_name: lastName ?? "",
        },
        { useBackend: true },
      );
      return (response.data?.data ?? response.data) as CustomerRecord;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't create the customer", {
        description: data?.message || "Please check the email and try again.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't create the customer");
    }
  },
);

const emptyList: CustomerListResponse = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

const CustomerSlice = createSlice({
  name: "Customer",
  initialState: {
    FetchCustomersState: {
      FetchCustomersIsLoading: false,
      FetchCustomersIsSuccess: false,
      FetchCustomersIsError: null as null | string | object,
      FetchCustomersData: emptyList,
    },
    FetchCustomerProfileState: {
      FetchCustomerProfileIsLoading: false,
      FetchCustomerProfileData: null as CustomerProfile | null,
    },
    FetchCustomerSummaryState: {
      FetchCustomerSummaryIsLoading: false,
      FetchCustomerSummaryData: null as CustomerSummary | null,
    },
    SearchCustomersState: {
      SearchCustomersIsLoading: false,
      SearchCustomersData: [] as CustomerRecord[],
    },
    CreateCustomerState: {
      CreateCustomerIsLoading: false,
    },
    FetchCustomerDetailsState: {
      FetchCustomerDetailsIsLoading: false,
      FetchCustomerDetailsIsSuccess: false,
      FetchCustomerDetailsIsError: null as null | string | object,
      FetchCustomerDetailsData: null as CustomerRecord | null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchCustomers.pending, (state) => {
        state.FetchCustomersState.FetchCustomersIsLoading = true;
        state.FetchCustomersState.FetchCustomersIsSuccess = false;
        state.FetchCustomersState.FetchCustomersIsError = null;
      })
      .addCase(FetchCustomers.fulfilled, (state, action) => {
        state.FetchCustomersState.FetchCustomersIsLoading = false;
        state.FetchCustomersState.FetchCustomersIsSuccess = true;
        state.FetchCustomersState.FetchCustomersData =
          action.payload ?? emptyList;
      })
      .addCase(FetchCustomers.rejected, (state, action) => {
        state.FetchCustomersState.FetchCustomersIsLoading = false;
        state.FetchCustomersState.FetchCustomersIsError = action.payload as
          | string
          | object;
      })
      .addCase(FetchCustomerProfile.pending, (state) => {
        state.FetchCustomerProfileState.FetchCustomerProfileIsLoading = true;
        state.FetchCustomerProfileState.FetchCustomerProfileData = null;
      })
      .addCase(FetchCustomerProfile.fulfilled, (state, action) => {
        state.FetchCustomerProfileState.FetchCustomerProfileIsLoading = false;
        state.FetchCustomerProfileState.FetchCustomerProfileData =
          action.payload;
      })
      .addCase(FetchCustomerProfile.rejected, (state) => {
        state.FetchCustomerProfileState.FetchCustomerProfileIsLoading = false;
      })
      .addCase(FetchCustomerSummary.pending, (state) => {
        state.FetchCustomerSummaryState.FetchCustomerSummaryIsLoading = true;
      })
      .addCase(FetchCustomerSummary.fulfilled, (state, action) => {
        state.FetchCustomerSummaryState.FetchCustomerSummaryIsLoading = false;
        state.FetchCustomerSummaryState.FetchCustomerSummaryData =
          action.payload;
      })
      .addCase(FetchCustomerSummary.rejected, (state) => {
        state.FetchCustomerSummaryState.FetchCustomerSummaryIsLoading = false;
        state.FetchCustomerSummaryState.FetchCustomerSummaryData = null;
      })
      .addCase(SearchCustomers.pending, (state) => {
        state.SearchCustomersState.SearchCustomersIsLoading = true;
      })
      .addCase(SearchCustomers.fulfilled, (state, action) => {
        state.SearchCustomersState.SearchCustomersIsLoading = false;
        state.SearchCustomersState.SearchCustomersData = action.payload ?? [];
      })
      .addCase(SearchCustomers.rejected, (state) => {
        state.SearchCustomersState.SearchCustomersIsLoading = false;
        state.SearchCustomersState.SearchCustomersData = [];
      })
      .addCase(CreateCustomer.pending, (state) => {
        state.CreateCustomerState.CreateCustomerIsLoading = true;
      })
      .addCase(CreateCustomer.fulfilled, (state) => {
        state.CreateCustomerState.CreateCustomerIsLoading = false;
      })
      .addCase(CreateCustomer.rejected, (state) => {
        state.CreateCustomerState.CreateCustomerIsLoading = false;
      })
      .addCase(FetchCustomerDetails.pending, (state) => {
        state.FetchCustomerDetailsState.FetchCustomerDetailsIsLoading = true;
        state.FetchCustomerDetailsState.FetchCustomerDetailsIsSuccess = false;
        state.FetchCustomerDetailsState.FetchCustomerDetailsIsError = null;
      })
      .addCase(FetchCustomerDetails.fulfilled, (state, action) => {
        state.FetchCustomerDetailsState.FetchCustomerDetailsIsLoading = false;
        state.FetchCustomerDetailsState.FetchCustomerDetailsIsSuccess = true;
        state.FetchCustomerDetailsState.FetchCustomerDetailsData =
          action.payload ?? null;
      })
      .addCase(FetchCustomerDetails.rejected, (state, action) => {
        state.FetchCustomerDetailsState.FetchCustomerDetailsIsLoading = false;
        state.FetchCustomerDetailsState.FetchCustomerDetailsIsError =
          action.payload as string | object;
      });
  },
});

export default CustomerSlice.reducer;
