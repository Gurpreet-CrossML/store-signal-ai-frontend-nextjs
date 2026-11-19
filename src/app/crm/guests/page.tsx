import { Suspense } from "react";

import Guests from "@/clients/guests";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/crm/guests";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <Suspense fallback={null}>
        <Guests />
      </Suspense>
    </AreaSubPage>
  );
}
