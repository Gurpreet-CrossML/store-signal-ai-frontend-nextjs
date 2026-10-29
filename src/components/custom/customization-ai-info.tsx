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
import type { AiDisclaimer } from "@/redux/api-slice/customization-slice";

const RichTextArea = dynamic(
  () => import("@/components/custom/rich-text-area"),
  { ssr: false },
);

/** The widget's built-in wording. A blank field falls back to these. */
export const DEFAULTS = {
  title: "About this AI Chatbot",
  description:
    "<p>This chatbot is powered by artificial intelligence and is designed to assist you with product discovery, and general support.</p><p>Please keep in mind: AI responses may occasionally be inaccurate or incomplete. Always verify important details like pricing, availability. For critical issues, please contact our human support team.</p><p>Your privacy matters: Conversations may be used to improve our service. We do not share your personal data with third parties.</p>",
  button_label: "Got it",
};

// Title limit is enforced by the API (store/models.py); the description limit
// counts visible text only, not the HTML tags.
const LIMITS = {
  title: 80,
  description: 1000,
};

export const pick = (value: string, fallback: string) =>
  value.trim() || fallback;

const visibleLength = (html: string) => html.replace(/<[^>]*>/g, "").length;

type EditorState = { title: string; description: string };

const toState = (value: AiDisclaimer | null | undefined): EditorState => ({
  title: value?.title || DEFAULTS.title,
  description: value?.description || DEFAULTS.description,
});

/** What is saved: only what differs from the defaults, or null for nothing. */
const toPayload = (state: EditorState): AiDisclaimer | null => {
  const out: AiDisclaimer = {};
  const title = state.title.trim();
  const description = state.description.trim();
  if (title && title !== DEFAULTS.title) out.title = title;
  if (description && description !== DEFAULTS.description) {
    out.description = description;
  }
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
          <InfoIcon text="The popup opened from the AI disclaimer line under the chat input. Leave a field blank to use the default wording." />
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
            maxLength={LIMITS.title}
            placeholder={DEFAULTS.title}
            onChange={(e) => update({ ...state, title: e.target.value })}
          />
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
            className={
              visibleLength(state.description) > LIMITS.description
                ? "text-destructive"
                : undefined
            }
          >
            {visibleLength(state.description)}/{LIMITS.description} characters
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
