"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormik, setIn } from "formik";
import z from "zod";
import {
  IconAdjustments,
  IconBriefcase,
  IconDeviceFloppy,
  IconDiamond,
  IconGauge,
  IconMoodSmile,
  IconSparkles,
} from "@tabler/icons-react";

import previewConfigJson from "@/app/brand-voice/tone-style/live-preview.json";
import BrandVoiceTabsNav from "@/components/custom/brand-voice-tabs-nav";
import BrandVoiceToneMetricSlider from "@/components/custom/brand-voice-tone-metric-slider";
import BrandVoiceTonePresetCard from "@/components/custom/brand-voice-tone-preset-card";
import ToneStylePreviewPanel, {
  type TonePreviewConfig,
} from "@/components/custom/brand-voice-tone-preview-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  GetToneStyle,
  SaveToneStyle,
} from "@/redux/api-slice/brand-voice-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { type ToneStylePayload, type ToneStyleRecord } from "@/db/brand-voice";

type ToneStylePreviewConfig = TonePreviewConfig & {
  presets: Record<
    (typeof PRESET_ORDER)[number],
    { title: string; description: string }
  >;
};

const previewConfig = previewConfigJson as ToneStylePreviewConfig;

const PRESET_ORDER = [
  "friendly",
  "warm_expert",
  "professional",
  "playful",
  "luxury",
  "custom",
] as const;

const PRESET_META = {
  friendly: {
    icon: IconMoodSmile,
    title: previewConfig.presets.friendly.title,
    description: previewConfig.presets.friendly.description,
  },
  warm_expert: {
    icon: IconSparkles,
    title: previewConfig.presets.warm_expert.title,
    description: previewConfig.presets.warm_expert.description,
  },
  professional: {
    icon: IconBriefcase,
    title: previewConfig.presets.professional.title,
    description: previewConfig.presets.professional.description,
  },
  playful: {
    icon: IconGauge,
    title: previewConfig.presets.playful.title,
    description: previewConfig.presets.playful.description,
  },
  luxury: {
    icon: IconDiamond,
    title: previewConfig.presets.luxury.title,
    description: previewConfig.presets.luxury.description,
  },
  custom: {
    icon: IconAdjustments,
    title: previewConfig.presets.custom.title,
    description: previewConfig.presets.custom.description,
  },
} as const;

const ANSWER_LENGTH_OPTIONS = [
  { value: "concise", label: "Concise" },
  { value: "standard", label: "Standard" },
  { value: "thorough", label: "Thorough" },
] as const;

const FREQUENCY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "sparing", label: "Sparing" },
  { value: "moderate", label: "Moderate" },
  { value: "liberal", label: "Liberal" },
  { value: "free", label: "Free" },
] as const;

const SPELLING_OPTIONS = [
  { value: "uk", label: "UK" },
  { value: "us", label: "US" },
  { value: "auto", label: "Auto" },
] as const;

type AnswerLengthValue = (typeof ANSWER_LENGTH_OPTIONS)[number]["value"];
type FrequencyPolicyValue = (typeof FREQUENCY_OPTIONS)[number]["value"];
type RegionalSpellingValue = (typeof SPELLING_OPTIONS)[number]["value"];

const validationSchema = z.object({
  preset: z.enum(PRESET_ORDER),
  warmth: z.number().min(0).max(100),
  formality: z.number().min(0).max(100),
  energy: z.number().min(0).max(100),
  playfulness: z.number().min(0).max(100),
  directness: z.number().min(0).max(100),
  answer_length: z.enum(["concise", "standard", "thorough"]),
  frequency_policy: z.enum(["none", "sparing", "moderate", "liberal", "free"]),
  regional_spelling: z.enum(["uk", "us", "auto"]),
  use_bullet_points: z.boolean(),
});

const DEFAULT_TONE_STYLE: ToneStylePayload = {
  preset: "friendly",
  warmth: 50,
  formality: 50,
  energy: 50,
  playfulness: 50,
  directness: 50,
  answer_length: "standard",
  frequency_policy: "sparing",
  regional_spelling: "auto",
  use_bullet_points: true,
};

function createDefaultToneStyle(): ToneStylePayload {
  return { ...DEFAULT_TONE_STYLE };
}

function normalizeToneStyle(data: ToneStyleRecord): ToneStylePayload {
  return {
    preset: data.preset as ToneStylePayload["preset"],
    warmth: data.warmth,
    formality: data.formality,
    energy: data.energy,
    playfulness: data.playfulness,
    directness: data.directness,
    answer_length: data.answer_length as AnswerLengthValue,
    frequency_policy: data.frequency_policy as FrequencyPolicyValue,
    regional_spelling: data.regional_spelling as RegionalSpellingValue,
    use_bullet_points: data.use_bullet_points,
  };
}

function thresholdLabel(value: number) {
  if (value >= 67) return "high" as const;
  if (value >= 34) return "medium" as const;
  return "low" as const;
}

function formatPresetLabel(value: string | undefined) {
  if (!value) return "custom";
  return value.replaceAll("_", " ");
}

function ToneSelectField({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Select value={value} onValueChange={onChange}>
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

type StoreSummary = {
  id: string;
  name: string;
  code: string;
};

function issuesToFormikErrors(issues: z.ZodIssue[]) {
  return issues.reduce(
    (errors, issue) => {
      const path = issue.path.join(".");
      return setIn(errors, path, issue.message);
    },
    {} as Record<string, unknown>,
  );
}

export default function BrandVoiceToneStyleEditor() {
  const stores = useAppSelector(
    (state) => state.GetStoresReducer.GetStoresState.GetStoresListData,
  );
  const selectedStore = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const store = stores.find((item) => item.code === selectedStore);

  return (
    <BrandVoiceToneStyleEditorView
      key={selectedStore || "no-store"}
      selectedStore={selectedStore}
      store={store}
    />
  );
}

function BrandVoiceToneStyleEditorView({
  selectedStore,
  store,
}: {
  selectedStore: string;
  store: StoreSummary | undefined;
}) {
  const dispatch = useAppDispatch();
  const saveIsLoading = useAppSelector(
    (state) => state.GetBrandVoiceReducer.toneStyle.save.isLoading,
  );
  const fetchIsLoading = useAppSelector(
    (state) => state.GetBrandVoiceReducer.toneStyle.fetch.isLoading,
  );
  const [initialValues, setInitialValues] = useState<ToneStylePayload>(
    createDefaultToneStyle(),
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hasStoredToneStyle, setHasStoredToneStyle] = useState<boolean | null>(
    null,
  );

  const formik = useFormik<ToneStylePayload>({
    enableReinitialize: true,
    initialValues,
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      if (result.success) return {};
      return issuesToFormikErrors(result.error.issues);
    },
    onSubmit: async (values) => {
      if (!selectedStore) return;
      const result = await dispatch(
        SaveToneStyle({
          storeCode: selectedStore,
          payload: values,
        }),
      );

      if (SaveToneStyle.fulfilled.match(result)) {
        const next = normalizeToneStyle(result.payload);
        setInitialValues(next);
        setHasStoredToneStyle(true);
        setLastSavedAt(result.payload.updated_at);
      }
    },
  });

  useEffect(() => {
    if (!selectedStore) return;

    let active = true;
    (async () => {
      const result = await dispatch(GetToneStyle(selectedStore));
      if (!active) return;

      if (GetToneStyle.fulfilled.match(result)) {
        if (result.payload) {
          const next = normalizeToneStyle(result.payload);
          setInitialValues(next);
          setHasStoredToneStyle(true);
          setLastSavedAt(result.payload.updated_at);
        } else {
          setInitialValues(createDefaultToneStyle());
          setHasStoredToneStyle(false);
          setLastSavedAt(null);
        }
      } else {
        setHasStoredToneStyle(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [dispatch, selectedStore]);

  const values = formik.values;
  const isDirty = formik.dirty;
  const previewMode =
    hasStoredToneStyle === null
      ? "loading"
      : hasStoredToneStyle
        ? "saved"
        : "preset";
  const modeLabel =
    previewMode === "saved" ? "Saved profile" : "Preset preview";
  const modeDescription =
    previewMode === "saved"
      ? "Live view of the stored store-specific tone settings."
      : previewMode === "loading"
        ? "Loading the store's tone settings."
        : "No saved tone profile yet, so this preview follows the starter preset.";

  const assistantMessage = useMemo(() => {
    const base =
      previewConfig.preview.assistantTemplates[values.preset] ??
      previewConfig.preview.assistantTemplates.custom;

    const opener =
      values.warmth >= 67
        ? "I’m sorry for the delay."
        : values.formality >= 67
          ? "Thank you for reaching out."
          : values.directness >= 67
            ? "Here’s the update."
            : "I’m here to help.";

    const detail =
      values.answer_length === "thorough"
        ? "I’m checking the shipment details now and will follow up with the next step."
        : values.answer_length === "concise"
          ? "I’m checking it now."
          : "I’m checking the shipment details now.";

    const closer =
      values.playfulness >= 67
        ? "Let’s get this sorted."
        : values.energy >= 67
          ? "I’ll move quickly on this."
          : values.use_bullet_points
            ? "I’ll keep the next steps clear."
            : "I’ll keep you posted.";

    if (values.use_bullet_points) {
      return [opener, base, detail, closer]
        .filter(Boolean)
        .map((line) => `- ${line}`)
        .join("\n");
    }

    return [opener, base, detail, closer].filter(Boolean).join(" ");
  }, [values]);

  const insightRows = useMemo(
    () => [
      {
        label: "Warmth",
        value:
          previewConfig.insights.warmth[thresholdLabel(values.warmth)] ??
          previewConfig.insights.warmth.medium,
      },
      {
        label: "Formality",
        value:
          previewConfig.insights.formality[thresholdLabel(values.formality)] ??
          previewConfig.insights.formality.medium,
      },
      {
        label: "Energy",
        value:
          previewConfig.insights.energy[thresholdLabel(values.energy)] ??
          previewConfig.insights.energy.medium,
      },
      {
        label: "Playfulness",
        value:
          previewConfig.insights.playfulness[
            thresholdLabel(values.playfulness)
          ] ?? previewConfig.insights.playfulness.medium,
      },
      {
        label: "Directness",
        value:
          previewConfig.insights.directness[
            thresholdLabel(values.directness)
          ] ?? previewConfig.insights.directness.medium,
      },
    ],
    [values],
  );

  const summaryRows = useMemo(
    () => [
      {
        label: "Answer length",
        value:
          previewConfig.insights.answer_length[
            values.answer_length as AnswerLengthValue
          ] ?? previewConfig.insights.answer_length.standard,
      },
      {
        label: "Frequency",
        value:
          previewConfig.insights.frequency_policy[
            values.frequency_policy as FrequencyPolicyValue
          ] ?? previewConfig.insights.frequency_policy.sparing,
      },
      {
        label: "Spelling",
        value:
          previewConfig.insights.regional_spelling[
            values.regional_spelling as RegionalSpellingValue
          ] ?? previewConfig.insights.regional_spelling.auto,
      },
      {
        label: "Bullet points",
        value:
          previewConfig.insights.use_bullet_points[
            String(values.use_bullet_points) as "true" | "false"
          ] ?? previewConfig.insights.use_bullet_points.true,
      },
    ],
    [values],
  );

  if (!selectedStore) {
    return (
      <div className="w-full px-4 pb-6 md:px-6">
        <BrandVoiceTabsNav />
        <Empty className="min-h-[55vh]">
          <EmptyHeader>
            <EmptyTitle>Select a store first</EmptyTitle>
            <EmptyDescription>
              Choose a store from the sidebar to edit Tone & Style and preview
              how replies will sound.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <form onSubmit={formik.handleSubmit} className="w-full px-4 pb-6 md:px-6">
      <BrandVoiceTabsNav />

      <div className="mt-6 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            Brand Voice
          </Badge>
          <Badge variant="outline" className="font-normal">
            {store?.name ?? selectedStore}
          </Badge>
          {lastSavedAt && (
            <span className="text-xs text-muted-foreground">
              Last synced {new Date(lastSavedAt).toLocaleString()}
            </span>
          )}
        </div>
        <h1 className="font-heading text-2xl font-semibold">
          {previewConfig.hero.title}
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {previewConfig.hero.description}
        </p>
      </div>

      {fetchIsLoading || hasStoredToneStyle === null ? (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Loading current tone settings
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        <div className="flex flex-col gap-6">
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
                {PRESET_ORDER.map((preset) => {
                  const meta = PRESET_META[preset];
                  return (
                    <BrandVoiceTonePresetCard
                      key={preset}
                      title={meta.title}
                      description={meta.description}
                      icon={meta.icon}
                      active={values.preset === preset}
                      onClick={() => formik.setFieldValue("preset", preset)}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 overflow-hidden border-border/60 bg-background/95 shadow-sm">
            <CardHeader className="px-5 py-4">
              <CardTitle className="flex items-center gap-2">
                <IconGauge className="size-4" />
                Tone dimensions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-5 pb-5">
              <BrandVoiceToneMetricSlider
                label="Warmth"
                value={values.warmth}
                minLabel="Reserved"
                maxLabel="Warm"
                onChange={(value) => formik.setFieldValue("warmth", value)}
              />
              <BrandVoiceToneMetricSlider
                label="Formality"
                value={values.formality}
                minLabel="Casual"
                maxLabel="Formal"
                onChange={(value) => formik.setFieldValue("formality", value)}
              />
              <BrandVoiceToneMetricSlider
                label="Energy"
                value={values.energy}
                minLabel="Calm"
                maxLabel="Energetic"
                onChange={(value) => formik.setFieldValue("energy", value)}
              />
              <BrandVoiceToneMetricSlider
                label="Playfulness"
                value={values.playfulness}
                minLabel="Serious"
                maxLabel="Playful"
                onChange={(value) => formik.setFieldValue("playfulness", value)}
              />
              <BrandVoiceToneMetricSlider
                label="Directness"
                value={values.directness}
                minLabel="Gentle"
                maxLabel="Direct"
                onChange={(value) => formik.setFieldValue("directness", value)}
              />
            </CardContent>
          </Card>

          <Card className="gap-0 overflow-hidden border-border/60 bg-background/95 shadow-sm">
            <CardHeader className="px-5 py-4">
              <CardTitle className="flex items-center gap-2">
                <IconAdjustments className="size-4" />
                Structure & expression
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-5 pb-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ToneSelectField
                  label="Answer length"
                  description="Controls how much detail the assistant gives."
                  value={values.answer_length}
                  options={ANSWER_LENGTH_OPTIONS}
                  onChange={(value) =>
                    formik.setFieldValue(
                      "answer_length",
                      value as ToneStylePayload["answer_length"],
                    )
                  }
                />
                <ToneSelectField
                  label="Frequency policy"
                  description="Sets how often signature phrasing can repeat."
                  value={values.frequency_policy}
                  options={FREQUENCY_OPTIONS}
                  onChange={(value) =>
                    formik.setFieldValue(
                      "frequency_policy",
                      value as ToneStylePayload["frequency_policy"],
                    )
                  }
                />
                <ToneSelectField
                  label="Regional spelling"
                  description="Matches the store's spelling preference."
                  value={values.regional_spelling}
                  options={SPELLING_OPTIONS}
                  onChange={(value) =>
                    formik.setFieldValue(
                      "regional_spelling",
                      value as ToneStylePayload["regional_spelling"],
                    )
                  }
                />
              </div>

              <Separator />

              <button
                type="button"
                onClick={() =>
                  formik.setFieldValue(
                    "use_bullet_points",
                    !values.use_bullet_points,
                  )
                }
                className={
                  values.use_bullet_points
                    ? "flex items-center justify-between rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 text-left transition-colors"
                    : "flex items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3 text-left transition-colors"
                }
                aria-pressed={values.use_bullet_points}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Use bullet points</span>
                  <span className="text-xs text-muted-foreground">
                    {previewConfig.insights.use_bullet_points[
                      String(values.use_bullet_points) as "true" | "false"
                    ] ?? previewConfig.insights.use_bullet_points.true}
                  </span>
                </div>
                <span
                  className={
                    values.use_bullet_points
                      ? "flex h-7 w-12 items-center rounded-full bg-primary p-1 transition-colors"
                      : "flex h-7 w-12 items-center rounded-full bg-muted p-1 transition-colors"
                  }
                >
                  <span
                    className={
                      values.use_bullet_points
                        ? "size-5 translate-x-5 rounded-full bg-background shadow-sm transition-transform"
                        : "size-5 translate-x-0 rounded-full bg-background shadow-sm transition-transform"
                    }
                  />
                </span>
              </button>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => formik.resetForm()}
              disabled={saveIsLoading || fetchIsLoading}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || saveIsLoading || fetchIsLoading}
            >
              {saveIsLoading ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Saving
                </>
              ) : (
                <>
                  <IconDeviceFloppy />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <ToneStylePreviewPanel
            preset={values.preset}
            modeLabel={modeLabel}
            modeDescription={modeDescription}
            customerMessage={previewConfig.preview.customerMessage}
            assistantMessage={assistantMessage}
            insightRows={insightRows}
            summaryRows={summaryRows}
            previewConfig={previewConfig}
          />

          <Card className="gap-0 overflow-hidden border-border/60 bg-background/95 shadow-sm">
            <CardHeader className="px-5 py-4">
              <CardTitle className="flex items-center gap-2">
                <IconBriefcase className="size-4" />
                Current profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5">
              <div className="flex flex-wrap gap-2">
                {PRESET_ORDER.map((preset) => (
                  <Badge
                    key={preset}
                    variant={values.preset === preset ? "default" : "outline"}
                    className="font-normal capitalize"
                  >
                    {formatPresetLabel(preset)}
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Warmth
                  </p>
                  <p className="mt-1 font-medium tabular-nums">
                    {values.warmth}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Formality
                  </p>
                  <p className="mt-1 font-medium tabular-nums">
                    {values.formality}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Energy
                  </p>
                  <p className="mt-1 font-medium tabular-nums">
                    {values.energy}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Playfulness
                  </p>
                  <p className="mt-1 font-medium tabular-nums">
                    {values.playfulness}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Directness
                  </p>
                  <p className="mt-1 font-medium tabular-nums">
                    {values.directness}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Bullet points
                  </p>
                  <p className="mt-1 font-medium">
                    {values.use_bullet_points ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
