"use client";

import { useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { IconGauge } from "@tabler/icons-react";

type SliderDef = {
  key: string;
  label: string;
  minLabel: string;
  maxLabel: string;
};

const SLIDERS: SliderDef[] = [
  {
    key: "warmth",
    label: "Warmth",
    minLabel: "Reserved",
    maxLabel: "Warm",
  },
  {
    key: "formality",
    label: "Formality",
    minLabel: "Casual",
    maxLabel: "Formal",
  },
  {
    key: "energy",
    label: "Energy",
    minLabel: "Calm",
    maxLabel: "Energetic",
  },
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

type BrandVoiceToneDimensionsProps = {
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
};

export default function BrandVoiceToneDimensions({
  values,
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
  );
}
