import { useState } from "react";
import { formikErrorsFromZod } from "@/lib/form-errors";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useFormik } from "formik";
import { toast } from "sonner";
import z from "zod";
import {
  IconArrowRight,
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validationSchema = z.object({
    email: z.email("Invalid email").min(1, "Email is required"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters"),
  });

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validate: (values) => {
      const result = validationSchema.safeParse(values);
      if (result.success) return {};
      return formikErrorsFromZod(result.error.issues);
    },
    onSubmit: async (values) => {
      setIsLoading(true);
      setAuthError("");

      const res = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });
      if (res?.ok) {
        toast.success("Log in Successfully!", {
          description: "Welcome back! You have successfully logged in.",
        });
        router.push("/");
        router.refresh();
      } else {
        let message = "Invalid email or password";
        if (res?.error) {
          try {
            const responseErrors = JSON.parse(res.error);
            message = responseErrors?.message ?? message;
            toast.error("Log in Failed!", {
              description:
                message +
                (responseErrors?.data?.non_field_errors
                  ? `: ${responseErrors.data.non_field_errors}`
                  : ""),
            });
          } catch {
            message = res.error;
            setAuthError(message);
          }
        }
      }

      setIsLoading(false);
    },
  });

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={formik.handleSubmit}
    >
      <FieldGroup>
        <div className="flex flex-col gap-2">
          <Typography variant="h1">Welcome back 👋</Typography>
          <Typography variant="p" className="text-muted-foreground">
            Log in to your StoreSignal account to continue
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
        <Field
          data-invalid={formik.touched.password && !!formik.errors.password}
        >
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="#"
              className="text-sm font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <InputGroup>
            <InputGroupAddon>
              <IconLock />
            </InputGroupAddon>
            <InputGroupInput
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              required
              aria-invalid={formik.touched.password && !!formik.errors.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-xs"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {formik.touched.password && formik.errors.password && (
            <Typography variant="small" className="text-destructive">
              {formik.errors.password}
            </Typography>
          )}
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="remember-me" name="rememberMe" />
          <FieldLabel htmlFor="remember-me" className="font-normal">
            Remember me
          </FieldLabel>
        </Field>
        {authError && (
          <Typography variant="small" className="text-center text-destructive">
            {authError}
          </Typography>
        )}
        <Field>
          <Button
            disabled={isLoading}
            type="submit"
            size="lg"
            className="relative"
          >
            {isLoading && <Spinner data-icon="inline-start" />}
            {isLoading ? "Logging in..." : "Log in"}
            {!isLoading && <IconArrowRight className="absolute right-4" />}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
