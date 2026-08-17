"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { InfoIcon } from "@/components/custom/info-icon";
import type { RetrievalSettings } from "@/redux/api-slice/knowledge-rag-slice";

function SettingRow({
  title,
  description,
  info,
  children,
}: {
  title: string;
  description?: string;
  info?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-md">
        <div className="flex items-center gap-1.5">
          <Typography variant="small" as="p" className="font-medium">
            {title}
          </Typography>
          {info && <InfoIcon text={info} />}
        </div>
        {description && (
          <Typography variant="muted" className="mt-1 text-xs">
            {description}
          </Typography>
        )}
      </div>
      <div className="w-full shrink-0 sm:w-64">{children}</div>
    </div>
  );
}

function SliderControl({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([next]) => onChange(next)}
      />
      <span className="w-12 shrink-0 text-right font-mono text-sm font-semibold text-primary">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

export function RetrievalSettingsCard({
  value,
  onChange,
}: {
  value: RetrievalSettings;
  onChange: (next: RetrievalSettings) => void;
}) {
  const update = (patch: Partial<RetrievalSettings>) =>
    onChange({ ...value, ...patch });

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Retrieval Settings</CardTitle>
        <CardDescription>
          Controls how the AI searches for and ranks relevant knowledge.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SettingRow
          title="Similarity Threshold"
          description="How closely a knowledge item must match the question before it's considered relevant."
          info="Higher values provide stricter matching — fewer results, but more relevant ones."
        >
          <SliderControl
            value={value.similarityThreshold}
            onChange={(similarityThreshold) => update({ similarityThreshold })}
          />
        </SettingRow>

        <SettingRow
          title="Top K Results"
          description="How many knowledge sources the AI considers before answering."
          info="A higher number gives the AI more context, but can slow responses and dilute focus."
        >
          <Input
            type="number"
            min={1}
            max={20}
            value={value.topK}
            onChange={(event) =>
              update({ topK: Math.max(1, Math.min(20, Number(event.target.value) || 1)) })
            }
          />
        </SettingRow>

        <SettingRow
          title="Minimum Matching Score"
          description="The lowest relevance score a source must reach to be used at all."
          info="Sources scoring below this are ignored entirely, even if nothing else is found."
        >
          <SliderControl
            value={value.minMatchingScore}
            onChange={(minMatchingScore) => update({ minMatchingScore })}
          />
        </SettingRow>

        <SettingRow
          title="Enable Hybrid Search"
          description="Combine keyword matching with semantic search."
          info="Keeps exact terms — like a product code or coupon name — from being missed by semantic search alone."
        >
          <div className="flex justify-end sm:justify-end">
            <Switch
              checked={value.hybridSearchEnabled}
              onCheckedChange={(hybridSearchEnabled) => update({ hybridSearchEnabled })}
            />
          </div>
        </SettingRow>

        <SettingRow
          title="Enable Reranking"
          description="Run a second, more precise pass over the top results to reorder them."
          info="Reranking is slower but more accurate — it re-scores the shortlist rather than the whole knowledge base."
        >
          <div className="flex justify-end sm:justify-end">
            <Switch
              checked={value.rerankingEnabled}
              onCheckedChange={(rerankingEnabled) => update({ rerankingEnabled })}
            />
          </div>
        </SettingRow>

        <SettingRow
          title="Reranking Threshold"
          description="The minimum reranked score a source must keep to stay in the final answer."
          info="Only applies when reranking is enabled."
        >
          <SliderControl
            value={value.rerankingThreshold}
            onChange={(rerankingThreshold) => update({ rerankingThreshold })}
            disabled={!value.rerankingEnabled}
          />
        </SettingRow>
      </CardContent>
    </Card>
  );
}
