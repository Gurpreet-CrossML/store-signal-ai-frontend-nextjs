"use client";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import type { AIScope } from "@/redux/api-slice/knowledge-rag-slice";
import { AI_SCOPE_OPTIONS } from "@/components/custom/knowledge/knowledge-meta";
import { MultiSelectCombobox } from "@/components/custom/knowledge/multi-select-combobox";

export function AIScopeField({
  value,
  onChange,
  error,
  container,
}: {
  value: AIScope[];
  onChange: (value: AIScope[]) => void;
  error?: string;
  container?: HTMLElement | null;
}) {
  const items = AI_SCOPE_OPTIONS.map((o) => ({ id: o.value, name: o.label }));
  const selected = items.filter((it) => value.includes(it.id as AIScope));

  return (
    <Field>
      <FieldLabel>AI Scope</FieldLabel>
      <FieldDescription>
        Which AI systems can use this knowledge.
      </FieldDescription>

      <MultiSelectCombobox
        items={items}
        value={selected}
        onValueChange={(next) => onChange(next.map((n) => n.id as AIScope))}
        onSearch={() => {}}
        isLoading={false}
        placeholder="Select AI scopes…"
        container={container}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </Field>
  );
}
