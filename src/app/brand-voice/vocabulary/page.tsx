import { Suspense } from "react";

import BrandVoiceVocabularyEditor from "@/clients/vocabulary";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/brand-voice/vocabulary";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <Suspense fallback={null}>
        <BrandVoiceVocabularyEditor />
      </Suspense>
    </AreaSubPage>
  );
}
