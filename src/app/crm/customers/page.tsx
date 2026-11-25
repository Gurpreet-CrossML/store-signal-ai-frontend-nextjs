import { Suspense } from "react";

import Customers from "@/clients/customers";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/crm/customers";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <Suspense fallback={null}>
        <Customers />
      </Suspense>
    </AreaSubPage>
  );
}
