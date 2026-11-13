"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import type { AIScope } from "@/redux/api-slice/knowledge-rag-slice";
import { AI_SCOPE_OPTIONS } from "@/components/custom/knowledge/knowledge-meta";

/**
 * "Change assistants" for the selected knowledge items: a button that opens a
 * small panel to pick which AI use them. The choice replaces each item's
 * current assistants, so it starts empty and needs at least one.
 */
export function BulkAssistantsPopover({
  count,
  onApply,
}: {
  /** How many items are selected. */
  count: number;
  /** Apply the choice; resolves `true` when it was saved, which closes the panel. */
  onApply: (aiScope: AIScope[]) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<AIScope[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const apply = async () => {
    setIsSaving(true);
    const saved = await onApply(chosen);
    setIsSaving(false);
    if (saved) setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (isSaving) return;
        // Each time it opens it starts empty again.
        if (next) setChosen([]);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Change assistants
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 gap-3">
        <p className="text-xs text-muted-foreground">
          Replace the assistants on {count} selected{" "}
          {count === 1 ? "item" : "items"}
        </p>
        <fieldset className="flex flex-col gap-2.5">
          <legend className="sr-only">Assistants</legend>
          {AI_SCOPE_OPTIONS.map(({ value, label }) => (
            <Label key={value} className="gap-2.5 font-normal">
              <Checkbox
                checked={chosen.includes(value)}
                onCheckedChange={(checked) =>
                  setChosen((previous) =>
                    checked === true
                      ? [...previous, value]
                      : previous.filter((entry) => entry !== value),
                  )
                }
              />
              {label}
            </Label>
          ))}
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSaving}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={chosen.length === 0 || isSaving}
            onClick={() => void apply()}
          >
            {isSaving && <Spinner data-icon="inline-start" />}
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
