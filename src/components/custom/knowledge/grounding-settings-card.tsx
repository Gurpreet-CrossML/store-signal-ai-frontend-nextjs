"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import type {
  GroundingMode,
  GroundingSettings,
  UnsupportedAnswerPolicy,
} from "@/redux/api-slice/knowledge-rag-slice";

const GROUNDING_MODE_OPTIONS: {
  value: GroundingMode;
  title: string;
  description: string;
}[] = [
  {
    value: "strict",
    title: "Strict",
    description: "Only use information supported by retrieved knowledge.",
  },
  {
    value: "balanced",
    title: "Balanced",
    description:
      "Allow reasonable interpretation while prioritizing retrieved knowledge.",
  },
  {
    value: "flexible",
    title: "Flexible",
    description:
      "Allow broader AI reasoning when retrieved knowledge is incomplete.",
  },
];

const UNSUPPORTED_POLICY_OPTIONS: {
  value: UnsupportedAnswerPolicy;
  title: string;
  description: string;
}[] = [
  {
    value: "never_guess",
    title: "Never guess",
    description:
      "If no reliable knowledge is found, the AI says so and escalates instead of answering.",
  },
  {
    value: "limited_inference",
    title: "Limited inference",
    description:
      "The AI may make small, clearly-flagged inferences, but won't invent specifics.",
  },
  {
    value: "allow_inference",
    title: "Allow inference",
    description:
      "The AI can reason beyond retrieved knowledge to give its best answer.",
  },
];

function RadioOptionCard({
  value,
  title,
  description,
}: {
  value: string;
  title: string;
  description: string;
}) {
  return (
    <Label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-3.5 has-data-checked:border-primary/40 has-data-checked:bg-primary/5">
      <RadioGroupItem value={value} className="mt-0.5" />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
    </Label>
  );
}

export function GroundingSettingsCard({
  value,
  onChange,
}: {
  value: GroundingSettings;
  onChange: (next: GroundingSettings) => void;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Grounding & Unsupported Answers</CardTitle>
        <CardDescription>
          How closely answers must stick to your knowledge, and what happens
          when nothing reliable is found.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Typography variant="small" as="p" className="font-medium">
            Grounding Mode
          </Typography>
          <RadioGroup
            value={value.mode}
            onValueChange={(mode) =>
              onChange({ ...value, mode: mode as GroundingMode })
            }
          >
            {GROUNDING_MODE_OPTIONS.map((option) => (
              <RadioOptionCard key={option.value} {...option} />
            ))}
          </RadioGroup>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <Typography variant="small" as="p" className="font-medium">
            Unsupported Answer Policy
          </Typography>
          <Typography variant="muted" className="text-xs">
            Controls how the AI behaves when reliable knowledge cannot be found
            for a question.
          </Typography>
          <RadioGroup
            value={value.unsupportedAnswerPolicy}
            onValueChange={(unsupportedAnswerPolicy) =>
              onChange({
                ...value,
                unsupportedAnswerPolicy:
                  unsupportedAnswerPolicy as UnsupportedAnswerPolicy,
              })
            }
            className="mt-1"
          >
            {UNSUPPORTED_POLICY_OPTIONS.map((option) => (
              <RadioOptionCard key={option.value} {...option} />
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
