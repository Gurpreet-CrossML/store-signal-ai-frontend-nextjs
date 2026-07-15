"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconMoodSmile } from "@tabler/icons-react";
import BrandVoiceTonePresetCard from "@/components/custom/brand-voice-tone-preset-card";
import type { Icon } from "@tabler/icons-react";

type PresetMeta = {
  key: string;
  icon: Icon;
  title: string;
  description: string;
};

type BrandVoiceTonePresetSelectorProps = {
  presets: PresetMeta[];
  activePreset: string;
  onSelect: (preset: string) => void;
};

export default function BrandVoiceTonePresetSelector({
  presets,
  activePreset,
  onSelect,
}: BrandVoiceTonePresetSelectorProps) {
  return (
    <Card className="gap-0 overflow-hidden border-border/60 bg-background/95 shadow-sm">
      <CardHeader className="px-5 py-4">
        <CardTitle className="flex items-center gap-2">
          <IconMoodSmile className="size-4" />
          Quick-start preset
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pick a starter voice. If the store already has a saved profile,
          the preview will stay synced to that data.
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {presets.map((preset) => (
            <BrandVoiceTonePresetCard
              key={preset.key}
              title={preset.title}
              description={preset.description}
              icon={preset.icon}
              active={activePreset === preset.key}
              onClick={() => onSelect(preset.key)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
