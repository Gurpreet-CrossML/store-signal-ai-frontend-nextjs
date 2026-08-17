"use client";

import { Fragment } from "react";
import type { useFormik } from "formik";
import {
  IconArrowRight,
  IconPlus,
  IconTrash,
  IconTextSpellcheck,
  IconBan,
  IconSignature,
  IconReplace,
} from "@tabler/icons-react";

import { InfoIcon } from "@/components/custom/info-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";

import { ChipList } from "@/components/custom/chip-list";

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

// One from→to swap: the word to avoid (red) becomes the word to use (green).
function ReplacementRow({
  index,
  sayWord,
  replaceWord,
  formik,
}: ReplacementRowProps) {
  // A pair is valid or it is not, so one message serves the row rather
  // than repeating itself under both boxes.
  const rowErrors = (
    formik.errors.word_replacements as
      | { say_word?: string; replace_word?: string }[]
      | undefined
  )?.[index];
  const rowError = rowErrors?.say_word ?? rowErrors?.replace_word;

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2">
        <Input
          id={`word_replacements.${index}.say_word`}
          name={`word_replacements.${index}.say_word`}
          value={sayWord}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="e.g. basket"
          autoComplete="off"
          className="border-red-200 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/30"
        />
        <IconArrowRight className="size-4 shrink-0 text-muted-foreground" />
        <Input
          id={`word_replacements.${index}.replace_word`}
          name={`word_replacements.${index}.replace_word`}
          value={replaceWord}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="e.g. cart"
          autoComplete="off"
          className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/30"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          aria-label="Remove replacement"
          className="text-destructive hover:text-destructive"
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
      {rowError ? (
        <Typography variant="caption" as="p" className="text-destructive">
          {rowError}
        </Typography>
      ) : null}
    </div>
  );
}

// Column header for a replacement list: "Instead of → The AI says", aligned
// to the same grid as the rows beneath it.
function ReplacementColumnHeader() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2">
      <Typography variant="muted" as="span" className="text-xs font-medium">
        Instead of
      </Typography>
      <span aria-hidden className="w-4" />
      <Typography variant="muted" as="span" className="text-xs font-medium">
        The AI says
      </Typography>
      <span aria-hidden className="w-8" />
    </div>
  );
}

// BrandVoiceVocabularyChipLists

type ChipSectionProps = {
  icon: React.ReactNode;
  title: string;
  info: string;
  description: string;
  items: string[];
  placeholder: string;
  chipClassName: string;
  onChange: (v: string[]) => void;
};

// One chip-collection card. All three render identically so the row stays
// symmetric; only icon, copy, and chip color differ.
function ChipSectionCard({
  icon,
  title,
  info,
  description,
  items,
  placeholder,
  chipClassName,
  onChange,
}: ChipSectionProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
          <InfoIcon text={info} />
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Badge variant="secondary">{items.length}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChipList
          items={items}
          placeholder={placeholder}
          onAdd={(values) => onChange([...items, ...values])}
          onRemove={(index) => onChange(items.filter((_, i) => i !== index))}
          chipClassName={chipClassName}
        />
      </CardContent>
    </Card>
  );
}

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
  // Keep original indexes when splitting into two columns — formik field
  // paths (word_replacements.N.*) must address the full array.
  const indexedReplacements = wordReplacements.map((row, index) => ({
    row,
    index,
  }));
  const midpoint = Math.ceil(indexedReplacements.length / 2);
  const replacementColumns = [
    indexedReplacements.slice(0, midpoint),
    indexedReplacements.slice(midpoint),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: the three chip collections — same content type, so equal
          heights read as one deliberate row. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChipSectionCard
          icon={<IconTextSpellcheck className="size-4" />}
          title="Preferred Words & Phrases"
          info="Words and phrases the AI favors when they fit naturally — they nudge the tone without being forced into every reply."
          description="The AI leans toward these when they fit."
          items={preferredPhrases}
          placeholder="Add a phrase and press Enter"
          chipClassName="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
          onChange={onPreferredChange}
        />
        <ChipSectionCard
          icon={<IconBan className="size-4" />}
          title="Banned Words"
          info="A blocklist the AI is instructed to keep out of its replies."
          description="The AI avoids these words."
          items={bannedWords}
          placeholder="Add a word and press Enter"
          chipClassName="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
          onChange={onBannedChange}
        />
        <ChipSectionCard
          icon={<IconSignature className="size-4" />}
          title="Signature Phrases"
          info="Your brand's catchphrases. The AI sprinkles them in occasionally so replies sound like you."
          description="Catchphrases the AI sprinkles in."
          items={signaturePhrases}
          placeholder="Add a phrase and press Enter"
          chipClassName="bg-primary/10 text-primary"
          onChange={onSignatureChange}
        />
      </div>

      {/* Row 2: Word Replacements full-width, rows split into two divider-
          separated columns (same pattern as the tone sliders). */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconReplace className="size-4" />
            Word Replacements
            <InfoIcon text="Whenever the AI would use the word on the left, it's guided to say the word on the right instead." />
          </CardTitle>
          <CardDescription>
            Word swaps the AI applies to its replies.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">{wordReplacements.length}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {wordReplacements.length ? (
            <div className="flex flex-col gap-4 md:flex-row md:gap-8">
              {replacementColumns.map((column, columnIndex) => (
                <Fragment key={columnIndex}>
                  {columnIndex > 0 && column.length > 0 && (
                    <Separator
                      orientation="vertical"
                      className="hidden h-auto self-stretch md:block"
                    />
                  )}
                  {column.length > 0 && (
                    <div className="flex flex-1 flex-col gap-2">
                      <ReplacementColumnHeader />
                      {column.map(({ row, index }) => (
                        <ReplacementRow
                          key={index}
                          index={index}
                          sayWord={row.say_word}
                          replaceWord={row.replace_word}
                          formik={formik}
                        />
                      ))}
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
              No replacements yet. Add one to swap a word you&rsquo;d rather the
              AI avoid.
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={onReplacementAdd}
          >
            <IconPlus className="size-4" />
            Add Replacement
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
