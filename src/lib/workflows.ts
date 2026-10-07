/**
 * Types and pure helpers for Settings → Workflows.
 *
 * Mirrors the backend's `chat.WorkflowPromptConfig`: a store keeps an
 * *override* per workflow — only the parts it changed, with `null` meaning
 * "use the workflow YAML text" — in `draft` (being edited) and `published`
 * (what live chats use). The YAML defaults arrive alongside as `defaults`,
 * and everything the canvas shows is the defaults with an override applied.
 */

/** The Workflows cards page, and one workflow's canvas. */
export const WORKFLOWS_HREF = "/settings/workflows";
export const workflowHref = (workflowId: string) =>
  `${WORKFLOWS_HREF}/${workflowId}`;

/** Same limits the backend serializers apply. */
export const PROMPT_LIMITS = {
  triggerName: 100,
  triggerDescription: 4000,
  stepTitle: 120,
  stepInstructions: 16000,
  stepSuggestions: 2000,
  versionNote: 255,
} as const;

export type WorkflowGroup =
  | "orders"
  | "returns"
  | "shopping"
  | "conversation"
  | "other";

export const WORKFLOW_GROUP_LABEL: Record<WorkflowGroup, string> = {
  orders: "Orders",
  returns: "Returns & refunds",
  shopping: "Shopping",
  conversation: "Conversation",
  other: "Other",
};

export const WORKFLOW_GROUP_ORDER: WorkflowGroup[] = [
  "orders",
  "returns",
  "shopping",
  "conversation",
  "other",
];

// --- Override (what the store changed) --------------------------------

export type PromptTriggerOverride = {
  name?: string | null;
  /** What the intent detector reads to pick this workflow. */
  description?: string | null;
};

export type PromptStepOverride = {
  title?: string | null;
  instructions?: string | null;
  suggestions?: string | null;
  /** Tools added to the step on top of the ones its YAML gives it. */
  tools_extra?: string[] | null;
  /** Replaces the step's tool-call limit from its YAML. */
  max_tool_calls?: number | null;
};

export type PromptOverride = {
  trigger?: PromptTriggerOverride | null;
  steps?: Record<string, PromptStepOverride> | null;
};

// --- Defaults (from the workflow YAML) ---------------------------------

export type WorkflowTrigger = {
  /** Display name of the workflow in the dashboard. */
  name: string;
  /**
   * The YAML `description`: when to use the workflow, examples and
   * exclusions, exactly as the intent detector reads it.
   */
  description: string;
};

export type WorkflowStep = {
  /** The agent's YAML key, e.g. `refund_intake`. */
  key: string;
  title: string;
  instructions: string;
  suggestions: string;
  tools: string[];
  /** Engine settings shown read-only: output schema, tool limits, gates. */
  system: string[];
  /**
   * The step has an `exit_when: needs_clarification` gate: when the
   * customer still has to answer, the flow replies and waits instead of
   * moving to the next step.
   */
  pausesForCustomer: boolean;
};

export type WorkflowDefinition = {
  workflow_id: string;
  group: WorkflowGroup;
  /** Required workflows can't be turned off (welcome, FAQ, handoff, fraud). */
  is_required: boolean;
  source_file: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
};

// --- Config (one store's row) ------------------------------------------

export type PromptVersionAction = "publish" | "restore" | "enable" | "disable";

/** One entry of `metadata.versions`: a full snapshot of the row. */
export type PromptVersion = {
  version: number;
  action: PromptVersionAction;
  note: string;
  workflow_id: string;
  is_enabled: boolean;
  is_overridden: boolean;
  draft: PromptOverride;
  published: PromptOverride;
  published_version: number;
  yaml_hash: string;
  published_at: string | null;
  updated_by: number | null;
  created_at: string;
};

export type WorkflowSummary = {
  workflow_id: string;
  name: string;
  /** First paragraph of the trigger description, for the workflow card. */
  summary: string;
  steps_count: number;
  group: WorkflowGroup;
  is_required: boolean;
  is_enabled: boolean;
  has_unpublished_changes: boolean;
  published_version: number;
};

export type WorkflowDetailData = WorkflowSummary & {
  defaults: WorkflowDefinition;
  draft: PromptOverride;
  published: PromptOverride;
  published_at: string | null;
  updated_at: string | null;
  /** The YAML was edited after this store last published its changes. */
  yaml_changed: boolean;
  versions: PromptVersion[];
};

export type WorkflowStatus = "live" | "draft" | "off";

/** One status for a workflow, in the order a reader cares about. */
export function workflowStatus(w: WorkflowSummary): WorkflowStatus {
  if (!w.is_enabled) return "off";
  if (w.has_unpublished_changes) return "draft";
  return "live";
}

// --- Resolving defaults + override -------------------------------------

/** The parts of a step a person edits. */
export type StepText = Pick<
  WorkflowStep,
  "title" | "instructions" | "suggestions"
>;

/** Steps are lettered on the canvas (A, B, C…), the way Fin labels blocks. */
export function stepLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export type ResolvedStep = WorkflowStep & {
  edited: boolean;
  /** Tools added in the dashboard; also included in `tools`. */
  addedTools: string[];
};
export type ResolvedWorkflow = {
  trigger: WorkflowTrigger;
  triggerEdited: boolean;
  steps: ResolvedStep[];
};

/** A value from the override, or the default when the override has none. */
function pick<T>(value: T | null | undefined, fallback: T): T {
  return value === null || value === undefined ? fallback : value;
}

/** What the canvas shows: the YAML defaults with an override applied. */
export function resolveWorkflow(
  defaults: WorkflowDefinition,
  override: PromptOverride,
): ResolvedWorkflow {
  const t = override.trigger ?? {};
  const trigger: WorkflowTrigger = {
    name: pick(t.name, defaults.trigger.name),
    description: pick(t.description, defaults.trigger.description),
  };

  const steps = defaults.steps.map((step) => {
    const s = override.steps?.[step.key] ?? {};
    const addedTools = (s.tools_extra ?? []).filter(
      (tool) => !step.tools.includes(tool),
    );
    const resolved = {
      ...step,
      title: pick(s.title, step.title),
      instructions: pick(s.instructions, step.instructions),
      suggestions: pick(s.suggestions, step.suggestions),
      tools: [...step.tools, ...addedTools],
    };
    return { ...resolved, addedTools, edited: !isEmptyOverride(s) };
  });

  return { trigger, triggerEdited: !isEmptyOverride(t), steps };
}

/** True when an override block sets nothing (all null, missing or empty). */
function isEmptyOverride(block: object): boolean {
  return Object.values(block).every(
    (v) =>
      v === null || v === undefined || (Array.isArray(v) && v.length === 0),
  );
}

/**
 * Turn edited trigger values back into an override: a field equal to the
 * YAML default is stored as `null`, so later YAML fixes still reach it.
 */
export function triggerOverrideFrom(
  defaults: WorkflowTrigger,
  values: WorkflowTrigger,
): PromptTriggerOverride {
  return {
    name: values.name === defaults.name ? null : values.name,
    description:
      values.description === defaults.description ? null : values.description,
  };
}

/** Same as {@link triggerOverrideFrom}, for one step's text. */
function stepOverrideFrom(
  defaults: WorkflowStep,
  values: StepText,
): PromptStepOverride {
  return {
    title: values.title === defaults.title ? null : values.title,
    instructions:
      values.instructions === defaults.instructions
        ? null
        : values.instructions,
    suggestions:
      values.suggestions === defaults.suggestions ? null : values.suggestions,
  };
}

/** The draft with the trigger replaced; an all-null trigger is dropped. */
export function withTrigger(
  draft: PromptOverride,
  trigger: PromptTriggerOverride,
): PromptOverride {
  const next: PromptOverride = { ...draft };
  if (isEmptyOverride(trigger)) delete next.trigger;
  else next.trigger = trigger;
  return next;
}

/** The draft with one step replaced; an all-null step is dropped. */
export function withStep(
  draft: PromptOverride,
  key: string,
  step: PromptStepOverride,
): PromptOverride {
  const steps = { ...(draft.steps ?? {}) };
  if (isEmptyOverride(step)) delete steps[key];
  else steps[key] = step;

  const next: PromptOverride = { ...draft };
  if (Object.keys(steps).length === 0) delete next.steps;
  else next.steps = steps;
  return next;
}

/** Human list of what differs between the draft and the published prompt. */
export function describeChanges(
  defaults: WorkflowDefinition,
  draft: PromptOverride,
  published: PromptOverride,
): string[] {
  const d = resolveWorkflow(defaults, draft);
  const p = resolveWorkflow(defaults, published);
  const changes: string[] = [];

  if (JSON.stringify(d.trigger) !== JSON.stringify(p.trigger)) {
    changes.push("Trigger");
  }
  d.steps.forEach((step, i) => {
    const before = p.steps[i];
    if (
      step.title !== before.title ||
      step.instructions !== before.instructions ||
      step.suggestions !== before.suggestions ||
      step.addedTools.join() !== before.addedTools.join()
    ) {
      changes.push(`${stepLetter(i)}. ${step.title}`);
    }
  });
  return changes;
}

/** One step's text set to `values`, keeping the tools added to it. */
export function withStepText(
  draft: PromptOverride,
  defaults: WorkflowStep,
  values: StepText,
): PromptOverride {
  // Keep the step's other settings (added tools, tool-call limit).
  return withStep(draft, defaults.key, {
    ...draft.steps?.[defaults.key],
    ...stepOverrideFrom(defaults, values),
  });
}

/** One step's added tools set to `tools`, keeping its text changes. */
export function withStepTools(
  draft: PromptOverride,
  key: string,
  tools: string[],
): PromptOverride {
  const current = draft.steps?.[key] ?? {};
  return withStep(draft, key, {
    ...current,
    tools_extra: tools.length ? tools : null,
  });
}

// --- Tool catalog --------------------------------------------------------

/**
 * `function`: a Python tool declared in the workflow YAMLs. `store`: a tool
 * served by the store's own MCP server (Shopify or Magento).
 */
export type ToolKind = "function" | "store";

export type CatalogTool = {
  name: string;
  kind: ToolKind;
  description: string;
  /** Workflows whose YAML already uses this tool. */
  used_in: string[];
};

export type ToolCatalog = {
  tools: CatalogTool[];
  /** False when the store's tool server couldn't be reached. */
  store_tools_live: boolean;
  store_tools_error: string;
};

// --- Prompt text → blocks ---------------------------------------------

export type InstructionBlock =
  /** A `<tag>` section, e.g. `<rules>` → "Rules". */
  | { kind: "heading"; text: string }
  /** A numbered, lettered or bulleted point; `depth` follows its indent. */
  | { kind: "item"; marker: string; text: string; depth: number }
  /** Prose; `depth` > 0 when it explains the point above it. */
  | { kind: "paragraph"; text: string; depth: number };

// Shared by the display parser and the editor's section split, so both read
// prompt text the same way.
const TAG_OPEN = /^<([a-z_]+)>$/;
const TAG_CLOSE = /^<\/[a-z_]+>$/;
const TAG_INLINE = /^<([a-z_]+)>(.*)<\/\1>$/;
/** `1.`, `a.`, `-`, `•` or `*`, then the point's text. */
const LIST_ITEM = /^(\d+\.|[a-z]\.|[-•*])\s+(.*)$/;
/** A line that carries on mid-sentence from the one above it. */
const CONTINUES = /^[a-z(→"'`]/;

/** Readable title of a prompt tag: `wrong_order_id_rule` → "Wrong order id rule". */
export function tagTitle(tag: string): string {
  const words = tag.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Parse prompt text for display, without changing it: `<tag>` lines become
 * section headings, `1.` / `a.` / `-` lines become points nested by their
 * indentation, and a wrapped line is joined to the point or paragraph it
 * continues. The text is stored and sent to the model exactly as written —
 * this only decides how it looks on the canvas.
 */
export function parseInstructions(text: string): InstructionBlock[] {
  const blocks: InstructionBlock[] = [];
  // Indent of the shallowest point in the current section, so nesting is
  // measured relative to it rather than to the YAML's own indentation.
  let baseIndent: number | null = null;
  let previousBlank = true;
  // The point the following lines may belong to, and its raw indent.
  let lastItem: { indent: number; depth: number } | null = null;

  for (const raw of text.split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed) {
      previousBlank = true;
      continue;
    }
    const indent = raw.length - raw.trimStart().length;
    const last = blocks[blocks.length - 1];

    const inline = trimmed.match(TAG_INLINE);
    const open = trimmed.match(TAG_OPEN);
    if (inline || open) {
      blocks.push({ kind: "heading", text: tagTitle((inline ?? open)![1]) });
      if (inline && inline[2].trim()) {
        blocks.push({ kind: "paragraph", text: inline[2].trim(), depth: 0 });
      }
      baseIndent = null;
      lastItem = null;
      previousBlank = false;
      continue;
    }
    if (TAG_CLOSE.test(trimmed)) {
      previousBlank = true;
      lastItem = null;
      continue;
    }

    const item = trimmed.match(LIST_ITEM);
    if (item) {
      if (baseIndent === null || indent < baseIndent) baseIndent = indent;
      const depth = Math.min(3, Math.floor((indent - baseIndent) / 2));
      blocks.push({ kind: "item", marker: item[1], text: item[2], depth });
      lastItem = { indent, depth };
      previousBlank = false;
      continue;
    }

    // A wrapped line carries on mid-sentence: it follows directly (no blank
    // line) and starts lowercase. Join it to the block above.
    const continues =
      !previousBlank &&
      last &&
      last.kind !== "heading" &&
      CONTINUES.test(trimmed);
    if (continues) {
      last.text = `${last.text} ${trimmed}`;
    } else {
      // Text indented under a point explains that point.
      const depth =
        lastItem && indent > lastItem.indent ? lastItem.depth + 1 : 0;
      if (depth === 0) lastItem = null;
      blocks.push({ kind: "paragraph", text: trimmed, depth });
    }
    previousBlank = false;
  }
  return blocks;
}

// --- Prompt text ↔ editable sections -----------------------------------
//
// The YAML prompts are written as `<task> … </task>` sections with lines
// hard-wrapped by hand. People editing in the dashboard shouldn't have to
// manage either, so the editor shows one plain box per section with the
// wrapping undone, and the tags are put back around each box on save.

/** One part of a prompt: the text inside one top-level `<tag>`. */
export type PromptSection = {
  /** The tag name, or `null` for text that sits outside any tag. */
  tag: string | null;
  /** Readable label for the editor: `rules` → "Rules". */
  title: string;
  /** The section's text with hand-wrapped lines joined again. */
  body: string;
};

/** Editor label of a section: its tag's title, or "General" for loose text. */
function sectionTitle(tag: string | null): string {
  return tag ? tagTitle(tag) : "General";
}

/**
 * Undo hand wrapping: remove the common indentation, and join a line to the
 * one above when it carries on mid-sentence (it starts lowercase). List
 * points and new sentences keep their own lines, so the structure stays.
 */
export function unwrapText(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.length - line.trimStart().length);
  const common = indents.length ? Math.min(...indents) : 0;

  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.slice(common).trimEnd();
    const trimmed = line.trim();
    const previous = out[out.length - 1];
    if (!trimmed) {
      if (previous !== "") out.push("");
      continue;
    }
    const continues =
      previous !== undefined &&
      previous !== "" &&
      !LIST_ITEM.test(trimmed) &&
      CONTINUES.test(trimmed);
    if (continues) out[out.length - 1] = `${previous} ${trimmed}`;
    else out.push(line);
  }
  return out.join("\n").trim();
}

/**
 * Split a prompt into its top-level `<tag>` sections. Text outside any tag
 * becomes a "General" section; tags nested inside a section stay part of
 * that section's text.
 */
export function splitSections(text: string): PromptSection[] {
  const sections: { tag: string | null; lines: string[] }[] = [];
  let open: { tag: string; lines: string[] } | null = null;
  let loose: { tag: null; lines: string[] } | null = null;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (open) {
      if (trimmed === `</${open.tag}>`) open = null;
      else open.lines.push(line);
      continue;
    }
    const inline = trimmed.match(TAG_INLINE);
    if (inline) {
      sections.push({ tag: inline[1], lines: [inline[2]] });
      loose = null;
      continue;
    }
    const start = trimmed.match(TAG_OPEN);
    if (start) {
      open = { tag: start[1], lines: [] };
      sections.push(open);
      loose = null;
      continue;
    }
    if (!trimmed && !loose) continue;
    if (!loose) {
      loose = { tag: null, lines: [] };
      sections.push(loose);
    }
    loose.lines.push(line);
  }

  return sections
    .map(({ tag, lines }) => ({
      tag,
      title: sectionTitle(tag),
      body: unwrapText(lines.join("\n")),
    }))
    .filter((section) => section.tag !== null || section.body);
}

/** Put the tags back: the prompt text the model receives. */
export function joinSections(sections: PromptSection[]): string {
  return sections
    .map(({ tag, body }) =>
      tag ? `<${tag}>\n${body.trim()}\n</${tag}>` : body.trim(),
    )
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Whether two prompts say the same thing once wrapping and spacing are set
 * aside — so opening a step and saving it untouched stores no change.
 */
export function samePrompt(a: string, b: string): boolean {
  return joinSections(splitSections(a)) === joinSections(splitSections(b));
}

/**
 * The text to save after an edit. Editors show prompts with wrapping undone,
 * so an untouched field comes back reworded but not changed; when the edit
 * says the same as one of `originals` (the default, then the current text),
 * that exact original is kept — so an untouched save stores no change.
 */
export function keepOriginal(
  edited: string,
  originals: string[],
  same: (a: string, b: string) => boolean,
): string {
  return originals.find((original) => same(edited, original)) ?? edited;
}

/** Same text once hand wrapping is set aside (for single-box fields). */
export function sameText(a: string, b: string): boolean {
  return unwrapText(a) === unwrapText(b);
}

// --- Tool mentions -------------------------------------------------------

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type TextPart = { text: string } | { tool: string };

/**
 * Split text into plain runs and mentions of the step's tools — by bare
 * name, as the YAML prompts write them, or as `@name`. Used both to show
 * tools as chips and to load them into the editor as chips.
 */
export function splitToolMentions(text: string, tools: string[]): TextPart[] {
  if (tools.length === 0) return text ? [{ text }] : [];
  const pattern = new RegExp(
    `@?\\b(${tools.map(escapeRegExp).join("|")})\\b`,
    "g",
  );
  const parts: TextPart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) parts.push({ text: text.slice(cursor, start) });
    parts.push({ tool: match[1] });
    cursor = start + match[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}

/** Case-insensitive search across a few fields; an empty query matches. */
export function matchesSearch(
  query: string,
  ...fields: (string | undefined)[]
): boolean {
  const needle = query.trim().toLowerCase();
  return (
    !needle || fields.some((field) => field?.toLowerCase().includes(needle))
  );
}
