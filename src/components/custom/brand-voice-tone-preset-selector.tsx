"use client";

import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconMoodSmile } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {presets.map((preset) => {
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelect(preset.id)}
                className="text-left"
                aria-pressed={activePreset === preset.id}
              >
                <Card
                  size="sm"
                  className={cn(
                    "h-full border-border/70 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm",
                    activePreset === preset.id &&
                      "border-primary bg-primary/10 ring-1 ring-primary/20",
                  )}
                >
                  <div className="flex h-full flex-col gap-3 px-4 py-4">
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
                    <div className="flex flex-col gap-1">
                      <h3 className="font-medium leading-tight">
                        {preset.name}
                      </h3>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {preset.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
