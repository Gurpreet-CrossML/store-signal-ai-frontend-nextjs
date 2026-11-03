import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { axiosInstance } from "@/redux/axios-config";
import { ENDPOINTS } from "@/lib/config";
import type { SupportTicketTagData } from "@/redux/api-slice/support-ticket-slice";

// --- Types ------------------------------------------------------------

/** The SLA a ticket tag puts on the tickets that carry it. */
export type SlaPolicy = {
  id: number;
  /** The tag the policy belongs to; fixed once the policy exists. */
  tag: number;
  tag_name: string;
  tag_color: string;
  tag_is_predefined: boolean;
  /** Minutes from ticket creation to the first agent reply. */
  first_reply_minutes: number | null;
  /** Minutes from each customer message to the next agent reply. */
  every_reply_minutes: number | null;
  /** Minutes from ticket creation (or reopening) until it is resolved. */
  resolution_minutes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** The policy fields the form sends, for a new policy or an edit. */
export type SlaPolicyPayload = {
  first_reply_minutes: number | null;
  every_reply_minutes: number | null;
  resolution_minutes: number | null;
  is_active: boolean;
};

/** A new policy: the same targets, given to each of the tags. */
export type SlaPolicyCreatePayload = SlaPolicyPayload & {
  tags: number[];
};

export type SlaPoliciesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: SlaPolicy[];
};

type FetchSlaPoliciesArgs = {
  storeCode: string;
  page?: number;
  limit?: number;
  search?: string;
};

// --- Thunks -----------------------------------------------------------

export const FetchSlaPolicies = createAsyncThunk(
  "FetchSlaPolicies",
  async (
    { storeCode, page = 1, limit = 25, search = "" }: FetchSlaPoliciesArgs,
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(ENDPOINTS.slaPolicies(), {
        params: {
          store_code: storeCode,
          page,
          page_size: limit,
          ...(search && { search }),
        },
      });
      return response.data.data as SlaPoliciesResponse;
    } catch (error) {
      const data = isAxiosError(error) ? error.response?.data : undefined;

      toast.error("Couldn't fetch SLA policies.", {
        description: data?.message || "Please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Couldn't fetch SLA policies.");
    }
  },
);

export const SlaPolicyCreate = createAsyncThunk(
  "SlaPolicyCreate",
  async (
    {
      storeCode,
      payload,
    }: { storeCode: string; payload: SlaPolicyCreatePayload },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.slaPolicies()}?store_code=${storeCode}`,
        payload,
      );
      return response.data.data as SlaPolicy[];
    } catch (error) {
      const data = isAxiosError(error) ? error.response?.data : undefined;

      toast.error("Couldn't create the SLA policy.", {
        description: data?.message || "Please try again later.",
      });

      return thunkAPI.rejectWithValue(
        data || "Couldn't create the SLA policy.",
      );
    }
  },
);

export const SlaPolicyUpdate = createAsyncThunk(
  "SlaPolicyUpdate",
  async (
    {
      storeCode,
      policyId,
      payload,
    }: {
      storeCode: string;
      policyId: number;
      payload: Partial<SlaPolicyPayload>;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.patch(
        `${ENDPOINTS.slaPolicyDetail(policyId)}?store_code=${storeCode}`,
        payload,
      );
      return response.data.data as SlaPolicy;
    } catch (error) {
      const data = isAxiosError(error) ? error.response?.data : undefined;

      toast.error("Couldn't update the SLA policy.", {
        description: data?.message || "Please try again later.",
      });

      return thunkAPI.rejectWithValue(
        data || "Couldn't update the SLA policy.",
      );
    }
  },
);

export const SlaPolicyDelete = createAsyncThunk(
  "SlaPolicyDelete",
  async (
    { storeCode, policyId }: { storeCode: string; policyId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.delete(
        `${ENDPOINTS.slaPolicyDetail(policyId)}?store_code=${storeCode}`,
      );
      return response.data.data;
    } catch (error) {
      const data = isAxiosError(error) ? error.response?.data : undefined;

      toast.error("Couldn't delete the SLA policy.", {
        description: data?.message || "Please try again later.",
      });

      return thunkAPI.rejectWithValue(
        data || "Couldn't delete the SLA policy.",
      );
    }
  },
);

/**
 * The store's active tags that have no SLA policy yet: the ones a new policy
 * can be created for. Asks for the most the API gives in one page, which is
 * more tags than a store keeps.
 */
export async function fetchSlaPolicyTagOptions({
  storeCode,
  signal,
}: {
  storeCode: string;
  signal?: AbortSignal;
}): Promise<SupportTicketTagData[]> {
  try {
    const response = await axiosInstance.get(
      ENDPOINTS.fetchSupportTicketTags(),
      {
        params: {
          store_code: storeCode,
          has_sla_policy: false,
          page_size: 100,
        },
        signal,
      },
    );
    const results = response.data.data?.results;
    return Array.isArray(results)
      ? (results as SupportTicketTagData[]).filter(
          (tag) => tag.is_active !== false,
        )
      : [];
  } catch {
    return [];
  }
}

// --- Slice ------------------------------------------------------------

const SlaPolicySlice = createSlice({
  name: "SlaPolicySlice",
  initialState: {
    FetchSlaPoliciesState: {
      FetchSlaPoliciesIsLoading: false,
      FetchSlaPoliciesIsError: null as null | string | object | unknown,
      FetchSlaPoliciesData: null as SlaPoliciesResponse | null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchSlaPolicies.pending, (state) => {
        state.FetchSlaPoliciesState.FetchSlaPoliciesIsLoading = true;
        state.FetchSlaPoliciesState.FetchSlaPoliciesIsError = null;
      })
      .addCase(FetchSlaPolicies.fulfilled, (state, action) => {
        state.FetchSlaPoliciesState.FetchSlaPoliciesIsLoading = false;
        state.FetchSlaPoliciesState.FetchSlaPoliciesData = action.payload;
      })
      .addCase(FetchSlaPolicies.rejected, (state, action) => {
        state.FetchSlaPoliciesState.FetchSlaPoliciesIsLoading = false;
        state.FetchSlaPoliciesState.FetchSlaPoliciesIsError = action.payload;
      });
  },
});

export default SlaPolicySlice.reducer;
