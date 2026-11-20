"use client";

import { useEffect, useImperativeHandle, useState, type Ref } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { IconDeviceFloppy } from "@tabler/icons-react";

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
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";

export type UnsavedChangesDialogHandle = {
  /** Runs `leave` now, or once the user has saved or discarded the edits. */
  confirmLeave: (leave: () => void) => void;
};

type UnsavedChangesDialogProps = {
  /** The page has edits that are not saved yet. */
  isDirty: boolean;
  isSaving: boolean;
  /** Saves the edits; resolves true only once they are saved. */
  onSave: () => Promise<boolean>;
  /** For a way off the page that is not a link: a back button calling
   *  `router.push`, or a picker that reloads the form. */
  ref?: Ref<UnsavedChangesDialogHandle>;
};

/**
 * The one "Unsaved changes" prompt of the app. While the page is dirty, a
 * link to another page opens it (reloading or closing the tab gets the
 * browser's own prompt), and so does whatever the page routes through
 * `confirmLeave`. Save Changes leaves once the save went through, Discard
 * Changes leaves as is, Cancel stays.
 */
export function UnsavedChangesDialog({
  isDirty,
  isSaving,
  onSave,
  ref,
}: UnsavedChangesDialogProps) {
  const router = useRouter();
  // What the user tried to do with edits unsaved. Set = dialog open.
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);

  // A state setter given a function calls it, so the action is wrapped.
  useImperativeHandle(ref, () => ({
    confirmLeave: (leave) => {
      if (isDirty) setPendingLeave(() => leave);
      else leave();
    },
  }));
  useUnsavedChangesGuard(isDirty, (href) =>
    setPendingLeave(() => () => router.push(href)),
  );

  // Closing or reloading the tab while this is open hands over to the
  // browser's own "Leave site?" prompt, so the two never show together.
  useEffect(() => {
    if (pendingLeave === null) return;
    const close = () => flushSync(() => setPendingLeave(null));
    window.addEventListener("beforeunload", close);
    return () => window.removeEventListener("beforeunload", close);
  }, [pendingLeave]);

  /** Runs the blocked leave, after saving first when asked to. */
  const leave = async (save: boolean) => {
    // A failed save keeps the dialog open; the page already said why.
    if (save && !(await onSave())) return;
    pendingLeave?.();
    setPendingLeave(null);
  };

  return (
    <AlertDialog
      open={pendingLeave !== null}
      onOpenChange={(open) => {
        if (!open && !isSaving) setPendingLeave(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Do you want to save your changes before
            leaving?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="outline"
            disabled={isSaving}
            onClick={(event) => {
              event.preventDefault();
              void leave(false);
            }}
          >
            Discard Changes
          </AlertDialogAction>
          <AlertDialogAction
            disabled={isSaving}
            onClick={(event) => {
              // Stays open until the save is through.
              event.preventDefault();
              void leave(true);
            }}
          >
            {isSaving ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <IconDeviceFloppy data-icon="inline-start" />
            )}
            Save Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
