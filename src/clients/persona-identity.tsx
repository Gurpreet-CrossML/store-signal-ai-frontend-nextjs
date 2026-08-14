"use client";

import { useEffect } from "react";
import { useFormik } from "formik";
import z from "zod";
import {
  IconBook2,
  IconBriefcase,
  IconDeviceFloppy,
  IconIdBadge2,
  IconMessages,
  IconSignature,
  IconSparkles,
  IconUserCircle,
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
import { Separator } from "@/components/ui/separator";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/custom/loading-state";
import { Spinner } from "@/components/ui/spinner";

import PersonaIdentityLivePreview from "@/components/custom/persona-identity-live-preview";

import {
  fetchPersonaIdentity,
  createPersonaIdentity,
  type PersonaIdentityData,
} from "@/redux/api-slice/brand-voice-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { formikErrorsFromZod, applyServerFieldErrors } from "@/lib/form-errors";
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
      return formikErrorsFromZod(result.error.issues);
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
        applyServerFieldErrors(formik, result.payload);
      }
    },
  });

  return (
    <div className="flex w-full flex-col gap-6">
      {FetchPersonaIdentityIsLoading ? (
        <LoadingState label="Loading Persona Identity…" />
      ) : (
        <form
          onSubmit={formik.handleSubmit}
          className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px]"
        >
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconUserCircle className="size-4" />
                  Agent Identity
                  <InfoIcon text="The basics of who your AI assistant is — shown to customers across chat, email, and WhatsApp." />
                </CardTitle>
                <CardDescription>
                  Name, role, and how the assistant speaks about itself.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <Field className="gap-2">
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor="agent-name">
                      <IconIdBadge2 className="size-4" />
                      Agent Name
                      <span className="-ml-1 text-xs text-destructive">*</span>
                      <InfoIcon text="The name customers see in chat and email. Short, friendly names work best — e.g. Ellie, Max, or your brand name." />
                    </FieldLabel>
                    <FieldDescription>
                      How the AI identifies itself — a persona name feels like a
                      real teammate, your brand name gives a company voice.
                    </FieldDescription>
                  </div>
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
                </Field>

                <Separator />

                <Field className="gap-2">
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor="role-description">
                      <IconBriefcase className="size-4" />
                      Role Description
                      <span className="-ml-1 text-xs text-destructive">*</span>
                      <InfoIcon text="One line describing the assistant's job. It frames how the AI presents its expertise when helping customers." />
                    </FieldLabel>
                    <FieldDescription>
                      Frames how the AI sees its own job — shapes helpfulness
                      and expertise.
                    </FieldDescription>
                  </div>
                  <Input
                    id="role-description"
                    name="role_description"
                    value={formik.values.role_description ?? ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="A friendly product expert who knows our catalog inside out"
                  />
                  {formik.touched.role_description &&
                    formik.errors.role_description && (
                      <p className="text-xs text-destructive">
                        {formik.errors.role_description}
                      </p>
                    )}
                </Field>

                <Separator />

                <Field className="gap-2">
                  <div className="flex flex-col gap-1">
                    <FieldLabel>
                      <IconMessages className="size-4" />
                      Self-Reference
                      <InfoIcon text="'I' reads as a single teammate; 'We' speaks for the whole company. Pick whichever matches your brand voice." />
                    </FieldLabel>
                    <FieldDescription>
                      How the AI refers to itself in conversations.
                    </FieldDescription>
                  </div>
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
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconSparkles className="size-4" />
                  Voice &amp; Sign-off
                  <InfoIcon text="Optional touches that shape how the assistant sounds and how its email replies end." />
                </CardTitle>
                <CardDescription>
                  Personality color and the sign-off used in emails.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <Field className="gap-2">
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor="backstory">
                      <IconBook2 className="size-4" />
                      Backstory
                      <span className="text-xs font-normal text-muted-foreground">
                        (optional)
                      </span>
                      <InfoIcon text="A little history and attitude makes replies feel human — experience, what the persona cares about, how it treats customers." />
                    </FieldLabel>
                    <FieldDescription>
                      Adds personality and context to guide how the AI responds.
                    </FieldDescription>
                  </div>
                  <textarea
                    id="backstory"
                    name="backstory"
                    value={formik.values.backstory ?? ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Ellie has helped thousands of shoppers pick the right product. Warm and knowledgeable, she gives honest recommendations without the hard sell."
                    rows={4}
                    className="w-full min-w-0 resize-y rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                  />
                  {formik.touched.backstory && formik.errors.backstory && (
                    <p className="text-xs text-destructive">
                      {formik.errors.backstory}
                    </p>
                  )}
                </Field>

                <Separator />

                <Field className="gap-2">
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor="email-signature">
                      <IconSignature className="size-4" />
                      Email Signature
                      <span className="text-xs font-normal text-muted-foreground">
                        (optional)
                      </span>
                      <InfoIcon text="Added to the end of email replies only — chat and WhatsApp skip it automatically." />
                    </FieldLabel>
                    <FieldDescription>
                      Appended to email replies. Chat and WhatsApp skip this
                      automatically.
                    </FieldDescription>
                  </div>
                  <Input
                    id="email-signature"
                    name="email_signature"
                    value={formik.values.email_signature ?? ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Warmly, Ellie — Customer Care Team"
                  />
                  {formik.touched.email_signature &&
                    formik.errors.email_signature && (
                      <p className="text-xs text-destructive">
                        {formik.errors.email_signature}
                      </p>
                    )}
                </Field>
              </CardContent>
            </Card>
            <div className="flex justify-start border-t border-border py-3">
              <Button
                type="submit"
                size="lg"
                disabled={CreatePersonaIdentityIsLoading}
              >
                {CreatePersonaIdentityIsLoading ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <IconDeviceFloppy data-icon="inline-start" />
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
