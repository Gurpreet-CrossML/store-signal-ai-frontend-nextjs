"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  formatDate,
  type Cycle,
} from "@/components/custom/billing/billing-format";
import BuyCreditsDialog from "@/components/custom/billing/buy-credits-dialog";
import ChangePlanDialog, {
  type PlanTarget,
} from "@/components/custom/billing/change-plan-dialog";
import {
  CreditsCard,
  CurrentPlanCard,
} from "@/components/custom/billing/current-plan-card";
import PaymentHistory from "@/components/custom/billing/payment-history";
import PlanGrid from "@/components/custom/billing/plan-grid";
import { PageHeading } from "@/components/custom/page-heading";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  CheckoutDismissed,
  openRazorpayCheckout,
} from "@/lib/razorpay-checkout";
import { fetchCreditStatus } from "@/redux/api-slice/ai-usage-slice";
import {
  cancelAutoRenew,
  createBillingCheckout,
  fetchBillingOverview,
  fetchBillingPlans,
  fetchTopUpPacks,
  verifyBillingPayment,
  type CheckoutRequest,
} from "@/redux/api-slice/billing-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

// Re-read billing this long after an unconfirmed payment (ms), so a webhook
// that lands a little later still shows up without a reload.
const RECHECK_AFTER_MS = [4000, 12000];

/**
 * Plans & Billing: the current plan, every plan to move to (with what each
 * change does), extra credits and past payments. Owner only.
 */
export default function Billing({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const dispatch = useAppDispatch();
  const credits = useAppSelector(
    (state) =>
      state.GetAIUsageReducer.FetchCreditStatusState.FetchCreditStatusData,
  );
  const {
    FetchBillingPlansState,
    FetchTopUpPacksState,
    FetchBillingOverviewState,
  } = useAppSelector((state) => state.GetBillingReducer);
  const plans = FetchBillingPlansState.FetchBillingPlansData;
  const packs = FetchTopUpPacksState.FetchTopUpPacksData;
  const overview = FetchBillingOverviewState.FetchBillingOverviewData;

  // The owner's pick; until then the view follows the cycle they pay on.
  const [pickedCycle, setCycle] = useState<Cycle | null>(null);
  const [target, setTarget] = useState<PlanTarget | null>(null);
  const [packsOpen, setPacksOpen] = useState(false);
  const [confirm, setConfirm] = useState<"turn_off" | "cancel_change" | null>(
    null,
  );
  // Which payment is waiting, e.g. "top_up-3", so only its button spins.
  const [busy, setBusy] = useState<string | null>(null);
  // Set before the first await: a fast double click can't start two payments.
  const paying = useRef(false);

  const refresh = useCallback(() => {
    dispatch(fetchBillingOverview());
    dispatch(fetchBillingPlans());
    // Credits belong to the company, so this doesn't wait for a store to be
    // picked (on phones the store picker only loads with the menu).
    dispatch(fetchCreditStatus({ storeCode: "" }));
  }, [dispatch]);

  useEffect(() => {
    refresh();
    dispatch(fetchTopUpPacks());
  }, [dispatch, refresh]);

  const currentCycle =
    credits?.plan && !credits.is_free ? credits.billing_cycle : null;
  const cycle: Cycle =
    pickedCycle ?? (currentCycle === "yearly" ? "yearly" : "monthly");

  const enabled = Boolean(overview?.payments_enabled);
  const onPaidPlan = Boolean(credits?.plan && !credits.is_free);

  /** Start a Razorpay payment, open Checkout, then confirm it with the backend. */
  const pay = async (request: CheckoutRequest, key: string) => {
    if (paying.current) return;
    paying.current = true;
    setBusy(key);
    let approvedInRazorpay = false;
    try {
      const options = await dispatch(createBillingCheckout(request)).unwrap();
      // Close our dialogs so Razorpay's window is in front.
      setTarget(null);
      setPacksOpen(false);
      const result = await openRazorpayCheckout(options);
      approvedInRazorpay = true;
      const verified = await dispatch(verifyBillingPayment(result)).unwrap();
      if (verified.result === "needs_review") {
        toast.warning("Payment received, but it needs a manual check.", {
          description: verified.message,
        });
      } else {
        toast.success(verified.message);
      }
    } catch (error) {
      const message =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Something went wrong.";
      if (error instanceof CheckoutDismissed) {
        toast.info("Payment window closed.", {
          description:
            "If you approved the payment in your UPI app, it will show here in a minute.",
        });
      } else if (approvedInRazorpay) {
        // Razorpay took the payment; only our confirmation failed.
        toast.warning("Payment received. We're still confirming it.", {
          description: "Please don't pay again. This page updates shortly.",
        });
        RECHECK_AFTER_MS.forEach((delay) => setTimeout(refresh, delay));
      } else {
        toast.error("Couldn't start the payment.", { description: message });
      }
    } finally {
      refresh();
      paying.current = false;
      setBusy(null);
    }
  };

  /** Turn off auto-renew, or drop the change waiting to start. */
  const stopRenewal = async () => {
    setBusy("cancel");
    try {
      const message = await dispatch(cancelAutoRenew()).unwrap();
      toast.success(message);
      refresh();
    } catch (error) {
      toast.error("Nothing was changed.", {
        description: typeof error === "string" ? error : undefined,
      });
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  };

  const scheduled = overview?.scheduled_change;
  const autoRenew = overview?.auto_renew;
  const currentName = onPaidPlan ? (credits?.plan?.name ?? null) : null;

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeading
        title={title}
        description={description}
        action={
          FetchBillingOverviewState.FetchBillingOverviewIsLoading && (
            <Spinner className="size-4" />
          )
        }
      />

      <div className="grid gap-4 desktop:grid-cols-3">
        <CurrentPlanCard
          credits={credits}
          overview={overview}
          busy={busy !== null}
          onChangePlan={() =>
            document
              .getElementById("plans")
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          onTurnOff={() => setConfirm("turn_off")}
          onCancelChange={() => setConfirm("cancel_change")}
        />
        <CreditsCard
          credits={credits}
          canBuy={enabled}
          onBuyCredits={() => setPacksOpen(true)}
        />
      </div>

      <PlanGrid
        plans={plans}
        isLoading={FetchBillingPlansState.FetchBillingPlansIsLoading}
        cycle={cycle}
        onCycleChange={setCycle}
        currentCycle={currentCycle}
        disabled={!enabled || busy !== null}
        onChoose={(plan, choice) => setTarget({ plan, cycle, choice })}
      />

      <PaymentHistory payments={overview?.recent_payments ?? []} />

      <ChangePlanDialog
        target={target}
        currentPlanName={currentName}
        currentCycle={currentCycle}
        busy={busy !== null}
        onClose={() => setTarget(null)}
        onConfirm={({ plan, cycle: targetCycle }) =>
          pay(
            { purpose: `${targetCycle}_plan`, plan: plan.id },
            `${targetCycle}_plan-${plan.id}`,
          )
        }
      />

      <BuyCreditsDialog
        open={packsOpen}
        onOpenChange={setPacksOpen}
        packs={packs}
        isLoading={FetchTopUpPacksState.FetchTopUpPacksIsLoading}
        canBuy={onPaidPlan}
        busyKey={busy}
        onBuy={(pack) =>
          pay({ purpose: "top_up", top_up_pack: pack.id }, `top_up-${pack.id}`)
        }
      />

      {/* Turn off auto-renew, or cancel a scheduled change. */}
      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && busy !== "cancel" && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "cancel_change" && scheduled
                ? `Cancel the change to ${scheduled.plan.name}?`
                : "Turn off auto-renew?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "cancel_change" && scheduled
                ? `${scheduled.plan.name} won't start on ${formatDate(scheduled.starts_on)}. Your ${credits?.plan?.name ?? "current"} plan still ends on ${overview?.paid_until ? formatDate(overview.paid_until) : "the end of this period"} and does not renew. To keep it after that, renew it from the plans below.`
                : `${autoRenew?.plan.name ?? "Your plan"} keeps working until the end of this period and won't be charged again. There is no refund for the current period.${
                    scheduled?.can_cancel
                      ? ` The change to ${scheduled.plan.name} is cancelled too.`
                      : ""
                  }`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === "cancel"}>
              Keep it
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy === "cancel"}
              onClick={(event) => {
                event.preventDefault();
                stopRenewal();
              }}
            >
              {busy === "cancel" && <Spinner className="size-4" />}
              {confirm === "cancel_change" ? "Cancel change" : "Turn off"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
