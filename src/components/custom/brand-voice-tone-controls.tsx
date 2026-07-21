"use client";

import { useId } from "react";
import type { useFormik } from "formik";
import { type ToneStylePayload } from "@/db/chat";
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
  key: keyof ToneStylePayload;
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
  name,
  label,
  value,
  minLabel,
  maxLabel,
  onChange,
  onBlur,
}: {
  name: string;
  label: string;
  value: number;
  minLabel: string;
  maxLabel: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
}) {
  const baseId = useId();
  const uid = `slider-${baseId.replace(/:/g, "")}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
        </Label>
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
        id={name}
        name={name}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
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
  name,
  label,
  description,
  value,
  options,
  onChange,
}: {
  name: string;
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
        <SelectTrigger id={name} className="w-full">
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
  formik: ReturnType<typeof useFormik<ToneStylePayload>>;
  bulletPointsDescription: string;
};

export default function BrandVoiceToneControls({
  formik,
  bulletPointsDescription,
}: BrandVoiceToneControlsProps) {
  const values = formik.values;

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
              name={slider.key}
              label={slider.label}
              value={Number(values[slider.key] ?? 50)}
              minLabel={slider.minLabel}
              maxLabel={slider.maxLabel}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
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
              name="answer_length"
              label="Answer length"
              description="Controls how much detail the assistant gives."
              value={values.answer_length}
              options={ANSWER_LENGTH_OPTIONS}
              onChange={(val) => formik.setFieldValue("answer_length", val)}
            />
            <ToneSelectField
              name="frequency_policy"
              label="Frequency policy"
              description="Sets how often signature phrasing can repeat."
              value={values.frequency_policy}
              options={FREQUENCY_OPTIONS}
              onChange={(val) => formik.setFieldValue("frequency_policy", val)}
            />
            <ToneSelectField
              name="regional_spelling"
              label="Regional spelling"
              description="Matches the store's spelling preference."
              value={values.regional_spelling}
              options={SPELLING_OPTIONS}
              onChange={(val) => formik.setFieldValue("regional_spelling", val)}
            />
          </div>

          <Separator />

          <button
            type="button"
            onClick={() =>
              formik.setFieldValue(
                "use_bullet_points",
                !values.use_bullet_points,
              )
            }
            className={
              values.use_bullet_points
                ? "flex items-center justify-between rounded-xl border border-primary/50 bg-primary/10 px-4 py-3 text-left transition-colors"
                : "flex items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3 text-left transition-colors"
            }
            aria-pressed={values.use_bullet_points}
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Use bullet points</span>
              <span className="text-xs text-muted-foreground">
                {bulletPointsDescription}
              </span>
            </div>
            <span
              className={
                values.use_bullet_points
                  ? "flex h-7 w-12 items-center rounded-full bg-primary p-1 transition-colors"
                  : "flex h-7 w-12 items-center rounded-full bg-muted p-1 transition-colors"
              }
            >
              <span
                className={
                  values.use_bullet_points
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
