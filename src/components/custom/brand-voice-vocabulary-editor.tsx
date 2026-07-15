"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useFormik, setIn } from "formik";
import z from "zod";
import {
  IconDeviceFloppy,
  IconPlus,
  IconTrash,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

import BrandVoiceTabsNav from "@/components/custom/brand-voice-tabs-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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

const validationSchema = z.object({
  preferred_phrases: z.array(z.string().trim().min(1)).default([]),
  banned_words: z.array(z.string().trim().min(1)).default([]),
  signature_phrases: z.array(z.string().trim().min(1)).default([]),
  word_replacements: z.array(
    z.object({
      say_word: z.string().trim().min(1, "Say word is required"),
      replace_word: z.string().trim().min(1, "Replacement word is required"),
      is_active: z.boolean(),
    }),
  ),
});

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

function emptyFormValues(): VocabularyFormValues {
  return {
    preferred_phrases: [],
    banned_words: [],
    signature_phrases: [],
    word_replacements: [],
  };
}

function normalizeList(values: string[] | undefined) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
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
      .map(
        (row): WordReplacementPayload => ({
          say_word: row.say_word.trim(),
          replace_word: row.replace_word.trim(),
          is_active: row.is_active,
        }),
      )
      .filter((row) => row.say_word || row.replace_word),
  };
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

function arrayToBadgeTone(kind: "preferred" | "banned" | "signature") {
  if (kind === "preferred") return "secondary" as const;
  if (kind === "banned") return "destructive" as const;
  return "default" as const;
}

function ChipListField({
  label,
  description,
  value,
  placeholder,
  kind,
  onChange,
}: {
  label: string;
  description: string;
  value: string[];
  placeholder: string;
  kind: "preferred" | "banned" | "signature";
  onChange: (value: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const addValue = (raw: string) => {
    const next = raw
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (!next.length) return;
    onChange(Array.from(new Set([...value, ...next])));
    setDraft("");
  };

  const removeValue = (item: string) => {
    onChange(value.filter((entry) => entry !== item));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addValue(draft);
    }
    if (event.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <Card className="gap-0 overflow-hidden">
      <CardHeader className="px-5 py-4">
        <CardTitle>{label}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5">
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <Badge
              key={item}
              variant={arrayToBadgeTone(kind)}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 font-normal"
            >
              <span>{item}</span>
              <button
                type="button"
                className="ml-0.5 inline-flex items-center justify-center"
                onClick={() => removeValue(item)}
                aria-label={`Remove ${item}`}
              >
                <IconX className="size-3" />
              </button>
            </Badge>
          ))}
          {value.length === 0 && (
            <span className="text-sm text-muted-foreground">
              No entries yet.
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addValue(draft)}
          >
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReplacementRow({
  index,
  sayWord,
  replaceWord,
  isActive,
  onChange,
  onRemove,
}: {
  index: number;
  sayWord: string;
  replaceWord: string;
  isActive: boolean;
  onChange: (
    patch: Partial<VocabularyFormValues["word_replacements"][number]>,
  ) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-border/60 bg-background p-4 md:grid-cols-[1fr_1fr_auto]">
      <Field>
        <FieldLabel htmlFor={`word_replacements.${index}.say_word`}>
          Say word
        </FieldLabel>
        <Input
          id={`word_replacements.${index}.say_word`}
          value={sayWord}
          onChange={(event) => onChange({ say_word: event.target.value })}
          placeholder="basket"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`word_replacements.${index}.replace_word`}>
          Replace with
        </FieldLabel>
        <Input
          id={`word_replacements.${index}.replace_word`}
          value={replaceWord}
          onChange={(event) => onChange({ replace_word: event.target.value })}
          placeholder="cart"
        />
      </Field>
      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant={isActive ? "default" : "outline"}
          onClick={() => onChange({ is_active: !isActive })}
          className="w-full md:w-auto"
        >
          {isActive ? <IconCheck /> : "Inactive"}
        </Button>
        <Button type="button" variant="ghost" onClick={onRemove}>
          <IconTrash />
        </Button>
      </div>
    </div>
  );
}

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

function BrandVoiceVocabularyEditorView({
  selectedStore,
}: {
  selectedStore: string;
}) {
  const dispatch = useAppDispatch();
  const saveIsLoading = useAppSelector(
    (state) => state.GetBrandVoiceReducer.vocabulary.save.isLoading,
  );
  const fetchIsLoading = useAppSelector(
    (state) => state.GetBrandVoiceReducer.vocabulary.fetch.isLoading,
  );
  const [initialValues, setInitialValues] =
    useState<VocabularyFormValues>(emptyFormValues());
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

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
        SaveVocabulary({
          storeCode: selectedStore,
          payload: toPayload(values),
        }),
      );

      if (SaveVocabulary.fulfilled.match(result)) {
        const next = normalizeVocabulary(result.payload);
        setInitialValues(next);
        setLastSavedAt(result.payload.updated_at);
      }
    },
  });

  useEffect(() => {
    if (!selectedStore) return;

    let active = true;
    (async () => {
      const result = await dispatch(GetVocabulary(selectedStore));
      if (!active) return;

      if (GetVocabulary.fulfilled.match(result)) {
        if (result.payload) {
          const next = normalizeVocabulary(result.payload);
          setInitialValues(next);
          setLastSavedAt(result.payload.updated_at);
        } else {
          setInitialValues(emptyFormValues());
          setLastSavedAt(null);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [dispatch, selectedStore]);

  const values = formik.values;
  const isDirty = formik.dirty;

  const summary = useMemo(
    () => [
      { label: "Preferred", value: values.preferred_phrases.length },
      { label: "Blocked", value: values.banned_words.length },
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

  if (!selectedStore) {
    return (
      <div className="w-full px-4 pb-6 md:px-6">
        <BrandVoiceTabsNav />
        <Empty className="min-h-[55vh]">
          <EmptyHeader>
            <EmptyTitle>Select a store first</EmptyTitle>
            <EmptyDescription>
              Choose a store from the sidebar to edit vocabulary rules and
              preferred phrasing.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <form onSubmit={formik.handleSubmit} className="w-full px-4 pb-6 md:px-6">
      <BrandVoiceTabsNav />

      <div className="mt-6 flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold">Vocabulary</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          The specific words that make your brand sound like you. Preferred
          phrases to lean into, words to ban, signature expressions, and exact
          swaps the AI always makes.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChipListField
              label="Preferred words & phrases"
              description="The AI leans toward these when they fit naturally."
              value={values.preferred_phrases}
              placeholder="Add a preferred phrase and press Enter"
              kind="preferred"
              onChange={(next) =>
                formik.setFieldValue("preferred_phrases", next)
              }
            />
            <ChipListField
              label="Banned words"
              description="The AI never uses these. Checked deterministically before send."
              value={values.banned_words}
              placeholder="Add a banned word and press Enter"
              kind="banned"
              onChange={(next) => formik.setFieldValue("banned_words", next)}
            />
            <ChipListField
              label="Signature phrases"
              description="Brand catchphrases the AI sprinkles in naturally."
              value={values.signature_phrases}
              placeholder="Add a signature phrase and press Enter"
              kind="signature"
              onChange={(next) =>
                formik.setFieldValue("signature_phrases", next)
              }
            />
            <Card className="gap-0 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between px-5 py-4">
                <div>
                  <CardTitle>Word replacements</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Exact swaps the AI always makes.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    formik.setFieldValue("word_replacements", [
                      ...values.word_replacements,
                      { say_word: "", replace_word: "", is_active: true },
                    ])
                  }
                >
                  <IconPlus />
                  Add replacement
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5">
                {values.word_replacements.length ? (
                  values.word_replacements.map((row, index) => (
                    <ReplacementRow
                      key={`${index}-${row.say_word}-${row.replace_word}`}
                      index={index}
                      sayWord={row.say_word}
                      replaceWord={row.replace_word}
                      isActive={row.is_active}
                      onChange={(patch) => {
                        const next = [...values.word_replacements];
                        next[index] = { ...next[index], ...patch };
                        formik.setFieldValue("word_replacements", next);
                      }}
                      onRemove={() => {
                        const next = values.word_replacements.filter(
                          (_item, itemIndex) => itemIndex !== index,
                        );
                        formik.setFieldValue("word_replacements", next);
                      }}
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                    Add replacements like say `basket` not `cart`.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="sticky top-4 gap-0 overflow-hidden">
          <CardHeader className="px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Vocabulary summary</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Quick counts and a few live hints.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {lastSavedAt && (
                  <span className="text-xs text-muted-foreground">
                    Last synced {new Date(lastSavedAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-5 pb-5">
            <div className="grid grid-cols-2 gap-3">
              {summary.map((item) => (
                <div key={item.label} className="rounded-xl border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Preferred phrases currently on deck.
              </p>
              <div className="flex flex-wrap gap-2">
                {values.preferred_phrases.slice(0, 6).map((item) => (
                  <Badge key={item} variant="secondary" className="font-normal">
                    {item}
                  </Badge>
                ))}
                {values.preferred_phrases.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Add a few preferred phrases to make the assistant sound more
                    on-brand.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => formik.resetForm()}
          disabled={saveIsLoading || fetchIsLoading}
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={!isDirty || saveIsLoading || fetchIsLoading}
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
