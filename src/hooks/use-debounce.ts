"use client";

import { useEffect, useState } from "react";

/** Returns a debounced copy of `value` that only updates after `delay` ms of no changes. */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}
