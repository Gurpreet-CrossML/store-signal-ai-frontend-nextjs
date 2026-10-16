"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormik } from "formik";
import { toast } from "sonner";
import z from "zod";
import { IconArrowLeft, IconMail, IconMailCheck } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { applyServerFieldErrors, formikErrorsFromZod } from "@/lib/form-errors";
import { requestPasswordReset } from "@/lib/password-reset";

const validationSchema = z.object({
  email: z.email("Enter a valid email"),
});

export function ForgotPasswordForm() {
  // The address the link went to; set once the request succeeds.
  const [sentTo, setSentTo] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { email: "" },
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      return result.success ? {} : formikErrorsFromZod(result.error.issues);
    },
    onSubmit: async (values) => {
      const result = await requestPasswordReset(values.email.trim());
      if (result.ok) {
        setSentTo(values.email.trim());
        return;
      }
      if (!applyServerFieldErrors(formik, result.data)) {
        toast.error("Couldn't send the reset link", {
          description: result.message,
        });
      }
    },
  });

  if (sentTo) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <IconMailCheck className="size-6" />
        </div>
        <div className="flex flex-col gap-2">
          <Typography variant="h1">Check your email</Typography>
          <Typography variant="p" className="text-muted-foreground">
            If an account exists for <strong>{sentTo}</strong>, we have sent a
            link to reset its password.
          </Typography>
          <Typography variant="p" className="text-muted-foreground">
            The link can be used only once: it stops working as soon as it is
            opened, even if you do not finish. If that happens, come back here
            and request a new one.
          </Typography>
        </div>
        <Button variant="outline" size="lg" asChild>
          <Link href="/login">
            <IconArrowLeft />
            Back to log in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={formik.handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col gap-2">
          <Typography variant="h1">Forgot your password?</Typography>
          <Typography variant="p" className="text-muted-foreground">
            Enter the email you log in with and we&apos;ll send you a link to
            set a new password.
          </Typography>
        </div>
        <Field data-invalid={formik.touched.email && !!formik.errors.email}>
          <FieldLabel htmlFor="email">Email Address</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <IconMail />
            </InputGroupAddon>
            <InputGroupInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              aria-invalid={formik.touched.email && !!formik.errors.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
            />
          </InputGroup>
          {formik.touched.email && formik.errors.email && (
            <Typography variant="small" className="text-destructive">
              {formik.errors.email}
            </Typography>
          )}
        </Field>
        <Field>
          <Button type="submit" size="lg" disabled={formik.isSubmitting}>
            {formik.isSubmitting && <Spinner data-icon="inline-start" />}
            {formik.isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
        </Field>
        <Typography variant="muted" className="text-center text-sm">
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Back to log in
          </Link>
        </Typography>
      </FieldGroup>
    </form>
  );
}
