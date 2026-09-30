"use client";

import { useEffect, useState } from "react";
import { IconCheck } from "@tabler/icons-react";

import { SHOPIFY_CONNECT_STEPS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { WebhookSubscriptionStatus } from "@/components/custom/webhook-subscription-status";

/**
 * Progress dialog for a Shopify return on Settings → Stores. The layout's
 * ShopifyOauthReturn handler strips the OAuth params and fires the callback
 * request; without this the user lands on a plain store list with nothing
 * saying their connect is still being finished. Opens itself when that
 * request starts (loading turning true is the signal — stale success from
 * an earlier flow never opens it) and walks a paced timeline until the
 * backend answers.
 */
export function ShopifyConnectProgress() {
  const {
    CompleteShopifyOauthIsLoading,
    CompleteShopifyOauthIsSuccess,
    CompleteShopifyOauthIsError,
    CompleteShopifyOauthData: connected,
  } = useAppSelector(
    (state) => state.GetOnboardingReducer.CompleteShopifyOauthState,
  );

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Open on the loading edge — adjusted during render, the endorsed
  // alternative to setState-in-effect.
  const [wasLoading, setWasLoading] = useState(false);
  if (CompleteShopifyOauthIsLoading !== wasLoading) {
    setWasLoading(CompleteShopifyOauthIsLoading);
    if (CompleteShopifyOauthIsLoading) {
      setOpen(true);
      setStep(0);
    }
  }

  // Pace through the intermediate stages while the request is in flight;
  // the final "Done" stage is reserved for the real response.
  useEffect(() => {
    if (!open || !CompleteShopifyOauthIsLoading) return;
    const handle = setInterval(
      () =>
        setStep((current) =>
          Math.min(current + 1, SHOPIFY_CONNECT_STEPS.length - 2),
        ),
      1500,
    );
    return () => clearInterval(handle);
  }, [open, CompleteShopifyOauthIsLoading]);

  if (!open) return null;

  const finished = !CompleteShopifyOauthIsLoading;
  const failed = finished && !!CompleteShopifyOauthIsError;
  const currentStep = CompleteShopifyOauthIsSuccess
    ? SHOPIFY_CONNECT_STEPS.length - 1
    : step;
  const errorMessage =
    typeof CompleteShopifyOauthIsError === "object" &&
    CompleteShopifyOauthIsError !== null &&
    "message" in CompleteShopifyOauthIsError
      ? String(
          (CompleteShopifyOauthIsError as { message?: string }).message ?? "",
        )
      : null;

  return (
    <Dialog open onOpenChange={(o) => !o && finished && setOpen(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {failed
              ? "Couldn't connect the store"
              : CompleteShopifyOauthIsSuccess
                ? `${connected?.store_name ?? "Store"} is connected`
                : "Setting up your store"}
          </DialogTitle>
          <DialogDescription>
            {failed
              ? errorMessage ||
                "Shopify didn't complete the handshake. Start the connect again from this page."
              : "You're back from Shopify — finishing the connection for you."}
          </DialogDescription>
        </DialogHeader>

        {!failed && (
          <ol className="flex flex-col gap-3">
            {SHOPIFY_CONNECT_STEPS.map((label, index) => {
              const done =
                index < currentStep ||
                (CompleteShopifyOauthIsSuccess &&
                  index === SHOPIFY_CONNECT_STEPS.length - 1);
              const active = !done && index === currentStep;
              return (
                <li key={label} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border",
                      done && "border-emerald-500 text-emerald-600",
                      !done && !active && "text-muted-foreground/50",
                    )}
                  >
                    {done ? (
                      <IconCheck className="size-4" />
                    ) : active ? (
                      <Spinner className="size-4" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <Typography
                    variant={done || active ? "small" : "muted"}
                    className="text-sm"
                  >
                    {label}
                  </Typography>
                </li>
              );
            })}
          </ol>
        )}

        {CompleteShopifyOauthIsSuccess && connected && (
          <WebhookSubscriptionStatus webhooks={connected.webhooks} />
        )}

        {finished && (
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>
              {failed ? "Close" : "Done"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
