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
    title: "Ask The Customer",
    tone: "neutral",
    icon: IconMessage2,
    question: "Do we still need something from the customer?",
  },
  team: {
    title: "Sent To Your Team",
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

/** The final step: what happens to a request no rule above matched. */
const ELSE_QUESTION = "Anything else?";
const ELSE_ROW = "A request that matches none of the rules above";

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

/** One numbered step: its question, then each row with its outcome. */
function FlowStep({
  number,
  question,
  effect,
  rows,
  last,
}: {
  number: number;
  question: string;
  effect: PolicyEffect;
  rows: ReturnType<typeof stepRows>;
  last: boolean;
}) {
  return (
    <li className="flex gap-3.5">
      {/* The step's number, and the line down to the next one. */}
      <div className="flex flex-col items-center">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">
          {number}
        </span>
        {!last && (
          <span className="my-1 w-0.5 flex-1 rounded-full bg-primary/20" />
        )}
      </div>
      <div
        className={cn("flex min-w-0 flex-1 flex-col gap-1", !last && "pb-4")}
      >
        <p className="pt-1 text-[13px] font-semibold">{question}</p>
        <ul className="flex flex-col">
          {rows.map((row) => (
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
              <OutcomeBadge effect={effect} withIcon />
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/**
 * The saved policy as numbered steps, in the order the engine settles a
 * request: a decline anywhere wins, then a missing detail is asked for,
 * then your team, then allowed, and last the policy's default for
 * anything no rule matched.
 */
export default function WorkflowPolicyFlow({
  flow,
  title,
}: {
  flow: PolicyFlow;
  title: string;
}) {
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
        {/* With icons, the same badges as on the rows below. */}
        <div className="flex flex-wrap gap-1.5">
          {LEGEND.map((effect) => (
            <OutcomeBadge key={effect} effect={effect} withIcon />
          ))}
        </div>
      </div>

      <ol className="flex flex-col">
        {flow.steps.map((step, index) => (
          <FlowStep
            key={index}
            number={index + 1}
            question={OUTCOMES[step.effect].question}
            effect={step.effect}
            rows={stepRows(step)}
            last={false}
          />
        ))}
        {/* The default is the final step, not a note under the list. */}
        <FlowStep
          number={flow.steps.length + 1}
          question={ELSE_QUESTION}
          effect={flow.default.effect}
          rows={[{ key: "else", text: ELSE_ROW, platform: false }]}
          last
        />
      </ol>
    </div>
  );
}
