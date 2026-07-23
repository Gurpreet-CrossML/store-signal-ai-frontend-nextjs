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
  fetchTonePresets,
  fetchToneStyle,
  createToneStyle,
} from "@/redux/api-slice/brand-voice-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { type ToneStylePayload } from "@/db/chat";

// Validation schema for the form using Zod
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

export default function BrandVoiceToneStyleEditor() {
  const dispatch = useAppDispatch();
  // Fetch store code from Redux state
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  // Fetch Tone Presets state from Redux
  const { FetchTonePresetsData, FetchTonePresetsIsLoading } = useAppSelector(
    (state) => state.GetBrandVoiceReducer.FetchTonePresetsState,
  );
  // Fetch Tone & Style state from Redux
  const { FetchToneStyleData, FetchToneStyleIsLoading } = useAppSelector(
    (state) => state.GetBrandVoiceReducer.FetchToneStyleState,
  );
  const { CreateToneStyleIsLoading } = useAppSelector(
    (state) => state.GetBrandVoiceReducer.CreateToneStyleState,
  );

  // Fetch tone presets and style data when the component mounts or store code changes
  useEffect(() => {
    if (storeCode) {
      dispatch(fetchTonePresets());
      dispatch(fetchToneStyle(storeCode));
    }
  }, [dispatch, storeCode]);

  // Initialize formik for form state management
  const formik = useFormik<ToneStylePayload>({
    enableReinitialize: true,
    initialValues: {
      preset: FetchToneStyleData?.preset ?? FetchTonePresetsData[0]?.id ?? 0,
      warmth:
        FetchToneStyleData?.warmth ?? FetchTonePresetsData[0]?.warmth ?? 50,
      formality:
        FetchToneStyleData?.formality ??
        FetchTonePresetsData[0]?.formality ??
        50,
      energy:
        FetchToneStyleData?.energy ?? FetchTonePresetsData[0]?.energy ?? 50,
      playfulness:
        FetchToneStyleData?.playfulness ??
        FetchTonePresetsData[0]?.playfulness ??
        50,
      directness:
        FetchToneStyleData?.directness ??
        FetchTonePresetsData[0]?.directness ??
        50,
      answer_length: FetchToneStyleData?.answer_length || "standard",
      frequency_policy: FetchToneStyleData?.frequency_policy || "sparing",
      regional_spelling: FetchToneStyleData?.regional_spelling || "auto",
      use_bullet_points: FetchToneStyleData?.use_bullet_points ?? true,
    },
    // Validation using Zod schema
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
    // Handle form submission
    onSubmit: async (values) => {
      // Guard against submitting without a store code
      if (!storeCode) return;
      // Dispatch the createToneStyle action and handle the result
      const result = await dispatch(
        createToneStyle({ storeCode, payload: values }),
      );
      // If the action is fulfilled, reset the form with the new values
      if (createToneStyle.fulfilled.match(result)) {
        formik.resetForm({ values: result.payload as ToneStylePayload });
      }
      if (createToneStyle.rejected.match(result)) {
        const payload = result.payload as Record<
          string,
          string | Record<string, string>
        > | null;
        const errors = (payload?.data as Record<string, string>) || {};
        formik.setErrors({
          ...errors,
        });
      }
    },
  });

  const customPresetId =
    FetchTonePresetsData.find(
      (preset) => preset.name.toLowerCase() === "custom",
    )?.id ?? null;

  // Update the active slider immediately in form state.
  const handleSliderChange = (key: keyof ToneStylePayload, value: number) => {
    formik.setFieldValue(key, value);

    if (customPresetId === null) return;
    const currentPreset = FetchTonePresetsData.find(
      (p) => p.id === formik.values.preset,
    );
    if (!currentPreset) return;

    const updatedValues = {
      ...formik.values,
      [key]: value,
    };

    // If the sliders no longer match the selected preset, mark the form as Custom.
    if (
      currentPreset.warmth !== Number(updatedValues.warmth) ||
      currentPreset.formality !== Number(updatedValues.formality) ||
      currentPreset.energy !== Number(updatedValues.energy) ||
      currentPreset.playfulness !== Number(updatedValues.playfulness) ||
      currentPreset.directness !== Number(updatedValues.directness)
    ) {
      if (formik.values.preset !== customPresetId) {
        formik.setFieldValue("preset", customPresetId, false);
      }
    }
  };

  const selectedPreset =
    FetchTonePresetsData.find((preset) => preset.id === formik.values.preset) ??
    FetchTonePresetsData[0];

  // Handle preset selection and apply its values
  const handlePresetSelect = (presetId: number) => {
    const tonePreset = FetchTonePresetsData.find(
      (preset) => preset.id === presetId,
    );
    if (!tonePreset) return;

    formik.setValues({
      ...formik.values,
      preset: tonePreset.id,
      warmth: tonePreset.warmth,
      formality: tonePreset.formality,
      energy: tonePreset.energy,
      playfulness: tonePreset.playfulness,
      directness: tonePreset.directness,
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {FetchToneStyleIsLoading || FetchTonePresetsIsLoading ? (
        <div className="flex items-center justify-center gap-2 py-10">
          <Spinner className="size-6" />
          Loading tone and style...
        </div>
      ) : (
        <form
          onSubmit={formik.handleSubmit}
          className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]"
        >
          <div className="flex flex-col gap-6">
            <div className="mt-3 flex flex-col gap-2">
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Shape how every reply sounds. The live preview updates as you
                adjust the settings.
              </p>
            </div>

            <BrandVoiceTonePresetSelector
              presets={FetchTonePresetsData}
              activePreset={formik.values.preset}
              onSelect={handlePresetSelect}
            />

            <BrandVoiceToneControls
              formik={formik}
              bulletPointsDescription="Bullet points help organize longer answers."
              onSliderChange={handleSliderChange}
            />

            <div className="sticky bottom-0 z-10 flex justify-start border-t border-border bg-background py-3">
              <Button
                type="submit"
                size="lg"
                disabled={CreateToneStyleIsLoading}
              >
                {CreateToneStyleIsLoading && (
                  <Spinner data-icon="inline-start" />
                )}
                {CreateToneStyleIsLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <ToneStylePreviewPanel
              preset={selectedPreset ?? null}
              presetOrder={FetchTonePresetsData}
              currentProfile={{
                preset: formik.values.preset,
                warmth: Number(formik.values.warmth),
                formality: Number(formik.values.formality),
                energy: Number(formik.values.energy),
                playfulness: Number(formik.values.playfulness),
                directness: Number(formik.values.directness),
                useBulletPoints: formik.values.use_bullet_points,
              }}
            />
          </div>
        </form>
      )}
    </div>
  );
}
