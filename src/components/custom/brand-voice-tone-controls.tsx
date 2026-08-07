"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";
import type { useFormik } from "formik";
import { type ToneStylePayload } from "@/db/chat";
import { Badge } from "@/components/ui/badge";
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
import { Slider } from "@/components/ui/slider";
import {
  TONE_SLIDERS,
  ANSWER_LENGTH_CHOICES,
  EMOJI_POLICY_CHOICES,
  EXCLAMATION_POLICY_CHOICES,
  REGIONAL_SPELLING_CHOICES,
  type DescribedOption,
} from "@/lib/config";
import { Switch } from "@/components/ui/switch";
import { IconAdjustments, IconGauge } from "@tabler/icons-react";
import { InfoIcon } from "@/components/custom/info-icon";

function ToneMetricSlider({
  name,
  label,
  info,
  value,
  minLabel,
  maxLabel,
  onChange,
  className,
}: {
  name: string;
  label: string;
  info: string;
  value: number;
  minLabel: string;
  maxLabel: string;
  onChange: (val: number) => void;
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Label htmlFor={name} className="text-sm font-medium">
            {label}
          </Label>
          <InfoIcon text={info} />
        </div>
        <Badge variant="ghost" className="font-normal tabular-nums">
          {value}%
        </Badge>
      </div>

      <Slider
        id={name}
        min={0}
        max={100}
        step={1}
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        className="w-full"
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function ToneRadioField({
  name,
  label,
  info,
  value,
  options,
  onChange,
}: {
  name: string;
  label: string;
  info: string;
  value: string;
  options: readonly DescribedOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm font-medium">{label}</Label>
        <InfoIcon text={info} />
      </div>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className={cn(
          "grid gap-x-4 gap-y-2.5",
          options.length > 3 && "grid-cols-2",
        )}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-start gap-2">
            <RadioGroupItem
              value={option.value}
              id={`${name}-${option.value}`}
              className="mt-0.5"
            />
            <div className="flex flex-col gap-0.5">
              <Label
                htmlFor={`${name}-${option.value}`}
                className="text-sm font-normal"
              >
                {option.label}
              </Label>
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

type BrandVoiceToneControlsProps = {
  formik: ReturnType<typeof useFormik<ToneStylePayload>>;
  bulletPointsDescription: string;
  onSliderChange: (key: keyof ToneStylePayload, value: number) => void;
};

export default function BrandVoiceToneControls({
  formik,
  bulletPointsDescription,
  onSliderChange,
}: BrandVoiceToneControlsProps) {
  const values = formik.values;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconGauge className="size-4" />
            Tone Style
            <InfoIcon text="Five dials that shape the personality of the assistant's replies. The live preview updates as you adjust them." />
          </CardTitle>
          <CardDescription>
            Adjust the dimensions of your assistant&apos;s tone.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 md:flex-row md:gap-8">
          {[
            TONE_SLIDERS.slice(0, Math.ceil(TONE_SLIDERS.length / 2)),
            TONE_SLIDERS.slice(Math.ceil(TONE_SLIDERS.length / 2)),
          ].map((column, columnIndex) => (
            <Fragment key={columnIndex}>
              {columnIndex > 0 && (
                <Separator
                  orientation="vertical"
                  className="hidden h-auto self-stretch md:block"
                />
              )}
              <div className="flex flex-1 flex-col gap-6">
                {column.map((slider) => (
                  <ToneMetricSlider
                    key={slider.key}
                    name={slider.key}
                    label={slider.label}
                    info={slider.info}
                    value={Number(values[slider.key] ?? 50)}
                    minLabel={slider.minLabel}
                    maxLabel={slider.maxLabel}
                    onChange={(val) => onSliderChange(slider.key, val)}
                    onBlur={formik.handleBlur}
                  />
                ))}
              </div>
            </Fragment>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconAdjustments className="size-4" />
            Writing Preferences
            <InfoIcon text="Formatting preferences the assistant follows when writing — length, emojis, punctuation, and spelling." />
          </CardTitle>
          <CardDescription>
            Set preferences for how your assistant writes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ToneRadioField
              name="answer_length"
              label="Answer Length"
              info="How much detail replies contain — from quick one-liners to full explanations."
              value={values.answer_length}
              options={ANSWER_LENGTH_CHOICES}
              onChange={(val) => formik.setFieldValue("answer_length", val)}
            />
            <ToneRadioField
              name="emoji_policy"
              label="Emoji Usage"
              info="How often emojis appear in replies, across chat, email, and social."
              value={values.emoji_policy}
              options={EMOJI_POLICY_CHOICES}
              onChange={(val) => formik.setFieldValue("emoji_policy", val)}
            />
            <ToneRadioField
              name="exclamation_marks_policy"
              label="Exclamation Marks"
              info="How much upbeat punctuation the assistant uses for emphasis."
              value={values.exclamation_marks_policy}
              options={EXCLAMATION_POLICY_CHOICES}
              onChange={(val) =>
                formik.setFieldValue("exclamation_marks_policy", val)
              }
            />
            <ToneRadioField
              name="regional_spelling"
              label="Regional Spelling"
              info="Which English spelling convention replies follow."
              value={values.regional_spelling}
              options={REGIONAL_SPELLING_CHOICES}
              onChange={(val) => formik.setFieldValue("regional_spelling", val)}
            />
          </div>

          <Separator />

          <div
            className={
              values.use_bullet_points
                ? "flex items-center justify-between rounded-xl border border-primary/50 bg-primary/10 px-4 py-3 text-left transition-colors"
                : "flex items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3 text-left transition-colors"
            }
          >
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                Use bullet points
                <InfoIcon text="When on, the assistant is guided to format longer answers as scannable bullet points instead of paragraphs." />
              </span>
              <span className="text-xs text-muted-foreground">
                {bulletPointsDescription}
              </span>
            </div>
            <Switch
              checked={values.use_bullet_points}
              onCheckedChange={(checked) =>
                formik.setFieldValue("use_bullet_points", checked)
              }
              aria-label="Use bullet points"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
