"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type TonePreviewConfig = {
  hero: {
    title: string;
    description: string;
  };
  preview: {
    customerLabel: string;
    assistantLabel: string;
    customerMessage: string;
    assistantTemplates: Record<string, string>;
    thresholds: {
      high: number;
      medium: number;
    };
    assistantMessage: {
      opener: {
        warmthHigh: string;
        formalityHigh: string;
        directnessHigh: string;
        fallback: string;
      };
      detail: Record<"concise" | "standard" | "thorough", string>;
      closer: {
        playfulnessHigh: string;
        energyHigh: string;
        bulletPoints: string;
        paragraph: string;
      };
    };
  };
  insights: {
    warmth: Record<"high" | "medium" | "low", string>;
    formality: Record<"high" | "medium" | "low", string>;
    energy: Record<"high" | "medium" | "low", string>;
    playfulness: Record<"high" | "medium" | "low", string>;
    directness: Record<"high" | "medium" | "low", string>;
    answer_length: Record<"concise" | "standard" | "thorough", string>;
    frequency_policy: Record<
      "none" | "sparing" | "moderate" | "liberal" | "free",
      string
    >;
    regional_spelling: Record<"uk" | "us" | "auto", string>;
    use_bullet_points: Record<"true" | "false", string>;
  };
};

type ToneStylePreviewPanelProps = {
  preset: string;
  modeLabel: string;
  modeDescription: string;
  customerMessage: string;
  assistantMessage: string;
  insightRows: Array<{ label: string; value: string }>;
  summaryRows: Array<{ label: string; value: string }>;
  previewConfig: TonePreviewConfig;
};

export default function ToneStylePreviewPanel({
  preset,
  modeLabel,
  modeDescription,
  customerMessage,
  assistantMessage,
  insightRows,
  summaryRows,
  previewConfig,
}: ToneStylePreviewPanelProps) {
  const presetLabel =
    typeof preset === "string" && preset.trim()
      ? preset.replaceAll("_", " ")
      : "custom";
  const assistantLines = assistantMessage
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const assistantBullets = assistantLines.every((line) =>
    line.startsWith("- "),
  );

  return (
    <Card className="sticky top-4 gap-0 overflow-hidden border-border/60 bg-background/95 shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/60 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-base font-medium">
                {previewConfig.hero.title}
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
                  {previewConfig.preview.assistantLabel}
                </div>
                {assistantBullets ? (
                  <ul className="space-y-2 pl-5">
                    {assistantLines.map((line) => (
                      <li key={line} className="list-disc">
                        {line.replace(/^- /, "")}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{assistantMessage}</p>
                )}
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
            {insightRows.map((row) => (
              <div key={row.label}>
                <div className="flex items-start gap-3">
                  <Badge
                    variant="outline"
                    className={cn("min-w-24 justify-center font-normal")}
                  >
                    {row.label}
                  </Badge>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {row.value}
                  </p>
                </div>
                <Separator className="mt-3" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Structure & expression
          </h3>
          <div className="flex flex-col gap-3">
            {summaryRows.map((row) => (
              <div key={row.label} className="flex items-start gap-3 text-sm">
                <Badge
                  variant="secondary"
                  className="min-w-24 justify-center font-normal"
                >
                  {row.label}
                </Badge>
                <p className="leading-relaxed text-muted-foreground">
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
