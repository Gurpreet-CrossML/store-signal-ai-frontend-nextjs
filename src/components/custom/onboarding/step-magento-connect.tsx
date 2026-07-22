"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  IconArrowRight,
  IconExternalLink,
  IconCopy,
  IconCircleCheck,
  IconLoader2,
  IconShieldCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { magentoAdminUrl } from "@/lib/onboarding";
import { useAppDispatch } from "@/redux/hooks";
import { VerifyMagentoToken } from "@/redux/api-slice/onboarding-slice";
import { OnboardingHeader } from "./onboarding-header";

/** Inline value + copy button — e.g. the integration name the merchant must
 * type verbatim into Magento. Click copies the exact string. */
function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the text and copy it manually.");
    }
  };

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 align-middle text-[0.8125rem] font-medium text-foreground">
      {value}
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy "${value}"`}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? (
          <IconCircleCheck className="size-3.5 text-emerald-600" />
        ) : (
          <IconCopy className="size-3.5" />
        )}
      </button>
    </span>
  );
}

/** Skeuomorphic, inset "plaque" showing the store's Magento admin URL as a
 * link that opens in a new tab (with a copy button). Built live from the URL
 * the merchant types; prompts for it until then. */
function AdminUrlBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Admin URL copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the URL and copy it manually.");
    }
  };

  return (
    <div
      className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-border bg-gradient-to-b from-muted to-background px-4 py-3"
      style={{
        // Inset depth for the skeuomorphic "plaque" look (inline so the
        // multi-value inset shadow is guaranteed to render).
        boxShadow:
          "inset 0 2px 5px 0 rgb(0 0 0 / 0.09), inset 0 1px 1px 0 rgb(0 0 0 / 0.06), 0 1px 0 0 rgb(255 255 255 / 0.7)",
      }}
    >
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate font-mono text-sm text-primary hover:underline"
        >
          {url}
        </a>
      ) : (
        <span className="font-mono text-sm text-muted-foreground">
          Enter your store URL above to get your admin link…
        </span>
      )}
      {url && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={copy}
            aria-label="Copy admin URL"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {copied ? (
              <IconCircleCheck className="size-4 text-emerald-600" />
            ) : (
              <IconCopy className="size-4" />
            )}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open admin panel in a new tab"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <IconExternalLink className="size-4" />
          </a>
        </div>
      )}
    </div>
  );
}

export function StepMagentoConnect({ onNext }: { onNext: () => void }) {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState<"setup" | "token">("setup");
  const [name, setName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [token, setToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const adminUrl = magentoAdminUrl(storeUrl);

  const goToToken = () => {
    if (!name.trim()) return toast.error("Enter a name for your store.");
    if (!storeUrl.trim()) return toast.error("Enter your store URL.");
    setPage("token");
  };

  const verify = async () => {
    if (!token.trim()) return toast.error("Paste your access token first.");
    setVerifying(true);
    const result = await dispatch(
      VerifyMagentoToken({
        name: name.trim(),
        base_url: storeUrl.trim(),
        access_token: token.trim(),
      }),
    );
    setVerifying(false);
    if (VerifyMagentoToken.fulfilled.match(result)) {
      toast.success("Magento store connected!", {
        description: "Your access token checked out — you're all set.",
      });
      onNext();
    }
    // On failure the thunk already surfaced a toast; stay so they can fix the
    // URL or token and retry.
  };

  // Token-generation steps; the first carries the live, clickable admin-URL
  // plaque, and step 4 offers a one-click copy of the exact integration name.
  const steps: React.ReactNode[] = [
    <>
      Log in to your Magento Admin panel.
      <AdminUrlBox url={adminUrl} />
    </>,
    "Go to System → Integrations.",
    "Click Add New Integration.",
    <>
      Under the{" "}
      <span className="font-medium text-foreground">Integration Info</span> tab:
      <ul className="mt-1 ml-4 list-disc space-y-1">
        <li>
          Enter a name for the integration (
          <CopyValue value="Store Signal AI" />
          ).
        </li>
        <li>
          Enter your Magento admin password in the{" "}
          <span className="font-medium text-foreground">
            Current User Identity Verification
          </span>{" "}
          section.
        </li>
      </ul>
    </>,
    <>
      Open the <span className="font-medium text-foreground">API</span> tab.
    </>,
    <>
      Set <span className="font-medium text-foreground">Resource Access</span>{" "}
      to <span className="font-medium text-foreground">All</span>.
    </>,
    <>
      Click{" "}
      <span className="font-medium text-foreground">Save and Activate</span>.
    </>,
    <>
      When prompted, click{" "}
      <span className="font-medium text-foreground">Allow</span> to authorise
      the integration.
    </>,
    "Magento will display the integration credentials.",
    <>
      Copy the value from the{" "}
      <span className="font-medium text-foreground">Access Token</span> field
      and paste it on the next step.
    </>,
  ];

  return (
    // A keyed motion.div (enter-only) rather than AnimatePresence: the two
    // sub-pages swap on `page`, and the incoming one slides in. No exit
    // animation — an AnimatePresence "wait" exit that fails to complete would
    // freeze the flow on the old page (the state flips but the DOM never
    // remounts), so we deliberately avoid depending on exit completion here.
    <motion.div
      key={page}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.24, ease: "easeInOut" }}
      className="flex flex-col gap-6"
    >
      {page === "setup" ? (
        <>
          <OnboardingHeader
            label="Step 2 of 5"
            title="Name & connect your store"
            time="2 min"
            description="Give your Magento store a name and URL, then generate an admin access token so Store Signal AI can read your catalogue, orders, and more."
          />

          <Card>
            <CardContent className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="magento-store-name">Store name</FieldLabel>
                <Input
                  id="magento-store-name"
                  name="magento-store-name"
                  placeholder="e.g. CityCraft Living"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="magento-store-url">
                  Your store URL
                </FieldLabel>
                <Input
                  id="magento-store-url"
                  name="magento-store-url"
                  placeholder="magento.example.com"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                />
              </Field>
              <p className="text-sm text-muted-foreground">
                Enter your Magento store&apos;s base URL — we point you at its
                admin panel in the steps below.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4">
              <div>
                <p className="font-semibold">
                  Generate your Magento access token
                </p>
                <p className="text-sm text-muted-foreground">
                  Follow these steps in your Magento admin, then paste the token
                  on the next step.
                </p>
              </div>
              <ol className="flex flex-col gap-3">
                {steps.map((content, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div className="text-sm text-muted-foreground">
                      {content}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={goToToken}>
              I&apos;ve generated my token <IconArrowRight />
            </Button>
          </div>
        </>
      ) : (
        <>
          <OnboardingHeader
            label="Step 2 of 5"
            title="Paste your access token"
            time="30 sec"
            description="Paste the access token you just generated. We'll verify it against your store before connecting — nothing is saved until it checks out."
          />

          <Card>
            <CardContent className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="magento-verify-url">Store URL</FieldLabel>
                <Input
                  id="magento-verify-url"
                  name="magento-verify-url"
                  placeholder="edfeb27880.nxcli.net"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  disabled={verifying}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="magento-access-token">
                  Access token
                </FieldLabel>
                <Input
                  id="magento-access-token"
                  name="magento-access-token"
                  placeholder="Paste your Magento access token"
                  className="font-mono"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={verifying}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !verifying) verify();
                  }}
                />
              </Field>
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <IconShieldCheck className="size-4" /> Your token is verified
                server-side and stored encrypted.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={verify} disabled={verifying}>
              {verifying ? (
                <>
                  <IconLoader2 className="animate-spin" /> Verifying…
                </>
              ) : (
                <>
                  Verify &amp; connect <IconArrowRight />
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
}
