import { applyServerFieldErrors, formikErrorsFromZod } from "@/lib/form-errors";
import Link from "next/link";
import { useFormik } from "formik";
import z from "zod";
import {
  IconArrowRight,
  IconBuildingStore,
  IconMail,
  IconMailCheck,
  IconUser,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { RegisterCompany } from "@/redux/api-slice/auth-slice";
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
const personName = z
  .string()
  .trim()
  .min(1, "This is required")
  .max(72, "Use 72 characters or fewer")
  .regex(/^[\p{L} ]+$/u, "Use letters and spaces only");

const validationSchema = z.object({
  first_name: personName,
  last_name: personName,
  name: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(255, "Use 255 characters or fewer")
    .regex(/\p{L}/u, "Include at least one letter"),
  email: z.email("Enter a valid work email").max(254),
  terms_and_conditions_accepted: z
    .boolean()
    .refine(Boolean, "Accept the terms to continue"),
});

type SignupValues = z.infer<typeof validationSchema>;

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const dispatch = useAppDispatch();
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
            <Typography variant="h1" as="span">
              Your account has been created
            </Typography>
          </EmptyTitle>
          <EmptyDescription>
            {registered.credentials_emailed ? (
              <>
                We&apos;ve emailed a temporary password to{" "}
                <span className="font-medium text-foreground">
                  {registered.admin_email}
                </span>
                . Your workspace is being set up — you&apos;ll be able to log in
                in a few minutes.
              </>
            ) : (
              <>
                We couldn&apos;t send the password email to{" "}
                <span className="font-medium text-foreground">
                  {registered.admin_email}
                </span>
                . Use &ldquo;Forgot password?&rdquo; on the login page once your
                workspace is ready, or contact support.
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
      <FieldGroup>
        <div className="flex flex-col gap-2">
          <Typography variant="h1">Create an account</Typography>
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
              type="email"
              placeholder="you@company.com"
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
