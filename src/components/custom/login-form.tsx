import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
    Field,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { useFormik } from "formik";
import z from "zod";

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"form">) {

    const router = useRouter();
    const [authError, setAuthError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const validationSchema = z.object({
        email: z.email("Invalid email").min(1, "Email is required"),
        password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
    });

    const formik = useFormik({
        initialValues: { email: "", password: "" },
        validate: (values) => {
            const result = validationSchema.safeParse(values);
            if (result.success) return {};
            return Object.fromEntries(
                result.error.issues.map((issue) => [issue.path.join("."), issue.message])
            );
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
                            description: message + (responseErrors?.data?.non_field_errors ? `: ${responseErrors.data.non_field_errors}` : ""),
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
        <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={formik.handleSubmit}>
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Login to your account</h1>
                    <p className="text-sm text-balance text-muted-foreground">
                        Enter your email below to login to your account
                    </p>
                </div>
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.email}
                    />
                    {formik.touched.email && formik.errors.email && (
                        <p className="text-sm text-destructive">{formik.errors.email}</p>
                    )}
                </Field>
                <Field>
                    <div className="flex items-center">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                    </div>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="********"
                        required
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.password}
                    />
                    {formik.touched.password && formik.errors.password && (
                        <p className="text-sm text-destructive">{formik.errors.password}</p>
                    )}
                </Field>
                {authError && (
                    <p className="text-sm text-destructive text-center">{authError}</p>
                )}
                <Field>
                    <Button
                        disabled={isLoading}
                        type="submit"
                    >
                        {isLoading && <Spinner data-icon="inline-start" />}
                        {isLoading ? "Logging in..." : "Login"}
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    )
}
