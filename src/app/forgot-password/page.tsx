import { AuthShell } from "@/components/custom/auth-shell";
import { ForgotPasswordForm } from "@/components/custom/forgot-password-form";

export const metadata = {
  title: "Forgot password",
};

export default function Page() {
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
