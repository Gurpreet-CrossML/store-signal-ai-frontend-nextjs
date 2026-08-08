import { Suspense } from "react";

import NeverSayRules from "@/clients/never-say-rules";
import SubPageShell from "@/components/custom/sub-page-shell";

export const metadata = {
  title: "Never-Say Rules",
};

export default function Page() {
  return (
    <SubPageShell
      backHref="/brand-voice"
      backLabel="Back to brand voice"
      title="Never-Say Rules"
      description="Language guardrails — the phrases, claims, and behaviors the AI avoids in conversation."
    >
      <Suspense fallback={null}>
        <NeverSayRules />
      </Suspense>
    </SubPageShell>
  );
}
