"use client";

import { useState } from "react";
import {
  IconCheck,
  IconGripVertical,
  IconTool,
  IconX,
} from "@tabler/icons-react";

import { LoadingState } from "@/components/custom/loading-state";
import { SearchInput } from "@/components/custom/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  matchesSearch,
  stepLetter,
  type CatalogTool,
  type ResolvedStep,
  type ToolCatalog,
  type ToolKind,
} from "@/lib/workflows";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";

import { FilterTabs } from "./filter-tabs";
import { startToolDrag } from "./tool-chip";
import { WarningNote } from "./warning-note";

type KindFilter = "all" | ToolKind;

const KIND_LABEL: Record<ToolKind, string> = {
  store: "Store",
  function: "Function",
};

const KIND_HINT: Record<ToolKind, string> = {
  store: "Served by the store's tool server (orders, products, discounts).",
  function: "Built into Store Signal (tickets, search, fraud checks).",
};

function ToolRow({
  tool,
  state,
  isSaving,
  onRemove,
}: {
  tool: CatalogTool;
  state: "built-in" | "added" | "available";
  isSaving: boolean;
  onRemove: () => void;
}) {
  return (
    <li
      draggable
      onDragStart={(event) =>
        startToolDrag(event.dataTransfer, tool.name, "copy")
      }
      title="Drag into a step you're editing"
      className="group flex cursor-grab items-start gap-2 rounded-lg border bg-card p-3 hover:border-primary/40 active:cursor-grabbing"
    >
      <IconGripVertical className="mt-2 size-4 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground" />
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <IconTool className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="truncate font-mono text-[13px] font-medium"
            title={tool.name}
          >
            {tool.name}
          </span>
          <Badge
            variant="outline"
            className={
              tool.kind === "store"
                ? BADGE_TONE_STYLES.info
                : BADGE_TONE_STYLES.topic
            }
            title={KIND_HINT[tool.kind]}
          >
            {KIND_LABEL[tool.kind]}
          </Badge>
        </div>
        {tool.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {tool.description}
          </p>
        )}
        <span className="text-[11px] text-muted-foreground">
          {tool.used_in.length > 0
            ? `Used in ${tool.used_in.length} workflow${tool.used_in.length === 1 ? "" : "s"}`
            : "Not used in any workflow yet"}
        </span>
      </div>
      <div className="shrink-0">
        {state === "built-in" ? (
          <Badge variant="outline" className={BADGE_TONE_STYLES.neutral}>
            <IconCheck />
            Built in
          </Badge>
        ) : state === "added" ? (
          <Button
            variant="outline"
            size="xs"
            disabled={isSaving}
            onClick={onRemove}
          >
            Remove
          </Button>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Every tool available to the store, docked beside the canvas (not over
 * it), so tools can be dragged straight into a step being edited — which
 * also gives that step the tool.
 */
export function ToolsPanel({
  onClose,
  steps,
  catalog,
  isLoading,
  isSaving,
  onChangeStepTools,
}: {
  onClose: () => void;
  steps: ResolvedStep[];
  catalog: ToolCatalog | null;
  isLoading: boolean;
  isSaving: boolean;
  onChangeStepTools: (stepKey: string, addedTools: string[]) => void;
}) {
  const [stepKey, setStepKey] = useState(steps[0]?.key ?? "");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");

  const step = steps.find((s) => s.key === stepKey) ?? steps[0];
  const tools = catalog?.tools ?? [];
  const visible = tools.filter(
    (tool) =>
      (kind === "all" || tool.kind === kind) &&
      matchesSearch(query, tool.name, tool.description),
  );
  const countFor = (value: KindFilter) =>
    value === "all"
      ? tools.length
      : tools.filter((t) => t.kind === value).length;

  const stateOf = (name: string) => {
    if (!step) return "available" as const;
    if (step.addedTools.includes(name)) return "added" as const;
    if (step.tools.includes(name)) return "built-in" as const;
    return "available" as const;
  };

  return (
    <aside
      aria-label="Tools"
      className="flex h-full min-h-0 w-96 shrink-0 flex-col border-l bg-card 2xl:w-[26rem]"
    >
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
        <div className="flex items-center gap-2">
          <IconTool className="size-4 text-primary" />
          <h2 className="text-base font-semibold">Tools</h2>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close tools"
          onClick={onClose}
        >
          <IconX />
        </Button>
      </header>
      <p className="border-b px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        Every tool this store can use. Drag one into a step you&apos;re editing
        to mention it there — the step gets the tool too.
      </p>

      <div className="flex flex-col gap-3 border-b p-4">
        <Field className="gap-1.5">
          <FieldLabel htmlFor="tools-step">Show tools for</FieldLabel>
          <Select value={step?.key ?? ""} onValueChange={setStepKey}>
            <SelectTrigger id="tools-step" className="w-full">
              <SelectValue placeholder="Choose a step" />
            </SelectTrigger>
            <SelectContent>
              {steps.map((s, i) => (
                <SelectItem key={s.key} value={s.key}>
                  {stepLetter(i)}. {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search tools…"
          label="Search tools"
        />
        <FilterTabs
          label="Filter by kind"
          className="self-start"
          value={kind}
          onChange={setKind}
          options={(["all", "store", "function"] as const).map((value) => ({
            value,
            label: value === "all" ? "All" : KIND_LABEL[value],
            count: countFor(value),
          }))}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {catalog && !catalog.store_tools_live && (
          <WarningNote className="rounded-lg">
            {catalog.store_tools_error ||
              "Couldn't reach the store's tool server."}{" "}
            Showing only the store tools workflows already use.
          </WarningNote>
        )}

        {isLoading && !catalog ? (
          <LoadingState label="Loading tools…" />
        ) : visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No tools match.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map((tool) => (
              <ToolRow
                key={tool.name}
                tool={tool}
                state={stateOf(tool.name)}
                isSaving={isSaving}
                onRemove={() =>
                  step &&
                  onChangeStepTools(
                    step.key,
                    step.addedTools.filter((name) => name !== tool.name),
                  )
                }
              />
            ))}
          </ul>
        )}
      </div>

      {isSaving && (
        <div className="flex items-center gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
          <Spinner className="size-3.5" />
          Saving to draft…
        </div>
      )}
    </aside>
  );
}
