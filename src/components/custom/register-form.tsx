"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormik } from "formik";
import { IconCheck } from "@tabler/icons-react";
import z from "zod";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { RegisterCompany } from "@/redux/api-slice/tenancy-slice";

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
  // Set to the admin email on success → opens the confirmation dialog.
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

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
      // On success the company is created (inactive) and its temp password is
      // emailed; show the confirmation dialog telling the user to check email.
      if (RegisterCompany.fulfilled.match(result)) {
        setSuccessEmail(result.payload.admin_email);
      }
    },
  });

  return (
    <>
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
              aria-invalid={Boolean(
                formik.touched.email && formik.errors.email,
              )}
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
            <Button disabled={registering} type="submit">
              {registering && <Spinner data-icon="inline-start" />}
              {registering ? "Creating account..." : "Create Account"}
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

      <AlertDialog
        open={Boolean(successEmail)}
        onOpenChange={(open) => {
          if (!open) setSuccessEmail(null);
        }}
      >
        <AlertDialogContent size="default">
          {/* Center everything (icon, title, description, action). A plain flex
              column is used instead of AlertDialogHeader, whose "size=default"
              layout left-aligns the text beside the icon at the sm breakpoint. */}
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertDialogMedia className="mb-0 rounded-full bg-green-600 text-white">
              <IconCheck />
            </AlertDialogMedia>

            <AlertDialogTitle>Registration Successful 🎉</AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              Your account has been created successfully.
              <br />
              <br />
              We&apos;ve sent a password to{" "}
              <span className="font-medium text-foreground">
                {successEmail}
              </span>
              .
              <br />
              <br />
              Please check your inbox (and your Spam/Junk folder if you
              don&apos;t see it) and use the temporary password to sign in.
              <br />
              <br />
              <span className="font-medium">Note:</span> Your workspace is
              currently being set up and may take a few minutes before it&apos;s
              ready. If you can&apos;t log in immediately, please wait a moment
              and try again.
            </AlertDialogDescription>
          </div>

          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              className="w-full sm:w-auto"
              onClick={() => router.push("/login")}
            >
              Go to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
