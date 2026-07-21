"use client";

import { useState, type KeyboardEvent } from "react";
import type { useFormik } from "formik";
import { IconX, IconCheck, IconPlus } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// ChipListField

type ChipKind = "preferred" | "banned" | "signature";

function badgeVariant(kind: ChipKind) {
  if (kind === "preferred") return "secondary" as const;
  if (kind === "banned") return "destructive" as const;
  return "default" as const;
}

type ChipListFieldProps = {
  label: string;
  description: string;
  value: string[];
  placeholder: string;
  kind: ChipKind;
  onChange: (value: string[]) => void;
};

function ChipListField({
  label,
  description,
  value,
  placeholder,
  kind,
  onChange,
}: ChipListFieldProps) {
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

  const removeValue = (item: string) =>
    onChange(value.filter((e) => e !== item));

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
    <Card className="flex h-full min-h-0 flex-col gap-0 overflow-hidden">
      <CardHeader className="px-5 py-4">
        <CardTitle>{label}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="flex flex-1 min-h-0 flex-col gap-4 px-5 pb-5">
        <div className="flex min-h-24 max-h-24 flex-wrap content-start gap-2 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-2">
          {value.map((item) => (
            <Badge
              key={item}
              variant={badgeVariant(kind)}
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
            <span className="px-1 text-sm text-muted-foreground">
              No entries yet.
            </span>
          )}
        </div>
        <div className="mt-auto grid gap-2 sm:grid-cols-[minmax(0,1fr)_4.75rem]">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-10"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addValue(draft)}
            className="h-10 shrink-0"
          >
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ReplacementRow

type ReplacementRowItem = {
  say_word: string;
  replace_word: string;
  is_active: boolean;
};

type ReplacementRowProps = {
  index: number;
  sayWord: string;
  replaceWord: string;
  isActive: boolean;
  formik: ReturnType<typeof useFormik<any>>;
};

function ReplacementRow({
  index,
  sayWord,
  replaceWord,
  isActive,
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
      <div className="flex items-center gap-1.5 lg:justify-end">
        <Button
          type="button"
          size="sm"
          variant={isActive ? "default" : "outline"}
          onClick={() =>
            formik.setFieldValue(
              `word_replacements.${index}.is_active`,
              !isActive,
            )
          }
          className="h-6 min-w-[4rem] px-1.5 text-[10px]"
          title={
            isActive
              ? "Active — click to deactivate"
              : "Inactive — click to activate"
          }
        >
          {isActive ? (
            <>
              <IconCheck className="size-2.5" /> Active
            </>
          ) : (
            "Inactive"
          )}
        </Button>
      </div>
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
      <ChipListField
        label="Preferred words & phrases"
        description="The AI leans toward these when they fit naturally."
        value={preferredPhrases}
        placeholder="Add a preferred phrase and press Enter"
        kind="preferred"
        onChange={onPreferredChange}
      />
      <ChipListField
        label="Banned words"
        description="The AI never uses these. Checked deterministically."
        value={bannedWords}
        placeholder="Add a banned word and press Enter"
        kind="banned"
        onChange={onBannedChange}
      />
      <ChipListField
        label="Signature phrases"
        description="Brand catchphrases the AI sprinkles in naturally."
        value={signaturePhrases}
        placeholder="Add a signature phrase and press Enter"
        kind="signature"
        onChange={onSignatureChange}
      />

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
                  isActive={row.is_active}
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
