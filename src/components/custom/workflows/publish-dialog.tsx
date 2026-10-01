"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { PROMPT_LIMITS } from "@/lib/workflows";

/** Confirms a publish, lists what changes, and takes a note for history. */
export function PublishDialog({
  open,
  onOpenChange,
  workflowName,
  storeName,
  changes,
  isPublishing,
  onPublish,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowName: string;
  storeName: string;
  changes: string[];
  isPublishing: boolean;
  onPublish: (note: string) => void;
}) {
  const [note, setNote] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setNote("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish {workflowName}?</DialogTitle>
          <DialogDescription>
            New chats on {storeName} use this version straight away. Other
            stores are not affected.
          </DialogDescription>
        </DialogHeader>

        {changes.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Changed
            </span>
            <ul className="ml-4 flex list-disc flex-col gap-1 text-sm">
              {changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </div>
        )}

        <Field className="gap-1.5">
          <FieldLabel htmlFor="publish-note">
            Note for version history
          </FieldLabel>
          <Input
            id="publish-note"
            value={note}
            maxLength={PROMPT_LIMITS.versionNote}
            placeholder="What changed and why"
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={isPublishing}
            onClick={() => onPublish(note.trim())}
          >
            {isPublishing && <Spinner />}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
