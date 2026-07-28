"use client";

import { useEffect } from "react";
import { useFormik } from "formik";
import z from "zod";

import BrandVoiceVocabularyChipLists from "@/components/custom/brand-voice-vocabulary-chip-lists";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchVocabulary,
  createVocabulary,
  fetchVocabularyPresets,
} from "@/redux/api-slice/brand-voice-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

// Type definition for form values
type VocabularyFormValues = {
  preferred_phrases: string[];
  banned_words: string[];
  signature_phrases: string[];
  word_replacements: Array<{
    say_word: string;
    replace_word: string;
  }>;
};

const replacementSchema = z.object({
  say_word: z.string().trim(),
  replace_word: z.string().trim(),
});

// Validation schema for the form using Zod
const validationSchema = z
  .object({
    preferred_phrases: z.array(z.string().trim().min(1)).default([]),
    banned_words: z.array(z.string().trim().min(1)).default([]),
    signature_phrases: z.array(z.string().trim().min(1)).default([]),
    word_replacements: z.array(replacementSchema),
  })
  // Require both fields for each replacement row so the pair stays valid.
  .superRefine((values, ctx) => {
    values.word_replacements.forEach((row, index) => {
      const hasSayWord = row.say_word.trim().length > 0;
      const hasReplaceWord = row.replace_word.trim().length > 0;

      if (hasSayWord !== hasReplaceWord) {
        if (!hasSayWord) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["word_replacements", index, "say_word"],
            message: "Say word and replace with must be filled together.",
          });
        }
        if (!hasReplaceWord) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["word_replacements", index, "replace_word"],
            message: "Say word and replace with must be filled together.",
          });
        }
      }
    });
  });

export default function BrandVoiceVocabularyEditor() {
  const dispatch = useAppDispatch();
  // Fetch store code from Redux state
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  // Fetch Vocabulary state from Redux
  const { FetchVocabularyData, FetchVocabularyIsLoading } = useAppSelector(
    (state) => state.GetBrandVoiceReducer.FetchVocabularyState,
  );
  const { FetchVocabularyPresetsData, FetchVocabularyPresetsIsLoading } =
    useAppSelector(
      (state) => state.GetBrandVoiceReducer.FetchVocabularyPresetsState,
    );
  const { CreateVocabularyIsLoading } = useAppSelector(
    (state) => state.GetBrandVoiceReducer.CreateVocabularyState,
  );

  const updatedAt = FetchVocabularyData?.updated_at ?? null;

  // Fetch vocabulary data when the component mounts or store code changes
  useEffect(() => {
    if (storeCode) {
      dispatch(fetchVocabulary(storeCode));
      dispatch(fetchVocabularyPresets());
    }
  }, [dispatch, storeCode]);

  const hasVocabData =
    FetchVocabularyData && Object.keys(FetchVocabularyData).length > 0;

  // If the store has no saved data yet, we generate a starting template.
  // This reduces (merges) ALL the different global vocabulary presets into one single set of arrays.
  const mergedVocabPresets = (
    FetchVocabularyPresetsData || []
  ).reduce<VocabularyFormValues>(
    (combinedVocab, currentPreset) => ({
      preferred_phrases: [
        ...combinedVocab.preferred_phrases,
        ...(currentPreset.preferred_phrases || []),
      ],
      banned_words: [
        ...combinedVocab.banned_words,
        ...(currentPreset.banned_words || []),
      ],
      signature_phrases: [
        ...combinedVocab.signature_phrases,
        ...(currentPreset.signature_phrases || []),
      ],
      word_replacements: [
        ...combinedVocab.word_replacements,
        // Note: The preset data returns replacement pairs under 'word_replacement_pairs'
        ...(currentPreset.word_replacement_pairs || []),
      ],
    }),
    {
      preferred_phrases: [],
      banned_words: [],
      signature_phrases: [],
      word_replacements: [],
    },
  );

  // Apply the store's actual saved data if it has any; otherwise use the merged presets template.
  const initialVocab = hasVocabData ? FetchVocabularyData : mergedVocabPresets;

  // Initialize formik for form state management
  const formik = useFormik<VocabularyFormValues>({
    enableReinitialize: true,
    initialValues: {
      preferred_phrases: initialVocab?.preferred_phrases ?? [],
      banned_words: initialVocab?.banned_words ?? [],
      signature_phrases: initialVocab?.signature_phrases ?? [],
      word_replacements: initialVocab?.word_replacements ?? [],
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
      const payload = {
        ...values,
        word_replacements: values.word_replacements.filter(
          (row) => row.say_word.trim() && row.replace_word.trim(),
        ),
      };
      // Dispatch the createVocabulary action and handle the result
      const result = await dispatch(
        createVocabulary({
          storeCode: storeCode,
          payload,
        }),
      );
      // If the action is fulfilled, reset the form with the new values
      if (createVocabulary.fulfilled.match(result)) {
        formik.resetForm({ values: result.payload as VocabularyFormValues });
      }
      if (createVocabulary.rejected.match(result)) {
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

  const values = formik.values;

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <div>
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Vocabulary
        </h4>
        <p className="text-sm text-muted-foreground">
          The specific words that make your brand sound like you. Preferred
          phrases to lean into, words to ban, signature expressions, and exact
          swaps the AI always makes.
        </p>
      </div>
      {FetchVocabularyIsLoading || FetchVocabularyPresetsIsLoading ? (
        <div className="flex items-center justify-center gap-2 py-10">
          <Spinner className="size-6" />
          Loading vocabulary...
        </div>
      ) : (
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <BrandVoiceVocabularyChipLists
              formik={formik}
              preferredPhrases={values.preferred_phrases}
              bannedWords={values.banned_words}
              signaturePhrases={values.signature_phrases}
              wordReplacements={values.word_replacements}
              onPreferredChange={(v) =>
                formik.setFieldValue("preferred_phrases", v)
              }
              onBannedChange={(v) => formik.setFieldValue("banned_words", v)}
              onSignatureChange={(v) =>
                formik.setFieldValue("signature_phrases", v)
              }
              onReplacementAdd={() =>
                formik.setFieldValue("word_replacements", [
                  ...values.word_replacements,
                  { say_word: "", replace_word: "" },
                ])
              }
            />

            <div className="sticky bottom-0 z-10 flex justify-start border-t border-border bg-background py-3">
              <Button
                type="submit"
                size="lg"
                disabled={CreateVocabularyIsLoading}
              >
                {CreateVocabularyIsLoading && (
                  <Spinner data-icon="inline-start" />
                )}
                {CreateVocabularyIsLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
