"use client";

import { useFormik } from "formik";
import { IconSend } from "@tabler/icons-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import {
  KNOWLEDGE_TEST_QUESTION_MAX_LENGTH,
  KNOWLEDGE_TEST_QUESTION_MIN_LENGTH,
} from "@/lib/config";
import { formikErrorsFromZod } from "@/lib/form-errors";
import { cn } from "@/lib/utils";

const schema = z.object({
  question: z
    .string()
    .trim()
    .min(
      KNOWLEDGE_TEST_QUESTION_MIN_LENGTH,
      `Write at least ${KNOWLEDGE_TEST_QUESTION_MIN_LENGTH} characters.`,
    )
    .max(
      KNOWLEDGE_TEST_QUESTION_MAX_LENGTH,
      `Keep the question to ${KNOWLEDGE_TEST_QUESTION_MAX_LENGTH} characters or fewer.`,
    ),
});

/**
 * The box under the Test AI chat where the user types their own question.
 * Enter sends it and Shift + Enter starts a new line. Typing stops at the
 * character limit, and a too short question is flagged under the box as it is
 * typed. Send is only on when the question passes and
 * the AI is not answering (the box is off then too).
 */
export function TestChatInput({
  onAsk,
  isAsking,
}: {
  /** Asks the AI the (trimmed) question in the chat. */
  onAsk: (question: string) => void;
  /** True while the AI is answering a question. */
  isAsking: boolean;
}) {
  const formik = useFormik({
    initialValues: { question: "" },
    validate: (values) => {
      const result = schema.safeParse(values);
      return result.success ? {} : formikErrorsFromZod(result.error.issues);
    },
    onSubmit: (values, { resetForm }) => {
      if (!schema.safeParse(values).success || isAsking) return;
      onAsk(values.question.trim());
      resetForm();
    },
  });

  const length = formik.values.question.trim().length;
  const validation = schema.safeParse(formik.values);
  // Nothing is flagged until something is typed; Send stays off until the
  // question passes, so a bad one can never be sent.
  const error =
    length > 0 && !validation.success
      ? validation.error.issues[0]?.message
      : undefined;
  const canSend = validation.success && !isAsking;

  return (
    <form
      onSubmit={formik.handleSubmit}
      noValidate
      className="flex flex-col gap-1.5 border-t p-2 sm:p-3"
    >
      <div className="flex items-end gap-2">
        <Textarea
          id="test-chat-question"
          name="question"
          rows={1}
          value={formik.values.question}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          onKeyDown={(event) => {
            // Enter sends; Shift + Enter is a new line; an IME choosing a
            // character with Enter must not send.
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              formik.submitForm();
            }
          }}
          disabled={isAsking}
          // Typing and pasting stop at the limit.
          maxLength={KNOWLEDGE_TEST_QUESTION_MAX_LENGTH}
          placeholder="Ask your own question…"
          aria-label="Your question"
          aria-invalid={Boolean(error)}
          aria-describedby="test-chat-question-hint"
          className="max-h-32 min-h-10 resize-none py-2"
        />
        <Button
          type="submit"
          size="lg"
          disabled={!canSend}
          aria-label="Send question"
          className="shrink-0"
        >
          <IconSend className="size-4" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>

      <div
        id="test-chat-question-hint"
        className={cn(
          "items-start justify-between gap-3",
          // On a phone this row only takes space when it has something to say.
          error || formik.values.question.length > 0
            ? "flex"
            : "hidden sm:flex",
        )}
      >
        {error ? (
          <Typography
            variant="caption"
            as="p"
            role="alert"
            className="text-destructive"
            data-field-error
          >
            {error}
          </Typography>
        ) : (
          <Typography variant="muted" as="p" className="hidden sm:block">
            Enter to send · Shift + Enter for a new line · 1 AI credit per
            answer
          </Typography>
        )}
        <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
          {formik.values.question.length}/{KNOWLEDGE_TEST_QUESTION_MAX_LENGTH}
        </span>
      </div>
    </form>
  );
}
