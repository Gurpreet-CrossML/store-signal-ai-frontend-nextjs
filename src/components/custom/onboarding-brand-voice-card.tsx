"use client";

import { useEffect, useState } from "react";
import { useFormik } from "formik";
import z from "zod";
import { IconArrowRight, IconIdBadge2 } from "@tabler/icons-react";

import BrandVoiceTonePresetSelector from "@/components/custom/brand-voice-tone-preset-selector";
import { InfoIcon } from "@/components/custom/info-icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAdvanceOnboarding } from "@/hooks/use-advance-onboarding";
import { applyServerFieldErrors, formikErrorsFromZod } from "@/lib/form-errors";
import {
  createPersonaIdentity,
  createToneStyle,
  fetchTonePresets,
} from "@/redux/api-slice/brand-voice-slice";
import { FetchOnboardingStatus } from "@/redux/api-slice/onboarding-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const validationSchema = z.object({
  name: z
    .string("Agent name is required")
    .trim()
    .min(1, "Agent name is required")
    .max(60),
  preset: z.number().int().positive("Pick a starting voice"),
});

/**
 * Brand-voice step, the last one: the agent's name and a quick-start tone
 * preset, saved to every connected store through the regular Brand Voice
 * endpoints. Everything else keeps its defaults and stays editable under
 * Brand Voice. Skippable.
 */
export function OnboardingBrandVoiceCard() {
  const dispatch = useAppDispatch();
  const advance = useAdvanceOnboarding();
  const { FetchOnboardingStatusData: status } = useAppSelector(
    (state) => state.GetOnboardingReducer.FetchOnboardingStatusState,
  );
  const { FetchTonePresetsData } = useAppSelector(
    (state) => state.GetBrandVoiceReducer.FetchTonePresetsState,
  );
  const { UpdateOnboardingStepIsLoading } = useAppSelector(
    (state) => state.GetOnboardingReducer.UpdateOnboardingStepState,
  );
  const [skipping, setSkipping] = useState(false);

  const stores = status?.stores ?? [];
  // Custom only means something once the dials move, which onboarding hides.
  const presets = FetchTonePresetsData.filter(
    (preset) => preset.name.toLowerCase() !== "custom",
  );

  useEffect(() => {
    dispatch(FetchOnboardingStatus());
    dispatch(fetchTonePresets());
  }, [dispatch]);

  const skip = async () => {
    setSkipping(true);
    await advance("skipped");
    setSkipping(false);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { name: "", preset: presets[0]?.id ?? 0 },
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      if (result.success) return {};
      return formikErrorsFromZod(result.error.issues);
    },
    onSubmit: async (values) => {
      const preset = presets.find((p) => p.id === values.preset);
      if (!preset) return;

      for (const { code: storeCode } of stores) {
        const persona = await dispatch(
          createPersonaIdentity({
            storeCode,
            payload: {
              name: values.name.trim(),
              // Required by the backend but not asked here; the same
              // fallback the persona preview shows.
              role_description: "a helpful assistant",
              self_reference: "i",
              email_signature: "",
              backstory: "",
              created_at: "",
              updated_at: "",
            },
          }),
        );
        if (createPersonaIdentity.rejected.match(persona)) {
          applyServerFieldErrors(formik, persona.payload);
          return;
        }

        const tone = await dispatch(
          createToneStyle({
            storeCode,
            payload: {
              preset: preset.id,
              warmth: preset.warmth,
              formality: preset.formality,
              energy: preset.energy,
              playfulness: preset.playfulness,
              directness: preset.directness,
              // Same defaults the Tone & Style screen starts from.
              answer_length: "standard",
              emoji_policy: "sparing",
              exclamation_marks_policy: "sparing",
              regional_spelling: "auto",
              use_bullet_points: true,
            },
          }),
        );
        if (createToneStyle.rejected.match(tone)) return;
      }
      await advance("completed");
    },
  });

  if (stores.length === 0 || presets.length === 0) {
    return <Skeleton className="h-72 w-full" />;
  }

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Set up your brand voice</CardTitle>
          <CardDescription>
            Name your assistant and pick how it sounds. You can fine-tune
            everything later under Brand Voice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field className="gap-2">
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="onboarding-agent-name">
                <IconIdBadge2 className="size-4" />
                Agent Name
                <span className="-ml-1 text-xs text-destructive">*</span>
                <InfoIcon text="The name customers see in chat and email. Short, friendly names work best — e.g. Ellie, Max, or your brand name." />
              </FieldLabel>
              <FieldDescription>
                How the AI identifies itself — a persona name feels like a real
                teammate, your brand name gives a company voice.
              </FieldDescription>
            </div>
            <Input
              id="onboarding-agent-name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Ellie"
            />
            {formik.touched.name && formik.errors.name && (
              <p className="text-xs text-destructive">{formik.errors.name}</p>
            )}
          </Field>
        </CardContent>
      </Card>

      <BrandVoiceTonePresetSelector
        presets={presets}
        activePreset={formik.values.preset}
        onSelect={(presetId) => formik.setFieldValue("preset", presetId)}
        // The drawer is max-w-3xl, so viewport breakpoints over-split it.
        className="sm:grid-cols-3 2xl:grid-cols-3"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          disabled={formik.isSubmitting || UpdateOnboardingStepIsLoading}
        >
          {formik.isSubmitting ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <IconArrowRight data-icon="inline-start" />
          )}
          Finish setup
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={formik.isSubmitting || UpdateOnboardingStepIsLoading}
          onClick={skip}
        >
          {skipping && <Spinner data-icon="inline-start" />}
          Skip for now
        </Button>
      </div>
    </form>
  );
}
