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

// ---------------------------------------------------------------------------
// Segments — a store's saved audience definitions, each a narrowing of one
// platform-wide SegmentCategory (see fetchSegmentCategories) with a numeric
// window and an optional cart-value floor.
// ---------------------------------------------------------------------------

// core.SegmentCategory — shared by every tenant, so no store_code on the URL.
export type SegmentCategory = {
  id: number;
  name: string;
  slug: string;
};

export type Segment = {
  id: number;
  store: number;
  name: string;
  category: number;
  time_period: number;
  min_price: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SegmentWritePayload = {
  name: string;
  category: number;
  time_period: number;
  min_price?: number | string;
  is_active?: boolean;
};

export const fetchSegmentCategories = createAsyncThunk(
  "fetchSegmentCategories",
  async (_: void, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        ENDPOINTS.fetchSegmentCategories(),
        { useBackend: true },
      );
      return response.data.data as SegmentCategory[];
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load segment categories", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const fetchSegments = createAsyncThunk(
  "fetchSegments",
  async (
    { storeCode, search }: { storeCode: string; search?: string },
    thunkAPI,
  ) => {
    try {
      const params = new URLSearchParams({ store_code: storeCode });
      const trimmed = search?.trim();
      if (trimmed) params.set("search", trimmed);
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchSegments()}?${params.toString()}`,
        { useBackend: true },
      );
      return response.data.data as Segment[];
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load segments", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

// One row of SegmentPreviewAPIView's matching-customers table.
// ``order_value`` is category-dependent — the customer's most recent
// order total for last-order, their windowed spend for total-spent, and
// null for abandoned-cart (no computable cart total — see
// campaign.helpers.compile_abandoned_cart on the backend).
export type SegmentPreviewCustomer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  order_value: string | null;
};

export type SegmentPreviewResult = {
  count: number;
  results: SegmentPreviewCustomer[];
};

export const previewSegmentCount = createAsyncThunk(
  "previewSegmentCount",
  async (
    {
      storeCode,
      category,
      time_period,
      min_price,
      page = 1,
      page_size = 25,
    }: {
      storeCode: string;
      category: number;
      time_period: number;
      min_price?: number | string;
      page?: number;
      page_size?: number;
    },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.previewSegment()}?store_code=${storeCode}&page=${page}&page_size=${page_size}`,
        { category, time_period, min_price },
        { useBackend: true },
      );
      return response.data.data as SegmentPreviewResult;
    } catch (error) {
      // No toast here — this fires on every debounced keystroke while
      // the user is still filling in the form (e.g. time_period
      // momentarily empty mid-edit), so a validation 400 is routine
      // rather than something worth interrupting them about.
      const response = isAxiosError(error) ? error.response : undefined;
      return thunkAPI.rejectWithValue(response?.data || "Something went wrong");
    }
  },
);

export const createSegment = createAsyncThunk(
  "createSegment",
  async (
    { storeCode, payload }: { storeCode: string; payload: SegmentWritePayload },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.createSegment()}?store_code=${storeCode}`,
        payload,
        { useBackend: true },
      );
      return response.data.data as Segment;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      // Reject with the whole envelope so the form can pull field errors
      // out of ``err.data`` (DRF puts one on the 400 response).
      return thunkAPI.rejectWithValue(response?.data || "Something went wrong");
    }
  },
);

/**
 * Prefer the DRF field-level error over the generic ``message`` on a
 * 400 — the field message is what actually says *why* (e.g. "Can't
 * pause this segment: it is still the audience of live campaign X").
 */
function bestErrorMessage(envelope: unknown, fallback: string): string {
  const data = envelope as { data?: unknown; message?: string } | undefined;
  const fieldData = data?.data;
  if (fieldData && typeof fieldData === "object" && !Array.isArray(fieldData)) {
    for (const value of Object.values(fieldData as Record<string, unknown>)) {
      if (typeof value === "string" && value) return value;
      if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }
  }
  return data?.message || fallback;
}

export const fetchSegmentDetail = createAsyncThunk(
  "fetchSegmentDetail",
  async (
    { storeCode, segmentId }: { storeCode: string; segmentId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.segmentDetail({ segmentId })}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as Segment;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load the segment", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const updateSegment = createAsyncThunk(
  "updateSegment",
  async (
    {
      storeCode,
      segmentId,
      payload,
    }: { storeCode: string; segmentId: number; payload: SegmentWritePayload },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.put(
        `${ENDPOINTS.segmentDetail({ segmentId })}?store_code=${storeCode}`,
        payload,
        { useBackend: true },
      );
      return response.data.data as Segment;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      // Reject with the whole envelope so the form can pull field errors
      // out of ``err.data`` (DRF puts one on the 400 response).
      return thunkAPI.rejectWithValue(response?.data || "Something went wrong");
    }
  },
);

export const deleteSegment = createAsyncThunk(
  "deleteSegment",
  async (
    { storeCode, segmentId }: { storeCode: string; segmentId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.delete(
        `${ENDPOINTS.segmentDetail({ segmentId })}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as { status: string };
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't delete the segment", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const updateSegmentStatus = createAsyncThunk(
  "updateSegmentStatus",
  async (
    {
      storeCode,
      segmentId,
      isActive,
    }: { storeCode: string; segmentId: number; isActive: boolean },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.patch(
        `${ENDPOINTS.segmentDetail({ segmentId })}?store_code=${storeCode}`,
        { is_active: isActive },
        { useBackend: true },
      );
      return response.data.data as Segment;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't update the segment", {
        description: bestErrorMessage(data, "Please try again later."),
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

// ---------------------------------------------------------------------------
// Campaigns — a scheduled multi-step journey targeting one Segment. Steps
// carry exactly one of whatsapp_template / email_template each; the backend
// enforces sub-24h total delay and >=30min spacing between consecutive steps.
// ---------------------------------------------------------------------------

export type CampaignSequenceStep = {
  id?: number;
  whatsapp_template: number | null;
  email_template: number | null;
  start_time: string;
  delay_value: number | null;
  step_order: number;
};

export type Campaign = {
  id: number;
  store: number;
  name: string;
  status: "draft" | "published";
  is_active: boolean;
  start_time: string;
  segment: number;
  continuous_entry: boolean;
  sequence_steps: CampaignSequenceStep[];
  created_at: string;
  updated_at: string;
};

// One campaign's own fields, as the detail endpoint returns them — the steps
// come from their own endpoint (see CampaignSequenceSteps). ``job_id`` is the
// next unfinished step run's id, or null when nothing is scheduled.
export type CampaignDetail = Omit<Campaign, "sequence_steps"> & {
  job_id: string | null;
};

// The steps endpoint's response: which campaign the steps belong to, plus
// the steps in ``step_order``.
export type CampaignSequenceSteps = {
  campaign_id: number;
  name: string;
  status: "draft" | "published";
  is_active: boolean;
  sequence_steps: CampaignSequenceStep[];
};

export type CampaignWritePayload = {
  name: string;
  status?: "draft" | "published";
  is_active?: boolean;
  start_time: string;
  segment: number;
  continuous_entry?: boolean;
  sequence_steps: Omit<CampaignSequenceStep, "id">[];
};

export const fetchCampaigns = createAsyncThunk(
  "fetchCampaigns",
  async (
    { storeCode, search }: { storeCode: string; search?: string },
    thunkAPI,
  ) => {
    try {
      const params = new URLSearchParams({ store_code: storeCode });
      const trimmed = search?.trim();
      if (trimmed) params.set("search", trimmed);
      const response = await axiosInstance.get(
        `${ENDPOINTS.fetchCampaigns()}?${params.toString()}`,
        { useBackend: true },
      );
      return response.data.data as Campaign[];
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load campaigns", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const fetchCampaignDetail = createAsyncThunk(
  "fetchCampaignDetail",
  async (
    { storeCode, campaignId }: { storeCode: string; campaignId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.campaignDetail({ campaignId })}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as CampaignDetail;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load the campaign", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const fetchCampaignSequenceSteps = createAsyncThunk(
  "fetchCampaignSequenceSteps",
  async (
    { storeCode, campaignId }: { storeCode: string; campaignId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.campaignSequenceSteps({ campaignId })}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as CampaignSequenceSteps;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't load the campaign's steps", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const createCampaign = createAsyncThunk(
  "createCampaign",
  async (
    {
      storeCode,
      payload,
    }: { storeCode: string; payload: CampaignWritePayload },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.createCampaign()}?store_code=${storeCode}`,
        payload,
        { useBackend: true },
      );
      return response.data.data as Campaign;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      // Reject with the whole envelope so the form can pull field errors
      // out of ``err.data`` (DRF puts one on the 400 response).
      return thunkAPI.rejectWithValue(response?.data || "Something went wrong");
    }
  },
);

export const updateCampaignStatus = createAsyncThunk(
  "updateCampaignStatus",
  async (
    {
      storeCode,
      campaignId,
      status,
      isActive,
    }: {
      storeCode: string;
      campaignId: number;
      status?: "draft" | "published";
      isActive?: boolean;
    },
    thunkAPI,
  ) => {
    try {
      const body: Record<string, unknown> = {};
      if (status !== undefined) body.status = status;
      if (isActive !== undefined) body.is_active = isActive;
      const response = await axiosInstance.patch(
        `${ENDPOINTS.campaignDetail({ campaignId })}?store_code=${storeCode}`,
        body,
        { useBackend: true },
      );
      return response.data.data as Campaign;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't update the campaign", {
        description: bestErrorMessage(data, "Please try again later."),
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const updateCampaign = createAsyncThunk(
  "updateCampaign",
  async (
    {
      storeCode,
      campaignId,
      payload,
    }: { storeCode: string; campaignId: number; payload: CampaignWritePayload },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.put(
        `${ENDPOINTS.campaignDetail({ campaignId })}?store_code=${storeCode}`,
        payload,
        { useBackend: true },
      );
      return response.data.data as Campaign;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      // Reject with the whole envelope so the form can pull field errors
      // out of ``err.data`` (DRF puts one on the 400 response).
      return thunkAPI.rejectWithValue(response?.data || "Something went wrong");
    }
  },
);

export const deleteCampaign = createAsyncThunk(
  "deleteCampaign",
  async (
    { storeCode, campaignId }: { storeCode: string; campaignId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.delete(
        `${ENDPOINTS.campaignDetail({ campaignId })}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as { status: string };
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't delete the campaign", {
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
