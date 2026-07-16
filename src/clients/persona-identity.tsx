"use client";

import { useEffect, useMemo } from "react";
import { useFormik } from "formik";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import PersonaIdentityForm from "@/components/custom/persona-identity-form";
import PersonaIdentityLivePreview from "@/components/custom/persona-identity-live-preview";
import SettingsPageHeader from "@/components/custom/settings-page-header";
import SettingsSaveBar from "@/components/custom/settings-save-bar";
import {
  fetchPersonaIdentity,
  savePersonaIdentity,
  type PersonaIdentityPayload,
} from "@/redux/api-slice/brand-voice-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const DEFAULT_VALUES: PersonaIdentityPayload = {
  name: "",
  role_description: "",
  self_reference: "i",
  email_signature: "",
  backstory: "",
};

const validationSchema = z.object({
  name: z.string().trim().min(1, "Agent name is required").max(100),
  role_description: z
    .string()
    .trim()
    .min(1, "Role description is required")
    .max(255),
  self_reference: z.enum(["i", "we"]),
  email_signature: z.string().max(255),
  backstory: z.string(),
});

export default function PersonaIdentity() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { data, isLoading } = useAppSelector(
    (state) => state.BrandVoiceReducer.personaIdentity,
  );
  const isSaving = useAppSelector(
    (state) => state.BrandVoiceReducer.isSavingPersonaIdentity,
  );

  useEffect(() => {
    if (storeCode) dispatch(fetchPersonaIdentity(storeCode));
  }, [dispatch, storeCode]);

  const initialValues = useMemo<PersonaIdentityPayload>(
    () =>
      data
        ? {
            name: data.name,
            role_description: data.role_description,
            self_reference: data.self_reference,
            email_signature: data.email_signature,
            backstory: data.backstory,
          }
        : DEFAULT_VALUES,
    [data],
  );

  const formik = useFormik<PersonaIdentityPayload>({
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
        name: values.name.trim(),
        role_description: values.role_description.trim(),
        email_signature: values.email_signature.trim(),
        backstory: values.backstory.trim(),
      };
      const result = await dispatch(
        savePersonaIdentity({ storeCode, payload }),
      );
      if (savePersonaIdentity.fulfilled.match(result)) {
        formik.resetForm({ values: result.payload });
      }
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <SettingsPageHeader
        breadcrumb="Brand Voice / Persona Identity"
        title="Persona Identity"
        description="Who the AI is when it talks to your customers — its name, role, how it refers to itself, and how it signs off."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                toast.info("Test Voice", {
                  description: "Voice testing is coming soon.",
                })
              }
            >
              Test Voice
            </Button>
            <Button
              type="button"
              onClick={formik.submitForm}
              disabled={isSaving}
            >
              {isSaving && <Spinner data-icon="inline-start" />}
              Publish
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <form
          onSubmit={formik.handleSubmit}
          className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px]"
        >
          <div className="flex flex-col gap-6">
            <PersonaIdentityForm
              name={formik.values.name}
              onNameChange={(value) => formik.setFieldValue("name", value)}
              roleDescription={formik.values.role_description}
              onRoleDescriptionChange={(value) =>
                formik.setFieldValue("role_description", value)
              }
              selfReference={formik.values.self_reference}
              onSelfReferenceChange={(value) =>
                formik.setFieldValue("self_reference", value)
              }
              emailSignature={formik.values.email_signature}
              onEmailSignatureChange={(value) =>
                formik.setFieldValue("email_signature", value)
              }
              backstory={formik.values.backstory}
              onBackstoryChange={(value) =>
                formik.setFieldValue("backstory", value)
              }
            />
            {(formik.touched.name && formik.errors.name) ||
            (formik.touched.role_description &&
              formik.errors.role_description) ? (
              <p className="text-sm text-destructive">
                {formik.errors.name || formik.errors.role_description}
              </p>
            ) : null}
            <SettingsSaveBar
              onReset={() => formik.setValues(DEFAULT_VALUES)}
              onCancel={() => formik.resetForm()}
              onSave={formik.submitForm}
              saving={isSaving}
            />
          </div>
          <PersonaIdentityLivePreview
            name={formik.values.name}
            roleDescription={formik.values.role_description}
            selfReference={formik.values.self_reference}
          />
        </form>
      )}
    </div>
  );
}
