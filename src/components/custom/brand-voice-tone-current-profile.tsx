"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBriefcase } from "@tabler/icons-react";

const PRESET_ORDER = [
  "friendly",
  "warm_expert",
  "professional",
  "playful",
  "luxury",
  "custom",
] as const;

function formatPresetLabel(value: string | undefined) {
  if (!value) return "custom";
  return value.replaceAll("_", " ");
}

type BrandVoiceToneCurrentProfileProps = {
  preset: string;
  warmth: number;
  formality: number;
  energy: number;
  playfulness: number;
  directness: number;
  useBulletPoints: boolean;
};

export default function BrandVoiceToneCurrentProfile({
  preset,
  warmth,
  formality,
  energy,
  playfulness,
  directness,
  useBulletPoints,
}: BrandVoiceToneCurrentProfileProps) {
  return (
    <Card className="gap-0 overflow-hidden border-border/60 bg-background/95 shadow-sm">
      <CardHeader className="px-5 py-4">
        <CardTitle className="flex items-center gap-2">
          <IconBriefcase className="size-4" />
          Current profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-5 pb-5">
        <div className="flex flex-wrap gap-2">
          {PRESET_ORDER.map((p) => (
            <Badge
              key={p}
              variant={preset === p ? "default" : "outline"}
              className="font-normal capitalize"
            >
              {formatPresetLabel(p)}
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {([
            ["Warmth", warmth],
            ["Formality", formality],
            ["Energy", energy],
            ["Playfulness", playfulness],
            ["Directness", directness],
          ] as const).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border/60 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 font-medium tabular-nums">{value}</p>
            </div>
          ))}
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Bullet points
            </p>
            <p className="mt-1 font-medium">
              {useBulletPoints ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
