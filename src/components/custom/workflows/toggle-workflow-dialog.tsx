"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

/** A workflow switch waiting for confirmation. */
export type PendingToggle = {
  workflowId: string;
  name: string;
  isEnabled: boolean;
};

/**
 * Confirms turning a workflow on or off before it happens — the change
 * affects live chats straight away, so a stray click on a switch shouldn't
 * be enough.
 */
export function ToggleWorkflowDialog({
  pending,
  isSaving,
  onConfirm,
  onCancel,
}: {
  pending: PendingToggle | null;
  isSaving: boolean;
  onConfirm: (pending: PendingToggle) => void;
  onCancel: () => void;
}) {
  const turningOn = pending?.isEnabled ?? false;

  return (
    <AlertDialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open && !isSaving) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Turn {turningOn ? "on" : "off"} {pending?.name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {turningOn
              ? "The assistant starts using this workflow for matching customer messages straight away."
              : "Customer messages that match this workflow will go to the FAQ workflow instead, starting straight away. Your prompt changes are kept, and you can turn it back on at any time."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={turningOn ? "default" : "destructive"}
            disabled={isSaving}
            onClick={(event) => {
              // Stay open until the change is saved, so a failure is seen.
              event.preventDefault();
              if (pending) onConfirm(pending);
            }}
          >
            {isSaving && <Spinner />}
            Turn {turningOn ? "on" : "off"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
