import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../axios-config";
import { ENDPOINTS } from "@/lib/config";
import { isAxiosError } from "axios";
import { toast } from "sonner";

export type EmailTemplateDetailRow = {
  icon: string;
  label: string;
  value: string;
};

// Renamed on the backend: intro -> body_text, footer_note -> footer_text,
// cta_label -> button_label, cta_url_token -> button_url — one vocabulary
// shared with WhatsApp/SMS templates now, instead of Email's own names.
export type EmailTemplate = {
  id: number;
  store: number;
  name: string;
  subject: string;
  preheader: string;
  accent_color: string;
  icon: string;
  heading: string;
  body_text: string;
  detail_rows: EmailTemplateDetailRow[];
  button_label: string;
  button_url: string;
  footer_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EmailTemplateWritePayload = {
  name: string;
  subject: string;
  preheader?: string;
  accent_color?: string;
  icon?: string;
  heading: string;
  body_text: string;
  detail_rows?: EmailTemplateDetailRow[];
  button_label?: string;
  button_url?: string;
  footer_text?: string;
  is_active?: boolean;
};

export type EmailTemplatesResponse = EmailTemplate[];

export const fetchEmailTemplates = createAsyncThunk(
  "fetchEmailTemplates",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchEmailTemplates()}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as EmailTemplatesResponse;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description:
          data?.message ||
          "Unable to fetch email templates, please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const createEmailTemplate = createAsyncThunk(
  "createEmailTemplate",
  async (
    {
      storeCode,
      payload,
    }: { storeCode: string; payload: EmailTemplateWritePayload },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.createEmailTemplate()}?store_code=${storeCode}`,
        payload,
        { useBackend: true },
      );
      return response.data.data as EmailTemplate;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't create the template", {
        description: data?.message || "Please check the form and try again.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const updateEmailTemplate = createAsyncThunk(
  "updateEmailTemplate",
  async (
    {
      storeCode,
      templateId,
      payload,
    }: {
      storeCode: string;
      templateId: number;
      payload: Partial<EmailTemplateWritePayload>;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.patch(
        `${ENDPOINTS.emailTemplateDetail({ templateId })}?store_code=${storeCode}`,
        payload,
        { useBackend: true },
      );
      return response.data.data as EmailTemplate;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't update the template", {
        description: data?.message || "Please check the form and try again.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const deleteEmailTemplate = createAsyncThunk(
  "deleteEmailTemplate",
  async (
    { storeCode, templateId }: { storeCode: string; templateId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.delete(
        `${ENDPOINTS.emailTemplateDetail({ templateId })}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as { status: string };
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't delete the template", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const fetchEmailTemplateDetail = createAsyncThunk(
  "fetchEmailTemplateDetail",
  async (
    { storeCode, templateId }: { storeCode: string; templateId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.emailTemplateDetail({ templateId })}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as EmailTemplate;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load the template", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const CampaignSlice = createSlice({
  name: "Campaign",
  initialState: {
    FetchEmailTemplatesState: {
      FetchEmailTemplatesIsLoading: false,
      FetchEmailTemplatesIsSuccess: false,
      FetchEmailTemplatesIsError: null as null | string | object,
      FetchEmailTemplatesData: [] as EmailTemplatesResponse,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmailTemplates.pending, (state) => {
        state.FetchEmailTemplatesState.FetchEmailTemplatesIsLoading = true;
        state.FetchEmailTemplatesState.FetchEmailTemplatesIsSuccess = false;
        state.FetchEmailTemplatesState.FetchEmailTemplatesIsError = null;
      })
      .addCase(fetchEmailTemplates.fulfilled, (state, action) => {
        state.FetchEmailTemplatesState.FetchEmailTemplatesIsLoading = false;
        state.FetchEmailTemplatesState.FetchEmailTemplatesIsSuccess = true;
        state.FetchEmailTemplatesState.FetchEmailTemplatesData = action.payload;
      })
      .addCase(fetchEmailTemplates.rejected, (state, action) => {
        state.FetchEmailTemplatesState.FetchEmailTemplatesIsLoading = false;
        state.FetchEmailTemplatesState.FetchEmailTemplatesIsSuccess = false;
        state.FetchEmailTemplatesState.FetchEmailTemplatesIsError =
          action.payload as string | object;
      });
  },
});

export default CampaignSlice.reducer;
