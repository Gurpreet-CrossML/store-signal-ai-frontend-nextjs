import { Suspense } from "react";

import BrandVoiceToneStyleEditor from "@/clients/tone";
import SubPageShell from "@/components/custom/sub-page-shell";

export const metadata = {
  title: "Tone & Style",
};

export default function Page() {
  return (
    <SubPageShell
      backHref="/brand-voice"
      backLabel="Back to brand voice"
      title="Tone & Style"
      description="Define how your assistant communicates. Choose a preset and fine-tune the tone to match your brand and customers."
    >
      <Suspense fallback={null}>
        <BrandVoiceToneStyleEditor />
      </Suspense>
    </SubPageShell>
  );
}
