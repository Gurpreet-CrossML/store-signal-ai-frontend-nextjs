"use client";

import { useEffect, useState } from "react";
import { useFormik } from "formik";
import z from "zod";
import {
  IconBrain,
  IconBrandTripadvisor,
  IconForbid,
  IconHandStop,
  IconPlus,
  IconScale,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

function ToggleRow({
  labelIcon,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  labelIcon?: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium flex items-center gap-2">
            {labelIcon}
            {label}
          </span>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </CardContent>
    </Card>
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
  const mergedPresets = (FetchNeverSayRulesPresetsData || []).reduce(
    (combinedRules: any, currentPreset: any) => ({
      do_not_say_phrases: [
        ...(combinedRules.do_not_say_phrases || []),
        ...(currentPreset.do_not_say_phrases || []),
      ],
      forbidden_claims: [
        ...(combinedRules.forbidden_claims || []),
        ...(currentPreset.forbidden_claims || []),
      ],
      required_legal_phrases: [
        ...(combinedRules.required_legal_phrases || []),
        ...(currentPreset.required_legal_phrases || []),
      ],
    }),
    {},
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

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <div>
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Never-Say Rules
        </h4>
        <p className="text-sm text-muted-foreground">
          These are language guardrails — kept separate from what the AI{" "}
          <em>does</em> (workflow guidance) and from hard action limits like
          refund caps (the Action Engine). Voice governs how it sounds; these
          govern what it must never say.
        </p>
      </div>
      {FetchNeverSayRulesIsLoading || FetchNeverSayRulesPresetsIsLoading ? (
        <div className="flex items-center justify-center gap-2 py-10">
          <Spinner className="size-6" />
          Loading Never-Say Rules...
        </div>
      ) : (
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="flex flex-col gap-3 justify-start pt-0">
                  <div className="flex flex-col gap-0.5">
                    <Label>
                      <IconHandStop className="size-4" />
                      Do-not-say list
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Phrases the AI is never allowed to use.
                    </p>
                  </div>
                  <ChipList
                    items={formik.values.do_not_say_phrases ?? []}
                    placeholder="Add a phrase and press Enter"
                    onAdd={(value) => addPhrase("do_not_say_phrases", value)}
                    onRemove={(index) =>
                      removePhrase("do_not_say_phrases", index)
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col gap-3 justify-start pt-0">
                  <div className="flex flex-col gap-0.5">
                    <Label>
                      <IconForbid className="size-4" />
                      Forbidden claims
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Claims the AI must never make, for trust and legal safety.
                    </p>
                  </div>
                  <ChipList
                    items={formik.values.forbidden_claims ?? []}
                    placeholder="Add a forbidden claim and press Enter"
                    onAdd={(value) => addPhrase("forbidden_claims", value)}
                    onRemove={(index) =>
                      removePhrase("forbidden_claims", index)
                    }
                    chipClassName="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                  />
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                  <Label>
                    <IconScale className="size-4" />
                    Required legal phrasing
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Exact wording the AI must include in specific contexts.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {(formik.values.required_legal_phrases ?? []).map(
                    (item, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 rounded-lg border border-border p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-1 flex-col gap-2">
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs">Context</Label>
                              <Input
                                value={item.context}
                                onChange={(event) =>
                                  updateLegalPhrase(index, {
                                    context: event.target.value,
                                  })
                                }
                                placeholder="Health & safety questions"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs">Phrase</Label>
                              <Input
                                value={item.phrase}
                                onChange={(event) =>
                                  updateLegalPhrase(index, {
                                    phrase: event.target.value,
                                  })
                                }
                                placeholder="Please consult your paediatrician..."
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() =>
                              formik.setFieldValue(
                                "required_legal_phrases",
                                (
                                  formik.values.required_legal_phrases ?? []
                                ).filter((_, itemIndex) => itemIndex !== index),
                              )
                            }
                          >
                            <IconTrash className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ),
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    onClick={() =>
                      formik.setFieldValue("required_legal_phrases", [
                        ...(formik.values.required_legal_phrases ?? []),
                        { context: "", phrase: "" },
                      ])
                    }
                  >
                    <IconPlus className="size-4" />
                    Add required phrase
                  </Button>
                </div>
              </CardContent>
            </Card>

            <ToggleRow
              labelIcon={<IconBrandTripadvisor className="size-4" />}
              label="No hollow apologies"
              description={'Avoid over-apologising or empty "so sorry" filler'}
              checked={formik.values.no_hollow_apologies ?? false}
              onCheckedChange={(value) =>
                formik.setFieldValue("no_hollow_apologies", value)
              }
            />

            <ToggleRow
              labelIcon={<IconBrain className="size-4" />}
              label="Never reveal it's an AI unprompted"
              description="Stay in persona unless the customer asks directly"
              checked={formik.values.never_reveal_ai_unprompted ?? false}
              onCheckedChange={(value) =>
                formik.setFieldValue("never_reveal_ai_unprompted", value)
              }
            />
          </div>
          <div className="sticky bottom-0 z-10 flex justify-start border-t border-border bg-background py-3">
            <Button
              type="button"
              size="lg"
              onClick={formik.submitForm}
              disabled={CreateNeverSayRulesIsLoading}
            >
              {CreateNeverSayRulesIsLoading && (
                <Spinner data-icon="inline-start" />
              )}
              {CreateNeverSayRulesIsLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
