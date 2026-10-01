import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError, type AxiosResponse } from "axios";
import { toast } from "sonner";

import { ENDPOINTS } from "@/lib/config";
import type {
  WorkflowDetailData,
  WorkflowSummary,
  PromptOverride,
  ToolCatalog,
} from "@/lib/workflows";
import { axiosInstance } from "@/redux/axios-config";

// Settings → Workflows. Every endpoint lives in Django (the YAML prompts are
// there), so reads pass `useBackend: true`; writes go to Django by the
// axios-config default. Every write returns the updated workflow.

type WorkflowArgs = { storeCode: string; workflowId: string };

function errorMessage(error: unknown, fallback: string): string {
  const data = isAxiosError(error) ? error.response?.data : undefined;
  return data?.message || fallback;
}

/**
 * One request as a thunk: unwraps `data`, toasts the server's message on a
 * write, and turns a failure into a toast plus a rejection — the same for
 * every endpoint here, so it is written once.
 */
function requestThunk<Result, Args>(
  type: string,
  request: (args: Args) => Promise<AxiosResponse>,
  failure: string,
  { toastSuccess = true }: { toastSuccess?: boolean } = {},
) {
  return createAsyncThunk<Result, Args, { rejectValue: string }>(
    type,
    async (args, { rejectWithValue }) => {
      try {
        const response = await request(args);
        if (toastSuccess) toast.success(response.data.message);
        return response.data.data as Result;
      } catch (error) {
        const description = errorMessage(error, failure);
        toast.error("Uh oh! Something went wrong.", { description });
        return rejectWithValue(description);
      }
    },
  );
}

const params = (storeCode: string) => ({ store_code: storeCode });

export const FetchWorkflows = requestThunk<WorkflowSummary[], string>(
  "FetchWorkflows",
  (storeCode) =>
    axiosInstance.get(ENDPOINTS.workflows(), {
      params: params(storeCode),
      useBackend: true,
    }),
  "Unable to fetch workflows, please try again later.",
  { toastSuccess: false },
);

export const FetchWorkflowTools = requestThunk<ToolCatalog, string>(
  "FetchWorkflowTools",
  (storeCode) =>
    axiosInstance.get(ENDPOINTS.workflowTools(), {
      params: params(storeCode),
      useBackend: true,
    }),
  "Unable to fetch tools, please try again later.",
  { toastSuccess: false },
);

export const FetchWorkflow = requestThunk<WorkflowDetailData, WorkflowArgs>(
  "FetchWorkflow",
  ({ storeCode, workflowId }) =>
    axiosInstance.get(ENDPOINTS.workflow(workflowId), {
      params: params(storeCode),
      useBackend: true,
    }),
  "Unable to fetch this workflow, please try again later.",
  { toastSuccess: false },
);

export const SaveWorkflowDraft = requestThunk<
  WorkflowDetailData,
  WorkflowArgs & { draft: PromptOverride }
>(
  "SaveWorkflowDraft",
  ({ storeCode, workflowId, draft }) =>
    axiosInstance.put(
      ENDPOINTS.workflowDraft(workflowId),
      { draft },
      { params: params(storeCode) },
    ),
  "Unable to save your changes, please try again later.",
);

export const DiscardWorkflowDraft = requestThunk<
  WorkflowDetailData,
  WorkflowArgs
>(
  "DiscardWorkflowDraft",
  ({ storeCode, workflowId }) =>
    axiosInstance.delete(ENDPOINTS.workflowDraft(workflowId), {
      params: params(storeCode),
    }),
  "Unable to discard the draft, please try again later.",
);

export const PublishWorkflow = requestThunk<
  WorkflowDetailData,
  WorkflowArgs & { note: string }
>(
  "PublishWorkflow",
  ({ storeCode, workflowId, note }) =>
    axiosInstance.post(
      ENDPOINTS.workflowPublish(workflowId),
      { note },
      { params: params(storeCode) },
    ),
  "Unable to publish, please try again later.",
);

export const ToggleWorkflow = requestThunk<
  WorkflowDetailData,
  WorkflowArgs & { isEnabled: boolean }
>(
  "ToggleWorkflow",
  ({ storeCode, workflowId, isEnabled }) =>
    axiosInstance.put(
      ENDPOINTS.workflowEnabled(workflowId),
      { is_enabled: isEnabled },
      { params: params(storeCode) },
    ),
  "Unable to change this workflow, please try again later.",
);

export const RestoreWorkflowVersion = requestThunk<
  WorkflowDetailData,
  WorkflowArgs & { version: number | "default" }
>(
  "RestoreWorkflowVersion",
  ({ storeCode, workflowId, version }) =>
    axiosInstance.post(
      ENDPOINTS.workflowRestore(workflowId),
      { version },
      { params: params(storeCode) },
    ),
  "Unable to restore this version, please try again later.",
);

// --- Slice ----------------------------------------------------------------

/** Keeps the list in step with a workflow that just changed. */
function patchSummary(list: WorkflowSummary[], detail: WorkflowDetailData) {
  const index = list.findIndex((w) => w.workflow_id === detail.workflow_id);
  if (index === -1) return;
  // Refresh every field the list row has from the updated workflow, so a
  // field added to the summary can't be forgotten here.
  const row = list[index];
  list[index] = Object.fromEntries(
    Object.keys(row).map((key) => [key, detail[key as keyof WorkflowSummary]]),
  ) as WorkflowSummary;
}

const mutationState = () => ({
  IsLoading: false,
  IsSuccess: false,
  IsError: null as null | string | object,
});

const WorkflowsSlice = createSlice({
  name: "Workflows",
  initialState: {
    FetchWorkflowsState: {
      FetchWorkflowsIsLoading: false,
      FetchWorkflowsIsSuccess: false,
      FetchWorkflowsIsError: null as null | string | object,
      FetchWorkflowsListData: [] as WorkflowSummary[],
    },
    FetchWorkflowState: {
      FetchWorkflowIsLoading: false,
      FetchWorkflowIsSuccess: false,
      FetchWorkflowIsError: null as null | string | object,
      FetchWorkflowData: null as WorkflowDetailData | null,
    },
    FetchWorkflowToolsState: {
      FetchWorkflowToolsIsLoading: false,
      FetchWorkflowToolsIsSuccess: false,
      FetchWorkflowToolsIsError: null as null | string | object,
      FetchWorkflowToolsData: null as ToolCatalog | null,
    },
    // One state per write, so a pending publish doesn't disable the switch.
    SaveWorkflowDraftState: mutationState(),
    DiscardWorkflowDraftState: mutationState(),
    PublishWorkflowState: mutationState(),
    ToggleWorkflowState: mutationState(),
    RestoreWorkflowVersionState: mutationState(),
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FetchWorkflows
      .addCase(FetchWorkflows.pending, (state) => {
        state.FetchWorkflowsState.FetchWorkflowsIsLoading = true;
        state.FetchWorkflowsState.FetchWorkflowsIsSuccess = false;
        state.FetchWorkflowsState.FetchWorkflowsIsError = null;
      })
      .addCase(FetchWorkflows.fulfilled, (state, action) => {
        state.FetchWorkflowsState.FetchWorkflowsIsLoading = false;
        state.FetchWorkflowsState.FetchWorkflowsIsSuccess = true;
        state.FetchWorkflowsState.FetchWorkflowsListData = action.payload;
      })
      .addCase(FetchWorkflows.rejected, (state) => {
        state.FetchWorkflowsState.FetchWorkflowsIsLoading = false;
        state.FetchWorkflowsState.FetchWorkflowsIsError =
          "Something went wrong";
      })
      // FetchWorkflowTools
      .addCase(FetchWorkflowTools.pending, (state) => {
        state.FetchWorkflowToolsState.FetchWorkflowToolsIsLoading = true;
        state.FetchWorkflowToolsState.FetchWorkflowToolsIsSuccess = false;
        state.FetchWorkflowToolsState.FetchWorkflowToolsIsError = null;
      })
      .addCase(FetchWorkflowTools.fulfilled, (state, action) => {
        state.FetchWorkflowToolsState.FetchWorkflowToolsIsLoading = false;
        state.FetchWorkflowToolsState.FetchWorkflowToolsIsSuccess = true;
        state.FetchWorkflowToolsState.FetchWorkflowToolsData = action.payload;
      })
      .addCase(FetchWorkflowTools.rejected, (state) => {
        state.FetchWorkflowToolsState.FetchWorkflowToolsIsLoading = false;
        state.FetchWorkflowToolsState.FetchWorkflowToolsIsError =
          "Something went wrong";
      })
      // FetchWorkflow
      .addCase(FetchWorkflow.pending, (state) => {
        state.FetchWorkflowState.FetchWorkflowIsLoading = true;
        state.FetchWorkflowState.FetchWorkflowIsSuccess = false;
        state.FetchWorkflowState.FetchWorkflowIsError = null;
      })
      .addCase(FetchWorkflow.fulfilled, (state, action) => {
        state.FetchWorkflowState.FetchWorkflowIsLoading = false;
        state.FetchWorkflowState.FetchWorkflowIsSuccess = true;
        state.FetchWorkflowState.FetchWorkflowData = action.payload;
      })
      .addCase(FetchWorkflow.rejected, (state) => {
        state.FetchWorkflowState.FetchWorkflowIsLoading = false;
        state.FetchWorkflowState.FetchWorkflowIsError = "Something went wrong";
      });

    // Every write returns the updated workflow: it replaces the open one
    // and refreshes its row in the list.
    const writes = [
      [SaveWorkflowDraft, "SaveWorkflowDraftState"],
      [DiscardWorkflowDraft, "DiscardWorkflowDraftState"],
      [PublishWorkflow, "PublishWorkflowState"],
      [ToggleWorkflow, "ToggleWorkflowState"],
      [RestoreWorkflowVersion, "RestoreWorkflowVersionState"],
    ] as const;

    for (const [thunk, key] of writes) {
      builder
        .addCase(thunk.pending, (state) => {
          state[key].IsLoading = true;
          state[key].IsSuccess = false;
          state[key].IsError = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state[key].IsLoading = false;
          state[key].IsSuccess = true;
          state.FetchWorkflowState.FetchWorkflowData = action.payload;
          patchSummary(
            state.FetchWorkflowsState.FetchWorkflowsListData,
            action.payload,
          );
        })
        .addCase(thunk.rejected, (state) => {
          state[key].IsLoading = false;
          state[key].IsError = "Something went wrong";
        });
    }
  },
});

export default WorkflowsSlice.reducer;
