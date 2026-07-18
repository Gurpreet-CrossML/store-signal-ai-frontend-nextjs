"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { IconAlertCircle } from "@tabler/icons-react";
import { OAUTH_CHANNEL, type OAuthMessage } from "@/lib/onboarding";

/**
 * Landing page for the OAuth popup when the connect fails: the backend
 * callback 302s here with a `message`. We surface it and signal the onboarding
 * tab so it can show the error and let the user retry. No auto-close — the
 * merchant should be able to read the error at their own pace.
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
        <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <IconAlertCircle className="size-9" />
        </span>
        <h1 className="text-2xl font-bold">
          We couldn&apos;t connect your store
        </h1>
        <p className="max-w-md text-muted-foreground">{message}</p>
        <p className="text-sm text-muted-foreground">
          Close this window and try again from the setup page.
        </p>
      </div>
    </div>
  );
}
