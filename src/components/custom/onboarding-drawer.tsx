"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { IconCheck } from "@tabler/icons-react";

import { ONBOARDING_STEPS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { CompleteShopifyOauth } from "@/redux/api-slice/onboarding-slice";
import { GoLiveCard } from "@/components/custom/go-live-card";
import { StoreSetupForm } from "@/components/custom/store-setup-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";

/**
 * Full-page, non-dismissible drawer shown while the session user still has
 * onboarding to finish. Which step renders comes from the session, so a
 * refresh lands on the right one.
 *
 * It also closes the Shopify OAuth loop: Shopify redirects the browser back
 * to this app with code/shop/state/hmac, the drawer forwards that query to
 * the backend callback, then strips it from the URL and refreshes the
 * session so `onboarding_step` advances without a re-login.
 */
export function OnboardingDrawer() {
  const { data: session, update } = useSession();
  const user = session?.user;

  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    CompleteShopifyOauthIsLoading,
    CompleteShopifyOauthIsSuccess,
    CompleteShopifyOauthData: connected,
  } = useAppSelector(
    (state) => state.GetOnboardingReducer.CompleteShopifyOauthState,
  );

  // Shopify's return carries all four; anything else in the query is ours.
  const search = searchParams?.toString() ?? "";
  const isShopifyReturn = ["code", "shop", "state", "hmac"].every((key) =>
    searchParams?.has(key),
  );
  // The `state` is single-use server-side, so the callback must fire once —
  // not again on a re-render, and not on a refresh (hence the URL rewrite).
  const handled = useRef(false);
  useEffect(() => {
    if (!isShopifyReturn || handled.current || !user?.onboarding_pending)
      return;
    handled.current = true;
    router.replace(pathname ?? "/");
    dispatch(CompleteShopifyOauth(search)).then((result) => {
      if (CompleteShopifyOauth.fulfilled.match(result)) update();
    });
  }, [isShopifyReturn, user?.onboarding_pending, search, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user?.onboarding_pending) return null;

  const sessionIndex = Math.max(
    0,
    ONBOARDING_STEPS.findIndex((step) => step.value === user.onboarding_step),
  );
  // A store connected in this tab counts as done even before the session
  // catches up.
  const currentIndex = CompleteShopifyOauthIsSuccess
    ? Math.max(sessionIndex, 1)
    : sessionIndex;
  const current = ONBOARDING_STEPS[currentIndex].value;
  const finishing = isShopifyReturn || CompleteShopifyOauthIsLoading;

  return (
    <Drawer open dismissible={false}>
      <DrawerContent
        className={cn(
          "h-svh rounded-none border-0",
          "data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-svh data-[vaul-drawer-direction=bottom]:rounded-none",
        )}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 overflow-y-auto p-6 md:p-10">
          <DrawerHeader className="p-0">
            <DrawerTitle>
              <Typography variant="h1" as="span">
                Set up your workspace
              </Typography>
            </DrawerTitle>
            <DrawerDescription>
              A couple of steps before StoreSignal can start working on your
              store.
            </DrawerDescription>
          </DrawerHeader>

          <ol className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            {ONBOARDING_STEPS.map((step, index) => {
              const done = index < currentIndex;
              const active = index === currentIndex;
              return (
                <li key={step.value} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                      active &&
                        "border-primary bg-primary text-primary-foreground",
                      done && "border-primary text-primary",
                      !active && !done && "text-muted-foreground",
                    )}
                  >
                    {done ? <IconCheck className="size-4" /> : index + 1}
                  </span>
                  <Typography
                    variant={active ? "small" : "muted"}
                    className="text-sm"
                  >
                    {step.label}
                  </Typography>
                </li>
              );
            })}
          </ol>

          {finishing && !CompleteShopifyOauthIsSuccess ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia>
                  <Spinner />
                </EmptyMedia>
                <EmptyTitle>Finishing your Shopify connection</EmptyTitle>
                <EmptyDescription>
                  Exchanging the authorization with Shopify and subscribing to
                  store updates. This takes a few seconds.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : current === "store_setup" ? (
            <Card>
              <CardHeader>
                <CardTitle>Connect the store</CardTitle>
                <CardDescription>
                  Choose your platform and point us at your store. You&apos;ll
                  be sent to it to authorize access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StoreSetupForm />
              </CardContent>
            </Card>
          ) : (
            <>
              {connected &&
                Object.keys(connected.webhooks.failed).length > 0 && (
                  <Typography variant="muted" className="text-sm">
                    {connected.store_name} is connected, but some store updates
                    couldn&apos;t be subscribed:{" "}
                    {Object.entries(connected.webhooks.failed)
                      .map(([topic, reason]) => `${topic} (${reason})`)
                      .join(", ")}
                    . Reconnecting the store retries them.
                  </Typography>
                )}
              <GoLiveCard />
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
