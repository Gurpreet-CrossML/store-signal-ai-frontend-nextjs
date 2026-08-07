"use client";

import { useEffect, useState } from "react";
import { useFormik } from "formik";
import z from "zod";
import {
  IconBrain,
  IconDeviceFloppy,
  IconForbid,
  IconHandStop,
  IconMoodSad,
  IconPlus,
  IconScale,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { InfoIcon } from "@/components/custom/info-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { LoadingState } from "@/components/custom/loading-state";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import {
  fetchNeverSayRules,
  createNeverSayRules,
  fetchNeverSayRulesPresets,
  type NeverSayRulesData,
  type RequiredLegalPhrase,
} from "@/redux/api-slice/brand-voice-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const validationSchema = z.object({
  no_hollow_apologies: z.boolean(),
  never_reveal_ai_unprompted: z.boolean(),
  do_not_say_phrases: z.array(z.string().trim().min(1).max(500)),
  forbidden_claims: z.array(z.string().trim().min(1).max(500)),
  // An unfinished row is allowed while the user is editing it; it is omitted
  // from the submitted payload below.
  required_legal_phrases: z.array(
    z.object({ context: z.string().max(1000), phrase: z.string().max(1000) }),
  ),
});

export function ChipList({
  items,
  placeholder,
  onAdd,
  onRemove,
  chipClassName = "bg-muted text-foreground",
}: {
  items: string[];
  placeholder: string;
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  chipClassName?: string;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-3">
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        placeholder={placeholder}
      />
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${chipClassName}`}
          >
            {item}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="ml-0.5 opacity-60 hover:opacity-100"
            >
              <IconX className="size-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

// A single switch row inside the Behavior Rules card — label with icon and
// info tooltip on the left, switch on the right. Not its own card.
function ToggleRow({
  labelIcon,
  label,
  info,
  description,
  checked,
  onCheckedChange,
}: {
  labelIcon?: React.ReactNode;
  label: string;
  info: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-2 text-sm font-medium">
          {labelIcon}
          {label}
          <InfoIcon text={info} />
        </span>
        <Typography variant="muted" className="text-xs">
          {description}
        </Typography>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function NeverSayRules() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchNeverSayRulesData, FetchNeverSayRulesIsLoading } =
    useAppSelector(
      (state) => state.GetBrandVoiceReducer.FetchNeverSayRulesState,
    );
  const { FetchNeverSayRulesPresetsData, FetchNeverSayRulesPresetsIsLoading } =
    useAppSelector(
      (state) => state.GetBrandVoiceReducer.FetchNeverSayRulesPresetsState,
    );
  const { CreateNeverSayRulesIsLoading } = useAppSelector(
    (state) => state.GetBrandVoiceReducer.CreateNeverSayRulesState,
  );

  useEffect(() => {
    if (storeCode) {
      dispatch(fetchNeverSayRules(storeCode));
      dispatch(fetchNeverSayRulesPresets());
    }
  }, [dispatch, storeCode]);

  const hasData =
    FetchNeverSayRulesData && Object.keys(FetchNeverSayRulesData).length > 0;

  // If the store has no saved data yet, we want to give them a starting template.
  // We do this by taking ALL available global presets from the database and
  // merging their arrays together into one massive preset object.
  const mergedPresets = (FetchNeverSayRulesPresetsData || []).reduce<
    Pick<
      NeverSayRulesData,
      "do_not_say_phrases" | "forbidden_claims" | "required_legal_phrases"
    >
  >(
    (combinedRules, currentPreset) => ({
      do_not_say_phrases: [
        ...combinedRules.do_not_say_phrases,
        ...(currentPreset.do_not_say_phrases || []),
      ],
      forbidden_claims: [
        ...combinedRules.forbidden_claims,
        ...(currentPreset.forbidden_claims || []),
      ],
      required_legal_phrases: [
        ...combinedRules.required_legal_phrases,
        ...(currentPreset.required_legal_phrases || []),
      ],
    }),
    {
      do_not_say_phrases: [],
      forbidden_claims: [],
      required_legal_phrases: [],
    },
  );

  // The database presets only contain lists. The boolean toggles are store-specific,
  // so we just default them to false here when creating the starting template.
  const presetTemplate = {
    ...mergedPresets,
    no_hollow_apologies: false,
    never_reveal_ai_unprompted: false,
  } as NeverSayRulesData;

  // Use the store's actual saved data if it exists, otherwise fall back to our newly merged preset template.
  const defaultInitialValues = hasData
    ? FetchNeverSayRulesData
    : presetTemplate;

  const formik = useFormik<NeverSayRulesData>({
    initialValues: defaultInitialValues,
    enableReinitialize: true,
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      if (result.success) return {};
      return Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      );
    },
    onSubmit: async (values) => {
      if (!storeCode) return;
      const payload = {
        ...values,
        do_not_say_phrases: (values.do_not_say_phrases ?? [])
          .map((item) => item.trim())
          .filter(Boolean),
        forbidden_claims: (values.forbidden_claims ?? [])
          .map((item) => item.trim())
          .filter(Boolean),
        required_legal_phrases: (values.required_legal_phrases ?? [])
          .map((item) => ({
            context: item.context.trim(),
            phrase: item.phrase.trim(),
          }))
          .filter((item) => item.context && item.phrase),
      };
      const result = await dispatch(
        createNeverSayRules({ storeCode, payload }),
      );
      if (createNeverSayRules.fulfilled.match(result)) {
        formik.resetForm({ values: result.payload });
      }
    },
  });

  const addPhrase = (
    field: "do_not_say_phrases" | "forbidden_claims",
    value: string,
  ) => {
    const phrase = value.trim();
    if (phrase)
      formik.setFieldValue(field, [...(formik.values[field] ?? []), phrase]);
  };

  const removePhrase = (
    field: "do_not_say_phrases" | "forbidden_claims",
    index: number,
  ) => {
    formik.setFieldValue(
      field,
      (formik.values[field] ?? []).filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    );
  };

  const updateLegalPhrase = (
    index: number,
    patch: Partial<RequiredLegalPhrase>,
  ) => {
    formik.setFieldValue(
      "required_legal_phrases",
      (formik.values.required_legal_phrases ?? []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  };

  const legalPhrases = formik.values.required_legal_phrases ?? [];

  return (
    <div className="flex w-full flex-col gap-6">
      {FetchNeverSayRulesIsLoading || FetchNeverSayRulesPresetsIsLoading ? (
        <LoadingState label="Loading Never-Say Rules…" />
      ) : (
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {/* Row 1: the two phrase blocklists — same content type, so an
                equal-height pair reads as one deliberate row. */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconHandStop className="size-4" />
                    Do-Not-Say Phrases
                    <InfoIcon text="Specific phrases the AI is instructed to keep out of replies — jargon, competitor names, or wording you dislike." />
                  </CardTitle>
                  <CardDescription>
                    Phrases the AI is instructed to avoid.
                  </CardDescription>
                  <CardAction>
                    <Badge variant="secondary">
                      {(formik.values.do_not_say_phrases ?? []).length}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <ChipList
                    items={formik.values.do_not_say_phrases ?? []}
                    placeholder="Add a phrase and press Enter"
                    onAdd={(value) => addPhrase("do_not_say_phrases", value)}
                    onRemove={(index) =>
                      removePhrase("do_not_say_phrases", index)
                    }
                    chipClassName="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                  />
                </CardContent>
              </Card>

              <Card size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconForbid className="size-4" />
                    Forbidden Claims
                    <InfoIcon text="Claims the AI is told to avoid — medical, legal, or performance promises that could create liability." />
                  </CardTitle>
                  <CardDescription>
                    Claims the AI is told to avoid, for trust and legal safety.
                  </CardDescription>
                  <CardAction>
                    <Badge variant="secondary">
                      {(formik.values.forbidden_claims ?? []).length}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <ChipList
                    items={formik.values.forbidden_claims ?? []}
                    placeholder="Add a claim and press Enter"
                    onAdd={(value) => addPhrase("forbidden_claims", value)}
                    onRemove={(index) =>
                      removePhrase("forbidden_claims", index)
                    }
                    chipClassName="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Row 2: both behavior switches grouped in one card. */}
            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBrain className="size-4" />
                  Behavior Rules
                  <InfoIcon text="Conversation-level guardrails for how the assistant handles apologies and questions about being an AI." />
                </CardTitle>
                <CardDescription>
                  How the assistant carries itself in conversation.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ToggleRow
                  labelIcon={<IconMoodSad className="size-4" />}
                  label="No hollow apologies"
                  info="Skips filler like 'We're so sorry for any inconvenience' and moves straight to fixing the problem. A sincere apology still appears when something genuinely went wrong."
                  description={
                    'Avoid over-apologising or empty "so sorry" filler'
                  }
                  checked={formik.values.no_hollow_apologies ?? false}
                  onCheckedChange={(value) =>
                    formik.setFieldValue("no_hollow_apologies", value)
                  }
                />
                <Separator />
                <ToggleRow
                  labelIcon={<IconBrain className="size-4" />}
                  label="Never reveal it's an AI unprompted"
                  info="The assistant stays in persona and doesn't volunteer that it's an AI. If a customer asks directly, it answers honestly."
                  description="Stay in persona unless the customer asks directly"
                  checked={formik.values.never_reveal_ai_unprompted ?? false}
                  onCheckedChange={(value) =>
                    formik.setFieldValue("never_reveal_ai_unprompted", value)
                  }
                />
              </CardContent>
            </Card>

            {/* Row 3: required legal phrasing as an aligned two-column table,
                not nested boxes. */}
            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconScale className="size-4" />
                  Required Legal Phrasing
                  <InfoIcon text="When a conversation touches one of these contexts, the AI is guided to include your exact approved wording." />
                </CardTitle>
                <CardDescription>
                  Approved wording the AI is guided to include in specific
                  contexts.
                </CardDescription>
                <CardAction>
                  <Badge variant="secondary">{legalPhrases.length}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {legalPhrases.length ? (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] items-center gap-2">
                      <Typography
                        variant="muted"
                        as="span"
                        className="text-xs font-medium"
                      >
                        When the conversation is about
                      </Typography>
                      <Typography
                        variant="muted"
                        as="span"
                        className="text-xs font-medium"
                      >
                        Include this wording
                      </Typography>
                      <span aria-hidden className="w-8" />
                    </div>
                    {legalPhrases.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] items-center gap-2"
                      >
                        <Input
                          value={item.context}
                          onChange={(event) =>
                            updateLegalPhrase(index, {
                              context: event.target.value,
                            })
                          }
                          placeholder="e.g. Health & safety questions"
                          aria-label="Context"
                        />
                        <Input
                          value={item.phrase}
                          onChange={(event) =>
                            updateLegalPhrase(index, {
                              phrase: event.target.value,
                            })
                          }
                          placeholder="e.g. Please consult your paediatrician…"
                          aria-label="Required phrase"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remove required phrase"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            formik.setFieldValue(
                              "required_legal_phrases",
                              legalPhrases.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            )
                          }
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
                    No required phrasing yet. Add one to pair a context with
                    approved wording.
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() =>
                    formik.setFieldValue("required_legal_phrases", [
                      ...legalPhrases,
                      { context: "", phrase: "" },
                    ])
                  }
                >
                  <IconPlus className="size-4" />
                  Add required phrase
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-start border-t border-border py-3">
            <Button
              type="submit"
              size="lg"
              disabled={CreateNeverSayRulesIsLoading}
            >
              {CreateNeverSayRulesIsLoading ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <IconDeviceFloppy data-icon="inline-start" />
              )}
              {CreateNeverSayRulesIsLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
