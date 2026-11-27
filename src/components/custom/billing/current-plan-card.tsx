"use client";

import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCalendarEvent,
  IconCoins,
  IconCrown,
} from "@tabler/icons-react";

import {
  formatDate,
  formatMoney,
} from "@/components/custom/billing/billing-format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type { CreditStatus } from "@/redux/api-slice/ai-usage-slice";
import type { BillingOverview } from "@/redux/api-slice/billing-slice";

/** A coloured note inside the card (scheduled change, failing payment…). */
function Notice({
  tone,
  icon: Icon,
  children,
}: {
  tone: BadgeTone;
  icon: typeof IconCalendarEvent;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
        BADGE_TONE_STYLES[tone],
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        {children}
      </div>
    </div>
  );
}

/** One label / value pair in the plan facts row. */
function Fact({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <Typography variant="caption" as="dt">
        {label}
      </Typography>
      <dd className="font-medium tabular-nums">{value}</dd>
      {note && (
        <Typography variant="caption" as="dd">
          {note}
        </Typography>
      )}
    </div>
  );
}

/**
 * The store's plan as it stands: name, price, renewal, what changes next,
 * and the actions on it. Built from the credit status and the billing
 * overview; it decides nothing itself.
 */
export function CurrentPlanCard({
  credits,
  overview,
  busy,
  onChangePlan,
  onTurnOff,
  onCancelChange,
}: {
  credits: CreditStatus | null;
  overview: BillingOverview | null;
  busy: boolean;
  onChangePlan: () => void;
  onTurnOff: () => void;
  onCancelChange: () => void;
}) {
  if (!credits || !overview) {
    return <Skeleton className="h-64 rounded-xl desktop:col-span-2" />;
  }

  const autoRenew = overview.auto_renew;
  const yearly = overview.yearly_plan;
  const scheduled = overview.scheduled_change;
  const onPaidPlan = Boolean(credits.plan && !credits.is_free);
  const failing = autoRenew?.status === "pending";

  // Badges: billing cycle, then where the renewal stands.
  const cycleText = yearly
    ? "Yearly"
    : autoRenew
      ? "Monthly"
      : credits.is_free
        ? "Free"
        : credits.billing_cycle === "yearly"
          ? "Yearly"
          : "Monthly";
  const status: { label: string; tone: BadgeTone } | null = failing
    ? { label: "Payment failing", tone: "danger" }
    : autoRenew && !autoRenew.cancel_at_cycle_end
      ? { label: "Auto-renew on", tone: "success" }
      : autoRenew
        ? { label: "Auto-renew off", tone: "neutral" }
        : yearly
          ? { label: "Paid for the year", tone: "info" }
          : null;

  const price = autoRenew
    ? `${formatMoney(autoRenew.amount, autoRenew.currency)} / month`
    : yearly
      ? `${formatMoney(yearly.amount, yearly.currency)} / year`
      : credits.is_free
        ? "Free"
        : null;

  // The first fact says what happens at the end of this period.
  const endFact =
    autoRenew && !autoRenew.cancel_at_cycle_end && autoRenew.next_charge_on
      ? {
          label: "Next charge",
          value: formatDate(autoRenew.next_charge_on),
          note: formatMoney(autoRenew.amount, autoRenew.currency),
        }
      : yearly
        ? { label: "Paid until", value: formatDate(yearly.ends_on) }
        : overview.paid_until
          ? {
              label: "Plan ends on",
              value: formatDate(overview.paid_until),
              note: scheduled ? `Then ${scheduled.plan.name}` : "Not renewing",
            }
          : credits.end_date
            ? { label: "Plan month ends", value: formatDate(credits.end_date) }
            : null;

  return (
    <Card className="desktop:col-span-2">
      <CardContent className="flex flex-col gap-5 py-6">
        {/* Plan name, badges and price */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconCrown className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <Typography variant="caption" as="p">
                Current plan
              </Typography>
              <div className="flex flex-wrap items-center gap-2">
                <Typography variant="h4" as="h3">
                  {credits.plan?.name ?? "No plan"}
                </Typography>
                <Badge className={BADGE_TONE_STYLES.neutral}>{cycleText}</Badge>
                {status && (
                  <Badge className={BADGE_TONE_STYLES[status.tone]}>
                    {status.label}
                  </Badge>
                )}
              </div>
              {price && (
                <Typography variant="muted" className="tabular-nums">
                  {price}
                </Typography>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!overview.payments_enabled}
              onClick={onChangePlan}
            >
              {onPaidPlan ? "Change plan" : "Choose a plan"}
            </Button>
          </div>
        </div>

        {/* Key facts */}
        <dl className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4 sm:grid-cols-3">
          {endFact && <Fact {...endFact} />}
          {credits.start_date && credits.end_date && (
            <Fact
              label="This plan month"
              value={`${formatDate(credits.start_date)} – ${formatDate(credits.end_date)}`}
            />
          )}
          <Fact
            label="Credits each month"
            value={
              credits.monthly_credits
                ? credits.monthly_credits.toLocaleString()
                : "–"
            }
          />
        </dl>

        {/* What needs attention, or what comes next */}
        {!overview.payments_enabled && (
          <Notice tone="warning" icon={IconAlertTriangle}>
            Online payments are not set up yet. Contact support to change your
            plan.
          </Notice>
        )}
        {failing && (
          <Notice tone="danger" icon={IconAlertTriangle}>
            Razorpay couldn&apos;t take this month&apos;s payment and is trying
            again. If it keeps failing, the AI stops when your plan month ends.
          </Notice>
        )}
        {scheduled && (
          <Notice tone="info" icon={IconCalendarEvent}>
            <span>
              <span className="font-semibold">{scheduled.plan.name}</span> (
              {scheduled.billing_cycle}) starts on{" "}
              <span className="font-semibold">
                {formatDate(scheduled.starts_on)}
              </span>
              . Until then you keep {credits.plan?.name}.
            </span>
            {scheduled.can_cancel ? (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-inherit underline"
                disabled={busy}
                onClick={onCancelChange}
              >
                Cancel this change
              </Button>
            ) : (
              <span className="text-xs opacity-80">
                Already paid, so it can&apos;t be cancelled online.
              </span>
            )}
          </Notice>
        )}
        {!onPaidPlan && (
          <Typography variant="muted">
            You&apos;re on the free plan. Pick a plan below to get AI credits
            every month.
          </Typography>
        )}

        {autoRenew && !autoRenew.cancel_at_cycle_end && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              disabled={busy}
              onClick={onTurnOff}
            >
              Turn off auto-renew
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Credits left, what the plan adds, and where to buy more. */
export function CreditsCard({
  credits,
  canBuy,
  onBuyCredits,
}: {
  credits: CreditStatus | null;
  canBuy: boolean;
  onBuyCredits: () => void;
}) {
  if (!credits) return <Skeleton className="h-64 rounded-xl" />;
  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-4 py-6">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconCoins className="size-4.5" />
          </div>
          <Typography variant="small" as="h3">
            AI credits
          </Typography>
        </div>
        <div>
          <Typography variant="h2" as="p" className="tabular-nums">
            {credits.balance.toLocaleString()}
          </Typography>
          <p
            className={cn(
              "text-xs",
              credits.has_quota ? "text-muted-foreground" : "text-destructive",
            )}
          >
            {credits.has_quota
              ? "Credits left. The AI is replying normally."
              : "Out of credits: the AI has stopped replying."}
          </p>
        </div>
        {credits.monthly_credits ? (
          <Typography variant="caption" as="p">
            Your plan adds {credits.monthly_credits.toLocaleString()} credits
            every plan month. Paid credits you don&apos;t use carry forward.
          </Typography>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled={!canBuy} onClick={onBuyCredits}>
            Buy credits
          </Button>
          <Button variant="link" size="sm" asChild>
            <Link href="/settings/ai-usage">
              See usage <IconArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
