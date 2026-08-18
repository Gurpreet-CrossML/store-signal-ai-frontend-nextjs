"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import type { AIScope } from "@/redux/api-slice/knowledge-rag-slice";
import { AI_SCOPE_OPTIONS } from "@/components/custom/knowledge/knowledge-meta";

export function AIScopeField({
  value,
  onChange,
  error,
}: {
  value: AIScope[];
  onChange: (value: AIScope[]) => void;
  error?: string;
}) {
  return (
    <Field>
      <FieldLabel>AI Scope</FieldLabel>
      <FieldDescription>
        Which AI systems can use this knowledge.
      </FieldDescription>
      <div className="grid grid-cols-2 gap-2">
        {AI_SCOPE_OPTIONS.map((option) => {
          const checked = value.includes(option.value);
          return (
            <Label
              key={option.value}
              className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 p-2.5 has-data-checked:border-primary/40 has-data-checked:bg-primary/5"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(next) =>
                  onChange(
                    next
                      ? [...value, option.value]
                      : value.filter((entry) => entry !== option.value),
                  )
                }
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </Label>
          );
        })}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </Field>
  );
}
