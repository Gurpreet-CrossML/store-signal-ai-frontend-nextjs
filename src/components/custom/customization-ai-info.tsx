"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconAlertTriangle,
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconInfoCircle,
  IconLock,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

import { InfoIcon } from "@/components/custom/info-icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import type {
  AiInfo,
  AiInfoIcon,
  AiInfoSection,
} from "@/redux/api-slice/customization-slice";

/** The widget's built-in wording. A blank field falls back to these. */
export const DEFAULTS = {
  disclaimer_text: "This AI-Chatbot can make mistakes.",
  disclaimer_link_text: "Learn more",
  title: "About this AI Chatbot",
  description:
    "This chatbot is powered by artificial intelligence and is designed to assist you with product discovery, and general support.",
  button_label: "Got it",
  sections: [
    {
      title: "Please keep in mind:",
      icon: "warning",
      points: [
        "AI responses may occasionally be inaccurate or incomplete.",
        "Always verify important details like pricing, availability.",
        "For critical issues, please contact our human support team.",
      ],
    },
    {
      title: "Your privacy matters:",
      icon: "lock",
      points: [
        "Conversations may be used to improve our service.",
        "We do not share your personal data with third parties.",
      ],
    },
  ] as Required<AiInfoSection>[],
};

// The same limits the API enforces (store/serializers.py: AIInfoSerializer).
const LIMITS = {
  disclaimer_text: 120,
  disclaimer_link_text: 40,
  title: 80,
  description: 500,
  button_label: 40,
  section_title: 80,
  max_sections: 4,
  max_points: 6,
  point: 300,
};

export const ICONS = {
  warning: IconAlertTriangle,
  lock: IconLock,
  info: IconInfoCircle,
  check: IconCheck,
} as const;

const ICON_NAMES = Object.keys(ICONS) as AiInfoIcon[];

type TextKey =
  | "disclaimer_text"
  | "disclaimer_link_text"
  | "title"
  | "description"
  | "button_label";

const TEXT_KEYS: TextKey[] = [
  "disclaimer_text",
  "disclaimer_link_text",
  "title",
  "description",
  "button_label",
];

type EditorState = {
  texts: Record<TextKey, string>;
  header_icon: AiInfoIcon;
  /** null = keep the two default cards, [] = show no cards. */
  sections: Required<AiInfoSection>[] | null;
};

export const pick = (value: string, fallback: string) =>
  value.trim() || fallback;

const toState = (value: AiInfo | null | undefined): EditorState => ({
  texts: {
    disclaimer_text: value?.disclaimer_text ?? DEFAULTS.disclaimer_text,
    disclaimer_link_text:
      value?.disclaimer_link_text ?? DEFAULTS.disclaimer_link_text,
    title: value?.title ?? DEFAULTS.title,
    description: value?.description ?? DEFAULTS.description,
    button_label: value?.button_label ?? DEFAULTS.button_label,
  },
  header_icon: value?.header_icon ?? "info",
  sections: Array.isArray(value?.sections)
    ? value.sections.map((section) => ({
        title: section.title ?? "",
        icon: section.icon ?? "info",
        points: section.points ?? [],
      }))
    : null,
});

/** What is saved: only what differs from the defaults, or null for nothing. */
const toPayload = (state: EditorState): AiInfo | null => {
  const out: AiInfo = {};
  for (const key of TEXT_KEYS) {
    const text = state.texts[key].trim();
    if (text && text !== DEFAULTS[key]) out[key] = text;
  }
  if (state.header_icon !== "info") out.header_icon = state.header_icon;
  if (state.sections !== null) {
    out.sections = state.sections.map((section) => ({
      title: section.title.trim(),
      icon: section.icon,
      points: section.points.map((point) => point.trim()).filter(Boolean),
    }));
  }
  return Object.keys(out).length ? out : null;
};

type CustomizationAiInfoProps = {
  value: AiInfo | null;
  onChange: (value: AiInfo | null) => void;
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

  const setText = (key: TextKey, text: string) =>
    update({ ...state, texts: { ...state.texts, [key]: text } });

  const sections = state.sections;
  const patchSection = (index: number, patch: Partial<AiInfoSection>) =>
    update({
      ...state,
      sections: (sections ?? []).map((section, i) =>
        i === index ? { ...section, ...patch } : section,
      ) as Required<AiInfoSection>[],
    });

  const moveSection = (index: number, dir: -1 | 1) => {
    const next = [...(sections ?? [])];
    [next[index], next[index + dir]] = [next[index + dir], next[index]];
    update({ ...state, sections: next });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          AI Info Popup
          <InfoIcon text="The disclaimer line under the chat input and the popup it opens. Leave a field blank to use the default wording." />
        </CardTitle>
        <CardDescription>
          Change the disclaimer and the &quot;About this AI Chatbot&quot; popup
          shown in your widget.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="gap-2">
            <FieldLabel htmlFor="ai-disclaimer-text">
              Disclaimer text
            </FieldLabel>
            <Input
              id="ai-disclaimer-text"
              value={state.texts.disclaimer_text}
              maxLength={LIMITS.disclaimer_text}
              placeholder={DEFAULTS.disclaimer_text}
              onChange={(e) => setText("disclaimer_text", e.target.value)}
            />
          </Field>
          <Field className="gap-2">
            <FieldLabel htmlFor="ai-disclaimer-link">Link text</FieldLabel>
            <Input
              id="ai-disclaimer-link"
              value={state.texts.disclaimer_link_text}
              maxLength={LIMITS.disclaimer_link_text}
              placeholder={DEFAULTS.disclaimer_link_text}
              onChange={(e) => setText("disclaimer_link_text", e.target.value)}
            />
          </Field>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <Field className="gap-2">
            <FieldLabel htmlFor="ai-title">Popup title</FieldLabel>
            <Input
              id="ai-title"
              value={state.texts.title}
              maxLength={LIMITS.title}
              placeholder={DEFAULTS.title}
              onChange={(e) => setText("title", e.target.value)}
            />
          </Field>
          <Field className="gap-2">
            <FieldLabel>Header icon</FieldLabel>
            <Select
              value={state.header_icon}
              onValueChange={(icon) =>
                update({ ...state, header_icon: icon as AiInfoIcon })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ICON_NAMES.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field className="gap-2">
          <FieldLabel htmlFor="ai-description">Description</FieldLabel>
          <Textarea
            id="ai-description"
            rows={3}
            value={state.texts.description}
            maxLength={LIMITS.description}
            placeholder={DEFAULTS.description}
            onChange={(e) => setText("description", e.target.value)}
          />
          <Typography variant="caption">
            {state.texts.description.length}/{LIMITS.description} characters
          </Typography>
        </Field>

        <Field className="gap-2">
          <FieldLabel htmlFor="ai-button">Button label</FieldLabel>
          <Input
            id="ai-button"
            value={state.texts.button_label}
            maxLength={LIMITS.button_label}
            placeholder={DEFAULTS.button_label}
            onChange={(e) => setText("button_label", e.target.value)}
          />
        </Field>

        <Separator />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Typography variant="small" as="p">
                Cards{" "}
                {sections ? `(${sections.length}/${LIMITS.max_sections})` : ""}
              </Typography>
              <FieldDescription>
                Up to {LIMITS.max_sections} cards, {LIMITS.max_points} lines
                each. One line per row.
              </FieldDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={(sections?.length ?? 0) >= LIMITS.max_sections}
                onClick={() =>
                  update({
                    ...state,
                    sections: [
                      ...(sections ??
                        JSON.parse(JSON.stringify(DEFAULTS.sections))),
                      { title: "", icon: "info", points: [""] },
                    ].slice(0, LIMITS.max_sections),
                  })
                }
              >
                <IconPlus data-icon="inline-start" />
                Add card
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => update({ ...state, sections: null })}
              >
                Use default cards
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => update({ ...state, sections: [] })}
              >
                Show no cards
              </Button>
            </div>
          </div>

          {sections === null ? (
            <Typography variant="muted">
              Using the default two cards. Click &quot;Add card&quot; to start
              from them and edit.
            </Typography>
          ) : sections.length === 0 ? (
            <Typography variant="muted">No cards will be shown.</Typography>
          ) : (
            sections.map((section, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-lg border border-dashed p-3"
              >
                <div className="flex items-center justify-between">
                  <Typography variant="small" as="p">
                    Card {index + 1}
                  </Typography>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => moveSection(index, -1)}
                    >
                      <IconArrowUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Move down"
                      disabled={index === sections.length - 1}
                      onClick={() => moveSection(index, 1)}
                    >
                      <IconArrowDown />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove card"
                      onClick={() =>
                        update({
                          ...state,
                          sections: sections.filter((_, i) => i !== index),
                        })
                      }
                    >
                      <IconTrash />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                  <Input
                    value={section.title}
                    maxLength={LIMITS.section_title}
                    placeholder="Heading"
                    aria-label={`Card ${index + 1} heading`}
                    onChange={(e) =>
                      patchSection(index, { title: e.target.value })
                    }
                  />
                  <Select
                    value={section.icon}
                    onValueChange={(icon) =>
                      patchSection(index, { icon: icon as AiInfoIcon })
                    }
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-label={`Card ${index + 1} icon`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_NAMES.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  rows={3}
                  value={section.points.join("\n")}
                  placeholder="One line per row"
                  aria-label={`Card ${index + 1} lines`}
                  onChange={(e) =>
                    patchSection(index, {
                      points: e.target.value
                        .split("\n")
                        .slice(0, LIMITS.max_points)
                        .map((point) => point.slice(0, LIMITS.point)),
                    })
                  }
                />
              </div>
            ))
          )}
        </div>

        {fieldErrors?.ai_info ? (
          <Typography variant="caption" className="text-destructive">
            {fieldErrors.ai_info}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}
