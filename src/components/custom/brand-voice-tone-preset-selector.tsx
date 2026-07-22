"use client";

import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconMoodSmile } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { TonePresetRecord } from "@/db/chat";

type BrandVoiceTonePresetSelectorProps = {
  presets: readonly TonePresetRecord[];
  activePreset: number;
  onSelect: (presetId: number) => void;
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
          Pick a starter voice. If the store already has a saved profile, the
          preview will stay synced to that data.
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <RadioGroup
          value={activePreset.toString()}
          onValueChange={(value) => onSelect(parseInt(value, 10))}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3"
        >
          {presets.map((preset) => (
            <label htmlFor={`preset-${preset.id}`} key={preset.id} className="cursor-pointer h-full block">
              <Card
                className={cn(
                  "h-full border-border/70 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm",
                  activePreset === preset.id &&
                    "border-primary bg-primary/10 ring-1 ring-primary/20",
                )}
              >
                <div className="flex h-full flex-col gap-3 px-4 py-4 relative">
                  <div className="absolute top-4 right-4">
                    <RadioGroupItem value={preset.id.toString()} id={`preset-${preset.id}`} />
                  </div>
                  <div className="relative flex size-9 items-center justify-center overflow-hidden rounded-md bg-muted text-xs font-medium text-muted-foreground">
                    {preset.icon ? (
                      <Image
                        src={preset.icon}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      preset.name.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col gap-1 pr-6">
                    <h3 className="font-medium leading-tight">{preset.name}</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {preset.description}
                    </p>
                  </div>
                </div>
              </Card>
            </label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
