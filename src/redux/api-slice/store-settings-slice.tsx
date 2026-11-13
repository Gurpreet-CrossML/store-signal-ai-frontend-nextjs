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

/**
 * What a suggestion is: two rules disagree, a rule (or built-in step) never
 * applies, a sentence is too vague to use, or some requests aren't covered.
 */
export type PolicySuggestionKind =
  | "contradiction"
  | "never_applies"
  | "unclear"
  | "missing";

/**
 * A line of the saved policy text, numbered as "Rule N" counts. Its place
 * is in JavaScript string units, so `text.slice(start_index, end_index)`
 * is the line's words in the saved Markdown.
 */
export type PolicySuggestionLine = {
  rule: number;
  start_index: number;
  end_index: number;
  /** The line's words, without Markdown marks. */
  text: string;
};

/**
 * A fix the AI is known to understand: `insert` goes in place of the saved
 * text between `start_index` and `end_index` (the same place for an add).
 */
export type PolicySuggestionFix = {
  action: "replace" | "add";
  /** The rule it changes, or the number it is added as. */
  rule: number;
  /** The sentence, to show. */
  text: string;
  start_index: number;
  end_index: number;
  insert: string;
};

/** One thing the policy check found when the policy was saved, with where it is. */
export type PolicySuggestion = {
  key: string;
  type: PolicySuggestionKind;
  /** flow: found by checking the policy; knowledge: by comparing it with the store's Knowledge. */
  source: "flow" | "knowledge";
  name: string;
  /** What is wrong. */
  description: string;
  /** What the merchant can do about it. */
  explanation: string;
  /** The merchant's lines it is about. */
  lines: PolicySuggestionLine[];
  /** The steps of "What the AI will do" it is about. */
  steps: { step: number; text: string; effect: PolicyEffect }[];
  /** The store's Knowledge it is based on. */
  quote: { source: string; text: string } | null;
  fix: PolicySuggestionFix | null;
};

/** One change to the workflow, for the Activity tab. */
export type PolicyActivity = {
  id: number;
  kind:
    | "status_changed"
    | "policy_added"
    | "policy_updated"
    | "policy_removed"
    | "policy_restored"
    | "version_deleted";
  /** `on` / `off`, a version as `v<n>`, or `default` for the default rules. */
  from_value: string;
  /** The same way; empty for a deleted version. */
  to_value: string;
  /** Empty when the system did it. */
  done_by: string;
  /** `with`: the workflow whose switch changed this one too. */
  metadata: { with?: string };
  created_at: string;
};

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
  /** The number the next save gets (numbers are never reused). */
  next_version: number;
  /** The saved policy as a flowchart. */
  flow: PolicyFlow;
  /**
   * The live policy's check, made when it was saved, less what was
   * dismissed; `checked_at` is null when that check didn't finish.
   */
  suggestions: {
    checked_at: string | null;
    items: PolicySuggestion[];
    dismissed: number;
  };
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
};

/** One page of a list endpoint. */
type Page<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

/**
 * The pages of a list loaded so far, for the store and workflow they
 * belong to (`owner`, "store:workflow"), so another one's never shows.
 */
export type PagedList<T> = {
  owner: string;
  items: T[];
  count: number;
  page: number;
  hasMore: boolean;
};

const EMPTY_LIST = { owner: "", items: [], count: 0, page: 0, hasMore: false };

type PageArg = { storeCode: string; workflow: string; page: number };

/**
 * Put a fetched page into its list: page 1 starts the list again, a later
 * page adds what isn't there yet (a refresh may have moved items along),
 * and a page for a list no longer shown is dropped.
 */
function takePage<T>(
  list: PagedList<T>,
  arg: PageArg,
  data: Page<T>,
  key: (item: T) => number,
): PagedList<T> {
  const owner = `${arg.storeCode}:${arg.workflow}`;
  if (arg.page > 1 && owner !== list.owner) return list;
  const known = new Set(arg.page > 1 ? list.items.map(key) : []);
  return {
    owner,
    items: [
      ...(arg.page > 1 ? list.items : []),
      ...data.results.filter((item) => !known.has(key(item))),
    ],
    count: data.count,
    page: arg.page,
    hasMore: data.next !== null,
  };
}

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
      // Out of credits (429) names no field either, though its envelope
      // carries a `type` key that reads like one.
      if (
        response?.status === 429 ||
        !Object.keys(serverFieldErrors(data)).length
      ) {
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

export const CheckWorkflowPolicy = createAsyncThunk(
  "CheckWorkflowPolicy",
  async (
    { storeCode, workflow }: { storeCode: string; workflow: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.workflowPolicyCheck()}?store_code=${storeCode}&workflow=${workflow}`,
        {},
        { useBackend: true },
      );
      return response.data.data as WorkflowPolicy;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to check this policy.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const DismissPolicySuggestion = createAsyncThunk(
  "DismissPolicySuggestion",
  async (
    {
      storeCode,
      workflow,
      key,
    }: { storeCode: string; workflow: string; key: string },
    thunkAPI,
  ) => {
    try {
      const response = await axiosInstance.post(
        `${ENDPOINTS.workflowPolicyDismiss()}?store_code=${storeCode}&workflow=${workflow}`,
        { key },
        { useBackend: true },
      );
      return response.data.data as WorkflowPolicy;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description:
          Object.values(serverFieldErrors(data))[0] ||
          data?.message ||
          "Unable to dismiss this suggestion.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const FetchPolicyVersions = createAsyncThunk(
  "FetchPolicyVersions",
  async ({ storeCode, workflow, page }: PageArg, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.workflowPolicyVersions()}?store_code=${storeCode}&workflow=${workflow}&page=${page}`,
        { useBackend: true },
      );
      return response.data.data as Page<PolicyHistoryEntry>;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to load the versions.",
      });
      return thunkAPI.rejectWithValue(data || "Something went wrong");
    }
  },
);

export const FetchWorkflowActivity = createAsyncThunk(
  "FetchWorkflowActivity",
  async ({ storeCode, workflow, page }: PageArg, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.workflowActivity()}?store_code=${storeCode}&workflow=${workflow}&page=${page}`,
        { useBackend: true },
      );
      return response.data.data as Page<PolicyActivity>;
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const data = response?.data;
      toast.error("Uh oh! Something went wrong.", {
        description: data?.message || "Unable to load the activity.",
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
    CheckWorkflowPolicyState: {
      // Workflow being checked, so a check of another one never shows here.
      CheckWorkflowPolicyPendingWorkflow: null as null | string,
      CheckWorkflowPolicyIsError: null as null | string | object,
    },
    DismissPolicySuggestionState: {
      // Suggestion being dismissed, so only its button waits.
      DismissPolicySuggestionPendingKey: null as null | string,
    },
    FetchPolicyVersionsState: {
      FetchPolicyVersionsIsLoading: false,
      FetchPolicyVersionsIsError: null as null | string | object,
      FetchPolicyVersionsData: EMPTY_LIST as PagedList<PolicyHistoryEntry>,
    },
    FetchWorkflowActivityState: {
      FetchWorkflowActivityIsLoading: false,
      FetchWorkflowActivityIsError: null as null | string | object,
      FetchWorkflowActivityData: EMPTY_LIST as PagedList<PolicyActivity>,
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
        // The same policy; the page refetches its versions.
        state.FetchWorkflowPolicyState.FetchWorkflowPolicyData = action.payload;
      })
      .addCase(DeleteWorkflowPolicyVersion.rejected, (state, action) => {
        state.DeleteWorkflowPolicyVersionState.DeleteWorkflowPolicyVersionPendingVersion =
          null;
        state.DeleteWorkflowPolicyVersionState.DeleteWorkflowPolicyVersionIsError =
          action.payload as string | object;
      })
      .addCase(CheckWorkflowPolicy.pending, (state, action) => {
        state.CheckWorkflowPolicyState.CheckWorkflowPolicyPendingWorkflow =
          action.meta.arg.workflow;
        state.CheckWorkflowPolicyState.CheckWorkflowPolicyIsError = null;
      })
      .addCase(CheckWorkflowPolicy.fulfilled, (state) => {
        state.CheckWorkflowPolicyState.CheckWorkflowPolicyPendingWorkflow =
          null;
      })
      .addCase(CheckWorkflowPolicy.rejected, (state, action) => {
        state.CheckWorkflowPolicyState.CheckWorkflowPolicyPendingWorkflow =
          null;
        state.CheckWorkflowPolicyState.CheckWorkflowPolicyIsError =
          action.payload as string | object;
      })
      .addCase(DismissPolicySuggestion.pending, (state, action) => {
        state.DismissPolicySuggestionState.DismissPolicySuggestionPendingKey =
          action.meta.arg.key;
      })
      .addCase(DismissPolicySuggestion.fulfilled, (state) => {
        state.DismissPolicySuggestionState.DismissPolicySuggestionPendingKey =
          null;
      })
      .addCase(DismissPolicySuggestion.rejected, (state) => {
        state.DismissPolicySuggestionState.DismissPolicySuggestionPendingKey =
          null;
      })
      .addCase(FetchPolicyVersions.pending, (state) => {
        state.FetchPolicyVersionsState.FetchPolicyVersionsIsLoading = true;
        state.FetchPolicyVersionsState.FetchPolicyVersionsIsError = null;
      })
      .addCase(FetchPolicyVersions.fulfilled, (state, action) => {
        state.FetchPolicyVersionsState.FetchPolicyVersionsIsLoading = false;
        state.FetchPolicyVersionsState.FetchPolicyVersionsData = takePage(
          state.FetchPolicyVersionsState.FetchPolicyVersionsData,
          action.meta.arg,
          action.payload,
          (entry) => entry.version,
        );
      })
      .addCase(FetchPolicyVersions.rejected, (state, action) => {
        state.FetchPolicyVersionsState.FetchPolicyVersionsIsLoading = false;
        state.FetchPolicyVersionsState.FetchPolicyVersionsIsError =
          action.payload as string | object;
      })
      .addCase(FetchWorkflowActivity.pending, (state) => {
        state.FetchWorkflowActivityState.FetchWorkflowActivityIsLoading = true;
        state.FetchWorkflowActivityState.FetchWorkflowActivityIsError = null;
      })
      .addCase(FetchWorkflowActivity.fulfilled, (state, action) => {
        state.FetchWorkflowActivityState.FetchWorkflowActivityIsLoading = false;
        state.FetchWorkflowActivityState.FetchWorkflowActivityData = takePage(
          state.FetchWorkflowActivityState.FetchWorkflowActivityData,
          action.meta.arg,
          action.payload,
          (entry) => entry.id,
        );
      })
      .addCase(FetchWorkflowActivity.rejected, (state, action) => {
        state.FetchWorkflowActivityState.FetchWorkflowActivityIsLoading = false;
        state.FetchWorkflowActivityState.FetchWorkflowActivityIsError =
          action.payload as string | object;
      })
      // A check or a dismissal comes back with the policy; show it unless
      // the page has moved on to another workflow meanwhile.
      .addMatcher(
        isAnyOf(
          CheckWorkflowPolicy.fulfilled,
          DismissPolicySuggestion.fulfilled,
        ),
        (state, action) => {
          const shown = state.FetchWorkflowPolicyState.FetchWorkflowPolicyData;
          if (shown?.workflow === action.payload.workflow)
            state.FetchWorkflowPolicyState.FetchWorkflowPolicyData =
              action.payload;
        },
      )
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
