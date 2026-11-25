import { Suspense } from "react";

import SlaPolicies from "@/clients/sla-policies";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/settings/sla";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <Suspense fallback={null}>
        <SlaPolicies />
      </Suspense>
    </AreaSubPage>
  );
}
