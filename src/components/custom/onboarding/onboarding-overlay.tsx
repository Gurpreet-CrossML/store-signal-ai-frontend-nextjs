"use client";

import { useEffect } from "react";
import { IconX } from "@tabler/icons-react";
import type { OnboardingPlatform } from "@/lib/onboarding";
import { OnboardingFlow } from "./onboarding-flow";

/**
 * Full-screen onboarding overlay shown on the dashboard. Fixed positioning with
 * an opaque background fully covers the viewport (sidebar + header included);
 * the page behind is scroll-locked so nothing bleeds through. The X dismisses it
 * (the dashboard then shows a resume banner); finishing calls `onComplete`.
 */
export function OnboardingOverlay({
  open,
  initialStep,
  platform,
  onClose,
  onComplete,
}: {
  open: boolean;
  initialStep: number;
  platform: OnboardingPlatform;
  onClose: () => void;
  onComplete: () => void;
}) {
  // While open, lock the page behind the overlay: no background scroll, and no
  // second (body) scrollbar next to the overlay's own.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-muted">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close setup"
        className="fixed right-4 top-4 z-[101] flex size-9 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-background/70 hover:text-foreground"
      >
        <IconX className="size-5" />
      </button>
      {/* Full-height internal scroll, with the scrollbar hidden. */}
      <div className="no-scrollbar h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-12 md:py-16">
          <OnboardingFlow
            initialStep={initialStep}
            platform={platform}
            onComplete={onComplete}
          />
        </div>
      </div>
    </div>
  );
}
