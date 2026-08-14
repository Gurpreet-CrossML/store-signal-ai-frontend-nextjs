"use client";

import { useState } from "react";
import { IconX } from "@tabler/icons-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * A list of values entered as chips: type, press Enter, get a chip.
 *
 * The optional hooks are what let one component serve both a free-text list
 * (banned words, preferred phrasing) and a validated one (allowed IPs)
 * without a second copy of the markup:
 *
 * - `validate` rejects a value and says why.
 * - `normalize` supplies the key duplicates are compared on, so entries
 *   that differ only in case or spacing still count as the same.
 * - `splitPattern` turns one paste into several chips.
 */
export function ChipList({
  items,
  placeholder,
  onAdd,
  onRemove,
  chipClassName = "bg-muted text-foreground",
  disabled = false,
  validate,
  normalize = (value) => value.trim(),
  splitPattern,
  duplicateMessage = (value) => `${value} is already on the list.`,
}: {
  items: string[];
  placeholder: string;
  /** Receives every accepted value; several at once when pasting a list. */
  onAdd: (values: string[]) => void;
  onRemove: (index: number) => void;
  chipClassName?: string;
  disabled?: boolean;
  /** Return a reason to reject, or null to accept. */
  validate?: (value: string) => string | null;
  normalize?: (value: string) => string;
  splitPattern?: RegExp;
  duplicateMessage?: (value: string) => string;
}) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const candidates = splitPattern
      ? raw
          .split(splitPattern)
          .map((part) => part.trim())
          .filter(Boolean)
      : [raw.trim()].filter(Boolean);
    if (!candidates.length) return;

    const seen = new Set(items.map(normalize));
    const accepted: string[] = [];

    for (const candidate of candidates) {
      const problem = validate?.(candidate);
      if (problem) {
        toast.error("Can't add that", { description: problem });
        continue;
      }
      const key = normalize(candidate);
      if (seen.has(key)) {
        toast.error("Already added", {
          description: duplicateMessage(candidate),
        });
        continue;
      }
      seen.add(key);
      accepted.push(candidate);
    }

    if (accepted.length) onAdd(accepted);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-3">
      <Input
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(draft);
          }
          // Backspace on an empty box drops the last chip, as chip inputs do.
          if (event.key === "Backspace" && !draft && items.length) {
            onRemove(items.length - 1);
          }
        }}
        // Commit on blur so a typed value isn't lost by clicking Save.
        onBlur={() => commit(draft)}
        placeholder={placeholder}
      />
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                chipClassName,
              )}
            >
              {item}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onRemove(index)}
                aria-label={`Remove ${item}`}
                className="ml-0.5 opacity-60 hover:opacity-100 disabled:opacity-30"
              >
                <IconX className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
