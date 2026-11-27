"use client";

import { IconCheck } from "@tabler/icons-react";

import {
  actionLabel,
  formatDate,
  formatMoney,
  type Cycle,
} from "@/components/custom/billing/billing-format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type { BillingPlan, PlanChoice } from "@/redux/api-slice/billing-slice";

/** The biggest yearly saving across plans, e.g. 17 for "Save 17%". */
function bestYearlySaving(plans: BillingPlan[]) {
  const savings = plans
    .filter((plan) => plan.yearly_price && Number(plan.monthly_price) > 0)
    .map(
      (plan) =>
        1 - Number(plan.yearly_price) / (12 * Number(plan.monthly_price)),
    );
  const best = Math.max(0, ...savings);
  return Math.round(best * 100);
}

/** The small line under a plan's button: when it starts, or why it can't. */
function choiceHint(choice: PlanChoice, cycle: Cycle) {
  if (choice.action === "current") {
    return cycle === "monthly" ? "Renews automatically" : "Your plan";
  }
  if (choice.action === "unavailable") return choice.reason;
  if (choice.starts_today) return "Starts today";
  return choice.starts_on ? `Starts on ${formatDate(choice.starts_on)}` : "";
}

/**
 * Every plan as a card, for one billing cycle, with the Monthly / Yearly
 * switch. What each button does (upgrade, downgrade, current…) and when it
 * starts come from the backend; this only draws them.
 */
export default function PlanGrid({
  plans,
  isLoading,
  cycle,
  onCycleChange,
  currentCycle,
  disabled,
  onChoose,
}: {
  plans: BillingPlan[];
  isLoading: boolean;
  cycle: Cycle;
  onCycleChange: (cycle: Cycle) => void;
  /** The cycle the store pays on now, if any. */
  currentCycle: string | null;
  /** Payments off, or a payment already in progress. */
  disabled: boolean;
  onChoose: (plan: BillingPlan, choice: PlanChoice) => void;
}) {
  const saving = bestYearlySaving(plans);
  const shown = plans.filter((plan) => plan.choices?.[cycle]);

  return (
    <section id="plans" className="flex scroll-mt-4 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Typography variant="h5" as="h3">
            Plans
          </Typography>
          <Typography variant="muted">
            A higher plan starts today. A lower plan starts when your paid
            period ends, so you keep what you paid for.
          </Typography>
        </div>
        <Tabs
          value={cycle}
          onValueChange={(value) => onCycleChange(value as Cycle)}
        >
          <TabsList>
            <TabsTrigger value="monthly" className="px-3">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="yearly" className="px-3">
              Yearly
              {saving > 0 && (
                <Badge className={cn("ml-1", BADGE_TONE_STYLES.success)}>
                  Save {saving}%
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(15rem,1fr))]">
        {isLoading &&
          !plans.length &&
          [0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-80 rounded-xl" />
          ))}

        {shown.map((plan) => {
          const choice = plan.choices![cycle]!;
          const price = Number(choice.amount);
          const yearly = cycle === "yearly";
          const yearlySaving = Number(plan.monthly_price) * 12 - price;
          const changesCycle = Boolean(currentCycle && currentCycle !== cycle);
          const primary =
            choice.action === "upgrade" || choice.action === "subscribe";
          const locked =
            choice.action === "current" || choice.action === "unavailable";
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col gap-5 rounded-xl bg-card p-5 shadow-xs ring-1 ring-foreground/10",
                choice.is_current && "ring-2 ring-primary",
              )}
            >
              {/* Name and the current-plan tag */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Typography variant="h6" as="h4">
                    {plan.name}
                  </Typography>
                  {plan.description && (
                    <Typography variant="caption" as="p">
                      {plan.description}
                    </Typography>
                  )}
                </div>
                {choice.is_current && (
                  <Badge className={BADGE_TONE_STYLES.accent}>Current</Badge>
                )}
              </div>

              {/* Price */}
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight tabular-nums">
                    {formatMoney(price, plan.currency)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {yearly ? "year" : "month"}
                  </span>
                </div>
                <Typography variant="caption" as="p">
                  {yearly
                    ? `${formatMoney(Math.round(price / 12), plan.currency)} a month${
                        yearlySaving > 0
                          ? `, you save ${formatMoney(yearlySaving, plan.currency)}`
                          : ""
                      }`
                    : "Billed every month"}
                </Typography>
              </div>

              {/* What you get */}
              <ul className="flex flex-col gap-2 text-sm">
                {[
                  <>
                    <span className="font-semibold tabular-nums">
                      {plan.monthly_credits.toLocaleString()}
                    </span>{" "}
                    AI credits every month
                  </>,
                  "Unused credits carry forward",
                  yearly
                    ? "Paid once for 12 months"
                    : "Renews monthly, turn off any time",
                ].map((line, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <IconCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              {/* Action, and when it would start */}
              <div className="mt-auto flex flex-col gap-1.5">
                <Button
                  variant={primary ? "default" : "outline"}
                  disabled={disabled || locked}
                  onClick={() => onChoose(plan, choice)}
                >
                  {actionLabel(choice.action, cycle, changesCycle)}
                </Button>
                <Typography
                  variant="caption"
                  as="p"
                  className="min-h-4 text-center"
                >
                  {choiceHint(choice, cycle)}
                </Typography>
              </div>
            </div>
          );
        })}
      </div>

      {!isLoading && !shown.length && (
        <Typography variant="muted">
          No {cycle} plans are available right now.
        </Typography>
      )}
    </section>
  );
}
