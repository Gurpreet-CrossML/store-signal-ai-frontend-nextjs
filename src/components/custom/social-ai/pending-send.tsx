"use client";

import { IconAlertTriangle } from "@tabler/icons-react";

import { Spinner } from "@/components/ui/spinner";
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
 * Status line under a pending bubble: a quiet "Sending…" while in flight,
 * and a destructive "Failed to send · Try again" if the API rejected it.
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
  if (status === "sending") {
    return (
      <p
        className={cn(
          "flex items-center gap-1.5 px-1 text-xs text-muted-foreground",
          className,
        )}
      >
        <Spinner className="size-3" />
        Sending…
      </p>
    );
  }

  return (
    <p
      className={cn(
        "flex items-center gap-1.5 px-1 text-xs text-destructive",
        className,
      )}
    >
      <IconAlertTriangle className="size-3.5 shrink-0" />
      Failed to send
      <span aria-hidden>·</span>
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
