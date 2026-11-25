import { Suspense } from "react";

import PersonaIdentity from "@/clients/persona-identity";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/brand-voice/persona-identity";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <Suspense fallback={null}>
        <PersonaIdentity />
      </Suspense>
    </AreaSubPage>
  );
}
