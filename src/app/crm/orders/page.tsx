import { Suspense } from "react";

import Orders from "@/clients/orders";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/crm/orders";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      {/* Orders reads useSearchParams (?customer=); static prerender
          requires a Suspense boundary around it. */}
      <Suspense fallback={null}>
        <Orders />
      </Suspense>
    </AreaSubPage>
  );
}
