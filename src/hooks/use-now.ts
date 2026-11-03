"use client";

import { useSyncExternalStore } from "react";

const DEFAULT_TICK_MS = 30_000;

type Ticker = {
  now: number;
  listeners: Set<() => void>;
  timer: ReturnType<typeof setInterval> | null;
};

// One shared clock per refresh rate, so a hundred components asking for the
// time every 30 seconds share one timer, and the few that count seconds down
// share another.
//
// Safe under the React Compiler's purity rules: Date.now() only ever runs at
// module load and inside event callbacks (the interval, a subscription), never
// during render — getSnapshot just returns the cached value. Time-based UI,
// such as an SLA countdown, then keeps itself current instead of waiting for
// something else to re-render it.
const tickers = new Map<number, Ticker>();
const subscribers = new Map<
  number,
  (onStoreChange: () => void) => () => void
>();

function tickerFor(tickMs: number): Ticker {
  let ticker = tickers.get(tickMs);
  if (!ticker) {
    ticker = { now: Date.now(), listeners: new Set(), timer: null };
    tickers.set(tickMs, ticker);
  }
  return ticker;
}

// The same function for the same rate, because useSyncExternalStore
// resubscribes whenever the one it is given changes.
function subscriberFor(tickMs: number) {
  let subscribe = subscribers.get(tickMs);
  if (!subscribe) {
    subscribe = (onStoreChange) => {
      const ticker = tickerFor(tickMs);
      ticker.listeners.add(onStoreChange);
      if (!ticker.timer) {
        // Catch up first: the cache may be as old as the last unsubscribe.
        ticker.now = Date.now();
        ticker.timer = setInterval(() => {
          ticker.now = Date.now();
          ticker.listeners.forEach((listener) => listener());
        }, tickMs);
      }

      return () => {
        ticker.listeners.delete(onStoreChange);
        if (ticker.listeners.size === 0 && ticker.timer) {
          clearInterval(ticker.timer);
          ticker.timer = null;
        }
      };
    };
    subscribers.set(tickMs, subscribe);
  }
  return subscribe;
}

/**
 * The current time in epoch milliseconds, refreshed every `tickMs`.
 *
 * @param tickMs - How often to refresh: 30 seconds by default, which is plenty
 *   for a minutes-level indicator. Pass 1000 to count seconds down.
 */
export function useNow(tickMs: number = DEFAULT_TICK_MS): number {
  return useSyncExternalStore(
    subscriberFor(tickMs),
    () => tickerFor(tickMs).now,
    () => tickerFor(tickMs).now,
  );
}
