"use client";

import { useEffect, useMemo } from "react";
import { useFormik } from "formik";
import z from "zod";

import { Spinner } from "@/components/ui/spinner";
import NeverSayRulesForm from "@/components/custom/never-say-rules-form";
import SettingsPageHeader from "@/components/custom/settings-page-header";
import SettingsSaveBar from "@/components/custom/settings-save-bar";
import {
  fetchNeverSayRules,
  saveNeverSayRules,
  type NeverSayRulesPayload,
  type RequiredLegalPhrase,
} from "@/redux/api-slice/brand-voice-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const DEFAULT_VALUES: NeverSayRulesPayload = {
  no_hollow_apologies: true,
  never_reveal_ai_unprompted: true,
  do_not_say_phrases: [],
  forbidden_claims: [],
  required_legal_phrases: [],
};

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

export default function NeverSayRules() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { data, isLoading } = useAppSelector(
    (state) => state.BrandVoiceReducer.neverSayRules,
  );
  const isSaving = useAppSelector(
    (state) => state.BrandVoiceReducer.isSavingNeverSayRules,
  );

  useEffect(() => {
    if (storeCode) dispatch(fetchNeverSayRules(storeCode));
  }, [dispatch, storeCode]);

  const initialValues = useMemo<NeverSayRulesPayload>(
    () =>
      data
        ? {
            no_hollow_apologies: data.no_hollow_apologies,
            never_reveal_ai_unprompted: data.never_reveal_ai_unprompted,
            do_not_say_phrases: data.do_not_say_phrases,
            forbidden_claims: data.forbidden_claims,
            required_legal_phrases: data.required_legal_phrases,
          }
        : DEFAULT_VALUES,
    [data],
  );

  const formik = useFormik<NeverSayRulesPayload>({
    initialValues,
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
        do_not_say_phrases: values.do_not_say_phrases
          .map((item) => item.trim())
          .filter(Boolean),
        forbidden_claims: values.forbidden_claims
          .map((item) => item.trim())
          .filter(Boolean),
        required_legal_phrases: values.required_legal_phrases
          .map((item) => ({
            context: item.context.trim(),
            phrase: item.phrase.trim(),
          }))
          .filter((item) => item.context && item.phrase),
      };
      const result = await dispatch(saveNeverSayRules({ storeCode, payload }));
      if (saveNeverSayRules.fulfilled.match(result)) {
        formik.resetForm({ values: result.payload });
      }
    },
  });

  const addPhrase = (
    field: "do_not_say_phrases" | "forbidden_claims",
    value: string,
  ) => {
    const phrase = value.trim();
    if (phrase) formik.setFieldValue(field, [...formik.values[field], phrase]);
  };

  const removePhrase = (
    field: "do_not_say_phrases" | "forbidden_claims",
    index: number,
  ) => {
    formik.setFieldValue(
      field,
      formik.values[field].filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const updateLegalPhrase = (
    index: number,
    patch: Partial<RequiredLegalPhrase>,
  ) => {
    formik.setFieldValue(
      "required_legal_phrases",
      formik.values.required_legal_phrases.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <SettingsPageHeader
        breadcrumb="Brand Voice / Never-Say Rules"
        title="Never-Say Rules"
        description="Brand voice is as much about subtraction as addition. These are the hard guardrails on language — kept separate from tone, and verified before any reply is sent."
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6">
          <NeverSayRulesForm
            noHollowApologies={formik.values.no_hollow_apologies}
            onNoHollowApologiesChange={(value) =>
              formik.setFieldValue("no_hollow_apologies", value)
            }
            neverRevealAiUnprompted={formik.values.never_reveal_ai_unprompted}
            onNeverRevealAiUnpromptedChange={(value) =>
              formik.setFieldValue("never_reveal_ai_unprompted", value)
            }
            doNotSayPhrases={formik.values.do_not_say_phrases}
            onAddDoNotSayPhrase={(value) =>
              addPhrase("do_not_say_phrases", value)
            }
            onRemoveDoNotSayPhrase={(index) =>
              removePhrase("do_not_say_phrases", index)
            }
            forbiddenClaims={formik.values.forbidden_claims}
            onAddForbiddenClaim={(value) =>
              addPhrase("forbidden_claims", value)
            }
            onRemoveForbiddenClaim={(index) =>
              removePhrase("forbidden_claims", index)
            }
            requiredLegalPhrases={formik.values.required_legal_phrases}
            onAddRequiredLegalPhrase={() =>
              formik.setFieldValue("required_legal_phrases", [
                ...formik.values.required_legal_phrases,
                { context: "", phrase: "" },
              ])
            }
            onUpdateRequiredLegalPhrase={updateLegalPhrase}
            onRemoveRequiredLegalPhrase={(index) =>
              formik.setFieldValue(
                "required_legal_phrases",
                formik.values.required_legal_phrases.filter(
                  (_, itemIndex) => itemIndex !== index,
                ),
              )
            }
          />
          <SettingsSaveBar
            onReset={() => formik.setValues(DEFAULT_VALUES)}
            onCancel={() => formik.resetForm()}
            onSave={formik.submitForm}
            saving={isSaving}
          />
        </form>
      )}
    </div>
  );
}
