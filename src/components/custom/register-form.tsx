"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormik } from "formik";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import z from "zod";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { RegisterCompany } from "@/redux/api-slice/tenancy-slice";

// The workspace is provisioned in the background after registration, and login
// is refused until it activates (usually a few seconds). Retry the auto sign-in
// on this cadence before falling back to the login page.
const SIGN_IN_RETRY_MS = 3000;
const SIGN_IN_MAX_ATTEMPTS = 20;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const validationSchema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email"),
});

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { registering } = useAppSelector((state) => state.GetTenancyReducer);
  // True while we auto-sign-in with the returned password, waiting for the
  // background provisioning to activate the workspace.
  const [preparing, setPreparing] = useState(false);

  // Registration doubles as login: sign in with the password the register API
  // returned, retrying while the workspace finishes provisioning, then land on
  // the dashboard. Falls back to /login if it never activates in time (the
  // password is also emailed, so nothing is lost).
  const signInUntilReady = async (email: string, password: string) => {
    setPreparing(true);
    for (let attempt = 0; attempt < SIGN_IN_MAX_ATTEMPTS; attempt++) {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      if (res?.ok) {
        router.push("/");
        router.refresh();
        return;
      }
      await sleep(SIGN_IN_RETRY_MS);
    }
    setPreparing(false);
    toast.info("Your workspace is still being prepared.", {
      description:
        "Please log in with the password we emailed you in a minute or two.",
    });
    router.push("/login");
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      first_name: "",
      last_name: "",
      email: "",
      terms: false,
    },
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      const errors: Record<string, string> = result.success
        ? {}
        : Object.fromEntries(
            result.error.issues.map((issue) => [
              issue.path.join("."),
              issue.message,
            ]),
          );
      if (!values.terms) {
        errors.terms = "Please accept the terms to continue";
      }
      return errors;
    },
    onSubmit: async (values) => {
      const result = await dispatch(
        RegisterCompany({
          name: values.name,
          admin_email: values.email,
          first_name: values.first_name,
          last_name: values.last_name,
        }),
      );
      // On success the password is returned once (and also emailed on
      // activation): toast the email notice, then sign straight in so the
      // user lands on the dashboard without a second login step.
      if (RegisterCompany.fulfilled.match(result)) {
        toast.success("Account created!", {
          description: `Your password has been sent to ${result.payload.admin_email}.`,
        });
        if (result.payload.password) {
          await signInUntilReady(
            result.payload.admin_email,
            result.payload.password,
          );
        } else {
          // Older backend without the password handover — email-only flow.
          router.push("/login");
        }
      }
    },
  });

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={formik.handleSubmit}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Get started with StoreSignal in just a few steps.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="name">Company</FieldLabel>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Enter your company name"
            autoComplete="organization"
            aria-invalid={Boolean(formik.touched.name && formik.errors.name)}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.name}
          />
          {formik.touched.name && formik.errors.name && (
            <p className="text-sm text-destructive">{formik.errors.name}</p>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="first_name">First Name</FieldLabel>
            <Input
              id="first_name"
              name="first_name"
              type="text"
              placeholder="Enter your first name"
              autoComplete="given-name"
              aria-invalid={Boolean(
                formik.touched.first_name && formik.errors.first_name,
              )}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.first_name}
            />
            {formik.touched.first_name && formik.errors.first_name && (
              <p className="text-sm text-destructive">
                {formik.errors.first_name}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="last_name">Last Name</FieldLabel>
            <Input
              id="last_name"
              name="last_name"
              type="text"
              placeholder="Enter your last name"
              autoComplete="family-name"
              aria-invalid={Boolean(
                formik.touched.last_name && formik.errors.last_name,
              )}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.last_name}
            />
            {formik.touched.last_name && formik.errors.last_name && (
              <p className="text-sm text-destructive">
                {formik.errors.last_name}
              </p>
            )}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your work email"
            autoComplete="email"
            aria-invalid={Boolean(formik.touched.email && formik.errors.email)}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.email}
          />
          {formik.touched.email && formik.errors.email && (
            <p className="text-sm text-destructive">{formik.errors.email}</p>
          )}
        </Field>

        <Field>
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="terms"
              className="mt-0.5 size-4 rounded border-input accent-primary"
              checked={formik.values.terms}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <span>
              I accept the{" "}
              {/* TODO: point these at the real policy pages when available. */}
              <Link
                href="#"
                className="text-primary underline-offset-4 hover:underline"
              >
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link
                href="#"
                className="text-primary underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {formik.touched.terms && formik.errors.terms && (
            <p className="text-sm text-destructive">{formik.errors.terms}</p>
          )}
        </Field>

        <Field>
          <Button disabled={registering || preparing} type="submit">
            {(registering || preparing) && <Spinner data-icon="inline-start" />}
            {registering
              ? "Creating account..."
              : preparing
                ? "Preparing your workspace..."
                : "Create Account"}
          </Button>
        </Field>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline"
          >
            Login
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
