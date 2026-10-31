"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { InfoIcon } from "@/components/custom/info-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { richTextLength, trimRichText } from "@/lib/rich-text";
import type { AiDisclaimer } from "@/redux/api-slice/customization-slice";

const RichTextArea = dynamic(
  () => import("@/components/custom/rich-text-area"),
  { ssr: false },
);

/** Only UI copy lives here; the default title/description come from the API. */
export const DEFAULTS = {
  button_label: "Got it",
};

// The description limits count visible text only — characters, spaces and line
// breaks, not the HTML tags — with leading and trailing blank space ignored.
export const AI_TITLE_LIMITS = { min: 10, max: 80 };
export const AI_DESCRIPTION_LIMITS = { min: 100, max: 1000 };

type EditorState = { title: string; description: string };

const toState = (value: AiDisclaimer | null | undefined): EditorState => ({
  title: value?.title ?? "",
  description: value?.description ?? "",
});

/** What is saved: the entered text without leading or trailing blank space. */
const toPayload = (state: EditorState): AiDisclaimer | null => {
  const out: AiDisclaimer = {};
  const title = state.title.trim();
  const description = trimRichText(state.description);
  if (title) out.title = title;
  if (description) out.description = description;
  return Object.keys(out).length ? out : null;
};

type CustomizationAiInfoProps = {
  value: AiDisclaimer | null;
  onChange: (value: AiDisclaimer | null) => void;
  fieldErrors?: Record<string, string>;
};

export default function CustomizationAiInfo({
  value,
  onChange,
  fieldErrors,
}: CustomizationAiInfoProps) {
  const [state, setState] = useState<EditorState>(() => toState(value));
  const lastEmitted = useRef(JSON.stringify(value));

  // A fresh load or save from the page replaces what the editor shows; our own
  // edits come back as the same value and are ignored.
  useEffect(() => {
    if (JSON.stringify(value) !== lastEmitted.current) {
      lastEmitted.current = JSON.stringify(value);
      setState(toState(value));
    }
  }, [value]);

  const titleLength = Array.from(state.title.trim()).length;
  const descriptionLength = richTextLength(state.description);
  const descriptionOutOfRange =
    descriptionLength > 0 &&
    (descriptionLength < AI_DESCRIPTION_LIMITS.min ||
      descriptionLength > AI_DESCRIPTION_LIMITS.max);

  const update = (next: EditorState) => {
    setState(next);
    const payload = toPayload(next);
    lastEmitted.current = JSON.stringify(payload);
    onChange(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          AI Disclaimer
          <InfoIcon text="The popup opened from the AI disclaimer line under the chat input. Both fields are required." />
        </CardTitle>
        <CardDescription>
          Change the title and description of the &quot;About this AI
          Chatbot&quot; popup shown in your widget.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Field className="gap-2">
          <FieldLabel htmlFor="ai-title">Popup title</FieldLabel>
          <Input
            id="ai-title"
            value={state.title}
            maxLength={AI_TITLE_LIMITS.max}
            aria-invalid={!!fieldErrors?.ai_disclaimer_title}
            // No leading spaces: they would only be trimmed on save.
            onChange={(e) =>
              update({ ...state, title: e.target.value.trimStart() })
            }
          />
          <Typography
            variant="caption"
            className={
              titleLength > 0 && titleLength < AI_TITLE_LIMITS.min
                ? "text-destructive"
                : undefined
            }
          >
            {titleLength}/{AI_TITLE_LIMITS.max} characters (minimum{" "}
            {AI_TITLE_LIMITS.min})
          </Typography>
          {fieldErrors?.ai_disclaimer_title ? (
            <Typography variant="caption" className="text-destructive">
              {fieldErrors.ai_disclaimer_title}
            </Typography>
          ) : null}
        </Field>

        <Field className="gap-2">
          <FieldLabel htmlFor="ai-description">Description</FieldLabel>
          <RichTextArea
            id="ai-description"
            value={state.description}
            minHeight="160px"
            onChange={(next) => update({ ...state, description: next })}
          />
          <Typography
            variant="caption"
            className={descriptionOutOfRange ? "text-destructive" : undefined}
          >
            {descriptionLength}/{AI_DESCRIPTION_LIMITS.max} characters (minimum{" "}
            {AI_DESCRIPTION_LIMITS.min})
          </Typography>
          {fieldErrors?.ai_disclaimer_description ? (
            <Typography variant="caption" className="text-destructive">
              {fieldErrors.ai_disclaimer_description}
            </Typography>
          ) : null}
        </Field>
      </CardContent>
    </Card>
  );
}
