"use client";

import { AuthShell } from "@/components/custom/auth-shell";
import { LoginForm } from "@/components/custom/login-form";

export default function Login() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
