import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../axios-config";
import { ENDPOINTS } from "@/lib/config";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { bestErrorMessage, errorEnvelope } from "@/lib/api-errors";

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
        `${ENDPOINTS.fetchEmailTemplates()}?store_code=${encodeURIComponent(storeCode)}`,
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
        `${ENDPOINTS.createEmailTemplate()}?store_code=${encodeURIComponent(storeCode)}`,
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
        `${ENDPOINTS.emailTemplateDetail({ templateId })}?store_code=${encodeURIComponent(storeCode)}`,
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
        `${ENDPOINTS.emailTemplateDetail({ templateId })}?store_code=${encodeURIComponent(storeCode)}`,
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

// The backend's slug for the abandoned-cart category. It has no cart value to
// filter on, so it only accepts a min_price of 0 (see SEGMENT_VALUE_FIELD).
export const SEGMENT_CATEGORY_ABANDONED_CART_SLUG = "abandoned-cart";

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
      const params = new URLSearchParams({
        store_code: storeCode,
        time_period: String(time_period),
        page: String(page),
        page_size: String(page_size),
      });
      if (min_price !== undefined && min_price !== "") {
        params.set("min_price", String(min_price));
      }
      const response = await axiosInstance.get(
        `${ENDPOINTS.previewSegment(category)}?${params.toString()}`,
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
        `${ENDPOINTS.createSegment()}?store_code=${encodeURIComponent(storeCode)}`,
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
export const fetchSegmentDetail = createAsyncThunk(
  "fetchSegmentDetail",
  async (
    { storeCode, segmentId }: { storeCode: string; segmentId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.segmentDetail({ segmentId })}?store_code=${encodeURIComponent(storeCode)}`,
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
        `${ENDPOINTS.segmentDetail({ segmentId })}?store_code=${encodeURIComponent(storeCode)}`,
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
        `${ENDPOINTS.segmentDetail({ segmentId })}?store_code=${encodeURIComponent(storeCode)}`,
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
        `${ENDPOINTS.segmentDetail({ segmentId })}?store_code=${encodeURIComponent(storeCode)}`,
        { is_active: isActive },
        { useBackend: true },
      );
      return response.data.data as Segment;
    } catch (error) {
      const data = errorEnvelope(error);
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

// The time zone every campaign's daily runs are scheduled in. Mirrors
// settings.TIME_ZONE on the backend.
export const CAMPAIGN_TIME_ZONE = "Asia/Kolkata";

export type CampaignSequenceStep = {
  id?: number;
  whatsapp_template: number | null;
  email_template: number | null;
  start_time: string;
  delay_value: number | null;
  step_order: number;
  // True once the step has run; such a step can't be removed.
  has_runs: boolean;
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
// come from their own endpoint (see CampaignSequenceSteps).
export type CampaignDetail = Omit<Campaign, "sequence_steps">;

// What the schedule endpoint reports: one recurring daily schedule per step
// it could book, and an error for each step it could not.
export type CampaignScheduleResult = {
  campaign: string;
  scheduled: {
    step_order: number;
    sequence_step_id: number;
    schedule_name: string;
    cron: string;
  }[];
  errors: { step_order: number; error: string }[];
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
  sequence_steps: Omit<CampaignSequenceStep, "id" | "has_runs">[];
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
        `${ENDPOINTS.campaignDetail({ campaignId })}?store_code=${encodeURIComponent(storeCode)}`,
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
        `${ENDPOINTS.campaignSequenceSteps({ campaignId })}?store_code=${encodeURIComponent(storeCode)}`,
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
        `${ENDPOINTS.createCampaign()}?store_code=${encodeURIComponent(storeCode)}`,
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
        `${ENDPOINTS.campaignDetail({ campaignId })}?store_code=${encodeURIComponent(storeCode)}`,
        body,
        { useBackend: true },
      );
      return response.data.data as Campaign;
    } catch (error) {
      const data = errorEnvelope(error);
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
        `${ENDPOINTS.campaignDetail({ campaignId })}?store_code=${encodeURIComponent(storeCode)}`,
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

// Puts the campaign's recurring daily schedules in place. Call after anything
// that starts a live campaign: publishing, resuming, rescheduling, or editing
// one that is running (the backend removes its schedules on edit). It fails
// when any step could not be scheduled, so a caller never reports success
// for a campaign that will not send. The error toast is shown here, once.
export const scheduleCampaign = createAsyncThunk(
  "scheduleCampaign",
  async (
    { storeCode, campaignId }: { storeCode: string; campaignId: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.campaignSchedule({ campaignId })}?store_code=${encodeURIComponent(storeCode)}`,
        undefined,
        { useBackend: true },
      );
      const result = response.data.data as CampaignScheduleResult;
      if (result.errors.length > 0) {
        toast.error("Some steps couldn't be scheduled", {
          description: result.errors
            .map((entry) => `Step ${entry.step_order + 1}: ${entry.error}`)
            .join("\n"),
        });
        return thunkAPI.rejectWithValue(result);
      }
      return result;
    } catch (error) {
      const data = errorEnvelope(error);
      toast.error("Couldn't schedule the campaign", {
        description: bestErrorMessage(data, "Please try again later."),
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

// Makes a campaign live (or publishes it and makes it live), then schedules
// its daily runs. The two calls go together, since a live campaign with no
// schedule looks active and never sends. If scheduling fails, the campaign
// stays published and live, and the detail screen's Reschedule retries it.
export const activateCampaign = createAsyncThunk(
  "activateCampaign",
  async (
    {
      storeCode,
      campaignId,
      publish = false,
    }: { storeCode: string; campaignId: number; publish?: boolean },
    thunkAPI,
  ) => {
    try {
      const updated = await thunkAPI
        .dispatch(
          updateCampaignStatus({
            storeCode,
            campaignId,
            ...(publish ? { status: "published" as const } : {}),
            isActive: true,
          }),
        )
        .unwrap();
      await thunkAPI
        .dispatch(scheduleCampaign({ storeCode, campaignId }))
        .unwrap();
      return updated;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
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
        `${ENDPOINTS.campaignDetail({ campaignId })}?store_code=${encodeURIComponent(storeCode)}`,
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
        `${ENDPOINTS.emailTemplateDetail({ templateId })}?store_code=${encodeURIComponent(storeCode)}`,
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
