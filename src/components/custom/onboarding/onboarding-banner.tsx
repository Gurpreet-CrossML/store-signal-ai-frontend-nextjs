"use client";

import { IconBuildingStore, IconArrowRight } from "@tabler/icons-react";

/**
 * Dashboard prompt to resume onboarding, shown just above "Performance Summary"
 * once the merchant dismisses the setup overlay without finishing. Clicking it
 * reopens the full-screen overlay.
 */
export function OnboardingBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="px-6 pt-4">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconBuildingStore className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Finish setting up your store</p>
            <p className="text-sm text-muted-foreground">
              Connect your store and go live — it only takes a couple of
              minutes.
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
          Resume setup <IconArrowRight className="size-4" />
        </span>
      </button>
    </div>
  );
}
