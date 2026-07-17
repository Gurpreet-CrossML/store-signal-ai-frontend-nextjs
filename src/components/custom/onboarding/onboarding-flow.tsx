"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { OAUTH_CHANNEL, type OAuthMessage } from "@/lib/onboarding";
import { StepConnect } from "@/components/custom/onboarding/step-connect";
import { StepConnectUrl } from "@/components/custom/onboarding/step-connect-url";
import { StepQuestions } from "@/components/custom/onboarding/step-questions";
import { StepGoLive } from "@/components/custom/onboarding/step-go-live";

/**
 * The 4-step setup flow, decoupled from where it's rendered (the dashboard
 * overlay). Manages step state and listens for the Shopify OAuth success
 * broadcast to auto-advance past the connect step. Calls `onComplete` when the
 * merchant finishes the final step.
 */
export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(OAUTH_CHANNEL);
    channel.onmessage = (event: MessageEvent<OAuthMessage>) => {
      const msg = event.data;
      if (msg?.type === "connected") {
        toast.success("Store connected!", {
          description: "Your Shopify store is now linked to Store Signal AI.",
        });
        // Only nudge forward if we're still on/behind the connect step.
        setStep((s) => (s < 3 ? 3 : s));
      } else if (msg?.type === "error") {
        toast.error("Couldn't connect your store.", {
          description: msg.message,
        });
      }
    };
    return () => channel.close();
  }, []);

  return (
    <>
      {step === 1 && <StepConnect onNext={() => setStep(2)} />}
      {step === 2 && <StepConnectUrl onBack={() => setStep(1)} />}
      {step === 3 && (
        <StepQuestions onNext={() => setStep(4)} onBack={() => setStep(2)} />
      )}
      {step === 4 && <StepGoLive onFinish={onComplete} />}
    </>
  );
}
