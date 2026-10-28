import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { ENDPOINTS } from "@/lib/config";
import { serverFieldErrors } from "@/lib/form-errors";
import { axiosInstance } from "../axios-config";

export type StoreSettings = {
  /**
   * Public IPs allowed to load the chatbot widget. Empty means no
   * restriction — the widget renders for everyone.
   */
  allowed_ips: string[];
};

export const FetchStoreAllowedIpsSettings = createAsyncThunk(
  "FetchStoreAllowedIpsSettings",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.storeAllowedIPsSettings()}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as StoreSettings;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to load store settings.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const UpdateStoreAllowedIpsSettings = createAsyncThunk(
  "UpdateStoreAllowedIpsSettings",
  async (
    { storeCode, allowedIps }: { storeCode: string; allowedIps: string[] },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.patch(
        `${ENDPOINTS.storeAllowedIPsSettings()}?store_code=${storeCode}`,
        { allowed_ips: allowedIps },
        { useBackend: true },
      );
      toast.success("Store settings saved.");
      return response.data.data as StoreSettings;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to save store settings.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

/** One platform workflow as the selected store sees it. */
export type StoreWorkflow = {
  code: string;
  name: string;
  description: string;
  /** Temporary download URL of the workflow's icon, or null for none. */
  icon: string | null;
  /** Short grouping labels, e.g. ["sales", "offers"]. */
  tags: string[];
  /** Whether the workflow needs a Shopify / Magento connection to work. */
  shopify_supported: boolean;
  magento_supported: boolean;
  /** Whether the workflow needs the store's knowledge base. */
  kb_supported: boolean;
  /** Position in the list; the API already returns workflows in this order. */
  order: number;
  /** False when the platform has locked the workflow on. */
  can_disable: boolean;
  is_enabled: boolean;
  /** Whether the store can write its own policy for this workflow. */
  has_policy: boolean;
  /** The store's published policy version; 0 when it never saved one. */
  policy_version: number;
};

/** One check in the plain-English summary, e.g. "a discount code was used". */
export type PolicySummaryItem = {
  check: string;
  /** What the customer is told when this check decides. */
  told: string;
};

/** A built-in check every store gets, and what it does to a request. */
export type PolicyAlwaysCheck = {
  text: string;
  outcome: "declined" | "team" | "ask";
};

/** The saved policy in plain English, grouped by what happens. */
export type PolicySummary = {
  allowed: PolicySummaryItem[];
  declined: PolicySummaryItem[];
  team: PolicySummaryItem[];
  /** How allowed requests are carried out, one sentence each. */
  how: string[];
  always: PolicyAlwaysCheck[];
};

export type PolicyHistoryEntry = {
  version: number;
  text: string;
  published_at: string;
  published_by: string;
  /** Set when this version brought back an earlier one. */
  rolled_back_from?: number;
};

/** A store's own policy for one workflow, as the policy endpoints return it. */
export type WorkflowPolicy = {
  workflow: string;
  text: string;
  policy: Record<string, unknown> | null;
  policy_version: number;
  policy_published_at: string | null;
  /** The policy in plain English; empty for older responses. */
  summary?: Partial<PolicySummary>;
  /** What the merchant should check about the current version. */
  review: {
    warnings: string[];
    ambiguities: {
      source_text: string;
      question: string;
      options: string[];
      assumed: string;
    }[];
    unsupported: { source_text: string; why: string }[];
  };
  /** Published versions, newest first. */
  history: PolicyHistoryEntry[];
};

export const FetchStoreWorkflows = createAsyncThunk(
  "FetchStoreWorkflows",
  async (storeCode: string, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.storeWorkflows()}?store_code=${storeCode}`,
        { useBackend: true },
      );
      return response.data.data as StoreWorkflow[];
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to load workflows.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const UpdateStoreWorkflow = createAsyncThunk(
  "UpdateStoreWorkflow",
  async (
    {
      storeCode,
      code,
      isEnabled,
    }: { storeCode: string; code: string; isEnabled: boolean },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.storeWorkflows()}?store_code=${storeCode}`,
        { workflow: code, is_enabled: isEnabled },
        { useBackend: true },
      );
      return response.data.data as { workflow: string; is_enabled: boolean };
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to update this workflow.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const FetchWorkflowPolicy = createAsyncThunk(
  "FetchWorkflowPolicy",
  async (
    { storeCode, workflow }: { storeCode: string; workflow: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.workflowPolicy()}?store_code=${storeCode}&workflow=${workflow}`,
        { useBackend: true },
      );
      return response.data.data as WorkflowPolicy;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to load this policy.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const SaveWorkflowPolicy = createAsyncThunk(
  "SaveWorkflowPolicy",
  async (
    {
      storeCode,
      workflow,
      text,
    }: { storeCode: string; workflow: string; text: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.workflowPolicy()}?store_code=${storeCode}`,
        { workflow, text },
        { useBackend: true },
      );
      return response.data.data as WorkflowPolicy;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      // Text that couldn't be converted comes back as field errors, which
      // the screen shows under the box; only toast what names no field.
      if (!Object.keys(serverFieldErrors(data)).length) {
        toast.error("Uh oh! Something went wrong.", {
          description: data?.message || "Unable to save this policy.",
        });
      }
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const RollbackWorkflowPolicy = createAsyncThunk(
  "RollbackWorkflowPolicy",
  async (
    {
      storeCode,
      workflow,
      version,
    }: { storeCode: string; workflow: string; version: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.workflowPolicyRollback()}?store_code=${storeCode}&workflow=${workflow}`,
        { version },
        { useBackend: true },
      );
      return response.data.data as WorkflowPolicy;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      // A version that no longer fits says why under `version`.
      toast.error("Uh oh! Something went wrong.", {
        description:
          Object.values(serverFieldErrors(data))[0] ||
          data?.message ||
          "Unable to restore this version.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

const StoreSettingsSlice = createSlice({
  name: "StoreSettings",
  initialState: {
    FetchStoreAllowedIpsSettingsState: {
      FetchStoreAllowedIpsSettingsIsLoading: false,
      FetchStoreAllowedIpsSettingsIsSuccess: false,
      FetchStoreAllowedIpsSettingsIsError: null as null | string | object,
      FetchStoreAllowedIpsSettingsData: { allowed_ips: [] } as StoreSettings,
    },
    UpdateStoreAllowedIpsSettingsState: {
      UpdateStoreAllowedIpsSettingsIsLoading: false,
      UpdateStoreAllowedIpsSettingsIsSuccess: false,
      UpdateStoreAllowedIpsSettingsIsError: null as null | string | object,
    },
    FetchStoreWorkflowsState: {
      FetchStoreWorkflowsIsLoading: false,
      FetchStoreWorkflowsIsSuccess: false,
      FetchStoreWorkflowsIsError: null as null | string | object,
      FetchStoreWorkflowsData: [] as StoreWorkflow[],
    },
    UpdateStoreWorkflowState: {
      // Code of the workflow being saved, so only its switch waits.
      UpdateStoreWorkflowPendingCode: null as null | string,
      UpdateStoreWorkflowIsError: null as null | string | object,
    },
    FetchWorkflowPolicyState: {
      FetchWorkflowPolicyIsLoading: false,
      FetchWorkflowPolicyIsSuccess: false,
      FetchWorkflowPolicyIsError: null as null | string | object,
      FetchWorkflowPolicyData: null as null | WorkflowPolicy,
    },
    SaveWorkflowPolicyState: {
      SaveWorkflowPolicyIsLoading: false,
      SaveWorkflowPolicyIsError: null as null | string | object,
    },
    RollbackWorkflowPolicyState: {
      // Version being restored, so only its button waits.
      RollbackWorkflowPolicyPendingVersion: null as null | number,
      RollbackWorkflowPolicyIsError: null as null | string | object,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(FetchStoreAllowedIpsSettings.pending, (state) => {
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsIsLoading = true;
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsIsSuccess = false;
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsIsError =
          null;
      })
      .addCase(FetchStoreAllowedIpsSettings.fulfilled, (state, action) => {
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsIsLoading = false;
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsIsSuccess = true;
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsData =
          {
            allowed_ips: action.payload?.allowed_ips ?? [],
          };
      })
      .addCase(FetchStoreAllowedIpsSettings.rejected, (state, action) => {
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsIsLoading = false;
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsIsError =
          action.payload as string | object;
      })
      .addCase(UpdateStoreAllowedIpsSettings.pending, (state) => {
        state.UpdateStoreAllowedIpsSettingsState.UpdateStoreAllowedIpsSettingsIsLoading = true;
        state.UpdateStoreAllowedIpsSettingsState.UpdateStoreAllowedIpsSettingsIsSuccess = false;
        state.UpdateStoreAllowedIpsSettingsState.UpdateStoreAllowedIpsSettingsIsError =
          null;
      })
      .addCase(UpdateStoreAllowedIpsSettings.fulfilled, (state, action) => {
        state.UpdateStoreAllowedIpsSettingsState.UpdateStoreAllowedIpsSettingsIsLoading = false;
        state.UpdateStoreAllowedIpsSettingsState.UpdateStoreAllowedIpsSettingsIsSuccess = true;
        // Keep the read slot in step so leaving and returning shows the
        // saved list without a refetch.
        state.FetchStoreAllowedIpsSettingsState.FetchStoreAllowedIpsSettingsData =
          {
            allowed_ips: action.payload?.allowed_ips ?? [],
          };
      })
      .addCase(UpdateStoreAllowedIpsSettings.rejected, (state, action) => {
        state.UpdateStoreAllowedIpsSettingsState.UpdateStoreAllowedIpsSettingsIsLoading = false;
        state.UpdateStoreAllowedIpsSettingsState.UpdateStoreAllowedIpsSettingsIsError =
          action.payload as string | object;
      })
      .addCase(FetchStoreWorkflows.pending, (state) => {
        state.FetchStoreWorkflowsState.FetchStoreWorkflowsIsLoading = true;
        state.FetchStoreWorkflowsState.FetchStoreWorkflowsIsSuccess = false;
        state.FetchStoreWorkflowsState.FetchStoreWorkflowsIsError = null;
      })
      .addCase(FetchStoreWorkflows.fulfilled, (state, action) => {
        state.FetchStoreWorkflowsState.FetchStoreWorkflowsIsLoading = false;
        state.FetchStoreWorkflowsState.FetchStoreWorkflowsIsSuccess = true;
        state.FetchStoreWorkflowsState.FetchStoreWorkflowsData =
          action.payload ?? [];
      })
      .addCase(FetchStoreWorkflows.rejected, (state, action) => {
        state.FetchStoreWorkflowsState.FetchStoreWorkflowsIsLoading = false;
        state.FetchStoreWorkflowsState.FetchStoreWorkflowsIsError =
          action.payload as string | object;
      })
      .addCase(UpdateStoreWorkflow.pending, (state, action) => {
        state.UpdateStoreWorkflowState.UpdateStoreWorkflowPendingCode =
          action.meta.arg.code;
        state.UpdateStoreWorkflowState.UpdateStoreWorkflowIsError = null;
      })
      .addCase(UpdateStoreWorkflow.fulfilled, (state, action) => {
        state.UpdateStoreWorkflowState.UpdateStoreWorkflowPendingCode = null;
        // Keep the list in step with what was saved, without a refetch.
        const saved =
          state.FetchStoreWorkflowsState.FetchStoreWorkflowsData.find(
            (workflow) => workflow.code === action.payload.workflow,
          );
        if (saved) saved.is_enabled = action.payload.is_enabled;
      })
      .addCase(UpdateStoreWorkflow.rejected, (state, action) => {
        state.UpdateStoreWorkflowState.UpdateStoreWorkflowPendingCode = null;
        state.UpdateStoreWorkflowState.UpdateStoreWorkflowIsError =
          action.payload as string | object;
      })
      .addCase(FetchWorkflowPolicy.pending, (state) => {
        state.FetchWorkflowPolicyState.FetchWorkflowPolicyIsLoading = true;
        state.FetchWorkflowPolicyState.FetchWorkflowPolicyIsSuccess = false;
        state.FetchWorkflowPolicyState.FetchWorkflowPolicyIsError = null;
        // Drop the last workflow's (or store's) policy so it never shows,
        // or gets edited, under another one.
        state.FetchWorkflowPolicyState.FetchWorkflowPolicyData = null;
      })
      .addCase(FetchWorkflowPolicy.fulfilled, (state, action) => {
        state.FetchWorkflowPolicyState.FetchWorkflowPolicyIsLoading = false;
        state.FetchWorkflowPolicyState.FetchWorkflowPolicyIsSuccess = true;
        state.FetchWorkflowPolicyState.FetchWorkflowPolicyData = action.payload;
      })
      .addCase(FetchWorkflowPolicy.rejected, (state, action) => {
        state.FetchWorkflowPolicyState.FetchWorkflowPolicyIsLoading = false;
        state.FetchWorkflowPolicyState.FetchWorkflowPolicyIsError =
          action.payload as string | object;
      })
      .addCase(SaveWorkflowPolicy.pending, (state) => {
        state.SaveWorkflowPolicyState.SaveWorkflowPolicyIsLoading = true;
        state.SaveWorkflowPolicyState.SaveWorkflowPolicyIsError = null;
      })
      .addCase(SaveWorkflowPolicy.fulfilled, (state) => {
        state.SaveWorkflowPolicyState.SaveWorkflowPolicyIsLoading = false;
      })
      .addCase(SaveWorkflowPolicy.rejected, (state, action) => {
        state.SaveWorkflowPolicyState.SaveWorkflowPolicyIsLoading = false;
        state.SaveWorkflowPolicyState.SaveWorkflowPolicyIsError =
          action.payload as string | object;
      })
      .addCase(RollbackWorkflowPolicy.pending, (state, action) => {
        state.RollbackWorkflowPolicyState.RollbackWorkflowPolicyPendingVersion =
          action.meta.arg.version;
        state.RollbackWorkflowPolicyState.RollbackWorkflowPolicyIsError = null;
      })
      .addCase(RollbackWorkflowPolicy.fulfilled, (state) => {
        state.RollbackWorkflowPolicyState.RollbackWorkflowPolicyPendingVersion =
          null;
      })
      .addCase(RollbackWorkflowPolicy.rejected, (state, action) => {
        state.RollbackWorkflowPolicyState.RollbackWorkflowPolicyPendingVersion =
          null;
        state.RollbackWorkflowPolicyState.RollbackWorkflowPolicyIsError =
          action.payload as string | object;
      })
      // Save and rollback both publish a new version: show it, and keep the
      // card's version badge in step without a refetch.
      .addMatcher(
        isAnyOf(SaveWorkflowPolicy.fulfilled, RollbackWorkflowPolicy.fulfilled),
        (state, action) => {
          state.FetchWorkflowPolicyState.FetchWorkflowPolicyData =
            action.payload;
          const saved =
            state.FetchStoreWorkflowsState.FetchStoreWorkflowsData.find(
              (workflow) => workflow.code === action.payload.workflow,
            );
          if (saved) saved.policy_version = action.payload.policy_version;
        },
      );
  },
});

export default StoreSettingsSlice.reducer;
