import { applyServerFieldErrors, formikErrorsFromZod } from "@/lib/form-errors";
import Link from "next/link";
import { useEffect } from "react";
import { useFormik } from "formik";
import z from "zod";
import {
  IconArrowRight,
  IconBuildingStore,
  IconMail,
  IconMailCheck,
  IconUser,
} from "@tabler/icons-react";

import {
  SIGNUP_COMPANY_NAME_MAX_LENGTH,
  SIGNUP_EMAIL_MAX_LENGTH,
  SIGNUP_NAME_MAX_LENGTH,
} from "@/lib/config";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  clearRegisterCompanyState,
  RegisterCompany,
} from "@/redux/api-slice/auth-slice";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";

// Mirrors the server's rules for POST /api/tenancy/register/ so the common
// mistakes are caught before the round trip; uniqueness comes back from it.
// `abort` keeps an empty field on "required" instead of the later checks.
// The blank checks run before trim(), which would turn "   " into "".
const requiredText = (label: string) =>
  z
    .string()
    .min(1, { error: `${label} is required.`, abort: true })
    .refine((value) => value.trim() !== "", {
      error: "This field cannot contain only spaces.",
      abort: true,
    })
    .trim();

const personName = (label: string) =>
  requiredText(label)
    .max(
      SIGNUP_NAME_MAX_LENGTH,
      `${label} must not exceed ${SIGNUP_NAME_MAX_LENGTH} characters.`,
    )
    .regex(/^[\p{L} ]+$/u, `${label} can contain only letters and spaces.`);

const validationSchema = z.object({
  first_name: personName("First name"),
  last_name: personName("Last name"),
  name: requiredText("Company name")
    .max(
      SIGNUP_COMPANY_NAME_MAX_LENGTH,
      `Company name must not exceed ${SIGNUP_COMPANY_NAME_MAX_LENGTH} characters.`,
    )
    // The server derives the company code from it: its first letter or
    // digit has to be an a-z letter.
    .regex(/^[^a-zA-Z0-9]*[a-zA-Z]/, "Company name must start with a letter."),
  email: requiredText("Work email")
    .max(
      SIGNUP_EMAIL_MAX_LENGTH,
      `Work email must not exceed ${SIGNUP_EMAIL_MAX_LENGTH} characters.`,
    )
    .regex(z.regexes.email, "Please enter a valid work email address."),
  terms_and_conditions_accepted: z
    .boolean()
    .refine(
      Boolean,
      "Please accept the Terms of Service and Privacy Policy to continue.",
    ),
});

type SignupValues = z.infer<typeof validationSchema>;

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(clearRegisterCompanyState());
  }, [dispatch]);

  const {
    RegisterCompanyIsLoading: isLoading,
    RegisterCompanyIsSuccess,
    RegisterCompanyData: registered,
  } = useAppSelector((state) => state.GetAuthReducer.RegisterCompanyState);

  const formik = useFormik<SignupValues>({
    initialValues: {
      first_name: "",
      last_name: "",
      name: "",
      email: "",
      terms_and_conditions_accepted: false,
    },
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      if (result.success) return {};
      return formikErrorsFromZod(result.error.issues);
    },
    onSubmit: async ({ first_name, last_name, email, ...rest }) => {
      const result = await dispatch(
        RegisterCompany({
          ...rest,
          user_data: { first_name, last_name, email },
        }),
      );
      if (RegisterCompany.rejected.match(result)) {
        // Field errors come back one level deep under `user_data`; the
        // form is flat, so lift them up before attaching. The thunk has
        // already toasted the top-level message.
        const { user_data, ...fields } =
          (result.payload as { data?: Record<string, unknown> })?.data ?? {};
        applyServerFieldErrors(formik, {
          ...fields,
          ...(user_data as Record<string, unknown>),
        });
      }
    },
  });

  if (RegisterCompanyIsSuccess && registered) {
    return (
      <Empty className="p-0 text-left">
        <EmptyHeader className="items-start text-left">
          <EmptyMedia variant="icon">
            <IconMailCheck />
          </EmptyMedia>
          <EmptyTitle>
            <Typography
              variant="h1"
              as="span"
              className="text-2xl font-bold sm:text-3xl"
            >
              Your account has been created successfully
            </Typography>
          </EmptyTitle>
          <EmptyDescription>
            {registered.credentials_emailed ? (
              <>
                Check your registered email for your login credentials to and
                log in to complete your workspace setup.
              </>
            ) : (
              <>
                We couldn&apos;t send the password email to{" "}
                <span className="font-medium text-foreground">
                  {registered.admin_email}
                </span>
                {/*
                . Use &ldquo;Forgot password?&rdquo; on the login page once your
                workspace is ready, or contact support.
                */}
                . Please contact support once your workspace is ready.
              </>
            )}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="items-start">
          <Button size="lg" asChild>
            <Link href="/login">
              Go to login
              <IconArrowRight />
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const invalid = (field: keyof SignupValues) =>
    formik.touched[field] && !!formik.errors[field];
  const errorFor = (field: keyof SignupValues) =>
    invalid(field) && (
      <Typography variant="small" className="text-destructive">
        {formik.errors[field]}
      </Typography>
    );

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={formik.handleSubmit}
    >
      <FieldGroup className="gap-5">
        <div className="flex flex-col gap-2">
          <Typography variant="h1" className="text-2xl font-bold sm:text-3xl">
            Create an account
          </Typography>
          <Typography variant="p" className="text-muted-foreground">
            Set up your StoreSignal workspace. We&apos;ll email you a password
            to log in with.
          </Typography>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={invalid("first_name")}>
            <FieldLabel htmlFor="first_name">First Name</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <IconUser />
              </InputGroupAddon>
              <InputGroupInput
                id="first_name"
                name="first_name"
                placeholder="Jane"
                maxLength={SIGNUP_NAME_MAX_LENGTH}
                required
                aria-invalid={invalid("first_name")}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.first_name}
              />
            </InputGroup>
            {errorFor("first_name")}
          </Field>
          <Field data-invalid={invalid("last_name")}>
            <FieldLabel htmlFor="last_name">Last Name</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="last_name"
                name="last_name"
                placeholder="Doe"
                maxLength={SIGNUP_NAME_MAX_LENGTH}
                required
                aria-invalid={invalid("last_name")}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.last_name}
              />
            </InputGroup>
            {errorFor("last_name")}
          </Field>
        </div>
        <Field data-invalid={invalid("name")}>
          <FieldLabel htmlFor="name">Company Name</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <IconBuildingStore />
            </InputGroupAddon>
            <InputGroupInput
              id="name"
              name="name"
              placeholder="Acme Stores"
              maxLength={SIGNUP_COMPANY_NAME_MAX_LENGTH}
              required
              aria-invalid={invalid("name")}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.name}
            />
          </InputGroup>
          {errorFor("name")}
        </Field>
        <Field data-invalid={invalid("email")}>
          <FieldLabel htmlFor="email">Work Email</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <IconMail />
            </InputGroupAddon>
            <InputGroupInput
              id="email"
              name="email"
              // Not type="email": the browser strips its spaces, so a
              // spaces-only entry would never reach the check for it.
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="you@company.com"
              maxLength={SIGNUP_EMAIL_MAX_LENGTH}
              required
              aria-invalid={invalid("email")}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
            />
          </InputGroup>
          {errorFor("email")}
        </Field>
        <Field data-invalid={invalid("terms_and_conditions_accepted")}>
          <Field orientation="horizontal">
            <Checkbox
              id="terms_and_conditions_accepted"
              name="terms_and_conditions_accepted"
              checked={formik.values.terms_and_conditions_accepted}
              onCheckedChange={(checked) =>
                formik.setFieldValue(
                  "terms_and_conditions_accepted",
                  checked === true,
                )
              }
              onBlur={() =>
                formik.setFieldTouched("terms_and_conditions_accepted", true)
              }
            />
            <FieldLabel
              htmlFor="terms_and_conditions_accepted"
              className="font-normal"
            >
              I agree to the{" "}
              <Link href="#" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </FieldLabel>
          </Field>
          {errorFor("terms_and_conditions_accepted")}
        </Field>
        <Field>
          <Button
            disabled={isLoading}
            type="submit"
            size="lg"
            className="relative"
          >
            {isLoading && <Spinner data-icon="inline-start" />}
            {isLoading ? "Creating account..." : "Create account"}
            {!isLoading && <IconArrowRight className="absolute right-4" />}
          </Button>
        </Field>
        <Typography variant="muted" className="text-center text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </Typography>
      </FieldGroup>
    </form>
  );
}
