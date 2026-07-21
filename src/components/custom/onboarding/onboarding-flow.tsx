"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { OAUTH_CHANNEL, ONBOARDING_STEP_KEYS } from "@/lib/onboarding";
import type { OAuthMessage, OnboardingPlatform } from "@/lib/onboarding";
import { useAppDispatch } from "@/redux/hooks";
import { CompleteOnboardingStep } from "@/redux/api-slice/onboarding-slice";
import { StepConnect } from "@/components/custom/onboarding/step-connect";
import { StepConnectUrl } from "@/components/custom/onboarding/step-connect-url";
import { StepMagentoConnect } from "@/components/custom/onboarding/step-magento-connect";
import { StepQuestions } from "@/components/custom/onboarding/step-questions";
import { StepAiReady } from "@/components/custom/onboarding/step-ai-ready";
import { StepWorkflows } from "@/components/custom/onboarding/step-workflows";
import { StepGoLive } from "@/components/custom/onboarding/step-go-live";

// Forward-only motion: each step slides in from the right, the previous one
// leaves to the left. There's no Back — progress only moves forward.
const variants = {
  enter: { x: 64, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -64, opacity: 0 },
};

/**
 * The 6-step setup flow, decoupled from where it's rendered (the dashboard
 * overlay). Opens at `initialStep` (the resume point from the saved journey),
 * saves each step to the backend as the merchant moves off it, and listens for
 * the Shopify OAuth success broadcast to auto-advance past the connect step.
 * Calls `onComplete` when the final step is finished.
 */
export function OnboardingFlow({
  initialStep,
  onComplete,
}: {
  initialStep: number;
  onComplete: () => void;
}) {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(initialStep);
  // Which platform the merchant picked on step 1 — drives the permissions shown
  // there and which connect UI (Shopify OAuth vs Magento token) step 2 renders.
  const [platform, setPlatform] = useState<OnboardingPlatform>("shopify");
  // Mirror `step` into a ref so the mount-only broadcast handler reads the
  // current step (not the stale value captured at mount).
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // Persist "step N is complete" (fire-and-forget; the backend keeps the order).
  const saveStep = (stepNumber: number) => {
    const key = ONBOARDING_STEP_KEYS[stepNumber - 1];
    if (key) dispatch(CompleteOnboardingStep(key));
  };

  // Complete the current step and move to the next.
  // For Magento: after step 3 (questions), jump straight to step 5 (workflows),
  // skipping step 4 (AI Ready) which is Shopify-only.
  const advance = () => {
    saveStep(step);
    setStep((s) => {
      if (platform === "magento" && s === 3) return 5;
      return s + 1;
    });
  };

  const finish = async () => {
    // Await the final save so the journey reads complete before the overlay
    // closes (otherwise the resume banner would flash for a beat).
    const key = ONBOARDING_STEP_KEYS[ONBOARDING_STEP_KEYS.length - 1];
    await dispatch(CompleteOnboardingStep(key));
    onComplete();
  };

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window))
      return;
    const channel = new BroadcastChannel(OAUTH_CHANNEL);
    channel.onmessage = (event: MessageEvent<OAuthMessage>) => {
      const msg = event.data;
      if (msg?.type === "connected") {
        toast.success("Store connected!", {
          description: "Your Shopify store is now linked to Store Signal AI.",
        });
        // The connect step (2) just finished — save it and move to questions.
        if (stepRef.current < 3) {
          saveStep(2);
          setStep(3);
        }
      } else if (msg?.type === "error") {
        toast.error("Couldn't connect your store.", {
          description: msg.message,
        });
      }
    };
    return () => channel.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={step}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.28, ease: "easeInOut" }}
      >
        {step === 1 && (
          <StepConnect
            platform={platform}
            onPlatformChange={setPlatform}
            onNext={advance}
          />
        )}
        {step === 2 &&
          (platform === "shopify" ? (
            <StepConnectUrl />
          ) : (
            <StepMagentoConnect onNext={advance} />
          ))}
        {step === 3 && <StepQuestions platform={platform} onNext={advance} />}
        {/* Step 4 (AI Ready) is only shown for Shopify; Magento skips it. */}
        {step === 4 && platform === "shopify" && (
          <StepAiReady onNext={advance} />
        )}
        {step === 5 && <StepWorkflows platform={platform} onNext={advance} />}
        {step === 6 && <StepGoLive onFinish={finish} />}
      </motion.div>
    </AnimatePresence>
  );
}
