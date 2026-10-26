"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { IconCheck, IconCircleCheck, IconCopy } from "@tabler/icons-react";

import { STORE_PLATFORMS, WIDGET_INSTALL_STEPS } from "@/lib/config";
import { widgetSnippet } from "@/lib/helpers";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { GetStores } from "@/redux/api-slice/stores-slice";
import {
  FetchOnboardingStatus,
  InstallShopifyWidget,
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
 * Go-live step: a Shopify store gets the widget added to its live theme
 * automatically; any other store (or a Shopify one where that fails) shows
 * the embed tag for the merchant to copy and paste. Finishing (or skipping)
 * PATCHes the company's onboarding step; the session refresh then closes
 * the drawer.
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
  // Shopify store code → the live theme its widget was added to, or null when
  // that failed (the store falls back to the snippet). Absent = installing.
  const [themes, setThemes] = useState<Record<string, string | null>>({});

  useEffect(() => {
    dispatch(FetchOnboardingStatus());
  }, [dispatch]);

  useEffect(() => {
    status?.stores
      .filter((store) => store.platform === "shopify")
      .forEach(async (store) => {
        const result = await dispatch(InstallShopifyWidget(store.code));
        setThemes((prev) => ({
          ...prev,
          [store.code]: InstallShopifyWidget.fulfilled.match(result)
            ? result.payload.theme
            : null,
        }));
      });
  }, [dispatch, status?.stores]);

  const stores = status?.stores ?? [];
  const installing = stores.some(
    (store) => store.platform === "shopify" && !(store.code in themes),
  );
  const live = stores.length > 0 && stores.every((store) => themes[store.code]);

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
    <Card className="flex max-h-[calc(100svh-12rem)] flex-col overflow-hidden">
      <CardHeader className="shrink-0">
        <CardTitle>
          {live ? "Your chatbot is live" : "Install the widget"}
        </CardTitle>
        <CardDescription>
          {live ? (
            "StoreSignal added the widget to every page of your storefront — nothing to paste."
          ) : (
            <>
              Paste each store&apos;s snippet before &lt;/body&gt; on every page
              of that storefront, then finish setup.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        {FetchOnboardingStatusIsLoading || !status ? (
          <Skeleton className="h-36 w-full" />
        ) : stores.length === 0 ? (
          <Typography variant="muted">
            No connected store yet. Refresh in a moment.
          </Typography>
        ) : (
          stores.map((store) => {
            const theme = themes[store.code];
            return store.platform === "shopify" && theme !== null ? (
              <StoreLive key={store.code} store={store} theme={theme} />
            ) : (
              <StoreSnippet key={store.code} store={store} />
            );
          })
        )}
      </CardContent>
      <CardFooter className="flex shrink-0 flex-wrap items-center gap-2 border-t bg-background">
        <Button
          disabled={
            stores.length === 0 || installing || UpdateOnboardingStepIsLoading
          }
          onClick={() => finish("completed")}
        >
          {outcome === "completed" ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <IconCheck data-icon="inline-start" />
          )}
          {live ? "Finish setup" : "I've added it — finish setup"}
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

/** A store's icon, name and platform · code, with `children` on the right. */
function StoreHeading({
  store,
  children,
}: {
  store: OnboardingStore;
  children?: ReactNode;
}) {
  const platform = STORE_PLATFORMS.find((p) => p.value === store.platform);
  return (
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
      {children}
    </div>
  );
}

/** A Shopify store whose widget go-live adds to the live theme itself;
    `theme` is unset while that is still running. */
function StoreLive({
  store,
  theme,
}: {
  store: OnboardingStore;
  theme?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <StoreHeading store={store} />
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
        {theme ? (
          <IconCircleCheck className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Spinner />
        )}
        <Typography variant="muted" className="text-sm">
          {theme
            ? `Your chatbot is live — we added it to your “${theme}” theme.`
            : "Adding the chatbot to your live theme…"}
        </Typography>
      </div>
    </div>
  );
}

/** One store's embed tag with a copy button — shared with Settings → Stores'
    "Get widget script" dialog. */
export function StoreSnippet({ store }: { store: OnboardingStore }) {
  const [copied, setCopied] = useState(false);
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
      <StoreHeading store={store}>
        <Button variant="outline" size="sm" onClick={copy}>
          <IconCopy data-icon="inline-start" />
          {copied ? "Copied" : "Copy snippet"}
        </Button>
      </StoreHeading>
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
        className="max-h-100 overflow-auto rounded-md bg-neutral-950 p-4 font-mono text-xs leading-relaxed text-neutral-50"
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
