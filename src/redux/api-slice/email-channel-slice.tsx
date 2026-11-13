import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { axiosInstance } from "@/redux/axios-config";
import { ENDPOINTS } from "@/lib/config";

// --- Types ------------------------------------------------------------

/** pending -> confirmation_received -> verified. */
export type EmailChannelStatus =
  | "pending"
  | "confirmation_received"
  | "verified";

export type EmailChannel = {
  id: number;
  email: string;
  /** The address the merchant's mailbox must forward to. */
  forwarding_address: string;
  status: EmailChannelStatus;
  /** What the mailbox provider mailed to the address: a code, a link, or both. */
  confirmation_code: string;
  confirmation_link: string;
  confirmation_received_at: string | null;
  test_sent_at: string | null;
  verified_at: string | null;
  created_at: string;
};

// --- Thunks -----------------------------------------------------------

/**
 * The store's email connection; null while none is set up (the API answers
 * 404 then, which is not an error worth a toast). `silent` is for polling.
 */
export const FetchEmailChannel = createAsyncThunk(
  "FetchEmailChannel",
  async (
    { storeCode, silent = false }: { storeCode: string; silent?: boolean },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(ENDPOINTS.emailChannel(), {
        params: { store_code: storeCode },
      });
      return response.data.data as EmailChannel;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return null;
      if (!silent) {
        toast.error("Couldn't fetch the email connection.", {
          description:
            (isAxiosError(error) && error.response?.data?.message) ||
            "Please try again later.",
        });
      }
      return thunkAPI.rejectWithValue("Couldn't fetch the email connection.");
    }
  },
);

export const ConnectEmailChannel = createAsyncThunk(
  "ConnectEmailChannel",
  async (
    { storeCode, email }: { storeCode: string; email: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.emailChannel()}?store_code=${storeCode}`,
        { email },
      );
      return response.data.data as EmailChannel;
    } catch (error) {
      // The reason ("already connected", ...) shows under the input.
      return thunkAPI.rejectWithValue(
        isAxiosError(error) ? error.response?.data : "Couldn't connect.",
      );
    }
  },
);

export const SendEmailChannelTest = createAsyncThunk(
  "SendEmailChannelTest",
  async ({ storeCode }: { storeCode: string }, thunkAPI) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.emailChannelSendTest()}?store_code=${storeCode}`,
      );
      toast.success(response.data.message);
      return response.data.data as EmailChannel;
    } catch (error) {
      const data = isAxiosError(error) ? error.response?.data : undefined;
      toast.error("Couldn't send the test email.", {
        description:
          data?.data?.non_field_errors ||
          data?.message ||
          "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't send the test email.");
    }
  },
);

export const DisconnectEmailChannel = createAsyncThunk(
  "DisconnectEmailChannel",
  async ({ storeCode }: { storeCode: string }, thunkAPI) => {
    try {
      await axiosInstance.delete(ENDPOINTS.emailChannel(), {
        params: { store_code: storeCode },
      });
      return null;
    } catch (error) {
      const data = isAxiosError(error) ? error.response?.data : undefined;
      toast.error("Couldn't disconnect the email.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't disconnect the email.");
    }
  },
);

// --- Slice ------------------------------------------------------------

const EmailChannelSlice = createSlice({
  name: "EmailChannelSlice",
  initialState: {
    channel: null as EmailChannel | null,
    /** False until the first fetch answers, so the page can show a spinner. */
    isLoaded: false,
    isSaving: false,
    connectError: null as null | string | object | unknown,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchEmailChannel.pending, (state, action) => {
        // A new store: drop the previous one's connection until this answers.
        if (!action.meta.arg.silent) {
          state.channel = null;
          state.isLoaded = false;
        }
      })
      .addCase(FetchEmailChannel.fulfilled, (state, action) => {
        state.channel = action.payload;
        state.isLoaded = true;
      })
      .addCase(FetchEmailChannel.rejected, (state) => {
        state.isLoaded = true;
      })
      .addCase(ConnectEmailChannel.pending, (state) => {
        state.isSaving = true;
        state.connectError = null;
      })
      .addCase(ConnectEmailChannel.fulfilled, (state, action) => {
        state.isSaving = false;
        state.channel = action.payload;
      })
      .addCase(ConnectEmailChannel.rejected, (state, action) => {
        state.isSaving = false;
        state.connectError = action.payload;
      })
      .addCase(SendEmailChannelTest.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(SendEmailChannelTest.fulfilled, (state, action) => {
        state.isSaving = false;
        state.channel = action.payload;
      })
      .addCase(SendEmailChannelTest.rejected, (state) => {
        state.isSaving = false;
      })
      .addCase(DisconnectEmailChannel.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(DisconnectEmailChannel.fulfilled, (state) => {
        state.isSaving = false;
        state.channel = null;
      })
      .addCase(DisconnectEmailChannel.rejected, (state) => {
        state.isSaving = false;
      });
  },
});

export default EmailChannelSlice.reducer;
