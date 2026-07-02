"use client";

import { IconChevronRight } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

export type StepperStep = 0 | 1 | 2;

type StepperProps = {
  step: StepperStep;
  labels?: readonly string[];
};

export function Stepper({
  step,
  labels = ["Instructions", "Credentials", "Verify"],
}: StepperProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {labels.map((label, index) => {
        const current = index as StepperStep;
        const active = step === current;
        const done = step > current;

        return (
          <div key={label} className="flex min-w-0 items-center gap-2">
            <div
              className={cn(
                "flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors",
                active
                  ? "border-foreground/20 bg-foreground text-background"
                  : done
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-border bg-muted text-muted-foreground",
              )}
            >
              <span className="flex size-4 items-center justify-center rounded-full bg-background/10 text-[11px]">
                {index + 1}
              </span>
              <span className="truncate">{label}</span>
            </div>
            {index < labels.length - 1 && (
              <IconChevronRight className="size-4 shrink-0 text-muted-foreground" />
            )}
          </div>
        );
      })}
    </div>
  );
}
