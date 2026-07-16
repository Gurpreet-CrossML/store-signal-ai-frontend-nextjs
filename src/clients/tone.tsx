"use client";

import { useEffect, useState } from "react";
import { useFormik, setIn } from "formik";
import z from "zod";

import previewConfigJson from "@/lib/brand-voice-tone-preview.json";
import BrandVoiceTonePresetSelector from "@/components/custom/brand-voice-tone-preset-selector";
import BrandVoiceToneControls from "@/components/custom/brand-voice-tone-controls";
import ToneStylePreviewPanel, {
  type TonePreviewConfig,
} from "@/components/custom/brand-voice-tone-preview-panel";
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
import { type ToneStylePayload, type ToneStyleRecord } from "@/db/chat";
import {
  IconAdjustments,
  IconBriefcase,
  IconDiamond,
  IconGauge,
  IconMoodSmile,
  IconSparkles,
} from "@tabler/icons-react";

// Types

const PRESET_ORDER = [
  "friendly",
  "warm_expert",
  "professional",
  "playful",
  "luxury",
  "custom",
] as const;

type TonePresetKey = (typeof PRESET_ORDER)[number];

type TonePresetText = {
  title: string;
  description: string;
};

type TonePresetSettings = {
  warmth: number;
  formality: number;
  energy: number;
  playfulness: number;
  directness: number;
  answer_length: ToneStylePayload["answer_length"];
  frequency_policy: ToneStylePayload["frequency_policy"];
  use_bullet_points: boolean;
};

type TonePresetConfig = TonePresetText & TonePresetSettings;

type ToneStylePreviewConfig = Omit<TonePreviewConfig, "preview"> & {
  preview: TonePreviewConfig["preview"] & {
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
      detail: Record<AnswerLengthValue, string>;
      closer: {
        playfulnessHigh: string;
        energyHigh: string;
        bulletPoints: string;
        paragraph: string;
      };
    };
  };
  presets: Record<TonePresetKey, TonePresetConfig>;
};

type AnswerLengthValue = "concise" | "standard" | "thorough";
type FrequencyPolicyValue =
  | "none"
  | "sparing"
  | "moderate"
  | "liberal"
  | "free";
type RegionalSpellingValue = "uk" | "us" | "auto";
type ToneEditableField = Exclude<keyof ToneStylePayload, "preset">;

type StoreSummary = { id: string; name: string; code: string };

// Constants

const previewConfig = previewConfigJson as unknown as ToneStylePreviewConfig;

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
] as const;

// Helpers

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
  const friendly = previewConfig.presets.friendly;
  return {
    preset: "friendly",
    warmth: friendly.warmth,
    formality: friendly.formality,
    energy: friendly.energy,
    playfulness: friendly.playfulness,
    directness: friendly.directness,
    answer_length: friendly.answer_length,
    frequency_policy: friendly.frequency_policy,
    regional_spelling: "auto",
    use_bullet_points: friendly.use_bullet_points,
  };
}

function thresholdLabel(value: number) {
  if (value >= previewConfig.preview.thresholds.high) return "high" as const;
  if (value >= previewConfig.preview.thresholds.medium)
    return "medium" as const;
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

// Root component (store selector shell)

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

// Editor view (Formik + Redux orchestrator)
function BrandVoiceToneStyleEditorView({
  selectedStore,
  store,
}: {
  selectedStore: string;
  store: StoreSummary | undefined;
}) {
  const dispatch = useAppDispatch();
  const { data: toneData, isLoading: fetchIsLoading } = useAppSelector(
    (state) => state.GetBrandVoiceReducer.toneStyle.fetch,
  );
  const { isLoading: saveIsLoading } = useAppSelector(
    (state) => state.GetBrandVoiceReducer.toneStyle.save,
  );

  const hasStoredToneStyle = toneData ? true : fetchIsLoading ? null : false;
  const updatedAt = toneData?.updated_at ?? null;

  // Formik
  const formik = useFormik<ToneStylePayload>({
    enableReinitialize: true,
    initialValues:
      (toneData as any as ToneStylePayload) || createDefaultToneStyle(),
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      if (result.success) return {};
      return issuesToFormikErrors(result.error.issues);
    },
    onSubmit: async (values) => {
      if (!selectedStore) return;
      await dispatch(
        SaveToneStyle({ storeCode: selectedStore, payload: values }),
      );
    },
  });

  // Fetch on mount
  useEffect(() => {
    if (selectedStore) {
      dispatch(GetToneStyle(selectedStore));
    }
  }, [dispatch, selectedStore]);

  // Derived state
  const values = formik.values;

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

  const assistantBase =
    previewConfig.preview.assistantTemplates[values.preset] ??
    previewConfig.preview.assistantTemplates.custom;
  const opener =
    values.warmth >= previewConfig.preview.thresholds.high
      ? previewConfig.preview.assistantMessage.opener.warmthHigh
      : values.formality >= previewConfig.preview.thresholds.high
        ? previewConfig.preview.assistantMessage.opener.formalityHigh
        : values.directness >= previewConfig.preview.thresholds.high
          ? previewConfig.preview.assistantMessage.opener.directnessHigh
          : previewConfig.preview.assistantMessage.opener.fallback;
  const detail =
    previewConfig.preview.assistantMessage.detail[
      values.answer_length as AnswerLengthValue
    ];
  const closer =
    values.playfulness >= previewConfig.preview.thresholds.high
      ? previewConfig.preview.assistantMessage.closer.playfulnessHigh
      : values.energy >= previewConfig.preview.thresholds.high
        ? previewConfig.preview.assistantMessage.closer.energyHigh
        : values.use_bullet_points
          ? previewConfig.preview.assistantMessage.closer.bulletPoints
          : previewConfig.preview.assistantMessage.closer.paragraph;
  const assistantMessage = values.use_bullet_points
    ? [opener, assistantBase, detail, closer]
        .filter(Boolean)
        .map((l) => `- ${l}`)
        .join("\n")
    : [opener, assistantBase, detail, closer].filter(Boolean).join(" ");

  const insightRows = [
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
        previewConfig.insights.directness[thresholdLabel(values.directness)] ??
        previewConfig.insights.directness.medium,
    },
  ];

  const summaryRows = [
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
  ];

  // Handlers
  const updateToneField = <K extends ToneEditableField>(
    key: K,
    value: ToneStylePayload[K],
  ) => {
    if (formik.values.preset !== "custom") {
      formik.setFieldValue("preset", "custom");
    }
    formik.setFieldValue(key, value);
  };

  const handlePresetSelect = (preset: string) => {
    if (preset === "custom") {
      formik.setFieldValue("preset", preset);
      return;
    }
    const tonePreset =
      previewConfig.presets[preset as Exclude<TonePresetKey, "custom">];
    if (tonePreset) {
      formik.setValues({
        ...formik.values,
        preset,
        warmth: tonePreset.warmth,
        formality: tonePreset.formality,
        energy: tonePreset.energy,
        playfulness: tonePreset.playfulness,
        directness: tonePreset.directness,
        answer_length: tonePreset.answer_length,
        frequency_policy: tonePreset.frequency_policy,
        use_bullet_points: tonePreset.use_bullet_points,
      });
    }
  };

  //  Empty state
  if (!selectedStore) {
    return (
      <div className="w-full px-4 pb-6 md:px-6">
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

  // Main layout
  return (
    <form onSubmit={formik.handleSubmit} className="w-full px-4 pb-6 md:px-6">
      {/* Page header */}
      <div className="mt-3 flex flex-col gap-2">
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Shape how every reply sounds. The live preview updates as you adjust
          the settings.
        </p>
      </div>

      {/* Loading banner */}
      {fetchIsLoading || hasStoredToneStyle === null ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Loading current tone settings
        </div>
      ) : null}

      {/* Two-column grid */}
      <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          <BrandVoiceTonePresetSelector
            presets={PRESET_META}
            activePreset={values.preset}
            onSelect={handlePresetSelect}
          />

          <BrandVoiceToneControls
            values={{
              warmth: values.warmth,
              formality: values.formality,
              energy: values.energy,
              playfulness: values.playfulness,
              directness: values.directness,
            }}
            answerLength={values.answer_length}
            frequencyPolicy={values.frequency_policy}
            regionalSpelling={values.regional_spelling}
            useBulletPoints={values.use_bullet_points}
            bulletPointsDescription={
              previewConfig.insights.use_bullet_points[
                String(values.use_bullet_points) as "true" | "false"
              ] ?? previewConfig.insights.use_bullet_points.true
            }
            onChange={(key, value) =>
              updateToneField(key as ToneEditableField, value as number)
            }
            onAnswerLengthChange={(v) =>
              updateToneField(
                "answer_length",
                v as ToneStylePayload["answer_length"],
              )
            }
            onFrequencyPolicyChange={(v) =>
              updateToneField(
                "frequency_policy",
                v as ToneStylePayload["frequency_policy"],
              )
            }
            onRegionalSpellingChange={(v) =>
              updateToneField(
                "regional_spelling",
                v as ToneStylePayload["regional_spelling"],
              )
            }
            onToggleBulletPoints={() =>
              updateToneField("use_bullet_points", !values.use_bullet_points)
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
                  Saving...
                </>
              ) : (
                "Save Changes"
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
            presetOrder={PRESET_ORDER}
            customerMessage={previewConfig.preview.customerMessage}
            assistantMessage={assistantMessage}
            insightRows={insightRows}
            summaryRows={summaryRows}
            previewConfig={previewConfig}
            currentProfile={{
              preset: values.preset,
              warmth: values.warmth,
              formality: values.formality,
              energy: values.energy,
              playfulness: values.playfulness,
              directness: values.directness,
              useBulletPoints: values.use_bullet_points,
            }}
          />
        </div>
      </div>
    </form>
  );
}
