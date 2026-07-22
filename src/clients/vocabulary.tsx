"use client";

import { useEffect } from "react";
import { useFormik } from "formik";
import z from "zod";

import BrandVoiceVocabularyChipLists from "@/components/custom/brand-voice-vocabulary-chip-lists";
import BrandVoiceVocabularySummary from "@/components/custom/brand-voice-vocabulary-summary";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchVocabulary,
  CreateVocabulary,
} from "@/redux/api-slice/brand-voice-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

// Types

type VocabularyFormValues = {
  preferred_phrases: string[];
  banned_words: string[];
  signature_phrases: string[];
  word_replacements: Array<{
    say_word: string;
    replace_word: string;
    is_active: boolean;
  }>;
};

// Helpers

const replacementSchema = z.object({
  say_word: z.string().trim(),
  replace_word: z.string().trim(),
  is_active: z.boolean(),
});

const validationSchema = z
  .object({
    preferred_phrases: z.array(z.string().trim().min(1)).default([]),
    banned_words: z.array(z.string().trim().min(1)).default([]),
    signature_phrases: z.array(z.string().trim().min(1)).default([]),
    word_replacements: z.array(replacementSchema),
  })
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
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const { FetchVocabularyData, FetchVocabularyIsLoading } = useAppSelector(
    (state) => state.GetBrandVoiceReducer.FetchVocabularyState,
  );
  const { CreateVocabularyIsLoading } = useAppSelector(
    (state) => state.GetBrandVoiceReducer.CreateVocabularyState,
  );

  const updatedAt = FetchVocabularyData?.updated_at ?? null;

  useEffect(() => {
    if (storeCode) {
      dispatch(fetchVocabulary(storeCode));
    }
  }, [dispatch, storeCode]);

  const formik = useFormik<VocabularyFormValues>({
    enableReinitialize: true,
    initialValues: (FetchVocabularyData as any as VocabularyFormValues) || {
      preferred_phrases: [],
      banned_words: [],
      signature_phrases: [],
      word_replacements: [],
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
      const payload = {
        ...values,
        word_replacements: values.word_replacements.filter(
          (row) => row.say_word.trim() && row.replace_word.trim(),
        ),
      };
      const result = await dispatch(
        CreateVocabulary({
          storeCode: storeCode,
          payload,
        }),
      );
      if (CreateVocabulary.fulfilled.match(result)) {
        formik.resetForm({ values: result.payload as VocabularyFormValues });
      }
      if (CreateVocabulary.rejected.match(result)) {
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

  const summary = [
    { label: "Preferred", value: values.preferred_phrases.length },
    { label: "Blocked", value: values.banned_words.length },
    { label: "Signature", value: values.signature_phrases.length },
    {
      label: "Replacements",
      value: values.word_replacements.filter(
        (row) => row.say_word.trim() && row.replace_word.trim(),
      ).length,
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      {FetchVocabularyIsLoading ? (
        <div className="flex items-center justify-center gap-2 py-10">
          <Spinner className="size-6" />
          Loading vocabulary...
        </div>
      ) : (
        <form
          onSubmit={formik.handleSubmit}
          className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]"
        >
          <div className="flex flex-col gap-6">
            <div className="mt-3 flex flex-col gap-2">
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                The specific words that make your brand sound like you.
                Preferred phrases to lean into, words to ban, signature
                expressions, and exact swaps the AI always makes.
              </p>
            </div>

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
                  { say_word: "", replace_word: "", is_active: true },
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

          <div className="flex flex-col gap-6">
            <BrandVoiceVocabularySummary
              summary={summary}
              preferredPhrases={values.preferred_phrases}
              updatedAt={updatedAt}
            />
          </div>
        </form>
      )}
    </div>
  );
}
