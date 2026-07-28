"use client";

import { useState, type KeyboardEvent } from "react";
import type { useFormik } from "formik";
import {
  IconX,
  IconPlus,
  IconTrash,
  IconTextSpellcheck,
  IconBan,
  IconSignature,
  IconReplace,
} from "@tabler/icons-react";
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

// Mirrors VocabularyFormValues in src/clients/vocabulary.tsx (structurally
// compatible, so the parent's formik instance is assignable).
type VocabularyFormValues = {
  preferred_phrases: string[];
  banned_words: string[];
  signature_phrases: string[];
  word_replacements: ReplacementRowItem[];
};

type ReplacementRowProps = {
  index: number;
  sayWord: string;
  replaceWord: string;
  formik: ReturnType<typeof useFormik<VocabularyFormValues>>;
};

function ReplacementRow({
  index,
  sayWord,
  replaceWord,
  formik,
}: ReplacementRowProps) {
  return (
    <div className="flex justify-center items-center gap-2">
      <Input
        id={`word_replacements.${index}.say_word`}
        name={`word_replacements.${index}.say_word`}
        value={sayWord}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        placeholder="e.g. basket"
        autoComplete="off"
      />
      <Input
        id={`word_replacements.${index}.replace_word`}
        name={`word_replacements.${index}.replace_word`}
        value={replaceWord}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        placeholder="e.g. cart"
        autoComplete="off"
      />
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => {
          const updatedReplacements = formik.values.word_replacements.filter(
            (_, i) => i !== index,
          );
          formik.setFieldValue("word_replacements", updatedReplacements);
        }}
      >
        <IconTrash className="size-4" />
      </Button>
    </div>
  );
}

// BrandVoiceVocabularyChipLists

type BrandVoiceVocabularyChipListsProps = {
  formik: ReturnType<typeof useFormik<VocabularyFormValues>>;
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
        <CardContent className="flex flex-col gap-3 justify-start pt-0">
          <div className="flex flex-col gap-0.5">
            <Label className="text-base font-semibold">
              <IconTextSpellcheck className="size-4" />
              Preferred words & phrases
            </Label>
            <p className="text-xs text-muted-foreground">
              The AI leans toward these when they fit naturally.
            </p>
          </div>
          <ChipList
            items={preferredPhrases}
            placeholder="Add a preferred phrase and press Enter"
            onAdd={(value) => onPreferredChange([...preferredPhrases, value])}
            onRemove={(index) =>
              onPreferredChange(preferredPhrases.filter((_, i) => i !== index))
            }
            chipClassName="bg-secondary text-secondary-foreground"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 justify-start pt-0">
          <div className="flex flex-col gap-0.5">
            <Label className="text-base font-semibold">
              <IconBan className="size-4" />
              Banned words
            </Label>
            <p className="text-xs text-muted-foreground">
              The AI never uses these. Checked deterministically.
            </p>
          </div>
          <ChipList
            items={bannedWords}
            placeholder="Add a banned word and press Enter"
            onAdd={(value) => onBannedChange([...bannedWords, value])}
            onRemove={(index) =>
              onBannedChange(bannedWords.filter((_, i) => i !== index))
            }
            chipClassName="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 justify-start pt-0">
          <div className="flex flex-col gap-0.5">
            <Label className="text-base font-semibold">
              <IconSignature className="size-4" />
              Signature phrases
            </Label>
            <p className="text-xs text-muted-foreground">
              Brand catchphrases the AI sprinkles in naturally.
            </p>
          </div>
          <ChipList
            items={signaturePhrases}
            placeholder="Add a signature phrase and press Enter"
            onAdd={(value) => onSignatureChange([...signaturePhrases, value])}
            onRemove={(index) =>
              onSignatureChange(signaturePhrases.filter((_, i) => i !== index))
            }
          />
        </CardContent>
      </Card>

      {/* Word Replacements */}
      <Card className="flex h-full min-h-0 flex-col gap-0 overflow-hidden">
        <CardContent className="flex flex-1 min-h-0 flex-col gap-3 px-5 pb-5">
          <div className="flex items-start justify-between gap-3 w-full">
            <div>
              <Label className="text-base font-semibold">
                <IconReplace className="size-4" />
                Word replacements
              </Label>
              <p className="text-xs text-muted-foreground">
                Exact swaps the AI always makes.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReplacementAdd}
            >
              <IconPlus className="size-4" />
              Add replacement
            </Button>
          </div>
          <div className="flex justify-center items-center gap-2 w-full">
            <Label className="text-xs w-full font-bold">Say Word</Label>
            <Label className="text-xs w-full font-bold -ml-8">
              Replace With
            </Label>
          </div>
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
