"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconGauge } from "@tabler/icons-react";
import BrandVoiceToneMetricSlider from "@/components/custom/brand-voice-tone-metric-slider";

type SliderDef = {
  key: string;
  label: string;
  minLabel: string;
  maxLabel: string;
  /** CSS color value that harmonizes with the purple theme */
  accentColor: string;
};

// Purple-harmonious palette — each slider gets a distinct shade
// within the analogous range of the theme hue (~292 oklch / purple).
const SLIDERS: SliderDef[] = [
  {
    key: "warmth",
    label: "Warmth",
    minLabel: "Reserved",
    maxLabel: "Warm",
    accentColor: "oklch(0.65 0.22 310)",
  }, // rosy magenta
  {
    key: "formality",
    label: "Formality",
    minLabel: "Casual",
    maxLabel: "Formal",
    accentColor: "oklch(0.55 0.24 270)",
  }, // deep violet
  {
    key: "energy",
    label: "Energy",
    minLabel: "Calm",
    maxLabel: "Energetic",
    accentColor: "oklch(0.62 0.26 330)",
  }, // fuchsia pink
  {
    key: "playfulness",
    label: "Playfulness",
    minLabel: "Serious",
    maxLabel: "Playful",
    accentColor: "oklch(0.68 0.20 290)",
  }, // soft lavender
  {
    key: "directness",
    label: "Directness",
    minLabel: "Gentle",
    maxLabel: "Direct",
    accentColor: "oklch(0.56 0.20 255)",
  }, // indigo blue
];

type BrandVoiceToneDimensionsProps = {
  values: Record<string, number>;
  disabled: boolean;
  onChange: (key: string, value: number) => void;
};

export default function BrandVoiceToneDimensions({
  values,
  disabled,
  onChange,
}: BrandVoiceToneDimensionsProps) {
  return (
    <Card className="gap-0 overflow-hidden border-border/60 bg-background/95 shadow-sm">
      <CardHeader className="px-5 py-4">
        <CardTitle className="flex items-center gap-2">
          <IconGauge className="size-4" />
          Tone dimensions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-5 pb-5">
        {SLIDERS.map((slider) => (
          <BrandVoiceToneMetricSlider
            key={slider.key}
            label={slider.label}
            value={values[slider.key] ?? 50}
            minLabel={slider.minLabel}
            maxLabel={slider.maxLabel}
            disabled={disabled}
            accentColor={slider.accentColor}
            onChange={(v) => onChange(slider.key, v)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
