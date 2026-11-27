import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "@/redux/axios-config";

/** What choosing a plan would do now; decided by the backend. */
export type PlanAction =
  | "current"
  | "subscribe"
  | "upgrade"
  | "downgrade"
  | "switch"
  | "renew"
  | "unavailable";

/** One plan on one billing cycle, as the backend sees it for this company. */
export type PlanChoice = {
  action: PlanAction;
  is_current: boolean;
  /** Why it can't be bought right now (empty when it can). */
  reason: string;
  /** Price per cycle. */
  amount: string;
  starts_on: string | null;
  starts_today: boolean;
  /** Charged at checkout; "0" when a monthly plan starts later. */
  pay_today: string;
  /** When the plan in force stops, if one does. */
  current_ends_on: string | null;
  /** A yearly plan cut short today: what it was paid until. */
  yearly_stops_on: string | null;
  free_credits_end: boolean;
};

/** A plan the company can buy, priced monthly and (optionally) yearly. */
export type BillingPlan = {
  id: number;
  code: string;
  name: string;
  description: string;
  monthly_credits: number;
  monthly_price: string;
  yearly_price: string | null;
  currency: string;
  choices: { monthly: PlanChoice | null; yearly: PlanChoice | null } | null;
};

/** A credit pack the company can buy. */
export type TopUpPack = {
  id: number;
  name: string;
  credits: number;
  price: string;
  currency: string;
};

/** One Razorpay payment in the billing history. */
export type BillingPayment = {
  id: number;
  purpose: "monthly_plan" | "yearly_plan" | "top_up";
  status: "created" | "paid" | "failed" | "needs_review";
  plan_name: string | null;
  credits: number | null;
  amount: string;
  currency: string;
  razorpay_payment_id: string | null;
  period_start: string | null;
  period_end: string | null;
  error_message: string;
  /** Set once paid, e.g. "SS/2026-27/00001". */
  invoice_number: string | null;
  created_at: string;
};

type PlanRef = { code: string; name: string };

/** Where the company stands with Razorpay. */
export type BillingOverview = {
  payments_enabled: boolean;
  key_id: string;
  auto_renew: {
    plan: PlanRef;
    amount: string;
    currency: string;
    status: string;
    cancel_at_cycle_end: boolean;
    next_charge_on: string | null;
  } | null;
  scheduled_change: {
    plan: PlanRef;
    billing_cycle: "monthly" | "yearly";
    starts_on: string;
    can_cancel: boolean;
  } | null;
  yearly_plan: {
    plan: PlanRef;
    amount: string;
    currency: string;
    starts_on: string;
    ends_on: string;
  } | null;
  paid_until: string | null;
  recent_payments: BillingPayment[];
};

export type CheckoutPurpose = "monthly_plan" | "yearly_plan" | "top_up";

/** What the backend needs to start a Razorpay payment. */
export type CheckoutRequest = {
  purpose: CheckoutPurpose;
  plan?: number;
  top_up_pack?: number;
};

/** The options Razorpay Checkout opens with, from the backend. */
export type CheckoutOptions = {
  key_id: string;
  purpose: CheckoutPurpose;
  subscription_id: string | null;
  order_id: string | null;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string };
  starts_on: string | null;
};

/** What Razorpay Checkout hands back after a payment. */
export type CheckoutResult = {
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_subscription_id?: string;
  razorpay_order_id?: string;
};

/** The backend's answer after checking a payment. */
export type VerifyResult = {
  result: "paid" | "scheduled" | "processing" | "needs_review";
  message: string;
};

/** The backend's message, or our fallback. */
function errorMessage(error: unknown, fallback: string) {
  const data = isAxiosError(error) ? error.response?.data : undefined;
  // Field errors carry the real reason (e.g. "Choose a plan.").
  const details = data?.data && typeof data.data === "object" ? data.data : {};
  const first = Object.values(details).find(
    (value) => typeof value === "string",
  );
  return (first as string | undefined) || data?.message || fallback;
}

/** Fetches the plans the company can buy. */
export const fetchBillingPlans = createAsyncThunk(
  "billing/fetchBillingPlans",
  async (_: void, thunkAPI) => {
    try {
      const response = await axiosInstance.get(ENDPOINTS.fetchBillingPlans(), {
        useBackend: true,
      });
      return response.data.data as BillingPlan[];
    } catch (error) {
      const message = errorMessage(error, "Couldn't fetch plans.");
      toast.error("Couldn't fetch plans.", { description: message });
      return thunkAPI.rejectWithValue(message);
    }
  },
);

/** Fetches the credit packs the company can buy. */
export const fetchTopUpPacks = createAsyncThunk(
  "billing/fetchTopUpPacks",
  async (_: void, thunkAPI) => {
    try {
      const response = await axiosInstance.get(ENDPOINTS.fetchTopUpPacks(), {
        useBackend: true,
      });
      return response.data.data as TopUpPack[];
    } catch (error) {
      const message = errorMessage(error, "Couldn't fetch credit packs.");
      toast.error("Couldn't fetch credit packs.", { description: message });
      return thunkAPI.rejectWithValue(message);
    }
  },
);

/** Fetches the company's auto-renew, yearly plan and payment history. */
export const fetchBillingOverview = createAsyncThunk(
  "billing/fetchBillingOverview",
  async (_: void, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        ENDPOINTS.fetchBillingOverview(),
        { useBackend: true },
      );
      return response.data.data as BillingOverview;
    } catch (error) {
      const message = errorMessage(error, "Couldn't fetch billing details.");
      toast.error("Couldn't fetch billing details.", { description: message });
      return thunkAPI.rejectWithValue(message);
    }
  },
);

/** Starts a Razorpay payment; resolves to the Checkout options. */
export const createBillingCheckout = createAsyncThunk(
  "billing/createBillingCheckout",
  async (body: CheckoutRequest, thunkAPI) => {
    try {
      const response = await axiosInstance.post(
        ENDPOINTS.createBillingCheckout(),
        body,
      );
      return response.data.data as CheckoutOptions;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        errorMessage(error, "Could not start the payment."),
      );
    }
  },
);

/** Sends Razorpay's reply to the backend to check and apply it. */
export const verifyBillingPayment = createAsyncThunk(
  "billing/verifyBillingPayment",
  async (body: CheckoutResult, thunkAPI) => {
    try {
      const response = await axiosInstance.post(
        ENDPOINTS.verifyBillingPayment(),
        body,
      );
      return {
        ...(response.data.data as Omit<VerifyResult, "message">),
        message: response.data.message as string,
      } as VerifyResult;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        errorMessage(error, "We could not verify this payment."),
      );
    }
  },
);

/**
 * A download link for a paid payment's invoice PDF. The backend builds the
 * PDF on the first request and reuses the stored file after that.
 */
export const fetchPaymentInvoice = createAsyncThunk(
  "billing/fetchPaymentInvoice",
  async (paymentId: number, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        ENDPOINTS.fetchPaymentInvoice(paymentId),
        { useBackend: true },
      );
      return response.data.data as { invoice_number: string; url: string };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        errorMessage(error, "Could not get the invoice."),
      );
    }
  },
);

/** Turns off auto-renew for the monthly plan. */
export const cancelAutoRenew = createAsyncThunk(
  "billing/cancelAutoRenew",
  async (_: void, thunkAPI) => {
    try {
      const response = await axiosInstance.post(ENDPOINTS.cancelAutoRenew());
      return response.data.message as string;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        errorMessage(error, "Could not turn off auto-renew."),
      );
    }
  },
);

const BillingSlice = createSlice({
  name: "Billing",
  initialState: {
    FetchBillingPlansState: {
      FetchBillingPlansIsLoading: false,
      FetchBillingPlansData: [] as BillingPlan[],
    },
    FetchTopUpPacksState: {
      FetchTopUpPacksIsLoading: false,
      FetchTopUpPacksData: [] as TopUpPack[],
    },
    FetchBillingOverviewState: {
      FetchBillingOverviewIsLoading: false,
      FetchBillingOverviewData: null as BillingOverview | null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Plans
      .addCase(fetchBillingPlans.pending, (state) => {
        state.FetchBillingPlansState.FetchBillingPlansIsLoading = true;
      })
      .addCase(fetchBillingPlans.fulfilled, (state, action) => {
        state.FetchBillingPlansState.FetchBillingPlansIsLoading = false;
        state.FetchBillingPlansState.FetchBillingPlansData = action.payload;
      })
      .addCase(fetchBillingPlans.rejected, (state) => {
        state.FetchBillingPlansState.FetchBillingPlansIsLoading = false;
      })
      // Packs
      .addCase(fetchTopUpPacks.pending, (state) => {
        state.FetchTopUpPacksState.FetchTopUpPacksIsLoading = true;
      })
      .addCase(fetchTopUpPacks.fulfilled, (state, action) => {
        state.FetchTopUpPacksState.FetchTopUpPacksIsLoading = false;
        state.FetchTopUpPacksState.FetchTopUpPacksData = action.payload;
      })
      .addCase(fetchTopUpPacks.rejected, (state) => {
        state.FetchTopUpPacksState.FetchTopUpPacksIsLoading = false;
      })
      // Overview
      .addCase(fetchBillingOverview.pending, (state) => {
        state.FetchBillingOverviewState.FetchBillingOverviewIsLoading = true;
      })
      .addCase(fetchBillingOverview.fulfilled, (state, action) => {
        state.FetchBillingOverviewState.FetchBillingOverviewIsLoading = false;
        state.FetchBillingOverviewState.FetchBillingOverviewData =
          action.payload;
      })
      .addCase(fetchBillingOverview.rejected, (state) => {
        state.FetchBillingOverviewState.FetchBillingOverviewIsLoading = false;
      });
  },
});

export default BillingSlice.reducer;
