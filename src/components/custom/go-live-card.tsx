"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { IconCheck, IconCopy } from "@tabler/icons-react";

import { STORE_PLATFORMS, WIDGET_INSTALL_STEPS } from "@/lib/config";
import { widgetSnippet } from "@/lib/helpers";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { GetStores } from "@/redux/api-slice/stores-slice";
import {
  FetchOnboardingStatus,
  UpdateOnboardingStep,
  type OnboardingOutcome,
  type OnboardingStore,
} from "@/redux/api-slice/onboarding-slice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";

/**
 * Go-live step: the widget embed tag for every connected store, copied and
 * pasted by the merchant. Finishing (or skipping) PATCHes the company's
 * onboarding step; the session refresh then closes the drawer.
 */
export function GoLiveCard() {
  const dispatch = useAppDispatch();
  const { update } = useSession();
  const { FetchOnboardingStatusData: status, FetchOnboardingStatusIsLoading } =
    useAppSelector(
      (state) => state.GetOnboardingReducer.FetchOnboardingStatusState,
    );
  const { UpdateOnboardingStepIsLoading } = useAppSelector(
    (state) => state.GetOnboardingReducer.UpdateOnboardingStepState,
  );
  const [outcome, setOutcome] = useState<OnboardingOutcome | null>(null);

  useEffect(() => {
    dispatch(FetchOnboardingStatus());
  }, [dispatch]);

  const stores = status?.stores ?? [];

  const finish = async (chosen: OnboardingOutcome) => {
    setOutcome(chosen);
    const result = await dispatch(UpdateOnboardingStep(chosen));
    if (UpdateOnboardingStep.fulfilled.match(result)) {
      // The proxy pins onboarding users to "/" from the JWT, so the session
      // has to be re-read from the backend before the drawer can go away.
      await update();
      // The store list was fetched (empty) before any store existed and is
      // only requested once; refilling it hydrates `selectedStore`, and every
      // screen refetches on that change — no page reload needed.
      dispatch(GetStores({}));
    }
    setOutcome(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Install the widget</CardTitle>
        <CardDescription>
          Paste each store&apos;s snippet before &lt;/body&gt; on every page of
          that storefront, then finish setup.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {FetchOnboardingStatusIsLoading || !status ? (
          <Skeleton className="h-36 w-full" />
        ) : stores.length === 0 ? (
          <Typography variant="muted">
            No connected store yet. Refresh in a moment.
          </Typography>
        ) : (
          stores.map((store) => <StoreSnippet key={store.code} store={store} />)
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-2">
        <Button
          disabled={stores.length === 0 || UpdateOnboardingStepIsLoading}
          onClick={() => finish("completed")}
        >
          {outcome === "completed" ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <IconCheck data-icon="inline-start" />
          )}
          I&apos;ve added it — finish setup
        </Button>
        <Button
          variant="ghost"
          disabled={UpdateOnboardingStepIsLoading}
          onClick={() => finish("skipped")}
        >
          {outcome === "skipped" && <Spinner data-icon="inline-start" />}
          Skip for now
        </Button>
      </CardFooter>
    </Card>
  );
}

/** One store's embed tag with a copy button — shared with Settings → Stores'
    "Get widget script" dialog. */
export function StoreSnippet({ store }: { store: OnboardingStore }) {
  const [copied, setCopied] = useState(false);
  const platform = STORE_PLATFORMS.find((p) => p.value === store.platform);
  const isShopify = store.platform === "shopify";
  const snippet = widgetSnippet(store.widget_key, store.platform);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success(`Snippet for ${store.name} copied`);
    } catch {
      toast.error("Couldn't copy", {
        description: "Select the snippet and copy it manually.",
      });
    }
  };

  return (
    // min-w-0: as a grid/flex child its minimum is otherwise the snippet's
    // full width, which blows the dialog open instead of letting the <pre>
    // scroll.
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {platform && (
            <Image
              src={platform.icon}
              alt=""
              width={20}
              height={20}
              className="size-5 object-contain"
            />
          )}
          <Typography variant="small">{store.name}</Typography>
          <Typography variant="muted" className="text-xs">
            {platform?.label ?? store.platform} · {store.code}
          </Typography>
        </div>
        <Button variant="outline" size="sm" onClick={copy}>
          <IconCopy data-icon="inline-start" />
          {copied ? "Copied" : "Copy snippet"}
        </Button>
      </div>
      <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/50 p-3">
        <Typography variant="small">How to install</Typography>
        <ol className="flex flex-col gap-1.5">
          {(isShopify
            ? WIDGET_INSTALL_STEPS.shopify
            : WIDGET_INSTALL_STEPS.default
          ).map((step, index) => (
            <li key={step} className="flex items-start gap-2">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>
              <Typography variant="muted" className="text-sm">
                {step}
              </Typography>
            </li>
          ))}
        </ol>
      </div>
      <pre
        className="overflow-x-auto rounded-md bg-neutral-950 p-4 font-mono text-xs leading-relaxed text-neutral-50"
        // The drawer's scroll lock reads shift+wheel as vertical (on Linux and
        // Windows it arrives as deltaY with no deltaX) and cancels it, so the
        // sideways scroll is done here by hand.
        onWheel={(event) => {
          if (event.shiftKey && !event.deltaX) {
            event.currentTarget.scrollLeft += event.deltaY;
          }
        }}
      >
        {snippet}
      </pre>
    </div>
  );
}
