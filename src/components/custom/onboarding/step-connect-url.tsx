"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldLabel } from "@/components/ui/field";
import { IconInfoCircle, IconExternalLink } from "@tabler/icons-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { StartShopifyInstall } from "@/redux/api-slice/onboarding-slice";
import { OnboardingHeader } from "./onboarding-header";

/** Reduce whatever the merchant pastes to a bare host (the backend re-validates
 * it as a *.myshopify.com domain). */
function normalizeShop(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

/** Open Shopify's approval screen in a centred popup window (not a tab), so the
 * merchant stays anchored to the onboarding page underneath. */
function openOAuthPopup(url: string) {
  const width = 560;
  const height = 720;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
  window.open(
    url,
    "storesignal-shopify-oauth",
    `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
  );
}

export function StepConnectUrl({ onBack }: { onBack: () => void }) {
  const dispatch = useAppDispatch();
  const { installing } = useAppSelector((s) => s.GetOnboardingReducer);
  const [name, setName] = useState("");
  const [shop, setShop] = useState("");
  // True once we've opened the Shopify popup and are waiting for the OAuth
  // round-trip to broadcast back (the orchestrator advances the step on that).
  const [awaiting, setAwaiting] = useState(false);

  const connect = async () => {
    const trimmedName = name.trim();
    const normalized = normalizeShop(shop);
    if (!trimmedName) {
      toast.error("Please enter a name for your store first.");
      return;
    }
    if (!normalized) {
      toast.error("Please enter your store URL first.");
      return;
    }
    const result = await dispatch(
      StartShopifyInstall({ shop: normalized, name: trimmedName }),
    );
    if (StartShopifyInstall.fulfilled.match(result)) {
      openOAuthPopup(result.payload.install_url);
      setAwaiting(true);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <OnboardingHeader
        label="Step 2 of 4"
        title="Name & connect your store"
        time="60 sec"
        description="Give your store a name and paste its Shopify URL. We'll open Shopify in a secure popup window so you can authorise access — this connects your store to Store Signal AI."
      />

      <Card>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="store-name">Store name</FieldLabel>
            <Input
              id="store-name"
              name="store-name"
              placeholder="e.g. CityCraft Living"
              value={name}
              disabled={installing}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") connect();
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="shop">Your store URL</FieldLabel>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="shop"
                name="shop"
                placeholder="your-store.myshopify.com"
                value={shop}
                disabled={installing}
                onChange={(e) => setShop(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") connect();
                }}
              />
              <Button
                onClick={connect}
                disabled={installing}
                className="shrink-0"
              >
                {installing && <Spinner data-icon="inline-start" />}
                {installing ? "Opening…" : "Authorise & connect"}
              </Button>
            </div>
          </Field>
          <p className="text-sm text-muted-foreground">
            Enter your{" "}
            <span className="font-medium text-foreground">myshopify.com</span>{" "}
            domain (e.g. your-store.myshopify.com). Tokens are stored encrypted;
            we never post as you.
          </p>
        </CardContent>
      </Card>

      {awaiting && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3">
            <Spinner className="mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="font-medium">Waiting for you to authorise in Shopify…</p>
              <p className="text-sm text-muted-foreground">
                A Shopify window opened — approve access there. This page continues
                automatically once your store is connected. If the window
                didn&apos;t open,{" "}
                <button
                  type="button"
                  onClick={connect}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  reopen Shopify
                </button>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
        <IconInfoCircle className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          <span className="font-medium text-foreground">
            Why this happens in a popup window:
          </span>{" "}
          Shopify hosts its own approval screen. You approve there, we save the
          connection, and you come right back here — no copy-pasting API keys.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack} disabled={installing}>
          Back
        </Button>
        <a
          href="https://help.shopify.com/en/manual/domains"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          Where do I find my URL? <IconExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
