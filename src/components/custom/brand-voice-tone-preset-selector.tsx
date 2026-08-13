"use client";

import Image from "next/image";

import { InfoIcon } from "@/components/custom/info-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconMoodSmile className="size-4" />
          Quick-start preset
          <InfoIcon text="One-click starting points for the five tone dials. Adjust any dial afterwards and the preset becomes Custom; writing preferences are set separately." />
        </CardTitle>
        <CardDescription>
          Pick a starter voice. If the store already has a saved profile, the
          preview will stay synced to that data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Controlled, not `defaultValue`: an uncontrolled group reads its
            value once at mount, so moving a dial switched the form to
            Custom while the radio still showed the old preset — and the
            selection also missed the presets arriving from the API. */}
        <RadioGroup
          value={activePreset.toString()}
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
                  <FieldDescription>{preset.description}</FieldDescription>
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
