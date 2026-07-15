"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

type BrandVoiceToneMetricSliderProps = {
  label: string;
  value: number;
  minLabel: string;
  maxLabel: string;
  onChange: (value: number) => void;
};

export default function BrandVoiceToneMetricSlider({
  label,
  value,
  minLabel,
  maxLabel,
  onChange,
}: BrandVoiceToneMetricSliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-medium">{label}</Label>
        <Badge variant="outline" className="font-normal tabular-nums">
          {value}
        </Badge>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-primary"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
