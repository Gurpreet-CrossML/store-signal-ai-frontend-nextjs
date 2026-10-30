import type { MouseEvent } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * `onMouseEnter` handler that gives a label a native tooltip of its full
 * text, but only while the text is cut off — a label that fits has nothing
 * to reveal, so it gets none.
 */
export function titleWhenClipped(event: MouseEvent<HTMLElement>) {
  const label = event.currentTarget;
  if (label.scrollWidth > label.clientWidth) {
    label.title = label.textContent ?? "";
  } else {
    label.removeAttribute("title");
  }
}
