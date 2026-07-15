"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormik, setIn } from "formik";
import z from "zod";
import { IconDeviceFloppy } from "@tabler/icons-react";

import BrandVoiceTabsNav from "@/components/custom/brand-voice-tabs-nav";
import BrandVoiceVocabularyChipLists from "@/components/custom/brand-voice-vocabulary-chip-lists";
import BrandVoiceVocabularySummary from "@/components/custom/brand-voice-vocabulary-summary";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import {
  GetVocabulary,
  SaveVocabulary,
} from "@/redux/api-slice/brand-voice-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import type {
  VocabularyPayload,
  VocabularyRecord,
  WordReplacementPayload,
} from "@/db/brand-voice";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validationSchema = z.object({
  preferred_phrases: z.array(z.string().trim().min(1)).default([]),
  banned_words: z.array(z.string().trim().min(1)).default([]),
  signature_phrases: z.array(z.string().trim().min(1)).default([]),
  word_replacements: z.array(
    z.object({
      say_word: z.string().trim(),
      replace_word: z.string().trim(),
      is_active: z.boolean(),
    }),
  ),
});

function emptyFormValues(): VocabularyFormValues {
  return { preferred_phrases: [], banned_words: [], signature_phrases: [], word_replacements: [] };
}

function normalizeList(values: string[] | undefined) {
  return (values ?? []).map((v) => v.trim()).filter(Boolean);
}

function normalizeVocabulary(data: VocabularyRecord): VocabularyFormValues {
  return {
    preferred_phrases: normalizeList(data.preferred_phrases),
    banned_words: normalizeList(data.banned_words),
    signature_phrases: normalizeList(data.signature_phrases),
    word_replacements: (data.word_replacements ?? []).map((item) => ({
      say_word: item.say_word,
      replace_word: item.replace_word,
      is_active: item.is_active,
    })),
  };
}

function toPayload(values: VocabularyFormValues): VocabularyPayload {
  return {
    preferred_phrases: normalizeList(values.preferred_phrases),
    banned_words: normalizeList(values.banned_words),
    signature_phrases: normalizeList(values.signature_phrases),
    word_replacements: values.word_replacements
      .map((row): WordReplacementPayload => ({
        say_word: row.say_word.trim(),
        replace_word: row.replace_word.trim(),
        is_active: row.is_active,
      }))
      .filter((row) => row.say_word || row.replace_word),
  };
}

function issuesToFormikErrors(issues: z.ZodIssue[]) {
  return issues.reduce(
    (errors, issue) => setIn(errors, issue.path.join("."), issue.message),
    {} as Record<string, unknown>,
  );
}

// ─── Root component (store selector shell) ────────────────────────────────────

export default function BrandVoiceVocabularyEditor() {
  const selectedStore = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  return (
    <BrandVoiceVocabularyEditorView
      key={selectedStore || "no-store"}
      selectedStore={selectedStore}
    />
  );
}

// ─── Editor view (Formik + Redux orchestrator) ────────────────────────────────

function BrandVoiceVocabularyEditorView({ selectedStore }: { selectedStore: string }) {
  const dispatch = useAppDispatch();
  const saveIsLoading = useAppSelector(
    (state) => state.GetBrandVoiceReducer.vocabulary.save.isLoading,
  );
  const fetchIsLoading = useAppSelector(
    (state) => state.GetBrandVoiceReducer.vocabulary.fetch.isLoading,
  );
  const [initialValues, setInitialValues] = useState<VocabularyFormValues>(emptyFormValues());
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // ── Formik ────────────────────────────────────────────────────────────────
  const formik = useFormik<VocabularyFormValues>({
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
        SaveVocabulary({ storeCode: selectedStore, payload: toPayload(values) }),
      );
      if (SaveVocabulary.fulfilled.match(result)) {
        setInitialValues(normalizeVocabulary(result.payload));
        setLastSavedAt(result.payload.updated_at);
      }
    },
  });

  // ── Fetch on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedStore) return;
    let active = true;
    (async () => {
      const result = await dispatch(GetVocabulary(selectedStore));
      if (!active) return;
      if (GetVocabulary.fulfilled.match(result)) {
        if (result.payload) {
          setInitialValues(normalizeVocabulary(result.payload));
          setLastSavedAt(result.payload.updated_at);
        } else {
          setInitialValues(emptyFormValues());
          setLastSavedAt(null);
        }
      }
    })();
    return () => { active = false; };
  }, [dispatch, selectedStore]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const values = formik.values;

  const summary = useMemo(
    () => [
      { label: "Preferred", value: values.preferred_phrases.length },
      { label: "Blocked",   value: values.banned_words.length },
      { label: "Signature", value: values.signature_phrases.length },
      {
        label: "Replacements",
        value: values.word_replacements.filter(
          (item) => item.say_word.trim() || item.replace_word.trim(),
        ).length,
      },
    ],
    [values],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleReplacementChange = (
    index: number,
    patch: Partial<VocabularyFormValues["word_replacements"][number]>,
  ) => {
    const next = [...values.word_replacements];
    next[index] = { ...next[index], ...patch };
    formik.setFieldValue("word_replacements", next);
  };

  const handleReplacementRemove = (index: number) => {
    formik.setFieldValue(
      "word_replacements",
      values.word_replacements.filter((_, i) => i !== index),
    );
  };

  const handleReplacementAdd = () => {
    formik.setFieldValue("word_replacements", [
      ...values.word_replacements,
      { say_word: "", replace_word: "", is_active: true },
    ]);
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
              Choose a store from the sidebar to edit vocabulary rules and preferred phrasing.
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
        <h1 className="font-heading text-2xl font-semibold">Vocabulary</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          The specific words that make your brand sound like you. Preferred phrases to lean
          into, words to ban, signature expressions, and exact swaps the AI always makes.
        </p>
      </div>

      {/* Two-column grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        {/* Left column — chip lists + replacements */}
        <BrandVoiceVocabularyChipLists
          preferredPhrases={values.preferred_phrases}
          bannedWords={values.banned_words}
          signaturePhrases={values.signature_phrases}
          wordReplacements={values.word_replacements}
          onPreferredChange={(v) => formik.setFieldValue("preferred_phrases", v)}
          onBannedChange={(v) => formik.setFieldValue("banned_words", v)}
          onSignatureChange={(v) => formik.setFieldValue("signature_phrases", v)}
          onReplacementChange={handleReplacementChange}
          onReplacementRemove={handleReplacementRemove}
          onReplacementAdd={handleReplacementAdd}
        />

        {/* Right column — summary sidebar */}
        <BrandVoiceVocabularySummary
          summary={summary}
          preferredPhrases={values.preferred_phrases}
          lastSavedAt={lastSavedAt}
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
    </form>
  );
}
