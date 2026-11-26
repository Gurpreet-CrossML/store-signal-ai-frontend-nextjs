import { Suspense } from "react";

import Orders from "@/clients/orders";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/crm/orders";

/**
 * Rendered per request. What this screen shows is decided by the
 * query string (customer), and a statically prerendered page is
 * served from the client router cache for the path alone — so
 * changing only the query could leave the previous view on screen.
 */
export const dynamic = "force-dynamic";

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
