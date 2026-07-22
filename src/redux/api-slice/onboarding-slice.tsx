import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "@/redux/axios-config";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ENDPOINTS } from "@/lib/config";
import type { OnboardingPlatform } from "@/lib/onboarding";

/**
 * Store-onboarding actions. Onboarding runs for the workspace's store, which the
 * backend resolves itself (creating it from the merchant's typed name on the
 * connect step) — so nothing here passes a store code.
 */

function errorMessage(error: unknown, fallback: string): string {
  const data = isAxiosError(error) ? error.response?.data : undefined;
  return data?.message || fallback;
}

export type ShopifyInstall = { install_url: string };

export const StartShopifyInstall = createAsyncThunk(
  "onboarding/StartShopifyInstall",
  async ({ shop, name }: { shop: string; name: string }, thunkAPI) => {
    try {
      // Authenticated Django GET (JWT names the tenant). `name` names the store
      // being created/connected — the backend derives its code from it.
      const res = await axiosInstance.get(
        ENDPOINTS.shopifyInstall(shop, name),
        {
          useBackend: true,
        },
      );
      return res.data.data as ShopifyInstall;
    } catch (error) {
      toast.error("Uh oh! Something went wrong.", {
        description: errorMessage(
          error,
          "Unable to start the Shopify connect.",
        ),
      });
      return thunkAPI.rejectWithValue(errorMessage(error, "Failed"));
    }
  },
);

// The "Your AI is ready" step streams `/store/shopify/verify/` (NDJSON) directly
// in the component, so its results aren't kept in Redux.

export type MagentoConnect = { store_code: string };

/** Verify a merchant's Magento admin access token and connect their store.
 * Django reads the store's categories with the token to prove it works, then
 * creates the store from `name` and saves the URL + token onto its credentials.
 * Resolves on success (loading is tracked locally by the connect step). */
export const VerifyMagentoToken = createAsyncThunk(
  "onboarding/VerifyMagentoToken",
  async (
    payload: { name: string; base_url: string; access_token: string },
    thunkAPI,
  ) => {
    try {
      const res = await axiosInstance.post(
        ENDPOINTS.magentoConnect(),
        payload,
        { useBackend: true },
      );
      return res.data.data as MagentoConnect;
    } catch (error) {
      toast.error("Couldn't verify your access token.", {
        description: errorMessage(
          error,
          "Magento didn't accept that token. Double-check it and try again.",
        ),
      });
      return thunkAPI.rejectWithValue(errorMessage(error, "Failed"));
    }
  },
);

export type OnboardingJourney = {
  store_code: string | null;
  platform: OnboardingPlatform;
  user_journey: string[];
  is_complete: boolean;
  next_step: string | null;
};

/** Load the workspace store's onboarding progress (source of truth for whether/
 * where to show the setup overlay, and which platform's flow to run). Before the
 * store exists it reads as an untouched Shopify journey (overlay opens at step 1). */
export const FetchOnboarding = createAsyncThunk(
  "onboarding/FetchOnboarding",
  async (_: void, thunkAPI) => {
    try {
      const res = await axiosInstance.get(ENDPOINTS.storeOnboarding(), {
        useBackend: true,
      });
      return res.data.data as OnboardingJourney;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        errorMessage(error, "Unable to load onboarding progress."),
      );
    }
  },
);

/** Record a completed onboarding step (fire-and-forget as the merchant moves on;
 * the backend keeps the ordered prefix and drives resume). The store + its
 * platform are resolved server-side, so only the step key is sent. */
export const CompleteOnboardingStep = createAsyncThunk(
  "onboarding/CompleteOnboardingStep",
  async (step: string, thunkAPI) => {
    try {
      const res = await axiosInstance.post(ENDPOINTS.storeOnboarding(), {
        step,
      });
      return res.data.data as OnboardingJourney;
    } catch (error) {
      // Non-blocking: the UI has already advanced; a failed save just means
      // resume may replay this step.
      return thunkAPI.rejectWithValue(
        errorMessage(error, "Unable to save onboarding step."),
      );
    }
  },
);

type OnboardingState = {
  installing: boolean;
  // Completed step keys (backend order); [] until the journey loads.
  journey: string[];
  // Platform of the workspace store — drives which flow (Shopify vs Magento).
  platform: OnboardingPlatform;
  // False until FetchOnboarding resolves — the dashboard waits before deciding.
  journeyLoaded: boolean;
  // Whether the full-screen overlay is currently shown.
  overlayOpen: boolean;
  // Guards the one-time auto-open so a dismissal isn't re-opened on re-render.
  autoOpened: boolean;
};

const initialState: OnboardingState = {
  installing: false,
  journey: [],
  platform: "shopify",
  journeyLoaded: false,
  overlayOpen: false,
  autoOpened: false,
};

const OnboardingSlice = createSlice({
  name: "Onboarding",
  initialState,
  reducers: {
    openOnboarding: (state) => {
      state.overlayOpen = true;
      state.autoOpened = true;
    },
    closeOnboarding: (state) => {
      state.overlayOpen = false;
      state.autoOpened = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(StartShopifyInstall.pending, (state) => {
        state.installing = true;
      })
      .addCase(StartShopifyInstall.fulfilled, (state) => {
        state.installing = false;
      })
      .addCase(StartShopifyInstall.rejected, (state) => {
        state.installing = false;
      })
      .addCase(FetchOnboarding.fulfilled, (state, action) => {
        state.journey = action.payload.user_journey;
        state.platform = action.payload.platform;
        state.journeyLoaded = true;
        // Auto-open the overlay once when setup isn't finished.
        if (!action.payload.is_complete && !state.autoOpened) {
          state.overlayOpen = true;
          state.autoOpened = true;
        }
      })
      .addCase(FetchOnboarding.rejected, (state) => {
        // Don't block the dashboard if the load fails.
        state.journeyLoaded = true;
      })
      .addCase(CompleteOnboardingStep.fulfilled, (state, action) => {
        state.journey = action.payload.user_journey;
        state.platform = action.payload.platform;
      });
  },
});

export const { openOnboarding, closeOnboarding } = OnboardingSlice.actions;

export default OnboardingSlice.reducer;
