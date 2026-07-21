"use client";

import { useEffect } from "react";
import { useFormik } from "formik";
import z from "zod";

import BrandVoiceTonePresetSelector from "@/components/custom/brand-voice-tone-preset-selector";
import BrandVoiceToneControls from "@/components/custom/brand-voice-tone-controls";
import ToneStylePreviewPanel from "@/components/custom/brand-voice-tone-preview-panel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  GetTonePresets,
  GetToneStyle,
  SaveToneStyle,
} from "@/redux/api-slice/brand-voice-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { type ToneStylePayload, type TonePresetRecord } from "@/db/chat";

const validationSchema = z.object({
  preset: z.number().int(),
  warmth: z.coerce.number().min(0).max(100),
  formality: z.coerce.number().min(0).max(100),
  energy: z.coerce.number().min(0).max(100),
  playfulness: z.coerce.number().min(0).max(100),
  directness: z.coerce.number().min(0).max(100),
  answer_length: z.enum(["concise", "standard", "thorough"]),
  frequency_policy: z.enum(["none", "sparing", "moderate", "liberal", "free"]),
  regional_spelling: z.enum(["uk", "us", "auto"]),
  use_bullet_points: z.boolean(),
});

function getCustomPreset(presets: TonePresetRecord[]): number | null {
  return (
    presets.find((preset) => preset.name.toLowerCase() === "custom")?.id ?? null
  );
}

// Root component (store selector shell)

export default function BrandVoiceToneStyleEditor() {
  const selectedStore = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  return <BrandVoiceToneStyleEditorView storeCode={selectedStore} />;
}

// Editor view (Formik + Redux orchestrator)

function BrandVoiceToneStyleEditorView({ storeCode }: { storeCode: string }) {
  const dispatch = useAppDispatch();
  const {
    GetTonePresetsData: tonePresets,
    GetTonePresetsIsLoading: presetsIsLoading,
  } = useAppSelector((state) => state.GetBrandVoiceReducer.GetTonePresetsState);
  const { GetToneStyleData: toneData, GetToneStyleIsLoading: fetchIsLoading } =
    useAppSelector((state) => state.GetBrandVoiceReducer.GetToneStyleState);
  const { SaveToneStyleIsLoading: saveIsLoading } = useAppSelector(
    (state) => state.GetBrandVoiceReducer.SaveToneStyleState,
  );

  const customPresetId = getCustomPreset(tonePresets);

  // Formik
  const formik = useFormik<ToneStylePayload>({
    enableReinitialize: true,
    initialValues: (toneData as ToneStylePayload) || {
      preset: tonePresets[0]?.id ?? 0,
      warmth: tonePresets[0]?.warmth ?? 50,
      formality: tonePresets[0]?.formality ?? 50,
      energy: tonePresets[0]?.energy ?? 50,
      playfulness: tonePresets[0]?.playfulness ?? 50,
      directness: tonePresets[0]?.directness ?? 50,
      answer_length: "standard",
      frequency_policy: "sparing",
      regional_spelling: "auto",
      use_bullet_points: true,
    },
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      if (result.success) return {};
      return Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      );
    },
    onSubmit: async (values) => {
      if (!storeCode) return;
      const result = await dispatch(
        SaveToneStyle({ storeCode: storeCode, payload: values }),
      );
      if (SaveToneStyle.fulfilled.match(result)) {
        formik.resetForm({ values: result.payload });
      }
    },
  });

  // Fetch on mount / store change
  useEffect(() => {
    if (!storeCode) return;
    let active = true;
    (async () => {
      await dispatch(GetToneStyle(storeCode));
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [dispatch, storeCode]);

  useEffect(() => {
    dispatch(GetTonePresets());
  }, [dispatch]);

  // Auto-switch to custom preset when dimension values change
  useEffect(() => {
    if (customPresetId === null) return;
    const currentPreset = tonePresets.find(
      (p) => p.id === formik.values.preset,
    );
    if (!currentPreset) return;
    if (
      currentPreset.warmth !== Number(formik.values.warmth) ||
      currentPreset.formality !== Number(formik.values.formality) ||
      currentPreset.energy !== Number(formik.values.energy) ||
      currentPreset.playfulness !== Number(formik.values.playfulness) ||
      currentPreset.directness !== Number(formik.values.directness)
    ) {
      if (formik.values.preset !== customPresetId) {
        formik.setFieldValue("preset", customPresetId, false);
      }
    }
  }, [
    formik.values.warmth,
    formik.values.formality,
    formik.values.energy,
    formik.values.playfulness,
    formik.values.directness,
    formik.values.preset,
    customPresetId,
    tonePresets,
    formik,
  ]);

  // Derived state
  const values = formik.values;
  const selectedPreset =
    tonePresets.find((preset) => preset.id === values.preset) ?? tonePresets[0];

  const previewMode = toneData
    ? "saved"
    : fetchIsLoading
      ? "loading"
      : "preset";

  const modeLabel =
    previewMode === "saved" ? "Saved profile" : "Preset preview";
  const modeDescription =
    previewMode === "saved"
      ? "Live view of the stored store-specific tone settings."
      : previewMode === "loading"
        ? "Loading the store's tone settings."
        : "No saved tone profile yet, so this preview follows the starter preset.";

  const handlePresetSelect = (presetId: number) => {
    const tonePreset = tonePresets.find((preset) => preset.id === presetId);
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
      {fetchIsLoading || presetsIsLoading ? (
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
            presets={tonePresets}
            activePreset={values.preset}
            onSelect={handlePresetSelect}
          />

          <BrandVoiceToneControls
            formik={formik}
            bulletPointsDescription="Bullet points help organize longer answers."
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
            presetOrder={tonePresets}
            currentProfile={{
              preset: values.preset,
              warmth: Number(values.warmth),
              formality: Number(values.formality),
              energy: Number(values.energy),
              playfulness: Number(values.playfulness),
              directness: Number(values.directness),
              useBulletPoints: values.use_bullet_points,
            }}
          />
        </div>
      </div>
    </form>
  );
}
