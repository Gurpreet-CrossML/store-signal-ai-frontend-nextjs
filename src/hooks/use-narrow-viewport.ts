import { useSyncExternalStore } from "react";

/**
 * The tablet layout: below 1024px, or a portrait screen up to 1100px (an iPad
 * Pro 12.9" held upright is exactly 1024px wide). Screens that show a list
 * and a detail pane side by side show only one of them here. The exact
 * complement of Tailwind's `desktop:` variant in globals.css — keep the two
 * in step.
 */
export const BELOW_LG_QUERY =
  "(max-width: 1023px), (max-width: 1100px) and (orientation: portrait)";

/** One-off read, for event handlers and effects that should not subscribe. */
export function isBelowLg() {
  return (
    typeof window !== "undefined" && window.matchMedia(BELOW_LG_QUERY).matches
  );
}

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(BELOW_LG_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/** Reactive version of `isBelowLg`; false on the server. */
export function useIsBelowLg() {
  return useSyncExternalStore(subscribe, isBelowLg, () => false);
}
