import { AuthShell } from "@/components/custom/auth-shell";
import { ResetPasswordForm } from "@/components/custom/reset-password-form";

export const metadata = {
  title: "Reset password",
};

// Only reads the link's parts. The link is opened (and used up) by the
// client form, never during server rendering.
export default async function Page({
  params,
}: {
  params: Promise<{ uid: string; token: string }>;
}) {
  const { uid, token } = await params;
  return (
    <AuthShell>
      <ResetPasswordForm uid={uid} token={token} />
    </AuthShell>
  );
}
