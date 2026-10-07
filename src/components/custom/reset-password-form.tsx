"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useFormik } from "formik";
import { toast } from "sonner";
import z from "zod";
import {
  IconArrowRight,
  IconCircleCheck,
  IconEye,
  IconEyeOff,
  IconLinkOff,
  IconLock,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { applyServerFieldErrors, formikErrorsFromZod } from "@/lib/form-errors";
import { openResetLink, resetPassword } from "@/lib/password-reset";

// Django's MinimumLengthValidator default; the server runs the full set of
// validators (common, numeric, similar to the email) and answers per field.
const MIN_LENGTH = 8;

const validationSchema = z
  .object({
    new_password: z
      .string()
      .min(1, "New password is required")
      .min(MIN_LENGTH, `Use at least ${MIN_LENGTH} characters`),
    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    path: ["confirm_password"],
    message: "The two passwords don't match",
  });

type Stage =
  | { name: "opening" }
  | { name: "invalid"; message: string }
  | { name: "form"; resetToken: string }
  | { name: "done" };

function PasswordInput({
  name,
  label,
  autoComplete,
  formik,
}: {
  name: "new_password" | "confirm_password";
  label: string;
  autoComplete: string;
  formik: ReturnType<
    typeof useFormik<{ new_password: string; confirm_password: string }>
  >;
}) {
  const [visible, setVisible] = useState(false);
  const error = formik.touched[name] && formik.errors[name];
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupAddon>
          <IconLock />
        </InputGroupAddon>
        <InputGroupInput
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          aria-invalid={Boolean(error)}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values[name]}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            size="icon-xs"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <IconEyeOff /> : <IconEye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {error && (
        <Typography variant="small" className="text-destructive">
          {error}
        </Typography>
      )}
    </Field>
  );
}

export function ResetPasswordForm({
  uid,
  token,
}: {
  uid: string;
  token: string;
}) {
  const { status } = useSession();
  const [stage, setStage] = useState<Stage>({ name: "opening" });

  // Opening the link uses it up on the server, so it runs once, here in the
  // browser (openResetLink also dedupes a repeated effect).
  useEffect(() => {
    let cancelled = false;
    openResetLink(uid, token).then((result) => {
      if (cancelled) return;
      setStage(
        result.ok
          ? { name: "form", resetToken: result.resetToken }
          : { name: "invalid", message: result.message },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [uid, token]);

  const formik = useFormik({
    initialValues: { new_password: "", confirm_password: "" },
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      return result.success ? {} : formikErrorsFromZod(result.error.issues);
    },
    onSubmit: async (values) => {
      if (stage.name !== "form") return;
      const result = await resetPassword({
        uid,
        reset_token: stage.resetToken,
        ...values,
      });
      if (result.ok) {
        setStage({ name: "done" });
        // Every login of this user just ended on the server; drop this
        // browser's session too rather than let it fail on the next call.
        if (status === "authenticated") await signOut({ redirect: false });
        return;
      }
      // No reply at all: the link may still be fine, so keep the form.
      if (result.noAnswer) {
        toast.error("Password not changed", { description: result.message });
        return;
      }
      if (applyServerFieldErrors(formik, result.data)) return;
      // No field to blame: the form token itself is bad or expired.
      setStage({ name: "invalid", message: result.message });
    },
  });

  if (stage.name === "opening") {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
        <Spinner />
        <Typography variant="small">Checking your reset link…</Typography>
      </div>
    );
  }

  if (stage.name === "invalid") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <IconLinkOff className="size-6" />
        </div>
        <div className="flex flex-col gap-2">
          <Typography variant="h1">This link no longer works</Typography>
          <Typography variant="p" className="text-muted-foreground">
            Reset links can be opened only once and expire after a while. This
            one is invalid, expired, or has already been used.
          </Typography>
        </div>
        <Button size="lg" asChild>
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  if (stage.name === "done") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <IconCircleCheck className="size-6" />
        </div>
        <div className="flex flex-col gap-2">
          <Typography variant="h1">Password changed</Typography>
          <Typography variant="p" className="text-muted-foreground">
            You have been signed out on every device. Log in with your new
            password.
          </Typography>
        </div>
        <Button size="lg" asChild>
          <Link href="/login">
            Log in
            <IconArrowRight />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={formik.handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col gap-2">
          <Typography variant="h1">Set a new password</Typography>
          <Typography variant="p" className="text-muted-foreground">
            Finish now: this link has been used and won&apos;t open again. After
            the change you&apos;ll be signed out everywhere.
          </Typography>
        </div>
        <PasswordInput
          name="new_password"
          label="New Password"
          autoComplete="new-password"
          formik={formik}
        />
        <PasswordInput
          name="confirm_password"
          label="Confirm New Password"
          autoComplete="new-password"
          formik={formik}
        />
        <Field>
          <Button type="submit" size="lg" disabled={formik.isSubmitting}>
            {formik.isSubmitting && <Spinner data-icon="inline-start" />}
            {formik.isSubmitting ? "Saving..." : "Reset password"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
