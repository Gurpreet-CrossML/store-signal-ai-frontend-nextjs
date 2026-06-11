import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "@/redux/axios-config";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { isAxiosError } from "axios";

export type WidgetQuickAction = {
  id?: number;
  name: string;
  message: string;
};

export type WidgetQuickLink = {
  id?: number;
  name: string;
  url: string;
  priority: number;
  is_active: boolean;
};

export type CreateWidgetCustomizationPayload = {
  store?: number;
  primary_color?: string;
  secondary_color?: string;
  tertiary_color?: string;
  welcome_message?: string;
  greeting_message?: string;
  quick_actions?: Omit<WidgetQuickAction, "id">[];
  quick_links?: Omit<WidgetQuickLink, "id">[];
};

export type UpdateWidgetCustomizationPayload = {
  store?: number;
  primary_color?: string;
  secondary_color?: string;
  tertiary_color?: string;
  welcome_message?: string;
  greeting_message?: string;
  quick_actions?: WidgetQuickAction[];
  quick_links?: WidgetQuickLink[];
};

export type WidgetCustomizationDataResponse = {
  id: number;
  store: number;
  primary_color: string | null;
  secondary_color: string | null;
  tertiary_color: string | null;
  logo: string | null;
  welcome_message: string;
  greeting_message: string;
  quick_actions: WidgetQuickAction[];
  quick_links: WidgetQuickLink[];
  created_at: string;
  updated_at: string;
};

export const FetchWidgetCustomization = createAsyncThunk(
  "customization/fetchWidgetCustomization",
  async (storeId: number, thunkAPI) => {
    try {
      // Widget customization is not ported to the Next.js API — read it
      // from the Django backend.
      const response = await axiosInstance.get(
        `${ENDPOINTS.widgetCustomization(storeId)}`,
        {
          useBackend: true,
        },
      );
      const data = response.data.data;

      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;

      // A store with no customization yet is expected — treat it as an
      // empty record (create mode) rather than a hard error.
      if (response?.status === 404) {
        return null;
      }

      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch customization metrics, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const CreateWidgetCustomization = createAsyncThunk(
  "customization/createWidgetCustomization",
  async (
    {
      storeId,
      payload,
    }: { storeId: number; payload: CreateWidgetCustomizationPayload },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.widgetCustomization(storeId)}`,
        payload,
      );
      const data = response.data.data;

      toast.success(
        response?.data?.message || "Widget customization created successfully",
      );
      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to create widget customization, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const UpdateWidgetCustomization = createAsyncThunk(
  "customization/updateWidgetCustomization",
  async (
    {
      storeId,
      payload,
    }: { storeId: number; payload: UpdateWidgetCustomizationPayload },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.put(
        `${ENDPOINTS.widgetCustomization(storeId)}`,
        payload,
      );
      const data = response.data.data;

      toast.success(
        response?.data?.message || "Widget customization updated successfully",
      );
      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to update widget customization, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const UpdateWidgetCustomizationWithImage = createAsyncThunk(
  "customization/updateWidgetCustomizationWithImage",
  async (
    {
      storeId,
      payload,
      logoFile,
    }: {
      storeId: number;
      payload: UpdateWidgetCustomizationPayload;
      logoFile: File;
    },
    thunkAPI,
  ) => {
    try {
      const formData = new FormData();
      formData.append("logo", logoFile);

      const scalarKeys = [
        "store",
        "primary_color",
        "secondary_color",
        "tertiary_color",
        "welcome_message",
        "greeting_message",
      ] as const;

      for (const key of scalarKeys) {
        const value = (payload as Record<string, unknown>)[key];
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }

      if (payload.quick_actions !== undefined) {
        formData.append("quick_actions", JSON.stringify(payload.quick_actions));
      }
      if (payload.quick_links !== undefined) {
        formData.append("quick_links", JSON.stringify(payload.quick_links));
      }

      const response = await axiosInstance.patch(
        `${ENDPOINTS.widgetCustomization(storeId)}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const data = response.data.data;

      toast.success(
        response?.data?.message || "Widget customization updated successfully",
      );
      return data;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;

      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to update widget customization, please try again later.",
      });

      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const CustomizationSlice = createSlice({
  name: "Customization",
  initialState: {
    FetchWidgetCustomizationState: {
      FetchWidgetCustomizationIsLoading: false,
      FetchWidgetCustomizationIsSuccess: false,
      FetchWidgetCustomizationIsError: null as null | string | object,
      FetchWidgetCustomizationData:
        null as null | WidgetCustomizationDataResponse,
    },
    CreateWidgetCustomizationState: {
      CreateWidgetCustomizationIsLoading: false,
      CreateWidgetCustomizationIsSuccess: false,
      CreateWidgetCustomizationIsError: null as null | string | object,
    },
    UpdateWidgetCustomizationState: {
      UpdateWidgetCustomizationIsLoading: false,
      UpdateWidgetCustomizationIsSuccess: false,
      UpdateWidgetCustomizationIsError: null as null | string | object,
    },
    UpdateWidgetCustomizationWithImageState: {
      UpdateWidgetCustomizationWithImageIsLoading: false,
      UpdateWidgetCustomizationWithImageIsSuccess: false,
      UpdateWidgetCustomizationWithImageIsError: null as null | string | object,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchWidgetCustomization.pending, (state) => {
        state.FetchWidgetCustomizationState.FetchWidgetCustomizationIsLoading = true;
        state.FetchWidgetCustomizationState.FetchWidgetCustomizationIsSuccess = false;
        state.FetchWidgetCustomizationState.FetchWidgetCustomizationIsError =
          null;
      })
      .addCase(FetchWidgetCustomization.fulfilled, (state, action) => {
        state.FetchWidgetCustomizationState.FetchWidgetCustomizationIsLoading = false;
        state.FetchWidgetCustomizationState.FetchWidgetCustomizationIsSuccess = true;
        state.FetchWidgetCustomizationState.FetchWidgetCustomizationData =
          action.payload;
      })
      .addCase(FetchWidgetCustomization.rejected, (state, action) => {
        state.FetchWidgetCustomizationState.FetchWidgetCustomizationIsLoading = false;
        state.FetchWidgetCustomizationState.FetchWidgetCustomizationIsSuccess = false;
        state.FetchWidgetCustomizationState.FetchWidgetCustomizationIsError =
          action.payload || "Something went wrong";
      })
      // CreateWidgetCustomization
      .addCase(CreateWidgetCustomization.pending, (state) => {
        state.CreateWidgetCustomizationState.CreateWidgetCustomizationIsLoading = true;
        state.CreateWidgetCustomizationState.CreateWidgetCustomizationIsSuccess = false;
        state.CreateWidgetCustomizationState.CreateWidgetCustomizationIsError =
          null;
      })
      .addCase(CreateWidgetCustomization.fulfilled, (state, action) => {
        state.CreateWidgetCustomizationState.CreateWidgetCustomizationIsLoading = false;
        state.CreateWidgetCustomizationState.CreateWidgetCustomizationIsSuccess = true;
        state.FetchWidgetCustomizationState.FetchWidgetCustomizationData =
          action.payload;
      })
      .addCase(CreateWidgetCustomization.rejected, (state, action) => {
        state.CreateWidgetCustomizationState.CreateWidgetCustomizationIsLoading = false;
        state.CreateWidgetCustomizationState.CreateWidgetCustomizationIsSuccess = false;
        state.CreateWidgetCustomizationState.CreateWidgetCustomizationIsError =
          action.payload || "Something went wrong";
      })
      // UpdateWidgetCustomization
      .addCase(UpdateWidgetCustomization.pending, (state) => {
        state.UpdateWidgetCustomizationState.UpdateWidgetCustomizationIsLoading = true;
        state.UpdateWidgetCustomizationState.UpdateWidgetCustomizationIsSuccess = false;
        state.UpdateWidgetCustomizationState.UpdateWidgetCustomizationIsError =
          null;
      })
      .addCase(UpdateWidgetCustomization.fulfilled, (state, action) => {
        state.UpdateWidgetCustomizationState.UpdateWidgetCustomizationIsLoading = false;
        state.UpdateWidgetCustomizationState.UpdateWidgetCustomizationIsSuccess = true;
        state.FetchWidgetCustomizationState.FetchWidgetCustomizationData =
          action.payload;
      })
      .addCase(UpdateWidgetCustomization.rejected, (state, action) => {
        state.UpdateWidgetCustomizationState.UpdateWidgetCustomizationIsLoading = false;
        state.UpdateWidgetCustomizationState.UpdateWidgetCustomizationIsSuccess = false;
        state.UpdateWidgetCustomizationState.UpdateWidgetCustomizationIsError =
          action.payload || "Something went wrong";
      })
      // UpdateWidgetCustomizationWithImage
      .addCase(UpdateWidgetCustomizationWithImage.pending, (state) => {
        state.UpdateWidgetCustomizationWithImageState.UpdateWidgetCustomizationWithImageIsLoading = true;
        state.UpdateWidgetCustomizationWithImageState.UpdateWidgetCustomizationWithImageIsSuccess = false;
        state.UpdateWidgetCustomizationWithImageState.UpdateWidgetCustomizationWithImageIsError =
          null;
      })
      .addCase(
        UpdateWidgetCustomizationWithImage.fulfilled,
        (state, action) => {
          state.UpdateWidgetCustomizationWithImageState.UpdateWidgetCustomizationWithImageIsLoading = false;
          state.UpdateWidgetCustomizationWithImageState.UpdateWidgetCustomizationWithImageIsSuccess = true;
          state.FetchWidgetCustomizationState.FetchWidgetCustomizationData =
            action.payload;
        },
      )
      .addCase(UpdateWidgetCustomizationWithImage.rejected, (state, action) => {
        state.UpdateWidgetCustomizationWithImageState.UpdateWidgetCustomizationWithImageIsLoading = false;
        state.UpdateWidgetCustomizationWithImageState.UpdateWidgetCustomizationWithImageIsSuccess = false;
        state.UpdateWidgetCustomizationWithImageState.UpdateWidgetCustomizationWithImageIsError =
          action.payload || "Something went wrong";
      });
  },
});

export default CustomizationSlice.reducer;
