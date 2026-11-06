"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { IconCheck, IconX } from "@tabler/icons-react";

import { StoreSnippet } from "@/components/custom/go-live-card";
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
  ONBOARDING_STEPS,
  STORE_PLATFORMS,
  type OnboardingStep,
} from "@/lib/config";
import { cn } from "@/lib/utils";
import {
  FetchDashboardChecklist,
  type ChecklistStepKey,
} from "@/redux/api-slice/dashboard-checklist-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const STEP_ORDER: ChecklistStepKey[] = [
  "connected",
  "widget_live",
  "brand_voice",
];

// Same three steps the onboarding wizard walks through, under its own key
// names — this maps the checklist's keys onto those so the title text has
// one source instead of two copies that can drift apart.
const ONBOARDING_STEP_KEY: Record<ChecklistStepKey, OnboardingStep> = {
  connected: "store_setup",
  widget_live: "go_live",
  brand_voice: "brand_voice",
};

const stepTitle = (key: ChecklistStepKey) =>
  ONBOARDING_STEPS.find((step) => step.value === ONBOARDING_STEP_KEY[key])!
    .label;

const STEP_DESCRIPTION: Record<
  Exclude<ChecklistStepKey, "connected">,
  string
> = {
  widget_live:
    "Paste the widget script into your Shopify theme (layout/theme.liquid, just before </body>) so the chat widget shows on your storefront.",
  brand_voice:
    "Name your assistant and pick how it sounds. Until then it uses the default name and the Customer Support preset.",
};

/** The extra line a finished step shows under its description. */
const STEP_DONE_DETAIL: Record<
  Exclude<ChecklistStepKey, "connected">,
  string
> = {
  widget_live: "Widget detected on your storefront",
  brand_voice: "Name and tone saved",
};

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
 * The "x/3" ring in the sidebar rail and its right-hand checklist drawer —
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
    if (selectedStore) void dispatch(FetchDashboardChecklist(selectedStore));
  }, [
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
    if (!selectedStore) return;
    const refetch = () => void dispatch(FetchDashboardChecklist(selectedStore));
    window.addEventListener("focus", refetch);
    return () => window.removeEventListener("focus", refetch);
  }, [dispatch, selectedStore]);

  // The ring hides at 3/3, so say so when the last step is finished — only
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

  // Nothing left to finish → no ring and no drawer.
  if (!checklist || checklist.pending.length === 0) return null;

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
              <div>
                <DrawerTitle className="text-xl font-semibold">
                  Finish setting up StoreSignal
                </DrawerTitle>
                <DrawerDescription>
                  Your assistant won&apos;t reach shoppers until these steps are
                  done.
                </DrawerDescription>
              </div>
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
                  </div>
                  {!step.done && (
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
