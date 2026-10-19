import { useSyncExternalStore } from "react";

/**
 * Below Tailwind's `lg` (1024px): iPad portrait and narrower. Screens that
 * show a list and a detail pane side by side show only one of them here.
 */
export const BELOW_LG_QUERY = "(max-width: 1023px)";

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
