"use client";

import { IconPalette } from "@tabler/icons-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ColorKey } from "./customization-types";

type CustomizationThemeProps = {
  themeColor: string;
  themeHexInput: string;
  secondaryColor: string;
  secondaryHexInput: string;
  tertiaryColor: string;
  tertiaryHexInput: string;
  themeVars: React.CSSProperties;
  applyColor: (which: ColorKey, value: string) => void;
  handleHexChange: (which: ColorKey, raw: string) => void;
};

export default function CustomizationTheme({
  themeColor,
  themeHexInput,
  secondaryColor,
  secondaryHexInput,
  tertiaryColor,
  tertiaryHexInput,
  themeVars,
  applyColor,
  handleHexChange,
}: CustomizationThemeProps) {
  const swatches = [
    {
      which: "primary" as const,
      label: "Primary color",
      color: themeColor,
      hex: themeHexInput,
      placeholder: "#6C5CE7",
    },
    {
      which: "secondary" as const,
      label: "Secondary color",
      color: secondaryColor,
      hex: secondaryHexInput,
      placeholder: "#F3F4F6",
    },
    {
      which: "tertiary" as const,
      label: "Tertiary color",
      color: tertiaryColor,
      hex: tertiaryHexInput,
      placeholder: "#DFE6E9",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <Label className="flex items-center gap-2">
        <IconPalette className="size-4" />
        Theme
      </Label>
      <div className="border border-border p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {swatches.map(({ which, label, color, hex, placeholder }) => (
            <div key={which} className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(event) => applyColor(which, event.target.value)}
                  aria-label={`${label} picker`}
                  className="h-8 w-10 cursor-pointer border border-input bg-background p-1"
                />
                <Input
                  value={hex}
                  onChange={(event) =>
                    handleHexChange(which, event.target.value)
                  }
                  placeholder={placeholder}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground"
          style={themeVars}
        >
          <span className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-full bg-[var(--cb-primary)]" />
            Header &amp; primary buttons
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-full bg-[var(--cb-secondary)]" />
            Bot message bubbles
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-full bg-[var(--cb-tertiary)]" />
            Accents &amp; surfaces
          </span>
        </div>
      </div>
    </div>
  );
}
