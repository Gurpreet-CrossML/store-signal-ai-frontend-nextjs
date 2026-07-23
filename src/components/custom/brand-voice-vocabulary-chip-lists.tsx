"use client";

import { useState, type KeyboardEvent } from "react";
import type { useFormik } from "formik";
import { IconX, IconPlus } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ChipList } from "@/clients/never-say-rules";

// ReplacementRow

type ReplacementRowItem = {
  say_word: string;
  replace_word: string;
};

type ReplacementRowProps = {
  index: number;
  sayWord: string;
  replaceWord: string;
  formik: ReturnType<typeof useFormik<any>>;
};

function ReplacementRow({
  index,
  sayWord,
  replaceWord,
  formik,
}: ReplacementRowProps) {
  return (
    <div className="grid gap-4 rounded-xl border border-border/60 bg-background p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
      <div className="flex min-w-0 flex-col gap-2">
        <FieldLabel htmlFor={`word_replacements.${index}.say_word`}>
          Say word
        </FieldLabel>
        <Input
          id={`word_replacements.${index}.say_word`}
          name={`word_replacements.${index}.say_word`}
          value={sayWord}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="e.g. basket"
          autoComplete="off"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <FieldLabel htmlFor={`word_replacements.${index}.replace_word`}>
          Replace with
        </FieldLabel>
        <Input
          id={`word_replacements.${index}.replace_word`}
          name={`word_replacements.${index}.replace_word`}
          value={replaceWord}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="e.g. cart"
          autoComplete="off"
        />
      </div>
      <div className="flex items-center gap-1.5 lg:justify-end"></div>
    </div>
  );
}

// BrandVoiceVocabularyChipLists

type BrandVoiceVocabularyChipListsProps = {
  formik: ReturnType<typeof useFormik<any>>;
  preferredPhrases: string[];
  bannedWords: string[];
  signaturePhrases: string[];
  wordReplacements: ReplacementRowItem[];
  onPreferredChange: (v: string[]) => void;
  onBannedChange: (v: string[]) => void;
  onSignatureChange: (v: string[]) => void;
  onReplacementAdd: () => void;
};

export default function BrandVoiceVocabularyChipLists({
  formik,
  preferredPhrases,
  bannedWords,
  signaturePhrases,
  wordReplacements,
  onPreferredChange,
  onBannedChange,
  onSignatureChange,
  onReplacementAdd,
}: BrandVoiceVocabularyChipListsProps) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-6 lg:auto-rows-[20rem] lg:grid-cols-2">
      <Card>
        <CardContent className="flex h-full flex-col gap-3 pt-6">
          <div className="flex flex-col gap-0.5">
            <Label className="text-base font-semibold">
              Preferred words & phrases
            </Label>
            <p className="text-xs text-muted-foreground">
              The AI leans toward these when they fit naturally.
            </p>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto pr-1 [&>div]:flex-1 [&_input]:mt-auto">
            <ChipList
              items={preferredPhrases}
              placeholder="Add a preferred phrase and press Enter"
              onAdd={(value) => onPreferredChange([...preferredPhrases, value])}
              onRemove={(index) =>
                onPreferredChange(
                  preferredPhrases.filter((_, i) => i !== index),
                )
              }
              chipClassName="bg-secondary text-secondary-foreground"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex h-full flex-col gap-3 pt-6">
          <div className="flex flex-col gap-0.5">
            <Label className="text-base font-semibold">Banned words</Label>
            <p className="text-xs text-muted-foreground">
              The AI never uses these. Checked deterministically.
            </p>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto pr-1 [&>div]:flex-1 [&_input]:mt-auto">
            <ChipList
              items={bannedWords}
              placeholder="Add a banned word and press Enter"
              onAdd={(value) => onBannedChange([...bannedWords, value])}
              onRemove={(index) =>
                onBannedChange(bannedWords.filter((_, i) => i !== index))
              }
              chipClassName="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex h-full flex-col gap-3 pt-6">
          <div className="flex flex-col gap-0.5">
            <Label className="text-base font-semibold">Signature phrases</Label>
            <p className="text-xs text-muted-foreground">
              Brand catchphrases the AI sprinkles in naturally.
            </p>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto pr-1 [&>div]:flex-1 [&_input]:mt-auto">
            <ChipList
              items={signaturePhrases}
              placeholder="Add a signature phrase and press Enter"
              onAdd={(value) => onSignatureChange([...signaturePhrases, value])}
              onRemove={(index) =>
                onSignatureChange(
                  signaturePhrases.filter((_, i) => i !== index),
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Word Replacements */}
      <Card className="flex h-full min-h-0 flex-col gap-0 overflow-hidden">
        <CardHeader className="px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Word replacements</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Exact swaps the AI always makes.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReplacementAdd}
              className="h-9 shrink-0"
            >
              <IconPlus className="size-4" />
              Add replacement
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 min-h-0 flex-col gap-3 px-5 pb-5">
          {wordReplacements.length ? (
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
              {wordReplacements.map((row, index) => (
                <ReplacementRow
                  key={index}
                  index={index}
                  sayWord={row.say_word}
                  replaceWord={row.replace_word}
                  formik={formik}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
              No replacements yet. Click &ldquo;Add replacement&rdquo; to get
              started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
