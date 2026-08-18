"use client";

import { useState } from "react";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { capitalizeText } from "@/lib/helpers";

/**
 * Show the first few of a list, with the rest behind a toggle.
 *
 * The detail panel stacks several of these cards, and a customer with
 * thirty orders pushed everything below them off the screen. Collapsing
 * keeps each card's height predictable, so the panel stays scannable
 * however much history a customer has.
 *
 * Returns the slice to render rather than rendering it, because the cards
 * that use this draw their rows very differently.
 */
export function useCollapsibleList<T>(items: T[], previewCount = 2) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? items : items.slice(0, previewCount);
  const hiddenCount = Math.max(items.length - previewCount, 0);

  return {
    visible,
    hiddenCount,
    expanded,
    toggle: () => setExpanded((current) => !current),
  };
}

/** The toggle itself, so every collapsed list opens the same way. */
export function ShowMoreToggle({
  hiddenCount,
  expanded,
  onToggle,
  noun,
  nounPlural = `${noun}s`,
}: {
  hiddenCount: number;
  expanded: boolean;
  onToggle: () => void;
  /** What is hidden, for the label: "3 more orders". */
  noun: string;
  nounPlural?: string;
}) {
  if (hiddenCount <= 0) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="w-full text-muted-foreground hover:text-foreground"
    >
      {expanded ? (
        <>
          <IconChevronUp className="size-4" />
          Show Less
        </>
      ) : (
        <>
          <IconChevronDown className="size-4" />
          {/* Title case like every other button, so the two states of this
              one toggle do not read as two different styles. */}
          Show {hiddenCount} More{" "}
          {capitalizeText(hiddenCount === 1 ? noun : nounPlural)}
        </>
      )}
    </Button>
  );
}
