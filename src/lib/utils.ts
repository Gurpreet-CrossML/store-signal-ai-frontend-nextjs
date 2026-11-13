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

/**
 * A random unique id for client-side keys and local ids.
 *
 * `crypto.randomUUID` only exists in secure contexts (HTTPS or localhost), so
 * it is undefined when the app is opened over plain HTTP on a LAN IP. Falls
 * back to `getRandomValues`, which is available everywhere.
 */
export function randomId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  // RFC 4122 version 4: set the version and variant bits.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10).join(""),
  ].join("-");
}
