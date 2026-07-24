import PersonaIdentity from "@/clients/persona-identity";
import { Suspense } from "react";

export const metadata = {
  title: "Persona Identity",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PersonaIdentity />
    </Suspense>
  );
}
