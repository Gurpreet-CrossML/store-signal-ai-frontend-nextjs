import { useEffect, useRef } from "react";

/**
 * Keeps the user from leaving a page with unsaved edits by accident.
 *
 * While `isDirty`, a click on any link to another page of the app is stopped
 * before Next.js sees it and handed to `onBlocked` with the link's path, so
 * the page can ask first (and `router.push` it once the user agrees).
 * Reloading, closing the tab or following an external link gets the
 * browser's own "Leave site?" prompt — the only one a browser allows there.
 *
 * shortcut: code that calls `router.push` itself, and the browser's back
 * button, are not intercepted; App Router has no API to block those.
 */
export function useUnsavedChangesGuard(
  isDirty: boolean,
  onBlocked: (href: string) => void,
) {
  const latestOnBlocked = useRef(onBlocked);

  useEffect(() => {
    latestOnBlocked.current = onBlocked;
  }, [onBlocked]);

  useEffect(() => {
    if (!isDirty) return;

    const onClick = (event: MouseEvent) => {
      // A modified or non-left click opens a new tab or window: this page stays.
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }
      const url = new URL(anchor.href);
      // External links are left to the beforeunload prompt; links within
      // this page (an #anchor) do not leave it.
      if (
        url.origin !== window.location.origin ||
        (url.pathname === window.location.pathname &&
          url.search === window.location.search)
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      latestOnBlocked.current(`${url.pathname}${url.search}${url.hash}`);
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    // Capture on window runs before React's own listeners, so the Link's
    // client-side navigation never starts.
    window.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [isDirty]);
}
