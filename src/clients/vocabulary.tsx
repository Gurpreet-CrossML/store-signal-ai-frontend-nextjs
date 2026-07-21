"use client";

import { useEffect } from "react";
import { useFormik } from "formik";
import z from "zod";

import BrandVoiceVocabularyChipLists from "@/components/custom/brand-voice-vocabulary-chip-lists";
import BrandVoiceVocabularySummary from "@/components/custom/brand-voice-vocabulary-summary";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  GetVocabulary,
  SaveVocabulary,
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

// Root component (store selector shell)

export default function BrandVoiceVocabularyEditor() {
  const selectedStore = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  return <BrandVoiceVocabularyEditorView storeCode={selectedStore} />;
}

// Editor view (Formik + Redux orchestrator)

function BrandVoiceVocabularyEditorView({ storeCode }: { storeCode: string }) {
  const dispatch = useAppDispatch();
  const {
    GetVocabularyData: vocabData,
    GetVocabularyIsLoading: fetchIsLoading,
  } = useAppSelector((state) => state.GetBrandVoiceReducer.GetVocabularyState);
  const { SaveVocabularyIsLoading: saveIsLoading } = useAppSelector(
    (state) => state.GetBrandVoiceReducer.SaveVocabularyState,
  );

  const updatedAt = vocabData?.updated_at ?? null;

  // Formik
  const formik = useFormik<VocabularyFormValues>({
    enableReinitialize: true,
    initialValues: (vocabData as any as VocabularyFormValues) || {
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
        SaveVocabulary({
          storeCode: storeCode,
          payload,
        }),
      );
      if (SaveVocabulary.fulfilled.match(result)) {
        formik.resetForm({ values: result.payload });
      }
    },
  });

  // Fetch on mount / store change
  useEffect(() => {
    if (!storeCode) return;
    let active = true;
    (async () => {
      await dispatch(GetVocabulary(storeCode));
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [dispatch, storeCode]);

  // Derived state
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

  // Main layout
  return (
    <form onSubmit={formik.handleSubmit} className="w-full px-4 pb-6 md:px-6">
      {/* Page header */}
      <div className="mt-3 flex flex-col gap-2">
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          The specific words that make your brand sound like you. Preferred
          phrases to lean into, words to ban, signature expressions, and exact
          swaps the AI always makes.
        </p>
      </div>

      {/* Two-column grid */}
      <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        {/* Left column — chip lists + replacements */}
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

        {/* Right column — summary sidebar */}
        <BrandVoiceVocabularySummary
          summary={summary}
          preferredPhrases={values.preferred_phrases}
          updatedAt={updatedAt}
        />
      </div>

      {/* Save / Reset buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
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
    </form>
  );
}
