"use client";

import { useEffect, useRef, useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Truncated text that shows in full on demand — by tap or click, and by
 * hover for a mouse.
 *
 * It replaces a hover tooltip, which a touch screen cannot open: Radix
 * ignores touch for tooltips, so on an iPad the full text was unreachable.
 * A popover opens on tap, and the hover handlers (mouse only) keep the old
 * behaviour for desktop users.
 *
 * It is only interactive while the text is actually cut off: when the full
 * text fits, there is nothing more to show, so no popover opens.
 */
export function ExpandableText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  // Re-measured whenever the text or its available width changes, so a
  // resize can turn the popover on or off.
  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const measure = () =>
      setTruncated(element.scrollWidth > element.clientWidth);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text]);

  return (
    <Popover open={open && truncated} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <p
          ref={textRef}
          className={cn(
            "max-w-xs truncate rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            truncated && "cursor-pointer",
            className,
          )}
          role={truncated ? "button" : undefined}
          tabIndex={truncated ? 0 : undefined}
          aria-label={truncated ? `Show full text: ${text}` : undefined}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") setOpen(true);
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") setOpen(false);
          }}
          onClick={(event) => {
            // A mouse has already opened it by hovering; the click that
            // follows would toggle it straight shut again.
            if ((event.nativeEvent as PointerEvent).pointerType === "mouse") {
              event.preventDefault();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen((current) => !current);
            }
          }}
        >
          {text}
        </p>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto max-w-sm"
        // Hover-opened for a mouse: do not steal focus from whatever the
        // user is doing, and let the pointer leave without it snapping shut
        // on the way to the content.
        onOpenAutoFocus={(event) => event.preventDefault()}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setOpen(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setOpen(false);
        }}
      >
        <p className="wrap-break-word whitespace-normal">{text}</p>
      </PopoverContent>
    </Popover>
  );
}
