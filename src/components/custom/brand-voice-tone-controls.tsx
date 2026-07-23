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
import { Slider } from "@/components/ui/slider";
import { TONE_SLIDERS, ANSWER_LENGTH_OPTIONS, FREQUENCY_OPTIONS, SPELLING_OPTIONS, SelectOption } from "@/lib/config";
import { Switch } from "@/components/ui/switch";
import { IconAdjustments, IconGauge } from "@tabler/icons-react";


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
  onChange: (val: number) => void;
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
}) {
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
      <Card className="gap-0 overflow-hidden border-border/60 bg-background/95 shadow-sm">
        <CardHeader className="px-5 py-4">
          <CardTitle className="flex items-center gap-2">
            <IconGauge className="size-4" />
            Tone dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 px-5 pb-5">
          {TONE_SLIDERS.map((slider) => (
            <ToneMetricSlider
              key={slider.key}
              name={slider.key}
              label={slider.label}
              value={Number(values[slider.key] ?? 50)}
              minLabel={slider.minLabel}
              maxLabel={slider.maxLabel}
              onChange={(val) => onSliderChange(slider.key, val)}
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

          <div
            className={
              values.use_bullet_points
                ? "flex items-center justify-between rounded-xl border border-primary/50 bg-primary/10 px-4 py-3 text-left transition-colors"
                : "flex items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3 text-left transition-colors"
            }
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Use bullet points</span>
              <span className="text-xs text-muted-foreground">
                {bulletPointsDescription}
              </span>
            </div>
            <Switch
              checked={values.use_bullet_points}
              onCheckedChange={(checked) => formik.setFieldValue("use_bullet_points", checked)}
              aria-label="Use bullet points"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
