"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { IconCircleCheck } from "@tabler/icons-react";
import { OAUTH_CHANNEL, type OAuthMessage } from "@/lib/onboarding";

/**
 * Landing page for the OAuth new tab: the backend callback 302s here after it
 * saves the store's tokens. We broadcast to the onboarding tab (so it advances)
 * and then close this tab to drop the merchant straight back into setup.
 */
export function ConnectedView() {
  const params = useSearchParams();
  const shop = params?.get("shop") ?? "";
  const store = params?.get("store") ?? null;

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(OAUTH_CHANNEL);
    const message: OAuthMessage = { type: "connected", shop, store };
    channel.postMessage(message);
    channel.close();
    // Return the merchant to the onboarding tab by closing this one. Allowed
    // because the tab was script-opened (window.open); if the browser blocks
    // it, the on-screen message is the fallback.
    const timer = setTimeout(() => window.close(), 1200);
    return () => clearTimeout(timer);
  }, [shop, store]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted/30 px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <IconCircleCheck className="size-9" />
      </span>
      <h1 className="text-2xl font-bold">Your store is connected</h1>
      <p className="max-w-md text-muted-foreground">
        {shop ? (
          <>
            <span className="font-medium text-foreground">{shop}</span> has been
            added to Store Signal AI.
          </>
        ) : (
          "Your store has been added to Store Signal AI."
        )}
      </p>
      <p className="text-sm font-medium text-foreground">
        Returning you to setup… you can close this tab.
      </p>
    </div>
  );
}
