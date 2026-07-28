"use client";

import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconMoodSmile } from "@tabler/icons-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { TonePresetRecord } from "@/db/chat";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
  FieldDescription,
} from "@/components/ui/field";

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
    <Card className="py-0">
      <CardHeader className="px-5 pt-5 pb-0">
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
          defaultValue={activePreset.toString()}
          onValueChange={(value) => onSelect(parseInt(value, 10))}
          className="grid grid-cols-1 gap-3 sm:grid-cols-4 2xl:grid-cols-6"
        >
          {presets.map((preset: TonePresetRecord) => (
            <FieldLabel
              key={preset.id}
              htmlFor={`preset-${preset.id}`}
              className="cursor-pointer"
            >
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle className="flex flex-col justify-start items-start">
                    <Image
                      src={
                        preset.icon ||
                        "/images/brand-voice-tone-presets/default.svg"
                      }
                      alt=""
                      width="25"
                      height="25"
                      className="object-contain"
                    />
                    {preset.name}
                  </FieldTitle>
                  <FieldDescription>
                    For individuals and small teams.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem
                  value={preset.id.toString()}
                  id={`preset-${preset.id}`}
                />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
