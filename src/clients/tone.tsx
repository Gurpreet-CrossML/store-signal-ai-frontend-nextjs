"use client";

import { useEffect } from "react";
import { useFormik, setIn } from "formik";
import z from "zod";

import BrandVoiceTonePresetSelector from "@/components/custom/brand-voice-tone-preset-selector";
import BrandVoiceToneControls from "@/components/custom/brand-voice-tone-controls";
import ToneStylePreviewPanel from "@/components/custom/brand-voice-tone-preview-panel";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import {
  GetTonePresets,
  GetToneStyle,
  SaveToneStyle,
} from "@/redux/api-slice/brand-voice-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { type TonePresetRecord, type ToneStylePayload } from "@/db/chat";

type ToneEditableField = Exclude<keyof ToneStylePayload, "preset">;

const validationSchema = z.object({
  preset: z.number().int(),
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

function createDefaultToneStyle(
  presets: readonly TonePresetRecord[],
): ToneStylePayload {
  const defaultPreset = presets[0] ?? null;
  return {
    preset: defaultPreset?.id ?? 0,
    warmth: defaultPreset?.warmth ?? 50,
    formality: defaultPreset?.formality ?? 50,
    energy: defaultPreset?.energy ?? 50,
    playfulness: defaultPreset?.playfulness ?? 50,
    directness: defaultPreset?.directness ?? 50,
    answer_length: "standard",
    frequency_policy: "sparing",
    regional_spelling: "auto",
    use_bullet_points: true,
  };
}

function getCustomPreset(
  presets: readonly TonePresetRecord[],
): TonePresetRecord | null {
  return (
    presets.find((preset) => preset.name.trim().toLowerCase() === "custom") ??
    null
  );
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
  const selectedStore = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  return (
    <BrandVoiceToneStyleEditorView
      key={selectedStore || "no-store"}
      selectedStore={selectedStore}
    />
  );
}

// Editor view (Formik + Redux orchestrator)
function BrandVoiceToneStyleEditorView({
  selectedStore,
}: {
  selectedStore: string;
}) {
  const dispatch = useAppDispatch();
  const tonePresetsFetch = useAppSelector(
    (state) => state.GetBrandVoiceReducer.tonePresets.fetch,
  );
  const { data: tonePresets, isLoading: presetsIsLoading } = tonePresetsFetch;
  const { data: toneData, isLoading: fetchIsLoading } = useAppSelector(
    (state) => state.GetBrandVoiceReducer.toneStyle.fetch,
  );
  const { isLoading: saveIsLoading } = useAppSelector(
    (state) => state.GetBrandVoiceReducer.toneStyle.save,
  );
  const presetList = tonePresets ?? [];
  const customPreset = getCustomPreset(presetList);
  const hasStoredToneStyle = toneData ? true : fetchIsLoading ? null : false;
  // Formik
  const formik = useFormik<ToneStylePayload>({
    enableReinitialize: true,
    initialValues:
      (toneData as ToneStylePayload) || createDefaultToneStyle(presetList),
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

  useEffect(() => {
    dispatch(GetTonePresets());
  }, [dispatch]);

  // Derived state
  const values = formik.values;
  const selectedPreset =
    presetList.find((preset) => preset.id === values.preset) ?? presetList[0];

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

  // Handlers
  const updateToneField = <K extends ToneEditableField>(
    key: K,
    value: ToneStylePayload[K],
  ) => {
    if (customPreset && formik.values.preset !== customPreset.id) {
      formik.setFieldValue("preset", customPreset.id);
    }
    formik.setFieldValue(key, value);
  };

  const handlePresetSelect = (presetId: number) => {
    const tonePreset = presetList.find((preset) => preset.id === presetId);
    if (!tonePreset) {
      return;
    }
    formik.setValues({
      ...formik.values,
      preset: tonePreset.id,
      warmth: tonePreset.warmth,
      formality: tonePreset.formality,
      energy: tonePreset.energy,
      playfulness: tonePreset.playfulness,
      directness: tonePreset.directness,
      answer_length: formik.values.answer_length,
      frequency_policy: formik.values.frequency_policy,
      regional_spelling: formik.values.regional_spelling,
      use_bullet_points: formik.values.use_bullet_points,
    });
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
      {fetchIsLoading || presetsIsLoading || hasStoredToneStyle === null ? (
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
            presets={presetList}
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
            bulletPointsDescription="Bullet points help organize longer answers."
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
            preset={selectedPreset ?? null}
            modeLabel={modeLabel}
            modeDescription={modeDescription}
            presetOrder={presetList}
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
