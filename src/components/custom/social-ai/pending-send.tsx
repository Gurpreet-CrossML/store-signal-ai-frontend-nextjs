"use client";

import { IconAlertTriangle } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

/**
 * A message or comment the agent has submitted but that isn't confirmed
 * yet. It renders immediately so the composer feels instant, then either
 * disappears (when the real row arrives over the socket or a refetch) or
 * flips to "failed" with a retry.
 */
export type PendingSend = {
  /** Client-side id — the backend never echoes a correlation id back. */
  tempId: string;
  content: string;
  status: "sending" | "failed";
};

let pendingCounter = 0;

/** Ids only need to be unique within this tab's session. */
export function createPendingSend(content: string): PendingSend {
  pendingCounter += 1;
  return { tempId: `pending-${pendingCounter}`, content, status: "sending" };
}

/**
 * Status line under a sent bubble.
 *
 * Nothing at all while it is in flight. Messenger and Instagram both draw
 * an optimistic message exactly as though it had already sent, and only
 * say something when that turns out to be wrong — dimming it and spinning
 * a loader tells the agent their message might not have gone, which is
 * usually a lie and always a distraction.
 */
export function PendingSendStatus({
  status,
  onRetry,
  className,
}: {
  status: PendingSend["status"];
  onRetry: () => void;
  className?: string;
}) {
  if (status === "sending") return null;

  return (
    <p
      className={cn(
        "flex items-center gap-1.5 px-1 text-xs text-destructive",
        className,
      )}
    >
      <IconAlertTriangle className="size-3.5 shrink-0" />
      Couldn&apos;t send.
      <button
        type="button"
        onClick={onRetry}
        className="font-medium underline underline-offset-2 hover:no-underline"
      >
        Try again
      </button>
    </p>
  );
}

/**
 * "Sent", under the newest outgoing message once the server has confirmed
 * it. Only the newest carries it — a column of them down the thread is
 * noise, and the only one anybody checks is the one they just sent.
 */
export function SentReceipt() {
  return <p className="px-1 text-right text-xs text-muted-foreground">Sent</p>;
}
