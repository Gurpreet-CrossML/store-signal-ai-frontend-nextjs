"use client";

import { useState } from "react";
import { IconEye } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * A floating "Preview" button that opens the live preview in a modal, for
 * screens too narrow to dock it beside the form (below `lg`).
 *
 * The preview is passed as children, so the modal shows exactly what the
 * docked pane shows and keeps updating from the same unsaved form values.
 * Children mount only while the modal is open.
 */
export function PreviewModalButton({
  title = "Preview",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="desktop:hidden">
      <Button
        type="button"
        size="lg"
        className="fixed right-6 bottom-6 z-30 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
      >
        <IconEye data-icon="inline-start" />
        Preview
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90svh] gap-0 overflow-y-auto p-3 sm:max-w-md">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Updates as you edit. Nothing is saved until you save your changes.
          </DialogDescription>
          {children}
        </DialogContent>
      </Dialog>
    </div>
  );
}
