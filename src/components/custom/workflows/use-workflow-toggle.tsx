"use client";

import { useState } from "react";

import {
  ToggleWorkflowDialog,
  type PendingToggle,
} from "./toggle-workflow-dialog";
import { ToggleWorkflow } from "@/redux/api-slice/workflows-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/**
 * Turning a workflow on or off, behind a confirmation. A switch calls
 * `requestToggle`; nothing changes until the dialog (render `dialog`) is
 * confirmed. Shared by the Workflows cards and the workflow page.
 */
export function useWorkflowToggle() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const [pending, setPending] = useState<PendingToggle | null>(null);
  // Only the workflow being switched waits; other switches stay usable.
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const confirm = async ({ workflowId, isEnabled }: PendingToggle) => {
    if (!storeCode) return;
    setTogglingId(workflowId);
    const result = await dispatch(
      ToggleWorkflow({ storeCode, workflowId, isEnabled }),
    );
    setTogglingId(null);
    // On failure the dialog stays open, so the error is seen in context.
    if (ToggleWorkflow.fulfilled.match(result)) setPending(null);
  };

  return {
    requestToggle: setPending,
    togglingId,
    dialog: (
      <ToggleWorkflowDialog
        pending={pending}
        isSaving={togglingId !== null}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    ),
  };
}
