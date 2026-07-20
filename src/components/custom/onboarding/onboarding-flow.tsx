"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { OAUTH_CHANNEL, type OAuthMessage } from "@/lib/onboarding";
import { StepConnect } from "@/components/custom/onboarding/step-connect";
import { StepConnectUrl } from "@/components/custom/onboarding/step-connect-url";
import { StepQuestions } from "@/components/custom/onboarding/step-questions";
import { StepAiReady } from "@/components/custom/onboarding/step-ai-ready";
import { StepWorkflows } from "@/components/custom/onboarding/step-workflows";
import { StepGoLive } from "@/components/custom/onboarding/step-go-live";

// Each step slides in from the right and the previous one leaves to the left
// (reversed on Back), so the 6-step flow reads as forward motion.
const variants = {
  enter: (dir: number) => ({ x: dir >= 0 ? 64 : -64, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? -64 : 64, opacity: 0 }),
};

/**
 * The 6-step setup flow, decoupled from where it's rendered (the dashboard
 * overlay). Manages step state and listens for the Shopify OAuth success
 * broadcast to auto-advance past the connect step. Calls `onComplete` when the
 * merchant finishes the final step. Steps transition with a left/right slide.
 */
export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  // Sign of the last transition: +1 forward (Continue), -1 backward (Back).
  const [direction, setDirection] = useState(1);

  const go = (next: number) => {
    setDirection(next >= step ? 1 : -1);
    setStep(next);
  };

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
        setDirection(1);
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
    <AnimatePresence mode="wait" custom={direction} initial={false}>
      <motion.div
        key={step}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.28, ease: "easeInOut" }}
      >
        {step === 1 && <StepConnect onNext={() => go(2)} />}
        {step === 2 && <StepConnectUrl onBack={() => go(1)} />}
        {step === 3 && (
          <StepQuestions onNext={() => go(4)} onBack={() => go(2)} />
        )}
        {step === 4 && <StepAiReady onNext={() => go(5)} onBack={() => go(3)} />}
        {step === 5 && (
          <StepWorkflows onNext={() => go(6)} onBack={() => go(4)} />
        )}
        {step === 6 && <StepGoLive onFinish={onComplete} />}
      </motion.div>
    </AnimatePresence>
  );
}
