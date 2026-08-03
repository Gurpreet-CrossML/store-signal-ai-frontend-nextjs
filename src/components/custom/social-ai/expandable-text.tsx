"use client";

import { useEffect, useRef, useState } from "react";

// Clamps text to 2 lines with an FB-style "See more"/"See less" toggle; the
// toggle only renders when the text actually overflows the clamp.
export function ExpandableText({
  text,
  className = "",
  textClassName = "text-[15px] leading-snug",
}: {
  text: string;
  className?: string;
  textClassName?: string;
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

  return (
    <div className={className}>
      <p
        ref={contentRef}
        className={`${textClassName} whitespace-pre-line ${expanded ? "" : "line-clamp-2"}`}
      >
        {text}
      </p>
      {(clamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={`${textClassName} font-semibold text-muted-foreground hover:underline`}
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}
