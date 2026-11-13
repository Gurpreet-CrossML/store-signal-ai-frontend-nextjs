import {
  IconCircleCheck,
  IconCircleX,
  IconLock,
  IconMessage2,
  IconUsers,
  type Icon,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type {
  PolicyEffect,
  PolicyFlow,
  PolicyFlowStep,
} from "@/redux/api-slice/store-settings-slice";

/** Each outcome's name, colour and icon, and the question its step asks. */
export const OUTCOMES: Record<
  PolicyEffect,
  { title: string; tone: BadgeTone; icon: Icon; question: string }
> = {
  decline: {
    title: "Declined",
    tone: "danger",
    icon: IconCircleX,
    question: "Does any of these apply?",
  },
  need_info: {
    title: "Ask the customer",
    tone: "neutral",
    icon: IconMessage2,
    question: "Do we still need something from the customer?",
  },
  team: {
    title: "Sent to your team",
    tone: "info",
    icon: IconUsers,
    question: "Does it need a person?",
  },
  allow: {
    title: "Allowed",
    tone: "success",
    icon: IconCircleCheck,
    question: "Can the AI do it now?",
  },
};

/** The legend, in the order the steps run. */
const LEGEND: PolicyEffect[] = ["decline", "need_info", "team", "allow"];

/** What happens when no step matched. */
const DEFAULT_TEXT: Record<PolicyFlow["default"]["effect"], string> = {
  decline: "Anything else is declined.",
  team: "Anything else is sent to your team to review.",
};

/** First letter up, the rest as written: "the order" → "The order". */
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function OutcomeBadge({
  effect,
  withIcon,
}: {
  effect: PolicyEffect;
  withIcon?: boolean;
}) {
  const { title, tone, icon: OutcomeIcon } = OUTCOMES[effect];
  return (
    <Badge variant="outline" className={BADGE_TONE_STYLES[tone]}>
      {withIcon && <OutcomeIcon data-icon="inline-start" />}
      {title}
    </Badge>
  );
}

/** A step's rows: what the customer is asked for, or its rules. */
function stepRows(step: PolicyFlowStep) {
  return step.effect === "need_info"
    ? step.asks.map((ask) => ({ key: ask, text: ask, platform: false }))
    : step.rules.map((rule) => ({
        key: rule.id,
        text: rule.check,
        platform: rule.platform,
      }));
}

/**
 * The saved policy as numbered steps, in the order the engine settles a
 * request: a decline anywhere wins, then a missing detail is asked for,
 * then your team, then allowed, then the policy's default.
 */
export default function WorkflowPolicyFlow({
  flow,
  title,
}: {
  flow: PolicyFlow;
  title: string;
}) {
  const DefaultIcon = OUTCOMES[flow.default.effect].icon;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">
            Built from your policy. Read top to bottom; the first rule that
            matches wins.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {LEGEND.map((effect) => (
            <OutcomeBadge key={effect} effect={effect} />
          ))}
        </div>
      </div>

      <ol className="flex flex-col">
        {flow.steps.map((step, index) => {
          const last = index === flow.steps.length - 1;
          return (
            <li key={index} className="flex gap-3.5">
              {/* The step's number, and the line down to the next one. */}
              <div className="flex flex-col items-center">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                {!last && (
                  <span className="my-1 w-0.5 flex-1 rounded-full bg-primary/20" />
                )}
              </div>
              <div
                className={cn(
                  "flex min-w-0 flex-1 flex-col gap-1",
                  !last && "pb-4",
                )}
              >
                <p className="pt-1 text-[13px] font-semibold">
                  {OUTCOMES[step.effect].question}
                </p>
                <ul className="flex flex-col">
                  {stepRows(step).map((row) => (
                    <li
                      key={row.key}
                      className="flex items-center gap-2.5 border-t border-border/60 py-2 text-[13px]"
                    >
                      <span className="flex min-w-0 flex-1 items-start gap-1.5 break-words">
                        {row.platform && (
                          <IconLock
                            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                            aria-label="Built-in check"
                          />
                        )}
                        {sentence(row.text)}
                      </span>
                      <OutcomeBadge effect={step.effect} withIcon />
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
        <DefaultIcon className="size-3.5 shrink-0" />
        {DEFAULT_TEXT[flow.default.effect]}
      </p>
    </div>
  );
}
