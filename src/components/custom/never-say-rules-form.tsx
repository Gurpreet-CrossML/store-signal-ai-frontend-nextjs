"use client";

import { useState } from "react";
import { IconPlus, IconTrash, IconX } from "@tabler/icons-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import type { RequiredLegalPhrase } from "@/redux/api-slice/brand-voice-slice";

type ChipListProps = {
  items: string[];
  placeholder: string;
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  chipClassName?: string;
};

function ChipList({
  items,
  placeholder,
  onAdd,
  onRemove,
  chipClassName = "bg-muted text-foreground",
}: ChipListProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${chipClassName}`}
          >
            {item}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="ml-0.5 opacity-60 hover:opacity-100"
            >
              <IconX className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        placeholder={placeholder}
      />
    </div>
  );
}

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
};

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: ToggleRowProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{label}</span>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </CardContent>
    </Card>
  );
}

type NeverSayRulesFormProps = {
  noHollowApologies: boolean;
  onNoHollowApologiesChange: (value: boolean) => void;
  neverRevealAiUnprompted: boolean;
  onNeverRevealAiUnpromptedChange: (value: boolean) => void;
  doNotSayPhrases: string[];
  onAddDoNotSayPhrase: (value: string) => void;
  onRemoveDoNotSayPhrase: (index: number) => void;
  forbiddenClaims: string[];
  onAddForbiddenClaim: (value: string) => void;
  onRemoveForbiddenClaim: (index: number) => void;
  requiredLegalPhrases: RequiredLegalPhrase[];
  onAddRequiredLegalPhrase: () => void;
  onUpdateRequiredLegalPhrase: (
    index: number,
    patch: Partial<RequiredLegalPhrase>,
  ) => void;
  onRemoveRequiredLegalPhrase: (index: number) => void;
};

export default function NeverSayRulesForm({
  noHollowApologies,
  onNoHollowApologiesChange,
  neverRevealAiUnprompted,
  onNeverRevealAiUnpromptedChange,
  doNotSayPhrases,
  onAddDoNotSayPhrase,
  onRemoveDoNotSayPhrase,
  forbiddenClaims,
  onAddForbiddenClaim,
  onRemoveForbiddenClaim,
  requiredLegalPhrases,
  onAddRequiredLegalPhrase,
  onUpdateRequiredLegalPhrase,
  onRemoveRequiredLegalPhrase,
}: NeverSayRulesFormProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
        <span className="mt-0.5 text-muted-foreground">ℹ</span>
        <p className="text-sm text-muted-foreground">
          These are{" "}
          <span className="font-semibold text-foreground">
            language guardrails
          </span>{" "}
          — kept separate from what the AI <em>does</em> (workflow guidance) and
          from hard action limits like refund caps (the Action Engine). Voice
          governs how it sounds; these govern what it must never say.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <Label>Do-not-say list</Label>
              <p className="text-xs text-muted-foreground">
                Phrases the AI is never allowed to use.
              </p>
            </div>
            <ChipList
              items={doNotSayPhrases}
              placeholder="Add a phrase and press Enter"
              onAdd={onAddDoNotSayPhrase}
              onRemove={onRemoveDoNotSayPhrase}
              chipClassName="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <Label>Forbidden claims</Label>
              <p className="text-xs text-muted-foreground">
                Claims the AI must never make, for trust and legal safety.
              </p>
            </div>
            <ChipList
              items={forbiddenClaims}
              placeholder="Add a forbidden claim and press Enter"
              onAdd={onAddForbiddenClaim}
              onRemove={onRemoveForbiddenClaim}
              chipClassName="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
            />
          </CardContent>
        </Card>

        <ToggleRow
          label="No hollow apologies"
          description='Avoid over-apologising or empty "so sorry" filler'
          checked={noHollowApologies}
          onCheckedChange={onNoHollowApologiesChange}
        />

        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <Label>Required legal phrasing</Label>
              <p className="text-xs text-muted-foreground">
                Exact wording the AI must include in specific contexts.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {requiredLegalPhrases.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Context</Label>
                        <Input
                          value={item.context}
                          onChange={(event) =>
                            onUpdateRequiredLegalPhrase(index, {
                              context: event.target.value,
                            })
                          }
                          placeholder="Health & safety questions"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Phrase</Label>
                        <Input
                          value={item.phrase}
                          onChange={(event) =>
                            onUpdateRequiredLegalPhrase(index, {
                              phrase: event.target.value,
                            })
                          }
                          placeholder="Please consult your paediatrician..."
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => onRemoveRequiredLegalPhrase(index)}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={onAddRequiredLegalPhrase}
              >
                <IconPlus className="size-4" />
                Add required phrase
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ToggleRow
        label="Never reveal it's an AI unprompted"
        description="Stay in persona unless the customer asks directly"
        checked={neverRevealAiUnprompted}
        onCheckedChange={onNeverRevealAiUnpromptedChange}
      />
    </div>
  );
}
