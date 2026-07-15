"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconAdjustments } from "@tabler/icons-react";

type SelectOption = { value: string; label: string };

const ANSWER_LENGTH_OPTIONS: readonly SelectOption[] = [
  { value: "concise", label: "Concise" },
  { value: "standard", label: "Standard" },
  { value: "thorough", label: "Thorough" },
];

const FREQUENCY_OPTIONS: readonly SelectOption[] = [
  { value: "none", label: "None" },
  { value: "sparing", label: "Sparing" },
  { value: "moderate", label: "Moderate" },
  { value: "liberal", label: "Liberal" },
  { value: "free", label: "Free" },
];

const SPELLING_OPTIONS: readonly SelectOption[] = [
  { value: "uk", label: "UK" },
  { value: "us", label: "US" },
  { value: "auto", label: "Auto" },
];

function ToneSelectField({
  label,
  description,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  options: readonly SelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className={`flex flex-col gap-2 ${disabled ? "opacity-70" : ""}`}>
      <div className="flex flex-col gap-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

type BrandVoiceToneStructureProps = {
  answerLength: string;
  frequencyPolicy: string;
  regionalSpelling: string;
  useBulletPoints: boolean;
  bulletPointsDescription: string;
  disabled: boolean;
  onAnswerLengthChange: (value: string) => void;
  onFrequencyPolicyChange: (value: string) => void;
  onRegionalSpellingChange: (value: string) => void;
  onToggleBulletPoints: () => void;
};

export default function BrandVoiceToneStructure({
  answerLength,
  frequencyPolicy,
  regionalSpelling,
  useBulletPoints,
  bulletPointsDescription,
  disabled,
  onAnswerLengthChange,
  onFrequencyPolicyChange,
  onRegionalSpellingChange,
  onToggleBulletPoints,
}: BrandVoiceToneStructureProps) {
  return (
    <Card className="gap-0 overflow-hidden border-border/60 bg-background/95 shadow-sm">
      <CardHeader className="px-5 py-4">
        <CardTitle className="flex items-center gap-2">
          <IconAdjustments className="size-4" />
          Structure &amp; expression
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-5 pb-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ToneSelectField
            label="Answer length"
            description="Controls how much detail the assistant gives."
            value={answerLength}
            options={ANSWER_LENGTH_OPTIONS}
            disabled={disabled}
            onChange={onAnswerLengthChange}
          />
          <ToneSelectField
            label="Frequency policy"
            description="Sets how often signature phrasing can repeat."
            value={frequencyPolicy}
            options={FREQUENCY_OPTIONS}
            disabled={disabled}
            onChange={onFrequencyPolicyChange}
          />
          <ToneSelectField
            label="Regional spelling"
            description="Matches the store's spelling preference."
            value={regionalSpelling}
            options={SPELLING_OPTIONS}
            disabled={disabled}
            onChange={onRegionalSpellingChange}
          />
        </div>

        <Separator />

        <button
          type="button"
          onClick={onToggleBulletPoints}
          disabled={disabled}
          className={
            useBulletPoints
              ? `flex items-center justify-between rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 text-left transition-colors ${disabled ? "opacity-70 cursor-not-allowed" : ""}`
              : `flex items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3 text-left transition-colors ${disabled ? "opacity-70 cursor-not-allowed" : ""}`
          }
          aria-pressed={useBulletPoints}
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Use bullet points</span>
            <span className="text-xs text-muted-foreground">
              {bulletPointsDescription}
            </span>
          </div>
          <span
            className={
              useBulletPoints
                ? "flex h-7 w-12 items-center rounded-full bg-primary p-1 transition-colors"
                : "flex h-7 w-12 items-center rounded-full bg-muted p-1 transition-colors"
            }
          >
            <span
              className={
                useBulletPoints
                  ? "size-5 translate-x-5 rounded-full bg-background shadow-sm transition-transform"
                  : "size-5 translate-x-0 rounded-full bg-background shadow-sm transition-transform"
              }
            />
          </span>
        </button>
      </CardContent>
    </Card>
  );
}
