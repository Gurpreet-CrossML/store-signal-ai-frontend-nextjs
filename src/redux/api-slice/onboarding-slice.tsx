import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "@/redux/axios-config";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ENDPOINTS } from "@/lib/config";

/**
 * Store-onboarding actions. Currently just the Shopify OAuth kick-off: an
 * authenticated GET to Django that resolves the caller's store, signs it into
 * the OAuth state, and returns Shopify's authorize URL for us to open.
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
      // Authenticated Django GET (JWT names the tenant → its store). `name`
      // renames that store to what the merchant typed on the connect step.
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

export type OnboardingJourney = {
  user_journey: string[];
  is_complete: boolean;
  next_step: string | null;
};

/** Load the company's onboarding progress from the backend (source of truth
 * for whether/where to show the setup overlay — replaces the old localStorage). */
export const FetchOnboarding = createAsyncThunk(
  "onboarding/FetchOnboarding",
  async (_: void, thunkAPI) => {
    try {
      const res = await axiosInstance.get(ENDPOINTS.onboardingJourney(), {
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
 * the backend keeps the ordered prefix and drives resume). */
export const CompleteOnboardingStep = createAsyncThunk(
  "onboarding/CompleteOnboardingStep",
  async (step: string, thunkAPI) => {
    try {
      const res = await axiosInstance.post(ENDPOINTS.onboardingJourney(), {
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
      });
  },
});

export const { openOnboarding, closeOnboarding } = OnboardingSlice.actions;

export default OnboardingSlice.reducer;
