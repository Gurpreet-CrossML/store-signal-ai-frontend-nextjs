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
      toast.error("Couldn't load store settings.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't load store settings.");
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
      toast.error("Couldn't save store settings.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't save store settings.");
    }
  },
);

/** One platform workflow as the selected store sees it. */
export type StoreWorkflow = {
  code: string;
  name: string;
  description: string;
  /** The AI the workflow belongs to. */
  agent: "sales" | "support";
  /** That AI's name for merchants, e.g. "Sales AI". */
  agent_label: string;
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
  /** False when the workflow is locked on, or a locked workflow needs it. */
  can_disable: boolean;
  is_enabled: boolean;
  /** Codes of the workflows that need this one; turning it off turns them off. */
  also_turns_off: string[];
  /** Codes of the workflows this one needs; turning it on turns them on. */
  also_turns_on: string[];
  /** Whether the store can write its own policy for this workflow. */
  has_policy: boolean;
  /** The store's published policy version; 0 when it never saved one. */
  policy_version: number;
};

/** What happens to a request: the outcome of one flowchart step. */
export type PolicyEffect = "decline" | "need_info" | "team" | "allow";

/** One rule in a flowchart step, in plain words. */
export type PolicyFlowRule = {
  id: string;
  /** Its conditions in words; a built-in check is shown by its reason. */
  check: string;
  /** What the customer is told when this rule decides. */
  told: string;
  /** The merchant's sentence it came from. */
  source_text: string;
  /** A built-in check every store gets. */
  platform: boolean;
};

/**
 * One step of the flowchart, in the order the engine settles a request:
 * yes leads to its outcome, no to the next step. `need_info` lists what
 * the customer is asked for; the others list their rules.
 */
export type PolicyFlowStep =
  | { effect: "need_info"; asks: string[] }
  | { effect: Exclude<PolicyEffect, "need_info">; rules: PolicyFlowRule[] };

/** The saved policy as the steps the engine settles a request in. */
export type PolicyFlow = {
  steps: PolicyFlowStep[];
  /** What happens when no step matched. */
  default: { effect: "decline" | "team"; told: string };
  /** What an allowed request does, e.g. "Cancelling the order". */
  action: string;
  /** Sentences that hold every allowed request for the team. */
  held: string[];
};

/** Something code found about how the merchant's sentences work together. */
export type PolicyFinding = {
  key: string;
  kind: "impossible" | "overridden" | "conflict" | "redundant" | "gap";
  severity: "error" | "warning" | "info";
  text: string;
  /** The merchant's sentence it is about; empty for a gap. */
  sentence: string;
  /** The other sentences, or built-in checks, involved. */
  others: { text: string; platform: boolean }[];
  /** The AI's read on an overlap, made when the policy was saved. */
  note: { verdict: "exception" | "contradiction"; text: string } | null;
};

/** A sentence the AI suggests adding to the policy. */
export type PolicyIdea = { sentence: string; why: string };

/** One time a version was made live again. */
export type PolicyRollback = {
  /** 1 for its first restore, then 2, 3… */
  order: number;
  /** The version that was live before the restore. */
  from_version: number;
  rolled_back_by: string;
  rolled_back_at: string;
};

export type PolicyHistoryEntry = {
  version: number;
  text: string;
  published_at: string;
  published_by: string;
  /** Every restore of this version, in order. */
  rollbacks: PolicyRollback[];
};

/** A store's own policy for one workflow, as the policy endpoints return it. */
export type WorkflowPolicy = {
  workflow: string;
  /** The workflow's name. */
  name: string;
  text: string;
  policy: Record<string, unknown> | null;
  policy_version: number;
  policy_published_at: string | null;
  /** Who published the live version; empty before the first save. */
  policy_published_by: string;
  /** The saved policy as a flowchart. */
  flow: PolicyFlow;
  /** What could be better in the saved policy. */
  suggestions: { findings: PolicyFinding[]; ideas: PolicyIdea[] };
  /** What the merchant should check about the current version. */
  review: {
    warnings: string[];
    // `limits`: the sentence would stop or route some requests, so until it
    // is reworded everything the policy would allow goes to the team.
    ambiguities: {
      source_text: string;
      question: string;
      options: string[];
      limits?: boolean;
    }[];
    unsupported: { source_text: string; why: string; limits?: boolean }[];
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
      toast.error("Couldn't load workflows.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't load workflows.");
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
      return response.data.data as {
        workflow: string;
        is_enabled: boolean;
        /** Linked workflows the backend switched in the same save. */
        also_changed: string[];
      };
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Couldn't update this workflow.", {
        description: data?.message || "Please try again later.",
      });
      return thunkAPI.rejectWithValue(data || "Couldn't update this workflow.");
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

export const DeleteWorkflowPolicyVersion = createAsyncThunk(
  "DeleteWorkflowPolicyVersion",
  async (
    {
      storeCode,
      workflow,
      version,
    }: { storeCode: string; workflow: string; version: number },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.delete(
        `${ENDPOINTS.workflowPolicyVersion()}?store_code=${storeCode}&workflow=${workflow}`,
        { data: { version }, useBackend: true },
      );
      return response.data.data as WorkflowPolicy;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      // The live version, or one already gone, says why under `version`.
      toast.error("Uh oh! Something went wrong.", {
        description:
          Object.values(serverFieldErrors(data))[0] ||
          data?.message ||
          "Unable to delete this version.",
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
    DeleteWorkflowPolicyVersionState: {
      // Version being deleted, so only its button waits.
      DeleteWorkflowPolicyVersionPendingVersion: null as null | number,
      DeleteWorkflowPolicyVersionIsError: null as null | string | object,
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
        const changed = [
          action.payload.workflow,
          ...action.payload.also_changed,
        ];
        for (const workflow of state.FetchStoreWorkflowsState
          .FetchStoreWorkflowsData) {
          if (changed.includes(workflow.code))
            workflow.is_enabled = action.payload.is_enabled;
        }
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
      .addCase(DeleteWorkflowPolicyVersion.pending, (state, action) => {
        state.DeleteWorkflowPolicyVersionState.DeleteWorkflowPolicyVersionPendingVersion =
          action.meta.arg.version;
        state.DeleteWorkflowPolicyVersionState.DeleteWorkflowPolicyVersionIsError =
          null;
      })
      .addCase(DeleteWorkflowPolicyVersion.fulfilled, (state, action) => {
        state.DeleteWorkflowPolicyVersionState.DeleteWorkflowPolicyVersionPendingVersion =
          null;
        // The same policy, one version fewer in its history.
        state.FetchWorkflowPolicyState.FetchWorkflowPolicyData = action.payload;
      })
      .addCase(DeleteWorkflowPolicyVersion.rejected, (state, action) => {
        state.DeleteWorkflowPolicyVersionState.DeleteWorkflowPolicyVersionPendingVersion =
          null;
        state.DeleteWorkflowPolicyVersionState.DeleteWorkflowPolicyVersionIsError =
          action.payload as string | object;
      })
      // Save and rollback both change the live version: show it, and keep the
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
