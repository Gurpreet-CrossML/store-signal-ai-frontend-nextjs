"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { IconAlertCircle } from "@tabler/icons-react";
import { OAUTH_CHANNEL, type OAuthMessage } from "@/lib/onboarding";

/**
 * Landing page for the OAuth new tab when the connect fails: the backend
 * callback 302s here with a `message`. We surface it and signal the onboarding
 * tab so it can show the error and let the user retry.
 */
export function ConnectErrorView() {
  const params = useSearchParams();
  const message =
    params?.get("message") ??
    "Something went wrong while connecting your store.";

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(OAUTH_CHANNEL);
    const payload: OAuthMessage = { type: "error", message };
    channel.postMessage(payload);
    channel.close();
  }, [message]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted/30 px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <IconAlertCircle className="size-9" />
      </span>
      <h1 className="text-2xl font-bold">We couldn&apos;t connect your store</h1>
      <p className="max-w-md text-muted-foreground">{message}</p>
      <p className="text-sm text-muted-foreground">
        Close this tab and try again from the setup page.
      </p>
    </div>
  );
}
