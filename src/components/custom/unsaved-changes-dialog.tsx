"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
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
  /**
   * For a page that saves its edits by itself (an editor with autosave).
   * Leaving with edits not yet saved first tries this; when it saves, the
   * page is left with no prompt, and the prompt only opens when it can't
   * (it resolves false). Without it the prompt always opens.
   */
  autoSave?: () => Promise<boolean>;
  /** For a way off the page that is not a link: a back button calling
   *  `router.push`, or a picker that reloads the form. */
  ref?: Ref<UnsavedChangesDialogHandle>;
};

/**
 * The one "Unsaved changes" prompt of the app. While the page is dirty, a
 * link to another page opens it (reloading or closing the tab gets the
 * browser's own prompt), and so does whatever the page routes through
 * `confirmLeave` (or, with `autoSave`, saves first and only asks when that
 * can't be done). Save Changes leaves once the save went through (if it
 * fails it closes the prompt and stays, so the error can be seen), Discard
 * Changes leaves as is, Cancel stays.
 */
export function UnsavedChangesDialog({
  isDirty,
  isSaving,
  onSave,
  autoSave,
  ref,
}: UnsavedChangesDialogProps) {
  const router = useRouter();
  // What the user tried to do with edits unsaved. Set = dialog open.
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);

  // Set while `autoSave` runs, so a second click doesn't leave twice.
  const isAutoSaving = useRef(false);

  const requestLeave = (leave: () => void) => {
    if (!isDirty) {
      leave();
      return;
    }
    // A state setter given a function calls it, so the action is wrapped.
    const askFirst = () => setPendingLeave(() => leave);
    if (!autoSave) {
      askFirst();
      return;
    }
    if (isAutoSaving.current) return;
    isAutoSaving.current = true;
    void autoSave()
      .then((saved) => (saved ? leave() : askFirst()))
      .catch(askFirst)
      .finally(() => {
        isAutoSaving.current = false;
      });
  };

  useImperativeHandle(ref, () => ({ confirmLeave: requestLeave }));
  useUnsavedChangesGuard(isDirty, (href) =>
    requestLeave(() => router.push(href)),
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
    // A failed save closes the dialog and stays on the page, so the error
    // (shown on the page or as a toast) is in view rather than behind it.
    if (save && !(await onSave())) {
      setPendingLeave(null);
      return;
    }
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
