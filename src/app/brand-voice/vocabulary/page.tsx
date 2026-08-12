import { Suspense } from "react";

import BrandVoiceVocabularyEditor from "@/clients/vocabulary";
import SubPageShell from "@/components/custom/sub-page-shell";

export const metadata = {
  title: "Vocabulary",
};

export default function Page() {
  return (
    <SubPageShell
      backHref="/brand-voice"
      backLabel="Back to brand voice"
      title="Vocabulary"
      description="The specific words that make your brand sound like you — phrases to lean into, words to avoid, and swaps the AI applies."
    >
      <Suspense fallback={null}>
        <BrandVoiceVocabularyEditor />
      </Suspense>
    </SubPageShell>
  );
}
