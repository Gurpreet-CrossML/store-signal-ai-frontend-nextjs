import { Suspense } from "react";

import BrandVoiceToneStyleEditor from "@/clients/tone";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/brand-voice/tone-and-style";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <Suspense fallback={null}>
        <BrandVoiceToneStyleEditor />
      </Suspense>
    </AreaSubPage>
  );
}
