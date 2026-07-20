"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { IconCircleCheck } from "@tabler/icons-react";
import { OAUTH_CHANNEL, type OAuthMessage } from "@/lib/onboarding";

// Seconds the popup stays open after a successful connect, counted down on
// screen, so the merchant can read the confirmation before it closes itself.
const COUNTDOWN_START = 10;

/**
 * Landing page for the OAuth popup: the backend callback 302s here after it
 * saves the store's tokens. We broadcast to the onboarding tab (so it advances),
 * count down from 10, then close the popup, dropping the merchant back into setup.
 */
export function ConnectedView() {
  const params = useSearchParams();
  const shop = params?.get("shop") ?? "";
  const store = params?.get("store") ?? null;
  const [seconds, setSeconds] = useState(COUNTDOWN_START);

  // Broadcast once on mount so the onboarding tab advances.
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window))
      return;
    const channel = new BroadcastChannel(OAUTH_CHANNEL);
    const message: OAuthMessage = { type: "connected", shop, store };
    channel.postMessage(message);
    channel.close();
  }, [shop, store]);

  // Tick 10 → 9 → … → 0, then close the (script-opened) popup. If the browser
  // refuses to close it, the on-screen message stays as the fallback.
  useEffect(() => {
    if (seconds <= 0) {
      window.close();
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  return (
    <div className="flex min-h-svh flex-col items-center bg-muted/30 px-6 text-center">
      <div className="pt-10">
        <Image
          src="https://storesignal.ai/wp-content/uploads/2026/01/final-logo-dark-1.svg"
          alt="StoreSignal AI"
          width={200}
          height={20}
          loading="eager"
        />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-16">
        <span className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <IconCircleCheck className="size-9" />
        </span>
        <h1 className="text-2xl font-bold">Your store is connected</h1>
        <p className="max-w-md text-muted-foreground">
          {shop ? (
            <>
              <span className="font-medium text-foreground">{shop}</span> has
              been added to Store Signal AI.
            </>
          ) : (
            "Your store has been added to Store Signal AI."
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          This window closes in{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {seconds}s
          </span>{" "}
          — you can also close it now.
        </p>
      </div>
    </div>
  );
}
