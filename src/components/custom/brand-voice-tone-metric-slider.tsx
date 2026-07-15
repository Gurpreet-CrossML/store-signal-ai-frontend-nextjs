"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useId } from "react";

type BrandVoiceToneMetricSliderProps = {
  label: string;
  value: number;
  minLabel: string;
  maxLabel: string;
  disabled?: boolean;
  accentColor?: string;
  onChange: (value: number) => void;
};

export default function BrandVoiceToneMetricSlider({
  label,
  value,
  minLabel,
  maxLabel,
  disabled,
  accentColor = "var(--color-primary)",
  onChange,
}: BrandVoiceToneMetricSliderProps) {
  const pct = ((value - 0) / (100 - 0)) * 100;

  // Use React's useId for a stable, pure unique identifier
  const baseId = useId();
  const uid = `slider-${baseId.replace(/:/g, "")}`;

  return (
    <div className={`flex flex-col gap-2 ${disabled ? "opacity-70" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-medium">{label}</Label>
        <Badge variant="outline" className="font-normal tabular-nums">
          {value}
        </Badge>
      </div>

      {/* Scoped styles for the range thumb & track */}
      <style>{`
        .${uid}::-webkit-slider-runnable-track {
          height: 8px;
          border-radius: 9999px;
          background: linear-gradient(
            to right,
            color-mix(in oklch, ${accentColor} 30%, transparent) ${pct}%,
            var(--color-muted, #e5e7eb) ${pct}%
          );
        }
        .${uid}::-moz-range-track {
          height: 8px;
          border-radius: 9999px;
          background: linear-gradient(
            to right,
            color-mix(in oklch, ${accentColor} 30%, transparent) ${pct}%,
            var(--color-muted, #e5e7eb) ${pct}%
          );
        }
        .${uid}::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: ${accentColor};
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          margin-top: -5px;
          cursor: ${disabled ? "not-allowed" : "pointer"};
        }
        .${uid}::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: ${accentColor};
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          cursor: ${disabled ? "not-allowed" : "pointer"};
        }
        .${uid}::-moz-range-progress {
          height: 8px;
          border-radius: 9999px 0 0 9999px;
          background: color-mix(in oklch, ${accentColor} 30%, transparent);
        }
      `}</style>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`${uid} w-full appearance-none bg-transparent ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
