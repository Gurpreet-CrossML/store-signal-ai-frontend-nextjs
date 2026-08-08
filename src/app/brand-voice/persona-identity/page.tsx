import { Suspense } from "react";

import PersonaIdentity from "@/clients/persona-identity";
import SubPageShell from "@/components/custom/sub-page-shell";

export const metadata = {
  title: "Persona Identity",
};

export default function Page() {
  return (
    <SubPageShell
      backHref="/brand-voice"
      backLabel="Back to brand voice"
      title="Persona Identity"
      description="Who the AI is when it talks to your customers — its name, role, how it refers to itself, and how it signs off."
    >
      <Suspense fallback={null}>
        <PersonaIdentity />
      </Suspense>
    </SubPageShell>
  );
}
