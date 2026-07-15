"use client";

import { useState, type KeyboardEvent } from "react";
import { IconX, IconCheck, IconTrash, IconPlus } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// ─── ChipListField ────────────────────────────────────────────────────────────

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

function ChipListField({ label, description, value, placeholder, kind, onChange }: ChipListFieldProps) {
  const [draft, setDraft] = useState("");

  const addValue = (raw: string) => {
    const next = raw.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
    if (!next.length) return;
    onChange(Array.from(new Set([...value, ...next])));
    setDraft("");
  };

  const removeValue = (item: string) => onChange(value.filter((e) => e !== item));

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
            <span className="text-sm text-muted-foreground">No entries yet.</span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
          <Button type="button" variant="outline" onClick={() => addValue(draft)}>
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── ReplacementRow ───────────────────────────────────────────────────────────

type ReplacementRowItem = { say_word: string; replace_word: string; is_active: boolean };

type ReplacementRowProps = {
  index: number;
  sayWord: string;
  replaceWord: string;
  isActive: boolean;
  onChange: (patch: Partial<ReplacementRowItem>) => void;
  onRemove: () => void;
};

function ReplacementRow({ index, sayWord, replaceWord, isActive, onChange, onRemove }: ReplacementRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background p-4 sm:flex-row sm:items-end">
      <div className="flex-1 min-w-0">
        <FieldLabel htmlFor={`say_word_${index}`}>Say word</FieldLabel>
        <Input
          id={`say_word_${index}`}
          value={sayWord}
          onChange={(e) => onChange({ say_word: e.target.value })}
          placeholder="e.g. basket"
          autoComplete="off"
        />
      </div>
      <div className="flex-1 min-w-0">
        <FieldLabel htmlFor={`replace_word_${index}`}>Replace with</FieldLabel>
        <Input
          id={`replace_word_${index}`}
          value={replaceWord}
          onChange={(e) => onChange({ replace_word: e.target.value })}
          placeholder="e.g. cart"
          autoComplete="off"
        />
      </div>
      <div className="flex shrink-0 gap-1.5">
        <Button
          type="button"
          size="sm"
          variant={isActive ? "default" : "outline"}
          onClick={() => onChange({ is_active: !isActive })}
          title={isActive ? "Active — click to deactivate" : "Inactive — click to activate"}
        >
          {isActive ? <><IconCheck className="size-4" /> Active</> : "Inactive"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onRemove} className="text-destructive hover:text-destructive">
          <IconTrash className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── BrandVoiceVocabularyChipLists (exported) ─────────────────────────────────

type BrandVoiceVocabularyChipListsProps = {
  preferredPhrases: string[];
  bannedWords: string[];
  signaturePhrases: string[];
  wordReplacements: ReplacementRowItem[];
  onPreferredChange: (v: string[]) => void;
  onBannedChange: (v: string[]) => void;
  onSignatureChange: (v: string[]) => void;
  onReplacementChange: (index: number, patch: Partial<ReplacementRowItem>) => void;
  onReplacementRemove: (index: number) => void;
  onReplacementAdd: () => void;
};

export default function BrandVoiceVocabularyChipLists({
  preferredPhrases,
  bannedWords,
  signaturePhrases,
  wordReplacements,
  onPreferredChange,
  onBannedChange,
  onSignatureChange,
  onReplacementChange,
  onReplacementRemove,
  onReplacementAdd,
}: BrandVoiceVocabularyChipListsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
        description="The AI never uses these. Checked deterministically before send."
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
      <Card className="gap-0 overflow-hidden">
        <CardHeader className="px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Word replacements</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Exact swaps the AI always makes.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onReplacementAdd} className="shrink-0">
              <IconPlus className="size-4" />
              Add replacement
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-5 pb-5">
          {wordReplacements.length ? (
            wordReplacements.map((row, index) => (
              <ReplacementRow
                key={index}
                index={index}
                sayWord={row.say_word}
                replaceWord={row.replace_word}
                isActive={row.is_active}
                onChange={(patch) => onReplacementChange(index, patch)}
                onRemove={() => onReplacementRemove(index)}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
              No replacements yet. Click &ldquo;Add replacement&rdquo; to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
