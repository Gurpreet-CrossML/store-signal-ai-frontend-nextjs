"use client";

import { useState } from "react";
import { useFormik } from "formik";
import z from "zod";
import { IconChevronDown, IconLock, IconSparkles } from "@tabler/icons-react";

import {
  EDITED_NODE_CLASS,
  EditButton,
  EditedBadge,
  EditorFooter,
  FieldMessage,
} from "./node-parts";
import { PromptInstructions } from "./prompt-instructions";
import { ToolChip } from "./tool-chip";
import { ToolTextEditor } from "./tool-text-editor";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  joinSections,
  keepOriginal,
  PROMPT_LIMITS,
  samePrompt,
  sameText,
  splitSections,
  stepLetter,
  unwrapText,
  type PromptSection,
  type StepText,
  type WorkflowStep,
} from "@/lib/workflows";
import { formikErrorsFromZod } from "@/lib/form-errors";
import { cn } from "@/lib/utils";

const validationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give the step a title.")
    .max(PROMPT_LIMITS.stepTitle),
  sections: z.array(z.string()),
  suggestions: z.string().max(PROMPT_LIMITS.stepSuggestions),
});

type FormValues = z.infer<typeof validationSchema>;

function toForm(step: StepText, layout: PromptSection[]): FormValues {
  // Bodies follow the layout of the step being edited, so "Use default"
  // fills the same boxes even if the default has its sections in another
  // order.
  const bodies = new Map(
    splitSections(step.instructions).map((section) => [
      section.tag,
      section.body,
    ]),
  );
  return {
    title: step.title,
    sections: layout.map((section) => bodies.get(section.tag) ?? ""),
    suggestions: unwrapText(step.suggestions),
  };
}

function StepEditor({
  step,
  defaults,
  isSaving,
  onSave,
  onCancel,
  onToolDrop,
}: {
  step: WorkflowStep;
  defaults: WorkflowStep;
  isSaving: boolean;
  onSave: (values: StepText) => void;
  onCancel: () => void;
  onToolDrop: (tool: string) => void;
}) {
  // One box per top-level <tag> of the prompt. The tags themselves are
  // never shown; they are put back around each box on save.
  const parsed = splitSections(step.instructions);
  const layout: PromptSection[] = parsed.length
    ? parsed
    : [{ tag: null, title: "Instructions", body: "" }];

  const build = (values: FormValues) =>
    joinSections(
      layout.map((section, i) => ({ ...section, body: values.sections[i] })),
    );

  // The boxes are uncontrolled while typing; bumping this reloads them.
  const [resetKey, setResetKey] = useState(0);

  const formik = useFormik<FormValues>({
    initialValues: toForm(step, layout),
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      const errors: Record<string, unknown> = result.success
        ? {}
        : formikErrorsFromZod(result.error.issues);
      const text = build(values);
      if (!text.trim()) errors.sections = "Instructions can't be empty.";
      else if (text.length > PROMPT_LIMITS.stepInstructions) {
        errors.sections = `Instructions are ${text.length.toLocaleString()} characters; the limit is ${PROMPT_LIMITS.stepInstructions.toLocaleString()}.`;
      }
      return errors;
    },
    onSubmit: (values) =>
      onSave({
        title: values.title.trim(),
        instructions: keepOriginal(
          build(values),
          [defaults.instructions, step.instructions],
          samePrompt,
        ),
        suggestions: keepOriginal(
          values.suggestions.trim(),
          [defaults.suggestions, step.suggestions],
          sameText,
        ),
      }),
  });

  const error = (name: keyof FormValues) =>
    formik.submitCount > 0 && <FieldMessage message={formik.errors[name]} />;

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
      <Field className="gap-1.5">
        <FieldLabel htmlFor={`step-title-${step.key}`}>Step title</FieldLabel>
        <Input
          id={`step-title-${step.key}`}
          name="title"
          value={formik.values.title}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        {error("title")}
      </Field>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Instructions</span>
        <p className="text-sm text-muted-foreground">
          What the AI follows in this step, in parts. Write normally — the
          formatting the AI needs is added when you save. Keep rules that
          mention tools
          {step.tools.length > 0 && (
            <>
              {" "}
              (
              {step.tools.map((tool, i) => (
                <span key={tool} className="font-mono text-xs">
                  {i > 0 && ", "}
                  {tool}
                </span>
              ))}
              )
            </>
          )}{" "}
          or needs_clarification: the workflow depends on them.
        </p>
      </div>

      {layout.map((section, i) => (
        <Field key={`${section.tag}-${i}`} className="gap-1.5">
          <FieldLabel
            htmlFor={`step-${step.key}-section-${i}`}
            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {section.title}
          </FieldLabel>
          <ToolTextEditor
            key={`${resetKey}-${i}`}
            id={`step-${step.key}-section-${i}`}
            aria-label={section.title}
            className="max-h-[50vh]"
            initialValue={formik.values.sections[i]}
            tools={step.tools}
            onToolDrop={onToolDrop}
            onChange={(value) =>
              formik.setFieldValue(`sections.${i}`, value, false)
            }
          />
        </Field>
      ))}
      {error("sections")}

      <Field className="gap-1.5">
        <FieldLabel htmlFor={`step-suggestions-${step.key}`}>
          Suggested replies
        </FieldLabel>
        <FieldDescription>
          When to show quick-reply chips under the AI&apos;s message.
        </FieldDescription>
        <Textarea
          id={`step-suggestions-${step.key}`}
          name="suggestions"
          className="leading-relaxed"
          value={formik.values.suggestions}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        {error("suggestions")}
      </Field>

      <EditorFooter
        isSaving={isSaving}
        onUseDefault={() => {
          formik.setValues(toForm(defaults, layout));
          setResetKey((key) => key + 1);
        }}
        onCancel={onCancel}
      />
    </form>
  );
}

/** One agent of the workflow, shown as a lettered instructions card. */
export function StepNode({
  step,
  defaults,
  index,
  edited,
  isLast,
  isEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  onToolDrop,
}: {
  step: WorkflowStep;
  defaults: WorkflowStep;
  index: number;
  edited: boolean;
  isLast: boolean;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (values: StepText) => void;
  /** A tool was dragged into this step's text from the Tools panel. */
  onToolDrop: (tool: string) => void;
}) {
  const nextLabel = isLast
    ? "Workflow ends"
    : step.pausesForCustomer
      ? "Check branches"
      : `Continue to ${stepLetter(index + 1)}`;

  return (
    <section
      id={`workflow-node-${step.key}`}
      aria-label={`Step ${stepLetter(index)}: ${step.title}`}
      className={cn(
        "flex shrink-0 flex-col rounded-xl border bg-card shadow-sm transition-[width]",
        isEditing ? "w-[42rem]" : "w-[34rem]",
        edited && EDITED_NODE_CLASS,
      )}
    >
      <header className="flex items-center gap-2.5 px-5 pt-4 pb-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-linear-to-br from-primary/15 to-primary/5 text-primary">
          <IconSparkles className="size-4" />
        </span>
        <span className="text-sm font-semibold text-muted-foreground">
          {stepLetter(index)}.
        </span>
        <h3 className="min-w-0 flex-1 truncate text-base font-semibold">
          {isEditing ? "Edit step" : step.title}
        </h3>
        {edited && !isEditing && <EditedBadge />}
        {!isEditing && <EditButton onClick={onEdit} />}
      </header>

      <div className="flex flex-col gap-4 px-5 pb-4">
        {isEditing ? (
          <StepEditor
            step={step}
            defaults={defaults}
            isSaving={isSaving}
            onSave={onSave}
            onCancel={onCancel}
            onToolDrop={onToolDrop}
          />
        ) : (
          <>
            <PromptInstructions text={step.instructions} tools={step.tools} />

            {step.suggestions && (
              <div className="rounded-lg border bg-muted/40 px-3 py-2.5">
                <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Suggested replies
                </span>
                <PromptInstructions
                  text={step.suggestions}
                  tools={step.tools}
                  className="mt-1"
                />
              </div>
            )}

            {step.tools.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                Can use
                {step.tools.map((tool) => (
                  <ToolChip key={tool} name={tool} />
                ))}
              </div>
            )}

            {step.system.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <IconLock className="size-3.5" />
                  {step.system.length} system settings · not editable
                  <IconChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="mt-2 ml-5 flex list-disc flex-col gap-1 text-xs text-muted-foreground">
                    {step.system.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        )}
      </div>

      {!isEditing && (
        <footer className="mt-auto border-t px-5 py-3">
          <span className="block text-xs text-muted-foreground">
            Once complete
          </span>
          <span className="text-sm font-medium">{nextLabel}</span>
        </footer>
      )}
    </section>
  );
}
