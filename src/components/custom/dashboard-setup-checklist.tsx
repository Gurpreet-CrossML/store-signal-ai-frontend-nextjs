"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "@/redux/api-slice/dashboard-slice";
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

const STEP_DESCRIPTION: Record<ChecklistStepKey, string> = {
  connected: "Choose your platform and authorize access to your store.",
  widget_live:
    "Paste the widget script into your Shopify theme (layout/theme.liquid, just before </body>) so the chat widget shows on your storefront.",
  brand_voice:
    "Name your assistant and pick how it sounds. Until then it uses the default name and the Customer Support preset.",
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
    (state) => state.GetDashboardReducer.FetchDashboardChecklistState,
  );
  const selectedStore = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const pathname = usePathname();

  // Re-fetches on every navigation (not just store switches) so a step
  // finished on another page (e.g. picking a tone preset) shows as done
  // the moment you're back, instead of needing a hard refresh — the
  // sidebar that renders this never unmounts between pages.
  useEffect(() => {
    if (selectedStore) void dispatch(FetchDashboardChecklist(selectedStore));
  }, [dispatch, selectedStore, pathname]);

  if (!checklist || checklist.pending.length === 0) return null;

  const percent = Math.round((checklist.completed / checklist.total) * 100);

  return (
    <>
      <SidebarMenuButton
        tooltip="Finish setting up StoreSignal"
        className="relative justify-center overflow-visible"
        aria-label={`Setup ${checklist.completed} of ${checklist.total} complete`}
        onClick={() => setOpen(true)}
      >
        <ProgressRing completed={checklist.completed} total={checklist.total} />
      </SidebarMenuButton>

      <Drawer direction="right" open={open} onOpenChange={setOpen}>
        <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:rounded-none data-[vaul-drawer-direction=right]:sm:w-1/2 data-[vaul-drawer-direction=right]:sm:max-w-none">
          <DrawerHeader className="gap-3 border-b bg-primary/5 pb-4">
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
              <span className="text-xs text-muted-foreground">
                {checklist.completed} of {checklist.total} complete
              </span>
              <span className="text-xs font-semibold text-primary tabular-nums">
                {percent}%
              </span>
            </div>
            <Progress value={percent} className="h-2 bg-primary/15" />
          </DrawerHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
            {STEP_ORDER.map((key, index) => {
              const step = checklist.steps[key];
              const isCurrent = key === checklist.pending[0];
              return (
                <div
                  key={key}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl border p-3",
                    isCurrent
                      ? "border-primary/30 bg-primary/5"
                      : "border-transparent",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                        step.done
                          ? "border-primary bg-primary text-primary-foreground"
                          : isCurrent && "border-primary text-primary",
                      )}
                    >
                      {step.done ? (
                        <IconCheck className="size-3.5" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            step.done && "text-muted-foreground line-through",
                          )}
                        >
                          {stepTitle(key)}
                        </span>
                        {!step.done && key === "widget_live" && (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                            Widget not detected
                          </span>
                        )}
                        {step.skipped && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            Skipped
                          </span>
                        )}
                      </div>
                      {step.done ? (
                        key === "connected" ? (
                          <p className="text-xs text-muted-foreground">
                            {checklist.store.name} ·{" "}
                            {STORE_PLATFORMS.find(
                              (p) => p.value === checklist.store.platform,
                            )?.label ?? checklist.store.platform}{" "}
                            connected
                          </p>
                        ) : null
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {STEP_DESCRIPTION[key]}
                        </p>
                      )}
                    </div>
                    {step.done && key === "connected" && (
                      <Link
                        href="/settings/store"
                        className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        Manage
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
