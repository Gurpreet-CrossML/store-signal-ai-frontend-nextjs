"use client";

import {
  IconAlertTriangle,
  IconArrowRight,
  IconInfoCircle,
  IconLock,
} from "@tabler/icons-react";

import {
  formatDate,
  formatMoney,
  type Cycle,
} from "@/components/custom/billing/billing-format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type { BillingPlan, PlanChoice } from "@/redux/api-slice/billing-slice";

/** A plan the owner picked, waiting for them to confirm and pay. */
export type PlanTarget = {
  plan: BillingPlan;
  cycle: Cycle;
  choice: PlanChoice;
};

const TITLES: Partial<Record<PlanChoice["action"], string>> = {
  subscribe: "Start the {plan} plan",
  upgrade: "Upgrade to {plan}",
  downgrade: "Downgrade to {plan}",
  switch: "Switch to {plan}",
  renew: "Renew {plan}",
};

/**
 * Review step before Razorpay opens: what changes, when it starts, what is
 * paid today and what happens to the current plan. Every fact comes from the
 * backend's plan choice.
 */
export default function ChangePlanDialog({
  target,
  currentPlanName,
  currentCycle,
  busy,
  onClose,
  onConfirm,
}: {
  target: PlanTarget | null;
  currentPlanName: string | null;
  currentCycle: string | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (target: PlanTarget) => void;
}) {
  if (!target) return null;
  const { plan, cycle, choice } = target;
  const currency = plan.currency;
  const yearly = cycle === "yearly";
  const payToday = Number(choice.pay_today);
  const startsWhen = choice.starts_today
    ? "Today"
    : choice.starts_on
      ? formatDate(choice.starts_on)
      : "–";
  const title = (TITLES[choice.action] ?? "Change to {plan}").replace(
    "{plan}",
    `${plan.name}${choice.action === "switch" || choice.action === "renew" ? ` (${cycle})` : ""}`,
  );

  // What happens around the change, in plain words.
  const notes: { text: string; warn?: boolean }[] = [];
  if (choice.yearly_stops_on && currentPlanName) {
    notes.push({
      warn: true,
      text: `Your yearly ${currentPlanName} plan stops today. It was paid until ${formatDate(choice.yearly_stops_on)}; the months left are not refunded.`,
    });
  } else if (choice.current_ends_on && currentPlanName) {
    notes.push({
      text: choice.starts_today
        ? `Your ${currentPlanName} plan stops today. Credits you haven't used stay in your balance.`
        : `You keep ${currentPlanName} until ${formatDate(choice.current_ends_on)}. Then ${plan.name} starts.`,
    });
  }
  if (choice.free_credits_end) {
    notes.push({ text: "Your free credits end when this plan starts." });
  }
  if (!yearly && payToday === 0) {
    notes.push({
      text: `Nothing is charged today. Razorpay may take a small amount (like ₹5) to approve auto-pay and gives it back. The first ${formatMoney(choice.amount, currency)} is charged on ${startsWhen}.`,
    });
  }
  notes.push({
    text: yearly
      ? "Paid once. Credits are added every month for 12 months, and we email you before the year ends."
      : "Renews every month. You can turn off auto-renew at any time.",
  });

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Check the details, then pay securely with Razorpay.
          </DialogDescription>
        </DialogHeader>

        {/* From → to, then the numbers */}
        <div className="flex flex-col gap-3 rounded-lg bg-muted/60 p-4 text-sm ring-1 ring-foreground/5">
          <div className="flex items-center gap-2 font-medium">
            {currentPlanName && (
              <>
                <span className="text-muted-foreground">
                  {currentPlanName}
                  {currentCycle ? ` · ${currentCycle}` : ""}
                </span>
                <IconArrowRight className="size-4 text-muted-foreground" />
              </>
            )}
            <span>
              {plan.name} · {cycle}
            </span>
          </div>
          <Separator />
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <dt className="text-muted-foreground">Starts</dt>
            <dd className="text-right">{startsWhen}</dd>
            <dt className="text-muted-foreground">AI credits</dt>
            <dd className="text-right tabular-nums">
              {plan.monthly_credits.toLocaleString()} every month
            </dd>
            <dt className="text-muted-foreground">Price</dt>
            <dd className="text-right tabular-nums">
              {formatMoney(choice.amount, currency)}{" "}
              {yearly ? "once for the year" : "every month"}
            </dd>
          </dl>
          <Separator />
          <div className="flex items-baseline justify-between">
            <span className="font-medium">Pay today</span>
            <span className="text-xl font-semibold tabular-nums">
              {formatMoney(payToday, currency)}
            </span>
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li
              key={note.text}
              className={cn(
                "flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
                note.warn
                  ? BADGE_TONE_STYLES.warning
                  : "border-transparent px-0 py-0 text-muted-foreground",
              )}
            >
              {note.warn ? (
                <IconAlertTriangle className="mt-px size-4 shrink-0" />
              ) : (
                <IconInfoCircle className="mt-px size-4 shrink-0" />
              )}
              <span>{note.text}</span>
            </li>
          ))}
        </ul>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button disabled={busy} onClick={() => onConfirm(target)}>
            {busy && <Spinner className="size-4" />}
            {payToday > 0
              ? `Pay ${formatMoney(payToday, currency)}`
              : "Approve auto-pay"}
          </Button>
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <IconLock className="size-3.5" /> Secured by Razorpay
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
