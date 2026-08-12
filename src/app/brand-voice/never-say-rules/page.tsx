import { Suspense } from "react";

import NeverSayRules from "@/clients/never-say-rules";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/brand-voice/never-say-rules";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <Suspense fallback={null}>
        <NeverSayRules />
      </Suspense>
    </AreaSubPage>
  );
}
