"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  IconArrowRight,
  IconCheck,
  IconClock,
  IconFileText,
  IconX,
} from "@tabler/icons-react";

import { StoreSnippet } from "@/components/custom/go-live-card";
import { useMetaOAuth } from "@/components/custom/settings/social-ai/use-meta-oauth";
import { useCan } from "@/hooks/use-can";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import {
  KNOWLEDGE_APPROVAL_WAITING_HREF,
  KNOWLEDGE_SCAN_ACTIVE_STATUSES,
  KNOWLEDGE_SCAN_POLL_MS,
  ONBOARDING_STEPS,
  SocialAIPlatformOptions,
  STORE_PLATFORMS,
  type OnboardingStep,
} from "@/lib/config";
import { cn } from "@/lib/utils";
import {
  FetchDashboardChecklist,
  type ChecklistStep,
  type ChecklistStepKey,
} from "@/redux/api-slice/dashboard-checklist-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const STEP_ORDER: ChecklistStepKey[] = [
  "connected",
  "widget_live",
  "brand_voice",
  "knowledge",
  "social",
];

// The first three are the steps the onboarding wizard walks through, under
// its own key names — this maps the checklist's keys onto those so the
// title text has one source instead of two copies that can drift apart.
// Knowledge and social are checklist-only, so they have no wizard step.
const ONBOARDING_STEP_KEY: Record<
  Exclude<ChecklistStepKey, "knowledge" | "social">,
  OnboardingStep
> = {
  connected: "store_setup",
  widget_live: "go_live",
  brand_voice: "brand_voice",
};

const CHECKLIST_ONLY_TITLE: Record<"knowledge" | "social", string> = {
  knowledge: "Add knowledge",
  social: "Connect social accounts",
};

const stepTitle = (key: ChecklistStepKey) =>
  key === "knowledge" || key === "social"
    ? CHECKLIST_ONLY_TITLE[key]
    : ONBOARDING_STEPS.find((step) => step.value === ONBOARDING_STEP_KEY[key])!
        .label;

const STEP_DESCRIPTION: Record<
  Exclude<ChecklistStepKey, "connected">,
  string
> = {
  widget_live:
    "Paste the widget script into your Shopify theme (layout/theme.liquid, just before </body>) so the chat widget shows on your storefront.",
  brand_voice:
    "Name your assistant and pick how it sounds. Until then it uses the default name and the Customer Support preset.",
  knowledge:
    "Add website pages, documents or questions and answers so your assistant can answer shoppers about your policies, shipping and returns.",
  social:
    "Sign in with Meta to connect Facebook, Instagram and WhatsApp. You choose which accounts to connect in the Meta window.",
};

/** The extra line a finished step shows under its description. */
const STEP_DONE_DETAIL: Record<
  Exclude<ChecklistStepKey, "connected">,
  string
> = {
  widget_live: "Widget detected on your storefront",
  brand_voice: "Name and tone saved",
  knowledge: "Knowledge added to your assistant",
  social: "Social accounts connected",
};

/**
 * What the automatic import of the store's policy pages did, under the
 * knowledge step: still scanning, or how many pages it published and how many
 * wait for the user's approval, with a button to review those. Nothing for a
 * store that was never scanned.
 */
function KnowledgeImportNote({
  step,
  onNavigate,
}: {
  step: ChecklistStep;
  onNavigate: () => void;
}) {
  const published = step.auto_published ?? 0;
  const waiting = step.approval_waiting ?? 0;
  const pages = (count: number) => `${count} ${count === 1 ? "page" : "pages"}`;

  if (step.scan && KNOWLEDGE_SCAN_ACTIVE_STATUSES.includes(step.scan)) {
    return (
      <p className="mt-1 text-xs font-medium text-primary">
        Scanning your website for policy and help pages…
      </p>
    );
  }
  if (published === 0 && waiting === 0) return null;

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-primary/5 px-4 py-3 text-sm">
        {published > 0 && (
          <span className="flex items-center gap-2 font-bold text-primary">
            <IconFileText className="size-4" />
            {pages(published)} added
          </span>
        )}
        {published > 0 && waiting > 0 && (
          <span aria-hidden className="h-5 w-px bg-border" />
        )}
        {waiting > 0 && (
          <span className="flex items-center gap-2 font-medium">
            <IconClock className="size-4 text-primary" />
            {pages(waiting)} waiting for approval
          </span>
        )}
      </div>
      {waiting > 0 && (
        <Button type="button" size="sm" className="mt-3" asChild>
          <Link href={KNOWLEDGE_APPROVAL_WAITING_HREF} onClick={onNavigate}>
            Review {pages(waiting)} for approval
            <IconArrowRight />
          </Link>
        </Button>
      )}
    </>
  );
}

/**
 * The social step's chips and buttons. Its own component so the Meta popup
 * listener only lives while the drawer is open — the sidebar ring never
 * unmounts, and a second always-on listener would double the toast when
 * connecting from the Social AI settings page.
 */
function ConnectSocialActions({
  storeCode,
  onSkip,
}: {
  storeCode: string;
  onSkip: () => void;
}) {
  const dispatch = useAppDispatch();
  const refetch = useCallback(
    () => void dispatch(FetchDashboardChecklist(storeCode)),
    [dispatch, storeCode],
  );
  const { startMetaOAuth, isStarting } = useMetaOAuth(storeCode, refetch);

  return (
    <div className="flex flex-col gap-3 pl-9">
      <div className="flex flex-wrap gap-2">
        {Object.entries(SocialAIPlatformOptions).map(
          ([key, { label, icon: Icon, color }]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-sm"
            >
              <Icon className={cn("size-4", color)} />
              {label}
            </span>
          ),
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isStarting}
          onClick={() => void startMetaOAuth()}
        >
          Connect with Meta
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-primary text-primary hover:bg-primary/5 hover:text-primary"
          onClick={onSkip}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}

/** A circular progress ring, filled proportional to completed/total, with
    the "done/total" count centered inside. */
function ProgressRing({
  completed,
  total,
  size = 32,
  stroke = 3.5,
}: {
  completed: number;
  total: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (total ? completed / total : 0));
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* The sidebar button forces every nested <svg> to size-4/size-5 via a
          `[&_svg]:size-*` class rule; an inline style (higher specificity
          than any class) is what actually wins against it. viewBox is set
          too, as a fallback so the drawing stays proportional even if
          something smaller still gets through. */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        style={{ width: size, height: size }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-primary/15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary tabular-nums">
        {completed}/{total}
      </span>
    </span>
  );
}

/**
 * The "x/5" ring in the sidebar rail and its right-hand checklist drawer —
 * the dashboard's persistent reminder of onboarding steps the wizard lets a
 * merchant click through (or skip) without actually finishing. Independent
 * of that wizard: it reflects each step's real, current state for whichever
 * store is selected (same ``store_code``-scoped pattern every other
 * dashboard report uses), and re-fetches on every store switch. Closing the
 * drawer only hides the drawer — the ring stays and reappears on its own
 * next time, for as long as a step is pending.
 */
export function DashboardSetupChecklist() {
  const dispatch = useAppDispatch();
  // Store setup progress is for the store owner and manager only; agents
  // and content managers neither fetch it nor see the ring.
  const canSetup = useCan("setup");
  const [open, setOpen] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);

  const { FetchDashboardChecklistData: checklist } = useAppSelector(
    (state) => state.GetDashboardChecklistReducer.FetchDashboardChecklistState,
  );
  const selectedStore = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const pathname = usePathname();
  // Steps finished without leaving the page: the wizard's last step (the
  // session's onboarding step moves on) and a brand voice save.
  const { data: session } = useSession();
  const onboardingStep = session?.user?.onboarding_step;
  const savedPersona = useAppSelector(
    (state) =>
      state.GetBrandVoiceReducer.CreatePersonaIdentityState
        .CreatePersonaIdentityData,
  );
  const savedTone = useAppSelector(
    (state) =>
      state.GetBrandVoiceReducer.CreateToneStyleState.CreateToneStyleData,
  );

  // Re-fetches on every navigation (not just store switches) so a step
  // finished on another page (e.g. picking a tone preset) shows as done
  // the moment you're back, instead of needing a hard refresh — the
  // sidebar that renders this never unmounts between pages.
  useEffect(() => {
    if (canSetup && selectedStore)
      void dispatch(FetchDashboardChecklist(selectedStore));
  }, [
    canSetup,
    dispatch,
    selectedStore,
    pathname,
    onboardingStep,
    savedPersona,
    savedTone,
  ]);

  // The widget goes live in another tab (the storefront), so check again
  // when the merchant comes back to this one.
  useEffect(() => {
    if (!canSetup || !selectedStore) return;
    const refetch = () => void dispatch(FetchDashboardChecklist(selectedStore));
    window.addEventListener("focus", refetch);
    return () => window.removeEventListener("focus", refetch);
  }, [canSetup, dispatch, selectedStore]);

  // The import of the store's pages runs in the background, so check again
  // every few seconds until it is complete (queued or running).
  const scan = checklist?.steps.knowledge.scan;
  const scanning = !!scan && KNOWLEDGE_SCAN_ACTIVE_STATUSES.includes(scan);
  useEffect(() => {
    if (!selectedStore || !scanning) return;
    const timer = window.setInterval(
      () => void dispatch(FetchDashboardChecklist(selectedStore)),
      KNOWLEDGE_SCAN_POLL_MS,
    );
    return () => window.clearInterval(timer);
  }, [dispatch, selectedStore, scanning]);

  // The ring hides at all steps done, so say so when the last step is finished — only
  // on that change for the same store, not on load or a store switch.
  const previous = useRef<{ code: string; pending: number } | null>(null);
  useEffect(() => {
    if (!checklist) return;
    const { code } = checklist.store;
    const pending = checklist.pending.length;
    if (
      pending === 0 &&
      previous.current?.code === code &&
      previous.current.pending > 0
    ) {
      toast.success("Setup complete", {
        description: "Your assistant is ready for shoppers.",
      });
    }
    previous.current = { code, pending };
  }, [checklist]);

  // Nothing left to finish, or a role that does not set the store up → no
  // ring and no drawer.
  if (!canSetup || !checklist || checklist.pending.length === 0) return null;

  const percent = Math.round((checklist.completed / checklist.total) * 100);
  const platformLabel =
    STORE_PLATFORMS.find((p) => p.value === checklist.store.platform)?.label ??
    checklist.store.platform;

  const doneActionClass =
    "shrink-0 text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80";

  return (
    <>
      <SidebarMenuButton
        tooltip="Finish setting up StoreSignal"
        className="relative justify-center overflow-visible"
        aria-label={`Setup ${checklist.completed} of ${checklist.total} complete`}
        onClick={() => setOpen(true)}
      >
        <ProgressRing completed={checklist.completed} total={checklist.total} />
        <span
          aria-hidden
          className="absolute top-0.5 right-0.5 size-2.5 rounded-full bg-destructive ring-2 ring-sidebar"
        />
      </SidebarMenuButton>

      <Drawer direction="right" open={open} onOpenChange={setOpen}>
        <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:rounded-none data-[vaul-drawer-direction=right]:sm:w-1/2 data-[vaul-drawer-direction=right]:sm:max-w-none">
          <DrawerHeader className="gap-3 border-b bg-primary/5 px-6 py-5">
            <div className="flex items-start justify-between gap-2">
              {/* Only social left → the assistant already reaches shoppers. */}
              {checklist.pending.length === 1 &&
              checklist.pending[0] === "social" ? (
                <div>
                  <DrawerTitle className="text-xl font-semibold">
                    Almost done
                  </DrawerTitle>
                  <DrawerDescription>
                    Your assistant is live on your store. Connect your social
                    accounts so it can reply there too.
                  </DrawerDescription>
                </div>
              ) : (
                <div>
                  <DrawerTitle className="text-xl font-semibold">
                    Finish setting up StoreSignal
                  </DrawerTitle>
                  <DrawerDescription>
                    Your assistant won&apos;t reach shoppers until these steps
                    are done.
                  </DrawerDescription>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Close setup checklist"
                onClick={() => setOpen(false)}
              >
                <IconX />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {checklist.completed} of {checklist.total} complete
              </span>
              <span className="text-sm font-semibold text-primary tabular-nums">
                {percent}%
              </span>
            </div>
            <Progress value={percent} className="h-2 bg-primary/15" />
          </DrawerHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
            {STEP_ORDER.map((key, index) => {
              const step = checklist.steps[key];
              const isCurrent = key === checklist.pending[0];
              return (
                <div
                  key={key}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl px-2 py-4",
                    isCurrent && "bg-primary/5",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                        step.done
                          ? "border-primary bg-primary text-primary-foreground"
                          : isCurrent
                            ? "border-primary text-primary"
                            : "border-border text-muted-foreground",
                      )}
                    >
                      {step.done ? (
                        <IconCheck className="size-3.5" stroke={3.5} />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold">
                          {stepTitle(key)}
                        </span>
                        {step.done && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            Done
                          </span>
                        )}
                        {!step.done && key === "widget_live" && (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                            Widget not detected
                          </span>
                        )}
                        {!step.done && step.skipped && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                            Skipped
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                        {key === "connected"
                          ? `Connect your ${platformLabel} store so the assistant can read your products, orders and customers.`
                          : STEP_DESCRIPTION[key]}
                      </p>
                      {key === "knowledge" && (
                        <KnowledgeImportNote
                          step={step}
                          onNavigate={() => setOpen(false)}
                        />
                      )}
                      {step.done && (
                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          {key === "connected"
                            ? `Connected: ${checklist.store.name} · ${platformLabel}`
                            : STEP_DONE_DETAIL[key]}
                        </p>
                      )}
                    </div>
                    {step.done && key === "connected" && (
                      <Link
                        href="/settings/store"
                        className={doneActionClass}
                        onClick={() => setOpen(false)}
                      >
                        Manage
                      </Link>
                    )}
                    {step.done && key === "widget_live" && (
                      <button
                        type="button"
                        className={doneActionClass}
                        onClick={() => setScriptOpen(true)}
                      >
                        View script
                      </button>
                    )}
                    {step.done && key === "brand_voice" && (
                      <Link
                        href="/brand-voice/persona-identity"
                        className={doneActionClass}
                        onClick={() => setOpen(false)}
                      >
                        Edit
                      </Link>
                    )}
                    {step.done && key === "knowledge" && (
                      <Link
                        href="/knowledge"
                        className={doneActionClass}
                        onClick={() => setOpen(false)}
                      >
                        Manage
                      </Link>
                    )}
                    {step.done && key === "social" && (
                      <Link
                        href="/settings/social-ai/accounts"
                        className={doneActionClass}
                        onClick={() => setOpen(false)}
                      >
                        Manage
                      </Link>
                    )}
                  </div>
                  {!step.done && key === "social" && (
                    <ConnectSocialActions
                      storeCode={checklist.store.code}
                      onSkip={() => setOpen(false)}
                    />
                  )}
                  {!step.done && key !== "social" && (
                    <div className="flex flex-wrap gap-2 pl-9">
                      {key === "widget_live" && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setScriptOpen(true)}
                        >
                          Get widget script
                        </Button>
                      )}
                      {key === "knowledge" && (
                        <Button type="button" size="sm" asChild>
                          <Link
                            href="/knowledge/new"
                            onClick={() => setOpen(false)}
                          >
                            Add knowledge
                          </Link>
                        </Button>
                      )}
                      {key === "brand_voice" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-primary text-primary hover:bg-primary/5 hover:text-primary"
                          asChild
                        >
                          {/* Agent Name already saved → send them straight to
                              the tone page instead of back through persona. */}
                          <Link
                            href={
                              step.persona_done
                                ? "/brand-voice/tone-and-style"
                                : "/brand-voice/persona-identity"
                            }
                            onClick={() => setOpen(false)}
                          >
                            {step.persona_done
                              ? "Pick a tone preset"
                              : "Set up brand voice"}
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog open={scriptOpen} onOpenChange={setScriptOpen}>
        <DialogContent className="max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Widget Script</DialogTitle>
            <DialogDescription>
              Add this to the storefront so the chat widget loads.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto">
            <StoreSnippet store={checklist.store} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
