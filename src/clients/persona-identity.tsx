"use client";

import { useEffect } from "react";
import { useFormik } from "formik";
import z from "zod";
import { IconMessageCircle, IconUserCircle } from "@tabler/icons-react";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import PersonaIdentityLivePreview from "@/components/custom/persona-identity-live-preview";
import { cn } from "@/lib/utils";
import {
  fetchPersonaIdentity,
  CreatePersonaIdentity,
  type PersonaIdentityData,
} from "@/redux/api-slice/brand-voice-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const validationSchema = z.object({
  name: z.string().trim().min(1, "Agent name is required").max(60),
  role_description: z
    .string()
    .trim()
    .min(1, "Role description is required")
    .max(160),
  self_reference: z.enum(["i", "we"]),
  email_signature: z.string().max(160),
  backstory: z.string().max(500),
});

export default function PersonaIdentity() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchPersonaIdentityData, FetchPersonaIdentityIsLoading } =
    useAppSelector(
      (state) => state.GetBrandVoiceReducer.FetchPersonaIdentityState,
    );
  const { CreatePersonaIdentityIsLoading } = useAppSelector(
    (state) => state.GetBrandVoiceReducer.CreatePersonaIdentityState,
  );

  useEffect(() => {
    if (storeCode) dispatch(fetchPersonaIdentity(storeCode));
  }, [dispatch, storeCode]);

  const formik = useFormik<PersonaIdentityData>({
    initialValues: FetchPersonaIdentityData ?? ({} as PersonaIdentityData),
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
        CreatePersonaIdentity({ storeCode, payload }),
      );
      if (CreatePersonaIdentity.fulfilled.match(result)) {
        formik.resetForm({ values: result.payload });
      }
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      {FetchPersonaIdentityIsLoading || !FetchPersonaIdentityData ? (
        <div className="flex items-center justify-center gap-2 py-10">
          <Spinner className="size-6" />
          Loading Persona Identity...
        </div>
      ) : (
        <form
          onSubmit={formik.handleSubmit}
          className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px]"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6">
              <Field>
                <FieldLabel htmlFor="agent-name">
                  <IconUserCircle className="size-4" />
                  Agent name
                </FieldLabel>
                <Input
                  id="agent-name"
                  name="name"
                  value={formik.values.name ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Ellie"
                />
                <p className="text-xs text-muted-foreground">
                  How the AI identifies itself. Use a persona name to feel like
                  a real teammate — or your brand name for a company voice.
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="role-description">
                  Role description
                </FieldLabel>
                <Input
                  id="role-description"
                  name="role_description"
                  value={formik.values.role_description ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="A friendly product expert on the Mother&Baby team"
                />
                <p className="text-xs text-muted-foreground">
                  Frames how the AI sees its own job. Shapes helpfulness and
                  expertise.
                </p>
              </Field>

              <Field>
                <FieldLabel>Self-reference</FieldLabel>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    {
                      value: "i",
                      label: '"I"',
                      example: "I can help with that",
                    },
                    {
                      value: "we",
                      label: '"We"',
                      example: "We can help with that",
                    },
                  ].map((option) => {
                    const selected =
                      formik.values.self_reference === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          formik.setFieldValue("self_reference", option.value)
                        }
                        className={cn(
                          "relative flex flex-col items-center gap-1 rounded-lg border p-4 text-center transition-colors",
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute right-3 top-3 size-3 rounded-full border",
                            selected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40",
                          )}
                        />
                        <span className="text-sm font-medium">
                          {option.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {option.example}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  How the AI refers to itself in conversations.
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="email-signature">
                  <IconMessageCircle className="size-4" />
                  Email signature
                </FieldLabel>
                <Input
                  id="email-signature"
                  name="email_signature"
                  value={formik.values.email_signature ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Warmly, Ellie — Mother&Baby Customer Care"
                />
                <p className="text-xs text-muted-foreground">
                  Appended to email replies. Chat and WhatsApp skip this
                  automatically.
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="backstory">
                  Backstory
                  <span className="text-xs font-normal text-muted-foreground">
                    (optional)
                  </span>
                </FieldLabel>
                <textarea
                  id="backstory"
                  name="backstory"
                  value={formik.values.backstory ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Ellie is a parent herself and genuinely understands the little worries new parents have. Warm, reassuring, never condescending."
                  rows={4}
                  className="w-full min-w-0 resize-y rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                />
                <p className="text-xs text-muted-foreground">
                  Adds personality and context to guide how the AI responds.
                </p>
              </Field>
            </div>
            {(formik.touched.name && formik.errors.name) ||
            (formik.touched.role_description &&
              formik.errors.role_description) ? (
              <p className="text-sm text-destructive">
                {formik.errors.name || formik.errors.role_description}
              </p>
            ) : null}
            <div className="sticky bottom-0 z-10 flex justify-start border-t border-border bg-background py-3">
              <Button
                type="button"
                size="lg"
                onClick={formik.submitForm}
                disabled={CreatePersonaIdentityIsLoading}
              >
                {CreatePersonaIdentityIsLoading && (
                  <Spinner data-icon="inline-start" />
                )}
                {CreatePersonaIdentityIsLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
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
