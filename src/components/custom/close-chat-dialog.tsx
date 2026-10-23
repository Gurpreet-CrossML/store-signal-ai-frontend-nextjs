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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Typography } from "@/components/ui/typography";
import {
  THREAD_CLOSE_REASONS,
  type ThreadCloseReason,
} from "@/lib/thread-options";

type CloseChatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: ThreadCloseReason) => void;
};

/** Asks the agent why they are closing the chat, then hands the reason back. */
export function CloseChatDialog({
  open,
  onOpenChange,
  onConfirm,
}: CloseChatDialogProps) {
  const [reason, setReason] = useState<ThreadCloseReason | "">("");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Close chat</DialogTitle>
          <DialogDescription>
            The customer is asked for optional feedback first. The chat closes
            with this reason once they submit it. If they skip, it stays open
            and goes back to the AI.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          value={reason}
          onValueChange={(value) => setReason(value as ThreadCloseReason)}
        >
          {THREAD_CLOSE_REASONS.map((option) => (
            <div
              key={option.value}
              className="flex items-start gap-3 cursor-pointer"
            >
              <RadioGroupItem
                id={`close-reason-${option.value}`}
                value={option.value}
                className="mt-1"
              />
              <Label
                htmlFor={`close-reason-${option.value}`}
                className="flex flex-col items-start gap-0.5 cursor-pointer"
              >
                {option.label}
                <Typography variant="muted" as="span">
                  {option.description}
                </Typography>
              </Label>
            </div>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!reason) return;
              onConfirm(reason);
              setReason("");
            }}
            disabled={!reason}
          >
            Request feedback & close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
