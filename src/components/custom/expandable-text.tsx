"use client";

import { useState } from "react";

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
 */
export function ExpandableText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <p
          className={cn(
            "max-w-xs cursor-pointer truncate rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            className,
          )}
          role="button"
          tabIndex={0}
          aria-label={`Show full text: ${text}`}
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
