import { Suspense } from "react";
import BrandVoiceVocabularyEditor from "@/clients/vocabulary";

export const metadata = {
  title: "Vocabulary",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BrandVoiceVocabularyEditor />
    </Suspense>
  );
}
