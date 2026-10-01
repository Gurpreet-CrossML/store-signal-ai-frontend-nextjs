"use client";

import { useFormik } from "formik";
import z from "zod";
import { IconBolt, IconFileCode } from "@tabler/icons-react";

import {
  EDITED_NODE_CLASS,
  EditButton,
  EditedBadge,
  EditorFooter,
  FieldMessage,
} from "./node-parts";
import { PromptInstructions } from "./prompt-instructions";
import { InfoIcon } from "@/components/custom/info-icon";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  keepOriginal,
  PROMPT_LIMITS,
  sameText,
  unwrapText,
  type WorkflowTrigger,
} from "@/lib/workflows";
import { formikErrorsFromZod } from "@/lib/form-errors";
import { cn } from "@/lib/utils";

const validationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the trigger a name.")
    .max(PROMPT_LIMITS.triggerName),
  description: z
    .string()
    .trim()
    .min(1, "Describe when this workflow should run.")
    .max(PROMPT_LIMITS.triggerDescription),
});

function TriggerEditor({
  trigger,
  defaults,
  isSaving,
  onSave,
  onCancel,
}: {
  trigger: WorkflowTrigger;
  defaults: WorkflowTrigger;
  isSaving: boolean;
  onSave: (values: WorkflowTrigger) => void;
  onCancel: () => void;
}) {
  // Shown with the YAML's hand wrapping undone, so it reads and edits as
  // normal text.
  const toForm = (value: WorkflowTrigger): WorkflowTrigger => ({
    name: value.name,
    description: unwrapText(value.description),
  });

  const formik = useFormik<WorkflowTrigger>({
    initialValues: toForm(trigger),
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      return result.success ? {} : formikErrorsFromZod(result.error.issues);
    },
    onSubmit: (values) =>
      onSave({
        name: values.name.trim(),
        description: keepOriginal(
          values.description.trim(),
          [defaults.description, trigger.description],
          sameText,
        ),
      }),
  });

  const error = (name: keyof WorkflowTrigger) =>
    formik.touched[name] && <FieldMessage message={formik.errors[name]} />;

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
      <Field className="gap-1.5">
        <FieldLabel htmlFor="trigger-name">Name</FieldLabel>
        <FieldDescription>Only shown here in the dashboard.</FieldDescription>
        <Input
          id="trigger-name"
          name="name"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        {error("name")}
      </Field>
      <Field className="gap-1.5">
        <FieldLabel htmlFor="trigger-description">When to use</FieldLabel>
        <FieldDescription>
          The intent detector reads this to pick the workflow. Keep the examples
          of customer messages and the &ldquo;do not use when&rdquo; cases —
          they stop it from picking the wrong workflow.
        </FieldDescription>
        <Textarea
          id="trigger-description"
          name="description"
          rows={18}
          className="max-h-[60vh] leading-relaxed"
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        {error("description")}
      </Field>

      <EditorFooter
        isSaving={isSaving}
        onUseDefault={() => formik.setValues(toForm(defaults))}
        onCancel={onCancel}
      />
    </form>
  );
}

/**
 * The first node on the canvas: when the intent detector should start this
 * workflow — the workflow YAML's `description`, as the detector reads it.
 */
export function TriggerNode({
  trigger,
  defaults,
  edited,
  sourceFile,
  isEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
}: {
  trigger: WorkflowTrigger;
  defaults: WorkflowTrigger;
  edited: boolean;
  sourceFile: string;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (values: WorkflowTrigger) => void;
}) {
  return (
    <section
      id="workflow-node-trigger"
      aria-label="Trigger"
      className={cn(
        "flex shrink-0 flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm transition-[width]",
        isEditing ? "w-[34rem]" : "w-[24rem]",
        edited && EDITED_NODE_CLASS,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <IconBolt className="size-5" />
        </span>
        <span className="flex-1" />
        {!isEditing && <EditButton onClick={onEdit} />}
      </div>

      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          Trigger
          <InfoIcon
            className="size-3.5"
            text="The intent detector reads this to decide when a customer message should start this workflow."
          />
          {edited && <EditedBadge />}
        </span>
        {!isEditing && (
          <h3 className="text-lg font-semibold text-balance">{trigger.name}</h3>
        )}
      </div>

      {isEditing ? (
        <TriggerEditor
          trigger={trigger}
          defaults={defaults}
          isSaving={isSaving}
          onSave={onSave}
          onCancel={onCancel}
        />
      ) : (
        <PromptInstructions text={trigger.description} />
      )}

      <div className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
        <IconFileCode className="size-3.5" />
        <span className="font-mono">{sourceFile}</span>
      </div>
    </section>
  );
}
