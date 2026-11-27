"use client";

import { IconAlertTriangle, IconCoins, IconLock } from "@tabler/icons-react";

import { formatMoney } from "@/components/custom/billing/billing-format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type { TopUpPack } from "@/redux/api-slice/billing-slice";

/** Credit packs to buy on top of the plan, one click each. */
export default function BuyCreditsDialog({
  open,
  onOpenChange,
  packs,
  isLoading,
  canBuy,
  busyKey,
  onBuy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packs: TopUpPack[];
  isLoading: boolean;
  /** Only a store on a paid plan can buy credits (existing rule). */
  canBuy: boolean;
  busyKey: string | null;
  onBuy: (pack: TopUpPack) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !busyKey && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buy AI credits</DialogTitle>
          <DialogDescription>
            Extra credits are added to your balance as soon as the payment goes
            through, and they carry forward.
          </DialogDescription>
        </DialogHeader>

        {!canBuy && (
          <div
            className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
              BADGE_TONE_STYLES.warning,
            )}
          >
            <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
            Credits can be bought on a paid plan. Choose a plan first.
          </div>
        )}

        <div className="flex flex-col gap-2">
          {packs.map((pack) => {
            const key = `top_up-${pack.id}`;
            const perCredit = Number(pack.price) / pack.credits;
            return (
              <div
                key={pack.id}
                className="flex items-center justify-between gap-3 rounded-lg p-3 ring-1 ring-foreground/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <IconCoins className="size-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium tabular-nums">
                      {pack.credits.toLocaleString()} credits
                    </span>
                    <Typography variant="caption" as="span">
                      {pack.name} ·{" "}
                      {formatMoney(perCredit.toFixed(2), pack.currency)} per
                      credit
                    </Typography>
                  </div>
                </div>
                <Button
                  disabled={!canBuy || busyKey !== null}
                  onClick={() => onBuy(pack)}
                >
                  {busyKey === key && <Spinner className="size-4" />}
                  {formatMoney(pack.price, pack.currency)}
                </Button>
              </div>
            );
          })}
          {!isLoading && !packs.length && (
            <Typography variant="muted">
              No credit packs are available right now.
            </Typography>
          )}
        </div>
        <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <IconLock className="size-3.5" /> Secured by Razorpay
        </p>
      </DialogContent>
    </Dialog>
  );
}
