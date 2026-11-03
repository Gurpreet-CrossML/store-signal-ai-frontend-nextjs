"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

const STEP_DESCRIPTION: Record<ChecklistStepKey, string> = {
  connected: "Choose your platform and authorize access to your store.",
  widget_live:
    "Paste the widget script into your storefront so the chat widget shows up for shoppers.",
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
    (state) => state.GetDashboardChecklistReducer.FetchDashboardChecklistState,
  );
  const selectedStore = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  useEffect(() => {
    if (selectedStore) void dispatch(FetchDashboardChecklist(selectedStore));
  }, [dispatch, selectedStore]);

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
        <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:rounded-none data-[vaul-drawer-direction=right]:sm:max-w-md">
          <DrawerHeader className="gap-3 pb-2">
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
                variant="ghost"
                size="icon-sm"
                aria-label="Close setup checklist"
                onClick={() => setOpen(false)}
              >
                <IconX />
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={percent} className="h-2" />
              <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                {percent}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {checklist.completed} of {checklist.total} complete
            </span>
          </DrawerHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
            {STEP_ORDER.map((key, index) => {
              const step = checklist.steps[key];
              return (
                <div
                  key={key}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl border p-3",
                    !step.done && "border-primary/30 bg-primary/5",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                        step.done &&
                          "border-primary bg-primary text-primary-foreground",
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
                      ) : key === "brand_voice" ? (
                        <ul className="flex flex-col gap-0.5">
                          {(
                            [
                              ["Persona Identity", step.persona_done],
                              ["Tone & Style", step.tone_done],
                            ] as const
                          ).map(([label, done]) => (
                            <li
                              key={label}
                              className="flex items-center gap-1.5 text-xs"
                            >
                              {done ? (
                                <IconCheck className="size-3 shrink-0 text-primary" />
                              ) : (
                                <span className="size-3 shrink-0 rounded-full border border-muted-foreground/40" />
                              )}
                              <span
                                className={
                                  done
                                    ? "text-muted-foreground line-through"
                                    : "text-muted-foreground"
                                }
                              >
                                {label}
                              </span>
                            </li>
                          ))}
                        </ul>
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
