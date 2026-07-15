"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormik, setIn } from "formik";
import z from "zod";
import {
  IconAdjustments,
  IconBriefcase,
  IconDiamond,
  IconGauge,
  IconMoodSmile,
  IconSparkles,
  IconDeviceFloppy,
} from "@tabler/icons-react";

import previewConfigJson from "@/app/brand-voice/tone-style/live-preview.json";
import BrandVoiceTabsNav from "@/components/custom/brand-voice-tabs-nav";
import BrandVoiceTonePresetSelector from "@/components/custom/brand-voice-tone-preset-selector";
import BrandVoiceToneDimensions from "@/components/custom/brand-voice-tone-dimensions";
import BrandVoiceToneStructure from "@/components/custom/brand-voice-tone-structure";
import BrandVoiceToneCurrentProfile from "@/components/custom/brand-voice-tone-current-profile";
import ToneStylePreviewPanel, {
  type TonePreviewConfig,
} from "@/components/custom/brand-voice-tone-preview-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import {
  GetToneStyle,
  SaveToneStyle,
} from "@/redux/api-slice/brand-voice-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { type ToneStylePayload, type ToneStyleRecord } from "@/db/brand-voice";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToneStylePreviewConfig = TonePreviewConfig & {
  presets: Record<
    (typeof PRESET_ORDER)[number],
    { title: string; description: string }
  >;
};

type AnswerLengthValue = "concise" | "standard" | "thorough";
type FrequencyPolicyValue =
  | "none"
  | "sparing"
  | "moderate"
  | "liberal"
  | "free";
type RegionalSpellingValue = "uk" | "us" | "auto";

type StoreSummary = { id: string; name: string; code: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const previewConfig = previewConfigJson as ToneStylePreviewConfig;

const PRESET_ORDER = [
  "friendly",
  "warm_expert",
  "professional",
  "playful",
  "luxury",
  "custom",
] as const;

const PRESET_META = [
  {
    key: "friendly",
    icon: IconMoodSmile,
    title: previewConfig.presets.friendly.title,
    description: previewConfig.presets.friendly.description,
  },
  {
    key: "warm_expert",
    icon: IconSparkles,
    title: previewConfig.presets.warm_expert.title,
    description: previewConfig.presets.warm_expert.description,
  },
  {
    key: "professional",
    icon: IconBriefcase,
    title: previewConfig.presets.professional.title,
    description: previewConfig.presets.professional.description,
  },
  {
    key: "playful",
    icon: IconGauge,
    title: previewConfig.presets.playful.title,
    description: previewConfig.presets.playful.description,
  },
  {
    key: "luxury",
    icon: IconDiamond,
    title: previewConfig.presets.luxury.title,
    description: previewConfig.presets.luxury.description,
  },
  {
    key: "custom",
    icon: IconAdjustments,
    title: previewConfig.presets.custom.title,
    description: previewConfig.presets.custom.description,
  },
];

const PRESET_VALUES: Record<
  Exclude<(typeof PRESET_ORDER)[number], "custom">,
  Partial<ToneStylePayload>
> = {
  friendly: {
    warmth: 85,
    formality: 35,
    energy: 65,
    playfulness: 70,
    directness: 45,
    answer_length: "standard",
    frequency_policy: "moderate",
    use_bullet_points: true,
  },
  warm_expert: {
    warmth: 78,
    formality: 66,
    energy: 42,
    playfulness: 25,
    directness: 55,
    answer_length: "thorough",
    frequency_policy: "sparing",
    use_bullet_points: true,
  },
  professional: {
    warmth: 35,
    formality: 85,
    energy: 45,
    playfulness: 15,
    directness: 75,
    answer_length: "concise",
    frequency_policy: "none",
    use_bullet_points: true,
  },
  playful: {
    warmth: 75,
    formality: 25,
    energy: 85,
    playfulness: 85,
    directness: 50,
    answer_length: "concise",
    frequency_policy: "liberal",
    use_bullet_points: false,
  },
  luxury: {
    warmth: 45,
    formality: 90,
    energy: 35,
    playfulness: 15,
    directness: 40,
    answer_length: "standard",
    frequency_policy: "sparing",
    use_bullet_points: false,
  },
};

const DEFAULT_TONE_STYLE: ToneStylePayload = {
  preset: "friendly",
  warmth: 85,
  formality: 35,
  energy: 65,
  playfulness: 70,
  directness: 45,
  answer_length: "standard",
  frequency_policy: "moderate",
  regional_spelling: "auto",
  use_bullet_points: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function issuesToFormikErrors(issues: z.ZodIssue[]) {
  return issues.reduce(
    (errors, issue) => {
      const path = issue.path.join(".");
      return setIn(errors, path, issue.message);
    },
    {} as Record<string, unknown>,
  );
}

// ─── Root component (store selector shell) ────────────────────────────────────

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

// ─── Editor view (Formik + Redux orchestrator) ────────────────────────────────

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

  // ── Formik ────────────────────────────────────────────────────────────────
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
        SaveToneStyle({ storeCode: selectedStore, payload: values }),
      );
      if (SaveToneStyle.fulfilled.match(result)) {
        const next = normalizeToneStyle(result.payload);
        setInitialValues(next);
        setHasStoredToneStyle(true);
        setLastSavedAt(result.payload.updated_at);
      }
    },
  });

  // ── Fetch on mount ────────────────────────────────────────────────────────
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

  // ── Derived state ─────────────────────────────────────────────────────────
  const values = formik.values;
  const isCustom = values.preset === "custom";

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
        ? "I'm sorry for the delay."
        : values.formality >= 67
          ? "Thank you for reaching out."
          : values.directness >= 67
            ? "Here's the update."
            : "I'm here to help.";
    const detail =
      values.answer_length === "thorough"
        ? "I'm checking the shipment details now and will follow up with the next step."
        : values.answer_length === "concise"
          ? "I'm checking it now."
          : "I'm checking the shipment details now.";
    const closer =
      values.playfulness >= 67
        ? "Let's get this sorted."
        : values.energy >= 67
          ? "I'll move quickly on this."
          : values.use_bullet_points
            ? "I'll keep the next steps clear."
            : "I'll keep you posted.";
    if (values.use_bullet_points) {
      return [opener, base, detail, closer]
        .filter(Boolean)
        .map((l) => `- ${l}`)
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

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePresetSelect = (preset: string) => {
    formik.setFieldValue("preset", preset);
    if (preset !== "custom") {
      const presetVals = PRESET_VALUES[preset as keyof typeof PRESET_VALUES];
      if (presetVals) {
        Object.entries(presetVals).forEach(([k, v]) =>
          formik.setFieldValue(k, v),
        );
      }
    }
  };

  const handleDimensionChange = (key: string, value: number) => {
    formik.setFieldValue(key, value);
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!selectedStore) {
    return (
      <div className="w-full px-4 pb-6 md:px-6">
        <BrandVoiceTabsNav />
        <Empty className="min-h-[55vh]">
          <EmptyHeader>
            <EmptyTitle>Select a store first</EmptyTitle>
            <EmptyDescription>
              Choose a store from the sidebar to edit Tone &amp; Style and
              preview how replies will sound.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <form onSubmit={formik.handleSubmit} className="w-full px-4 pb-6 md:px-6">
      <BrandVoiceTabsNav />

      {/* Page header */}
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

      {/* Loading banner */}
      {fetchIsLoading || hasStoredToneStyle === null ? (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Loading current tone settings
        </div>
      ) : null}

      {/* Two-column grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          <BrandVoiceTonePresetSelector
            presets={PRESET_META}
            activePreset={values.preset}
            onSelect={handlePresetSelect}
          />

          <BrandVoiceToneDimensions
            values={{
              warmth: values.warmth,
              formality: values.formality,
              energy: values.energy,
              playfulness: values.playfulness,
              directness: values.directness,
            }}
            disabled={!isCustom}
            onChange={handleDimensionChange}
          />

          <BrandVoiceToneStructure
            answerLength={values.answer_length}
            frequencyPolicy={values.frequency_policy}
            regionalSpelling={values.regional_spelling}
            useBulletPoints={values.use_bullet_points}
            bulletPointsDescription={
              previewConfig.insights.use_bullet_points[
                String(values.use_bullet_points) as "true" | "false"
              ] ?? previewConfig.insights.use_bullet_points.true
            }
            disabled={!isCustom}
            onAnswerLengthChange={(v) =>
              formik.setFieldValue(
                "answer_length",
                v as ToneStylePayload["answer_length"],
              )
            }
            onFrequencyPolicyChange={(v) =>
              formik.setFieldValue(
                "frequency_policy",
                v as ToneStylePayload["frequency_policy"],
              )
            }
            onRegionalSpellingChange={(v) =>
              formik.setFieldValue(
                "regional_spelling",
                v as ToneStylePayload["regional_spelling"],
              )
            }
            onToggleBulletPoints={() =>
              formik.setFieldValue(
                "use_bullet_points",
                !values.use_bullet_points,
              )
            }
          />

          {/* Save / Reset buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => formik.resetForm()}
              disabled={saveIsLoading || fetchIsLoading}
            >
              Discard changes
            </Button>
            <Button
              type="submit"
              disabled={!formik.dirty || saveIsLoading || fetchIsLoading}
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

        {/* Right column */}
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

          <BrandVoiceToneCurrentProfile
            preset={values.preset}
            warmth={values.warmth}
            formality={values.formality}
            energy={values.energy}
            playfulness={values.playfulness}
            directness={values.directness}
            useBulletPoints={values.use_bullet_points}
          />
        </div>
      </div>
    </form>
  );
}
