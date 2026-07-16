"use client";

import { useId } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { IconAdjustments, IconGauge } from "@tabler/icons-react";

type SliderDef = {
  key: string;
  label: string;
  minLabel: string;
  maxLabel: string;
};

const SLIDERS: SliderDef[] = [
  { key: "warmth", label: "Warmth", minLabel: "Reserved", maxLabel: "Warm" },
  {
    key: "formality",
    label: "Formality",
    minLabel: "Casual",
    maxLabel: "Formal",
  },
  { key: "energy", label: "Energy", minLabel: "Calm", maxLabel: "Energetic" },
  {
    key: "playfulness",
    label: "Playfulness",
    minLabel: "Serious",
    maxLabel: "Playful",
  },
  {
    key: "directness",
    label: "Directness",
    minLabel: "Gentle",
    maxLabel: "Direct",
  },
];

type SelectOption = { value: string; label: string };

const ANSWER_LENGTH_OPTIONS: readonly SelectOption[] = [
  { value: "concise", label: "Concise" },
  { value: "standard", label: "Standard" },
  { value: "thorough", label: "Thorough" },
];

const FREQUENCY_OPTIONS: readonly SelectOption[] = [
  { value: "none", label: "None" },
  { value: "sparing", label: "Sparing" },
  { value: "moderate", label: "Moderate" },
  { value: "liberal", label: "Liberal" },
  { value: "free", label: "Free" },
];

const SPELLING_OPTIONS: readonly SelectOption[] = [
  { value: "uk", label: "UK" },
  { value: "us", label: "US" },
  { value: "auto", label: "Auto" },
];

function ToneMetricSlider({
  label,
  value,
  minLabel,
  maxLabel,
  onChange,
}: {
  label: string;
  value: number;
  minLabel: string;
  maxLabel: string;
  onChange: (value: number) => void;
}) {
  const baseId = useId();
  const uid = `slider-${baseId.replace(/:/g, "")}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-medium">{label}</Label>
        <Badge variant="outline" className="font-normal tabular-nums">
          {value}
        </Badge>
      </div>

      <style>{`
        .${uid}::-webkit-slider-runnable-track {
          height: 8px;
          border-radius: 9999px;
          background: linear-gradient(
            to right,
            var(--color-primary) ${value}%,
            var(--color-border) ${value}%
          );
        }
        .${uid}::-moz-range-track {
          height: 8px;
          border-radius: 9999px;
          background: var(--color-border);
        }
        .${uid}::-moz-range-progress {
          height: 8px;
          border-radius: 9999px 0 0 9999px;
          background: var(--color-primary);
        }
        .${uid}::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: var(--color-primary);
          border: 2px solid var(--color-background);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16);
          margin-top: -5px;
          cursor: pointer;
        }
        .${uid}::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: var(--color-primary);
          border: 2px solid var(--color-background);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16);
          cursor: pointer;
        }
      `}</style>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`${uid} w-full cursor-pointer appearance-none bg-transparent`}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function ToneSelectField({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

type BrandVoiceToneControlsProps = {
  values: Record<string, number>;
  answerLength: string;
  frequencyPolicy: string;
  regionalSpelling: string;
  useBulletPoints: boolean;
  bulletPointsDescription: string;
  onChange: (key: string, value: number) => void;
  onAnswerLengthChange: (value: string) => void;
  onFrequencyPolicyChange: (value: string) => void;
  onRegionalSpellingChange: (value: string) => void;
  onToggleBulletPoints: () => void;
};

export default function BrandVoiceToneControls({
  values,
  answerLength,
  frequencyPolicy,
  regionalSpelling,
  useBulletPoints,
  bulletPointsDescription,
  onChange,
  onAnswerLengthChange,
  onFrequencyPolicyChange,
  onRegionalSpellingChange,
  onToggleBulletPoints,
}: BrandVoiceToneControlsProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card className="gap-0 overflow-hidden border-border/60 bg-background/95 shadow-sm">
        <CardHeader className="px-5 py-4">
          <CardTitle className="flex items-center gap-2">
            <IconGauge className="size-4" />
            Tone dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 px-5 pb-5">
          {SLIDERS.map((slider) => (
            <ToneMetricSlider
              key={slider.key}
              label={slider.label}
              value={values[slider.key] ?? 50}
              minLabel={slider.minLabel}
              maxLabel={slider.maxLabel}
              onChange={(v) => onChange(slider.key, v)}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden border-border/60 bg-background/95 shadow-sm">
        <CardHeader className="px-5 py-4">
          <CardTitle className="flex items-center gap-2">
            <IconAdjustments className="size-4" />
            Structure &amp; expression
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 px-5 pb-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ToneSelectField
              label="Answer length"
              description="Controls how much detail the assistant gives."
              value={answerLength}
              options={ANSWER_LENGTH_OPTIONS}
              onChange={onAnswerLengthChange}
            />
            <ToneSelectField
              label="Frequency policy"
              description="Sets how often signature phrasing can repeat."
              value={frequencyPolicy}
              options={FREQUENCY_OPTIONS}
              onChange={onFrequencyPolicyChange}
            />
            <ToneSelectField
              label="Regional spelling"
              description="Matches the store's spelling preference."
              value={regionalSpelling}
              options={SPELLING_OPTIONS}
              onChange={onRegionalSpellingChange}
            />
          </div>

          <Separator />

          <button
            type="button"
            onClick={onToggleBulletPoints}
            className={
              useBulletPoints
                ? "flex items-center justify-between rounded-xl border border-primary/50 bg-primary/10 px-4 py-3 text-left transition-colors"
                : "flex items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3 text-left transition-colors"
            }
            aria-pressed={useBulletPoints}
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Use bullet points</span>
              <span className="text-xs text-muted-foreground">
                {bulletPointsDescription}
              </span>
            </div>
            <span
              className={
                useBulletPoints
                  ? "flex h-7 w-12 items-center rounded-full bg-primary p-1 transition-colors"
                  : "flex h-7 w-12 items-center rounded-full bg-muted p-1 transition-colors"
              }
            >
              <span
                className={
                  useBulletPoints
                    ? "size-5 translate-x-5 rounded-full bg-background shadow-sm transition-transform"
                    : "size-5 translate-x-0 rounded-full bg-background shadow-sm transition-transform"
                }
              />
            </span>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
