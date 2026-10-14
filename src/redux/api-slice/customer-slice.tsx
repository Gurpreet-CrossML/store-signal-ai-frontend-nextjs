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

export type CustomerListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: CustomerRecord[];
};

/**
 * Everything the list screen can narrow by. All of it resolves server-side —
 * the client only ever holds one page, so filtering here would silently
 * search a fraction of the store.
 */
export type CustomerFilters = {
  /** Matches name, email, phone and platform customer id. */
  search?: string;
  accepts_email_marketing?: boolean;
  accepts_sms_marketing?: boolean;
  is_email_verified?: boolean;
  /** Inclusive bounds on lifetime order count. */
  orders_count_min?: number;
  orders_count_max?: number;
  /** Inclusive bounds on lifetime spend. */
  total_spent_min?: number;
  total_spent_max?: number;
  /** ISO instants bounding `registered_at`. */
  registered_from?: string;
  registered_to?: string;
  /** Two/three letter code, matched against the customer's addresses. */
  country?: string;
  /** Sort key, e.g. "-total_spent" — leading "-" is descending. */
  ordering?: string;
};

export type CustomerOrdering =
  | "-total_spent"
  | "total_spent"
  | "-orders_count"
  | "orders_count"
  | "-registered_at"
  | "registered_at"
  | "first_name"
  | "-first_name";

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
    params.set(key, String(value));
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
        `${ENDPOINTS.fetchCustomers()}?${toQueryParams(storeCode, page, limit, filters)}`,
        { useBackend: true },
      );
      // Accepts the payload wrapped in `data` or returned bare, so a
      // change on the backend shows an empty table rather than crashing.
      return toPaginatedList<CustomerRecord>(
        response.data?.data ?? response.data,
      );
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to load customers.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
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
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to load this customer.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
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
        `${ENDPOINTS.fetchCustomers()}?store_code=${storeCode}&limit=10&search=${encodeURIComponent(search)}`,
        { useBackend: true },
      );
      return toPaginatedList<CustomerRecord>(
        response.data?.data ?? response.data,
      ).results;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      return thunkAPI.rejectWithValue(response?.data || "Something went wrong");
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
      return thunkAPI.rejectWithValue(data || "Something went wrong");
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
