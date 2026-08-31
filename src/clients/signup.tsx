"use client";

import { AuthShell } from "@/components/custom/auth-shell";
import { SignupForm } from "@/components/custom/signup-form";

export default function Signup() {
  return (
    <AuthShell>
      <SignupForm />
    </AuthShell>
  );
}
