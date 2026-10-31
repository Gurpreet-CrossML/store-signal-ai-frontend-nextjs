"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useAppDispatch } from "@/redux/hooks";
import { resetRouterCache } from "@/hooks/reset-router-cache";
import { GetStores } from "@/redux/api-slice/stores-slice";
import {
  UpdateOnboardingStep,
  type OnboardingOutcome,
} from "@/redux/api-slice/onboarding-slice";

/**
 * PATCH the company's onboarding step, then re-read the session: the drawer
 * renders whichever step the session holds, so the backend is what remembers
 * it across refreshes and devices.
 */
export function useAdvanceOnboarding() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { update } = useSession();

  return useCallback(
    async (step: OnboardingOutcome) => {
      const result = await dispatch(UpdateOnboardingStep(step));
      if (!UpdateOnboardingStep.fulfilled.match(result)) return;
      // The proxy pins onboarding users to "/" from the JWT, so the session
      // has to be re-read from the backend before the drawer moves on.
      await update();
      // The store list was fetched (empty) before any store existed and is
      // only requested once; refilling it hydrates `selectedStore`, and every
      // screen refetches on that change — no page reload needed.
      dispatch(GetStores({}));
      // While onboarding was pending the proxy bounced every other URL to
      // "/", and the sidebar links prefetched in that state cached the
      // redirect as their destination. Without dropping those, a link click
      // after the last step lands back on "/" until the page is reloaded.
      if (step !== "brand_voice") {
        await resetRouterCache();
        router.replace("/");
      }
    },
    [dispatch, router, update],
  );
}
