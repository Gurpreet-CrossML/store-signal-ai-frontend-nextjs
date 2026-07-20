"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  type Icon,
  IconBabyCarriage,
  IconShirt,
  IconSparkles,
  IconArmchair,
  IconSalad,
  IconDiamond,
  IconYoga,
  IconDots,
  IconArrowRight,
} from "@tabler/icons-react";
import { OnboardingHeader } from "./onboarding-header";

const CATEGORIES: {
  key: string;
  icon: Icon;
  label: string;
  detected?: boolean;
}[] = [
  { key: "baby", icon: IconBabyCarriage, label: "Baby & Kids", detected: true },
  { key: "fashion", icon: IconShirt, label: "Fashion" },
  { key: "beauty", icon: IconSparkles, label: "Beauty" },
  { key: "furniture", icon: IconArmchair, label: "Furniture" },
  { key: "food", icon: IconSalad, label: "Food" },
  { key: "luxury", icon: IconDiamond, label: "Luxury" },
  { key: "wellness", icon: IconYoga, label: "Wellness" },
  { key: "other", icon: IconDots, label: "Other" },
];

const PRIORITIES = [
  {
    key: "support",
    title: "Reduce support load",
    subtitle: "Too many repetitive tickets",
  },
  { key: "sales", title: "Increase sales", subtitle: "Convert more browsers" },
  { key: "both", title: "Both", subtitle: "Support and revenue" },
];

export function StepQuestions({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [category, setCategory] = useState("baby");
  const [priority, setPriority] = useState("both");

  return (
    <div className="flex flex-col gap-6">
      <OnboardingHeader
        label="Step 3 of 6"
        title="Two quick questions"
        time="30 sec"
        description="These two answers pre-configure everything that follows — workflows, tone, safety limits, and your dashboard. That's all we ask."
      />

      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
        <Spinner className="mt-0.5 size-4" />
        <p>
          We&apos;re already reading your store in the background —{" "}
          <span className="font-semibold">
            catalogue, policies, and past tickets.
          </span>{" "}
          Keep going; it&apos;ll be ready when you are.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-semibold">1. What do you sell?</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                aria-pressed={category === c.key}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border bg-card p-6 text-center transition-all",
                  category === c.key
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "hover:border-muted-foreground/30",
                )}
              >
                <Icon className="size-6 text-primary" aria-hidden />
                <span className="font-semibold">{c.label}</span>
                {c.detected && (
                  <span className="text-xs text-muted-foreground">Detected</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-semibold">2. What matters most right now?</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {PRIORITIES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPriority(p.key)}
              aria-pressed={priority === p.key}
              className={cn(
                "flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all",
                priority === p.key
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "hover:border-muted-foreground/30",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                  priority === p.key
                    ? "border-primary"
                    : "border-muted-foreground/40",
                )}
              >
                {priority === p.key && (
                  <span className="size-2 rounded-full bg-primary" />
                )}
              </span>
              <span className="flex flex-col">
                <span className="font-semibold">{p.title}</span>
                <span className="text-sm text-muted-foreground">
                  {p.subtitle}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>
          Continue <IconArrowRight />
        </Button>
      </div>
    </div>
  );
}
