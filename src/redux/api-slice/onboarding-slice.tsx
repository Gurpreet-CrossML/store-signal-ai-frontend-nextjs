import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "../axios-config";

export type ShopifyConnectedStore = {
  store_code: string;
  store_name: string;
  webhooks: {
    subscribed: string[];
    existing: string[];
    /** topic → reason. The store is connected even when this is non-empty. */
    failed: Record<string, string>;
  };
};

export type OnboardingStatus = {
  onboarding_pending: boolean;
  onboarding_step: string | null;
  /** Every connected store; each carries the widget key issued for it. */
  stores: OnboardingStore[];
};

export type OnboardingStore = {
  code: string;
  name: string;
  platform: string;
  widget_key: string;
};

/** What the dashboard may set the step to; the backend owns the rest. */
export type OnboardingOutcome = "completed" | "skipped";

export const FetchOnboardingStatus = createAsyncThunk(
  "FetchOnboardingStatus",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get(ENDPOINTS.companyOnboarding(), {
        useBackend: true,
      });
      return response.data.data as OnboardingStatus;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to load your setup progress.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const UpdateOnboardingStep = createAsyncThunk(
  "UpdateOnboardingStep",
  async (onboardingStep: OnboardingOutcome, thunkAPI) => {
    try {
      const response = await axiosInstance.patch(
        ENDPOINTS.companyOnboarding(),
        { onboarding_step: onboardingStep },
      );
      toast.success(
        onboardingStep === "completed"
          ? "You're live"
          : "Setup skipped — you can install the widget later",
      );
      return response.data.data as Partial<OnboardingStatus>;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't update your setup", {
        description: data?.message || "Try again in a moment.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const StartShopifyOauth = createAsyncThunk(
  "StartShopifyOauth",
  async (
    {
      storeAlias,
      redirectToSetting = false,
    }: {
      storeAlias: string;
      /** True only from Settings → Stores: Shopify then sends the user back
       * to /settings/store, and a never-finished onboarding is marked
       * completed instead of advancing to go-live. */
      redirectToSetting?: boolean;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(ENDPOINTS.shopifyOauthStart(), {
        store_alias: storeAlias,
        ...(redirectToSetting && { redirect_to_setting: true }),
      });
      return response.data.data as { authorize_url: string };
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't start the Shopify connection", {
        description: data?.message || "Unable to reach Shopify. Try again.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const CompleteShopifyOauth = createAsyncThunk(
  "CompleteShopifyOauth",
  // The query string Shopify redirected back with, forwarded untouched:
  // the backend verifies its HMAC over every parameter.
  async (search: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.shopifyOauthCallback()}?${search}`,
        { useBackend: true },
      );
      const data = response.data.data as ShopifyConnectedStore;
      const failed = Object.keys(data?.webhooks?.failed ?? {});
      if (failed.length) {
        toast.warning("Store connected, some webhooks failed", {
          description: `Not subscribed: ${failed.join(", ")}.`,
        });
      } else {
        toast.success("Shopify store connected");
      }
      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't finish the Shopify connection", {
        description:
          data?.message || "Shopify didn't complete the handshake. Try again.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const OnboardingSlice = createSlice({
  name: "Onboarding",
  initialState: {
    FetchOnboardingStatusState: {
      FetchOnboardingStatusIsLoading: false,
      FetchOnboardingStatusIsSuccess: false,
      FetchOnboardingStatusIsError: null as null | string | object,
      FetchOnboardingStatusData: null as OnboardingStatus | null,
    },
    UpdateOnboardingStepState: {
      UpdateOnboardingStepIsLoading: false,
      UpdateOnboardingStepIsSuccess: false,
      UpdateOnboardingStepIsError: null as null | string | object,
    },
    StartShopifyOauthState: {
      StartShopifyOauthIsLoading: false,
      StartShopifyOauthIsSuccess: false,
      StartShopifyOauthIsError: null as null | string | object,
    },
    CompleteShopifyOauthState: {
      CompleteShopifyOauthIsLoading: false,
      CompleteShopifyOauthIsSuccess: false,
      CompleteShopifyOauthIsError: null as null | string | object,
      CompleteShopifyOauthData: null as ShopifyConnectedStore | null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchOnboardingStatus.pending, (state) => {
        state.FetchOnboardingStatusState.FetchOnboardingStatusIsLoading = true;
        state.FetchOnboardingStatusState.FetchOnboardingStatusIsSuccess = false;
        state.FetchOnboardingStatusState.FetchOnboardingStatusIsError = null;
      })
      .addCase(FetchOnboardingStatus.fulfilled, (state, action) => {
        state.FetchOnboardingStatusState.FetchOnboardingStatusIsLoading = false;
        state.FetchOnboardingStatusState.FetchOnboardingStatusIsSuccess = true;
        state.FetchOnboardingStatusState.FetchOnboardingStatusData =
          action.payload;
      })
      .addCase(FetchOnboardingStatus.rejected, (state, action) => {
        state.FetchOnboardingStatusState.FetchOnboardingStatusIsLoading = false;
        state.FetchOnboardingStatusState.FetchOnboardingStatusIsError =
          action.payload as string | object;
      })
      .addCase(UpdateOnboardingStep.pending, (state) => {
        state.UpdateOnboardingStepState.UpdateOnboardingStepIsLoading = true;
        state.UpdateOnboardingStepState.UpdateOnboardingStepIsSuccess = false;
        state.UpdateOnboardingStepState.UpdateOnboardingStepIsError = null;
      })
      .addCase(UpdateOnboardingStep.fulfilled, (state, action) => {
        state.UpdateOnboardingStepState.UpdateOnboardingStepIsLoading = false;
        state.UpdateOnboardingStepState.UpdateOnboardingStepIsSuccess = true;
        // Keep the read slot in step so the drawer reflects it immediately.
        if (state.FetchOnboardingStatusState.FetchOnboardingStatusData) {
          Object.assign(
            state.FetchOnboardingStatusState.FetchOnboardingStatusData,
            action.payload,
          );
        }
      })
      .addCase(UpdateOnboardingStep.rejected, (state, action) => {
        state.UpdateOnboardingStepState.UpdateOnboardingStepIsLoading = false;
        state.UpdateOnboardingStepState.UpdateOnboardingStepIsError =
          action.payload as string | object;
      })
      .addCase(StartShopifyOauth.pending, (state) => {
        state.StartShopifyOauthState.StartShopifyOauthIsLoading = true;
        state.StartShopifyOauthState.StartShopifyOauthIsSuccess = false;
        state.StartShopifyOauthState.StartShopifyOauthIsError = null;
      })
      .addCase(StartShopifyOauth.fulfilled, (state) => {
        // Loading stays true on purpose: the browser is about to leave for
        // Shopify, and flipping the button back would invite a second click.
        state.StartShopifyOauthState.StartShopifyOauthIsSuccess = true;
      })
      .addCase(StartShopifyOauth.rejected, (state, action) => {
        state.StartShopifyOauthState.StartShopifyOauthIsLoading = false;
        state.StartShopifyOauthState.StartShopifyOauthIsError =
          action.payload as string | object;
      })
      .addCase(CompleteShopifyOauth.pending, (state) => {
        state.CompleteShopifyOauthState.CompleteShopifyOauthIsLoading = true;
        state.CompleteShopifyOauthState.CompleteShopifyOauthIsSuccess = false;
        state.CompleteShopifyOauthState.CompleteShopifyOauthIsError = null;
      })
      .addCase(CompleteShopifyOauth.fulfilled, (state, action) => {
        state.CompleteShopifyOauthState.CompleteShopifyOauthIsLoading = false;
        state.CompleteShopifyOauthState.CompleteShopifyOauthIsSuccess = true;
        state.CompleteShopifyOauthState.CompleteShopifyOauthData =
          action.payload;
      })
      .addCase(CompleteShopifyOauth.rejected, (state, action) => {
        state.CompleteShopifyOauthState.CompleteShopifyOauthIsLoading = false;
        state.CompleteShopifyOauthState.CompleteShopifyOauthIsError =
          action.payload as string | object;
      });
  },
});

export default OnboardingSlice.reducer;
