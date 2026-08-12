"use client";

import { useEffect, useRef, useState } from "react";

import { typographyVariants } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

// Clamps text with an FB-style "See more"/"See less" toggle; the toggle only
// renders when the text actually overflows the clamp.
//
// The clamp classes are spelled out rather than interpolated so Tailwind's
// scanner can see them.
const CLAMP_CLASS: Record<number, string> = {
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
};

export function ExpandableText({
  text,
  className = "",
  textClassName,
  lines = 2,
  maxHeightClass,
}: {
  text: string;
  className?: string;
  // Extra classes for the body text — colour/emphasis, not size.
  textClassName?: string;
  lines?: 2 | 3 | 4;
  // Clamp to a height rather than a line count — lets a caption run as long
  // as the space beside it allows, and only collapse when it truly exceeds
  // it. Wins over `lines` when set.
  maxHeightClass?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (expanded) return;
    const el = contentRef.current;
    if (el) setClamped(el.scrollHeight > el.clientHeight);
  }, [text, expanded]);

  if (!text) return null;

  const clampClass = maxHeightClass
    ? `${maxHeightClass} overflow-hidden`
    : CLAMP_CLASS[lines];

  return (
    <div className={className}>
      <div className="relative">
        <p
          ref={contentRef}
          className={cn(
            // `small` is the body scale; it ships leading-none and a medium
            // weight, which suit a label, not a paragraph.
            typographyVariants({ variant: "small" }),
            "leading-snug font-normal whitespace-pre-line",
            textClassName,
            expanded ? "" : clampClass,
          )}
        >
          {text}
        </p>
        {/* Height clamping cuts mid-line; the fade makes that deliberate.
            Line clamping already ends in an ellipsis, so it needs none. */}
        {!expanded && clamped && maxHeightClass && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
      {(clamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={cn(
            typographyVariants({ variant: "small" }),
            "mt-1 text-muted-foreground hover:underline",
          )}
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}
