"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { TonePresetRecord } from "@/db/chat";
import { cn } from "@/lib/utils";

type ToneStylePreviewPanelProps = {
  preset: TonePresetRecord | null;
  modeLabel: string;
  modeDescription: string;
  presetOrder: readonly TonePresetRecord[];
  currentProfile: {
    preset: number;
    warmth: number;
    formality: number;
    energy: number;
    playfulness: number;
    directness: number;
    useBulletPoints: boolean;
  };
};

export default function ToneStylePreviewPanel({
  preset,
  modeLabel,
  modeDescription,
  presetOrder,
  currentProfile,
}: ToneStylePreviewPanelProps) {
  const presetLabel = preset?.name ?? "Custom";
  const customerMessage = preset?.preview_question ?? "";
  const assistantMessage = preset?.preview_message ?? "";

  return (
    <Card className="sticky top-4 gap-0 overflow-hidden border-border/60 bg-background/95 shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/60 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-base font-medium">
                Tone & Style
              </h2>
              <Badge variant="secondary" className="font-normal">
                {modeLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{modeDescription}</p>
          </div>
          <Badge variant="outline" className="capitalize font-normal">
            {presetLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-5 py-5">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-muted px-4 py-3 text-left text-sm leading-relaxed text-foreground">
                {customerMessage}
              </div>
            </div>

            <div className="flex justify-start">
              <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-primary/15 bg-primary/10 px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Assistant
                </div>
                <p>{assistantMessage}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Why it sounds this way
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge
                variant="outline"
                className={cn("min-w-24 justify-center font-normal")}
              >
                Warmth
              </Badge>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {currentProfile.warmth}
              </p>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Badge
                variant="outline"
                className={cn("min-w-24 justify-center font-normal")}
              >
                Formality
              </Badge>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {currentProfile.formality}
              </p>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Badge
                variant="outline"
                className={cn("min-w-24 justify-center font-normal")}
              >
                Energy
              </Badge>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {currentProfile.energy}
              </p>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Badge
                variant="outline"
                className={cn("min-w-24 justify-center font-normal")}
              >
                Playfulness
              </Badge>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {currentProfile.playfulness}
              </p>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Badge
                variant="outline"
                className={cn("min-w-24 justify-center font-normal")}
              >
                Directness
              </Badge>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {currentProfile.directness}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Structure & expression
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 text-sm">
              <Badge
                variant="secondary"
                className="min-w-24 justify-center font-normal"
              >
                Preset ID
              </Badge>
              <p className="leading-relaxed text-muted-foreground">
                {currentProfile.preset}
              </p>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Badge
                variant="secondary"
                className="min-w-24 justify-center font-normal"
              >
                Bullet points
              </Badge>
              <p className="leading-relaxed text-muted-foreground">
                {currentProfile.useBulletPoints ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Current profile
          </h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {presetOrder.map((p) => (
                <Badge
                  key={p.id}
                  variant={
                    currentProfile.preset === p.id ? "default" : "outline"
                  }
                  className="font-normal capitalize"
                >
                  {p.name}
                </Badge>
              ))}
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Preview
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Uses the selected preset&apos;s stored question and answer.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
