import { Suspense } from "react";

import SettingsWorkflows from "@/clients/settings-workflows";
import { AreaSubPage } from "@/components/custom/area-sub-page";
import { areaSectionMetadata } from "@/lib/nav-areas";

const HREF = "/settings/workflows";

export const metadata = areaSectionMetadata(HREF);

export default function Page() {
  return (
    <AreaSubPage href={HREF}>
      <Suspense fallback={null}>
        <SettingsWorkflows />
      </Suspense>
    </AreaSubPage>
  );
}
