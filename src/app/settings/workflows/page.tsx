import { Suspense } from "react";

import SettingsWorkflows from "@/clients/settings-workflows";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/settings/workflows";

/**
 * Rendered per request. Which workflow is open lives in the query string
 * (?workflow), and a statically prerendered page is served from the client
 * router cache for the path alone — so changing only the query could leave
 * the previous view on screen.
 */
export const dynamic = "force-dynamic";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SettingsWorkflows />
    </Suspense>
  );
}
