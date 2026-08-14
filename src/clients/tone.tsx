"use client";

import { useEffect } from "react";
import { useFormik } from "formik";
import z from "zod";

import BrandVoiceTonePresetSelector from "@/components/custom/brand-voice-tone-preset-selector";
import BrandVoiceToneControls from "@/components/custom/brand-voice-tone-controls";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/custom/loading-state";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchTonePresets,
  fetchToneStyle,
  createToneStyle,
} from "@/redux/api-slice/brand-voice-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { formikErrorsFromZod, applyServerFieldErrors } from "@/lib/form-errors";
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
  emoji_policy: z.enum(["none", "sparing", "moderate", "liberal", "free"]),
  exclamation_marks_policy: z.enum([
    "none",
    "sparing",
    "moderate",
    "liberal",
    "free",
  ]),
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
      emoji_policy: FetchToneStyleData?.emoji_policy || "sparing",
      exclamation_marks_policy:
        FetchToneStyleData?.exclamation_marks_policy || "sparing",
      regional_spelling: FetchToneStyleData?.regional_spelling || "auto",
      use_bullet_points: FetchToneStyleData?.use_bullet_points ?? true,
    },
    // Validation using Zod schema
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      if (result.success) return {};
      return formikErrorsFromZod(result.error.issues);
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
        applyServerFieldErrors(formik, result.payload);
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
    <div className="flex w-full flex-col gap-6">
      {FetchToneStyleIsLoading || FetchTonePresetsIsLoading ? (
        <LoadingState label="Loading Tone & Style…" />
      ) : (
        <form onSubmit={formik.handleSubmit} className="grid grid-cols-1 gap-6">
          <div className="flex flex-col gap-6">
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

            <div className="flex justify-start border-t border-border py-3">
              <Button
                type="submit"
                size="lg"
                disabled={CreateToneStyleIsLoading}
              >
                {CreateToneStyleIsLoading ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <IconDeviceFloppy data-icon="inline-start" />
                )}
                {CreateToneStyleIsLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
