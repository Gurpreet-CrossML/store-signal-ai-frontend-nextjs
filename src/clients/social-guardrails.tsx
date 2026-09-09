"use client";

import { useEffect, useState } from "react";
import {
  IconClockShield,
  IconDeviceFloppy,
  IconHourglass,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { InfoIcon } from "@/components/custom/info-icon";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import {
  ACTIVE_HOURS_SEED,
  LANGUAGE_HANDLING_LABEL,
  getStaticGuardrails,
  updateStaticGuardrails,
  type ActiveHoursWindow,
  type GuardrailSettings,
} from "@/lib/guardrails-data";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchSocialAccountsSubscriptions } from "@/redux/api-slice/social-ai-slice";

/** The numbers ride as strings while edited; parsed and checked on save. */
type GuardrailDraft = {
  maxRepliesPerHour: string;
  maxDmsPerHour: string;
  oneReplyPerThread: boolean;
  loopBreakerReplies: string;
  activeHours: ActiveHoursWindow | null;
};

function toDraft(settings: GuardrailSettings): GuardrailDraft {
  return {
    maxRepliesPerHour: String(settings.maxRepliesPerHour),
    maxDmsPerHour: String(settings.maxDmsPerHour),
    oneReplyPerThread: settings.oneReplyPerThread,
    loopBreakerReplies: String(settings.loopBreakerReplies),
    activeHours: settings.activeHours,
  };
}

function parseLimit(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}

/** Title + description left, one control right — the settings row shape. */
function LimitRow({
  title,
  description,
  info,
  locked = false,
  children,
}: {
  title: string;
  description: string;
  /** The ⓘ beside the title, for detail the one-line description can't hold. */
  info?: React.ReactNode;
  /** Renders the same Locked badge a locked workflow gate carries. */
  locked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Typography
          variant="small"
          as="span"
          className="flex flex-wrap items-center gap-2"
        >
          {title}
          {info && <InfoIcon text={info} />}
          {locked && (
            <Badge variant="secondary" className="uppercase">
              Locked
            </Badge>
          )}
        </Typography>
        <Typography variant="caption" as="p" className="leading-relaxed">
          {description}
        </Typography>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

/**
 * Rate and pacing ceilings, per connected account. They keep automation
 * inside spam-safe territory, so the limits themselves are deliberately
 * boring numbers rather than rules with conditions.
 */
export default function SocialGuardrails() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const accounts =
    useAppSelector(
      (state) =>
        state.GetSocialAIReducer.FetchSocialAccountSubscriptionsState
          .FetchSocialAccountsSubscriptionsData,
    )?.results ?? [];

  const [pickedAccountId, setPickedAccountId] = useState("");
  // Until the user picks, the first connected account is the one configured.
  const selectedAccountId =
    pickedAccountId || (accounts.length ? String(accounts[0].id) : "");

  useEffect(() => {
    if (storeCode) dispatch(fetchSocialAccountsSubscriptions(storeCode));
  }, [dispatch, storeCode]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography variant="caption" as="p">
          Every connected account has its own limits. Pick the one to configure.
        </Typography>
        <Select value={selectedAccountId} onValueChange={setPickedAccountId}>
          <SelectTrigger className="w-64" aria-label="Connected account">
            <SelectValue placeholder="Select an account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={String(account.id)}>
                {account.name} ·{" "}
                {account.channel_type === "instagram"
                  ? "Instagram"
                  : "Facebook"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Keyed by account so switching the picker remounts the form and
          its state seeds fresh from that account's saved limits. */}
      {selectedAccountId && (
        <GuardrailsForm key={selectedAccountId} accountId={selectedAccountId} />
      )}
    </div>
  );
}

function GuardrailsForm({ accountId }: { accountId: string }) {
  const [draft, setDraft] = useState<GuardrailDraft>(() =>
    toDraft(getStaticGuardrails(accountId)),
  );
  const [baseline, setBaseline] = useState(() => JSON.stringify(draft));

  const isDirty = JSON.stringify(draft) !== baseline;

  const patch = (partial: Partial<GuardrailDraft>) =>
    setDraft((prev) => ({ ...prev, ...partial }));

  const handleSave = () => {
    const maxRepliesPerHour = parseLimit(draft.maxRepliesPerHour);
    const maxDmsPerHour = parseLimit(draft.maxDmsPerHour);
    const loopBreakerReplies = parseLimit(draft.loopBreakerReplies);
    if (!maxRepliesPerHour || !maxDmsPerHour || !loopBreakerReplies) {
      toast.error("Couldn't save the guardrails", {
        description: "Every limit needs a whole number of at least 1.",
      });
      return;
    }
    if (
      draft.activeHours &&
      (!draft.activeHours.start ||
        !draft.activeHours.end ||
        draft.activeHours.start === draft.activeHours.end)
    ) {
      toast.error("Couldn't save the guardrails", {
        description:
          "Custom active hours need a start and an end that differ. For no restriction, pick Around the Clock.",
      });
      return;
    }
    updateStaticGuardrails(accountId, {
      maxRepliesPerHour,
      maxDmsPerHour,
      oneReplyPerThread: draft.oneReplyPerThread,
      loopBreakerReplies,
      activeHours: draft.activeHours,
    });
    setBaseline(JSON.stringify(draft));
    toast.success("Guardrails saved", {
      description: "The AI keeps to these limits on this account from now on.",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconClockShield className="size-4" />
            Rate & Pacing Limits
            <InfoIcon text="These ceilings cover everything the AI sends on this account, on top of your comment and DM rules. When a limit is reached the AI queues the rest and alerts you, so a burst of activity cannot read as spam to Meta." />
          </CardTitle>
          <CardDescription>
            Protects your accounts from spam-like behaviour and runaway loops.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <LimitRow
            title="Max Replies Per Hour, Per Account"
            description="A hard ceiling. Past it, the AI queues new replies and alerts you instead of flooding."
          >
            <Input
              value={draft.maxRepliesPerHour}
              onChange={(event) =>
                patch({ maxRepliesPerHour: event.target.value })
              }
              className="h-8 w-20"
              inputMode="numeric"
              aria-label="Max replies per hour"
            />
            <Typography variant="caption">/ hour</Typography>
          </LimitRow>

          <Separator />

          <LimitRow
            title="Max DMs Sent Per Hour"
            description="Kept well under Meta's pacing threshold (about 200 an hour) to protect the account."
          >
            <Input
              value={draft.maxDmsPerHour}
              onChange={(event) => patch({ maxDmsPerHour: event.target.value })}
              className="h-8 w-20"
              inputMode="numeric"
              aria-label="Max DMs sent per hour"
            />
            <Typography variant="caption">/ hour</Typography>
          </LimitRow>

          <Separator />

          <LimitRow
            title="One Reply Per Comment Thread"
            description="One answer per thread, so the AI does not argue back and forth in public."
          >
            <Switch
              checked={draft.oneReplyPerThread}
              onCheckedChange={(oneReplyPerThread) =>
                patch({ oneReplyPerThread })
              }
              aria-label="One reply per comment thread"
            />
          </LimitRow>

          <Separator />

          <LimitRow
            title="Loop Breaker"
            description="Stop and alert if the AI would reply to the same person more than this many times in a short window."
          >
            <Typography variant="caption">after</Typography>
            <Input
              value={draft.loopBreakerReplies}
              onChange={(event) =>
                patch({ loopBreakerReplies: event.target.value })
              }
              className="h-8 w-16"
              inputMode="numeric"
              aria-label="Loop breaker reply count"
            />
            <Typography variant="caption">replies</Typography>
          </LimitRow>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconHourglass className="size-4" />
            Response Pacing
            <InfoIcon text="When, and in what language, the AI answers on this account. Pacing shapes each send; the ceilings above cap the hourly volume." />
          </CardTitle>
          <CardDescription>
            Human-like timing that protects your accounts and your brand.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <LimitRow
            title="Active Hours"
            description="When the AI is allowed to act on this account. Outside these hours it still hides spam."
            info={
              <ul className="max-w-xs list-disc space-y-1 pl-4">
                <li>
                  <span className="font-semibold">Around the Clock:</span> the
                  AI may act at any time.
                </li>
                <li>
                  <span className="font-semibold">Custom Hours:</span> only
                  inside the window you set, in your store&apos;s timezone. An
                  end before the start runs overnight. Outside the window the AI
                  only hides spam; everything else waits for a teammate.
                </li>
              </ul>
            }
          >
            <Select
              value={draft.activeHours ? "custom" : "always"}
              onValueChange={(mode) =>
                patch({
                  activeHours:
                    mode === "always"
                      ? null
                      : (draft.activeHours ?? ACTIVE_HOURS_SEED),
                })
              }
            >
              <SelectTrigger
                size="sm"
                className="w-48"
                aria-label="Active hours"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">Around the Clock</SelectItem>
                <SelectItem value="custom">Custom Hours</SelectItem>
              </SelectContent>
            </Select>
          </LimitRow>

          {draft.activeHours && (
            <div className="flex flex-wrap items-center gap-2">
              <Typography variant="caption">From</Typography>
              <Input
                type="time"
                value={draft.activeHours.start}
                onChange={(event) =>
                  patch({
                    activeHours: {
                      start: event.target.value,
                      end: draft.activeHours?.end ?? "",
                    },
                  })
                }
                className="h-8 w-32"
                aria-label="Active from"
              />
              <Typography variant="caption">to</Typography>
              <Input
                type="time"
                value={draft.activeHours.end}
                onChange={(event) =>
                  patch({
                    activeHours: {
                      start: draft.activeHours?.start ?? "",
                      end: event.target.value,
                    },
                  })
                }
                className="h-8 w-32"
                aria-label="Active until"
              />
              <Typography variant="caption">
                {draft.activeHours.start &&
                draft.activeHours.end &&
                draft.activeHours.end < draft.activeHours.start
                  ? "store timezone · runs overnight"
                  : "store timezone"}
              </Typography>
            </div>
          )}

          <Separator />

          <LimitRow
            title="Language Handling"
            description="The AI replies in the language the customer used, where supported."
            locked
          >
            <Select value="match" disabled>
              <SelectTrigger
                size="sm"
                className="w-48"
                aria-label="Language handling"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">{LANGUAGE_HANDLING_LABEL}</SelectItem>
              </SelectContent>
            </Select>
          </LimitRow>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 border-t border-border py-3">
        <Button
          type="button"
          size="lg"
          onClick={handleSave}
          disabled={!isDirty}
        >
          <IconDeviceFloppy data-icon="inline-start" />
          Save Changes
        </Button>
        {isDirty && (
          <Typography variant="caption">You have unsaved changes.</Typography>
        )}
      </div>
    </div>
  );
}
