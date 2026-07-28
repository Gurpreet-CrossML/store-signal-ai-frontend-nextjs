"use client";

import { useEffect } from "react";
import { useFormik } from "formik";
import z from "zod";
import { IconMessageCircle, IconUserCircle } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

import PersonaIdentityLivePreview from "@/components/custom/persona-identity-live-preview";

import {
  fetchPersonaIdentity,
  createPersonaIdentity,
  type PersonaIdentityData,
} from "@/redux/api-slice/brand-voice-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { SELF_REFERENCE_OPTIONS } from "@/lib/config";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Validation schema for the form using Zod
const validationSchema = z.object({
  name: z
    .string("Agent name is required")
    .trim()
    .min(1, "Agent name is required")
    .max(60),
  role_description: z
    .string("Role description is required")
    .trim()
    .min(1, "Role description is required")
    .max(160),
  self_reference: z.enum(["i", "we"]).default("i"),
  email_signature: z.string().max(160).optional(),
  backstory: z.string().max(500).optional(),
});

const initialValues: PersonaIdentityData = {
  name: "",
  role_description: "",
  self_reference: "i",
  email_signature: "",
  backstory: "",
  created_at: "",
  updated_at: "",
};

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
    initialValues: { ...initialValues, ...FetchPersonaIdentityData },
    enableReinitialize: true,

    // Validation using Zod schema
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

    // Handle form submission
    onSubmit: async (values) => {
      // Guard against submitting without a store code
      if (!storeCode) return;

      // Trim whitespace from string fields before sending to the API
      const payload = {
        ...values,
        name: values.name.trim(),
        role_description: values.role_description.trim(),
        email_signature: values.email_signature.trim(),
        backstory: values.backstory.trim(),
      };

      // Dispatch the createPersonaIdentity action and handle the result
      const result = await dispatch(
        createPersonaIdentity({ storeCode, payload }),
      );

      // If the action is fulfilled, reset the form with the new values
      if (createPersonaIdentity.fulfilled.match(result)) {
        formik.resetForm({ values: result.payload });
      }

      if (createPersonaIdentity.rejected.match(result)) {
        const payload = result.payload as Record<
          string,
          string | Record<string, string>
        > | null;
        const errors = (payload?.data as Record<string, string>) || {};
        formik.setErrors({
          ...errors,
        });
      }
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <div>
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Persona Identity
        </h4>
        <p className="text-sm text-muted-foreground">
          Who the AI is when it talks to your customers — its name, role, how it
          refers to itself, and how it signs off.
        </p>
      </div>

      {FetchPersonaIdentityIsLoading ? (
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
                  <span className="text-xs text-destructive -ml-1.5">*</span>
                </FieldLabel>
                <Input
                  id="agent-name"
                  name="name"
                  value={formik.values.name ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Ellie"
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="text-xs text-destructive">
                    {formik.errors.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  How the AI identifies itself. Use a persona name to feel like
                  a real teammate — or your brand name for a company voice.
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="role-description">
                  Role description
                  <span className="text-xs text-destructive -ml-1.5">*</span>
                </FieldLabel>
                <Input
                  id="role-description"
                  name="role_description"
                  value={formik.values.role_description ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="A friendly product expert on the Mother&Baby team"
                />
                {formik.touched.role_description &&
                  formik.errors.role_description && (
                    <p className="text-xs text-destructive">
                      {formik.errors.role_description}
                    </p>
                  )}
                <p className="text-xs text-muted-foreground">
                  Frames how the AI sees its own job. Shapes helpfulness and
                  expertise.
                </p>
              </Field>

              <Field>
                <FieldLabel>Self-reference</FieldLabel>
                <RadioGroup
                  defaultValue={formik.values.self_reference}
                  className="flex w-full"
                  onValueChange={(value) =>
                    formik.setFieldValue("self_reference", value)
                  }
                >
                  {SELF_REFERENCE_OPTIONS.map((option) => (
                    <FieldLabel
                      htmlFor={`${option.value}-reference`}
                      key={option.value}
                    >
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>{option.label}</FieldTitle>
                          <FieldDescription>
                            {option.description}
                          </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem
                          value={option.value}
                          id={`${option.value}-reference`}
                        />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  How the AI refers to itself in conversations.
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="email-signature">
                  <IconMessageCircle className="size-4" />
                  Email signature
                  <span className="text-xs font-normal text-muted-foreground">
                    (optional)
                  </span>
                </FieldLabel>
                <Input
                  id="email-signature"
                  name="email_signature"
                  value={formik.values.email_signature ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Warmly, Ellie — Mother&Baby Customer Care"
                />
                {formik.touched.email_signature &&
                  formik.errors.email_signature && (
                    <p className="text-xs text-destructive">
                      {formik.errors.email_signature}
                    </p>
                  )}
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
                {formik.touched.backstory && formik.errors.backstory && (
                  <p className="text-xs text-destructive">
                    {formik.errors.backstory}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Adds personality and context to guide how the AI responds.
                </p>
              </Field>
            </div>
            <div className="sticky bottom-0 z-10 flex justify-start border-t border-border bg-background py-3">
              <Button
                type="submit"
                size="lg"
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
