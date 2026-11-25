"use client";

import { useEffect, useRef } from "react";

/**
 * Loads the next page when a sentinel element scrolls into view.
 *
 * Attach the returned ref to an element at the end of the list. The
 * callback is held in a ref so a re-rendered handler doesn't tear down and
 * rebuild the observer on every render.
 *
 * `rootMargin` fires it slightly before the sentinel is actually visible,
 * so the next page is usually there by the time the reader reaches it.
 */
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>({
  onLoadMore,
  hasMore,
  loading,
}: {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}) {
  const sentinelRef = useRef<T>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMoreRef.current();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  return sentinelRef;
}
