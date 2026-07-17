import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
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
      const res = await axiosInstance.get(ENDPOINTS.shopifyInstall(shop, name), {
        useBackend: true,
      });
      return res.data.data as ShopifyInstall;
    } catch (error) {
      toast.error("Uh oh! Something went wrong.", {
        description: errorMessage(error, "Unable to start the Shopify connect."),
      });
      return thunkAPI.rejectWithValue(errorMessage(error, "Failed"));
    }
  },
);

type OnboardingState = {
  installing: boolean;
  // null until hydrated from localStorage; then whether setup is finished.
  completed: boolean | null;
  // Whether the full-screen overlay is currently shown.
  overlayOpen: boolean;
  // Guards the one-time auto-open so a dismissal isn't re-opened on re-render.
  autoOpened: boolean;
};

const initialState: OnboardingState = {
  installing: false,
  completed: null,
  overlayOpen: false,
  autoOpened: false,
};

const OnboardingSlice = createSlice({
  name: "Onboarding",
  initialState,
  reducers: {
    // Seed `completed` from localStorage and auto-open the overlay once when
    // setup isn't finished (dispatched from the dashboard on mount).
    hydrateOnboarding: (state, action: PayloadAction<boolean>) => {
      state.completed = action.payload;
      if (!action.payload && !state.autoOpened) {
        state.overlayOpen = true;
        state.autoOpened = true;
      }
    },
    openOnboarding: (state) => {
      state.overlayOpen = true;
      state.autoOpened = true;
    },
    closeOnboarding: (state) => {
      state.overlayOpen = false;
      state.autoOpened = true;
    },
    completeOnboarding: (state) => {
      state.completed = true;
      state.overlayOpen = false;
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
      });
  },
});

export const {
  hydrateOnboarding,
  openOnboarding,
  closeOnboarding,
  completeOnboarding,
} = OnboardingSlice.actions;

export default OnboardingSlice.reducer;
